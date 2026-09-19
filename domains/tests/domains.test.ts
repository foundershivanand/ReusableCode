import { describe, it, expect, beforeEach } from "vitest";
import {
  InMemoryDomainsRepository,
  DomainService,
} from "../server/index.js";
import { MockDnsResolver } from "../providers/index.js";

describe("Module 25: Custom Domain & White-Label Engine", () => {
  let repo: InMemoryDomainsRepository;
  let dnsResolver: MockDnsResolver;
  let service: DomainService;
  const tenantA = "tenant_alpha";
  const tenantB = "tenant_beta";

  beforeEach(() => {
    repo = new InMemoryDomainsRepository();
    dnsResolver = new MockDnsResolver();
    service = new DomainService(repo, dnsResolver, "cname.saasplatform.com");
  });

  it("should request a custom domain and generate valid DNS challenges", async () => {
    const domain = await service.requestCustomDomain({
      tenantId: tenantA,
      domain: "app.alphacorp.com",
    });

    expect(domain.status).toBe("REQUESTED");
    expect(domain.sslStatus).toBe("PENDING_ISSUANCE");
    expect(domain.verificationToken).toMatch(/^verify_[a-f0-9]{32}$/);
    expect(domain.dnsChallenges).toHaveLength(2);

    const cnameRecord = domain.dnsChallenges.find((c) => c.recordType === "CNAME");
    expect(cnameRecord?.expectedValue).toBe("cname.saasplatform.com");

    const txtRecord = domain.dnsChallenges.find((c) => c.recordType === "TXT");
    expect(txtRecord?.name).toBe("_saas-challenge.app.alphacorp.com");
    expect(txtRecord?.expectedValue).toBe(domain.verificationToken);
  });

  it("should prevent unauthorized domain claiming across different tenants", async () => {
    await service.requestCustomDomain({
      tenantId: tenantA,
      domain: "portal.alphacorp.com",
    });

    // Tenant B attempts to claim same domain
    await expect(
      service.requestCustomDomain({
        tenantId: tenantB,
        domain: "portal.alphacorp.com",
      })
    ).rejects.toThrow("already claimed by another organization");
  });

  it("should reject malicious host headers and host-header attacks", async () => {
    // Malicious headers with ports, colons, spaces, CRLF, or path injection
    await expect(
      service.resolveTenantFromHostname("evil.com:8080")
    ).rejects.toThrow("Invalid or malicious host header");

    await expect(
      service.resolveTenantFromHostname("app.test.com/path")
    ).rejects.toThrow("Invalid or malicious host header");

    await expect(
      service.resolveTenantFromHostname("app.test.com\r\nHost: evil.com")
    ).rejects.toThrow("Invalid or malicious host header");
  });

  it("should verify domain ownership via DNS resolver and transition lifecycle to ACTIVE", async () => {
    const domain = await service.requestCustomDomain({
      tenantId: tenantA,
      domain: "workspace.alphacorp.com",
    });

    // Mock DNS record publication
    dnsResolver.setTxtRecord(
      `_saas-challenge.workspace.alphacorp.com`,
      [domain.verificationToken]
    );

    const verified = await service.verifyDomainOwnership(domain.id, tenantA);
    expect(verified.status).toBe("ACTIVE");
    expect(verified.sslStatus).toBe("ISSUED");
    expect(verified.verifiedAt).toBeDefined();

    // Resolving hostname should now successfully map to tenantA
    const routing = await service.resolveTenantFromHostname("workspace.alphacorp.com");
    expect(routing.tenantId).toBe(tenantA);
    expect(routing.domain).toBe("workspace.alphacorp.com");
  });

  it("should reject host routing if domain is not active", async () => {
    await service.requestCustomDomain({
      tenantId: tenantA,
      domain: "pending.alphacorp.com",
    });

    await expect(
      service.resolveTenantFromHostname("pending.alphacorp.com")
    ).rejects.toThrow("is not active");
  });

  it("should remove custom domain and invalidate routing", async () => {
    const domain = await service.requestCustomDomain({
      tenantId: tenantA,
      domain: "delete-me.alphacorp.com",
    });

    dnsResolver.setTxtRecord(`_saas-challenge.delete-me.alphacorp.com`, [domain.verificationToken]);
    await service.verifyDomainOwnership(domain.id, tenantA);

    // Delete domain
    await service.removeDomain(domain.id, tenantA);

    await expect(
      service.resolveTenantFromHostname("delete-me.alphacorp.com")
    ).rejects.toThrow("is not registered");
  });

  it("should manage white-label branding and validate email sender domain", async () => {
    const domain = await service.requestCustomDomain({
      tenantId: tenantA,
      domain: "mail.alphacorp.com",
    });
    dnsResolver.setTxtRecord(`_saas-challenge.mail.alphacorp.com`, [domain.verificationToken]);
    await service.verifyDomainOwnership(domain.id, tenantA);

    // Update branding with verified custom domain
    const branding = await service.updateBranding({
      tenantId: tenantA,
      companyName: "Alpha Corp Inc.",
      primaryColor: "#059669",
      senderEmailDomain: "mail.alphacorp.com",
    });

    expect(branding.companyName).toBe("Alpha Corp Inc.");
    expect(branding.primaryColor).toBe("#059669");
    expect(branding.senderEmailVerified).toBe(true);

    // Attempting to set unverified sender email domain should reject
    await expect(
      service.updateBranding({
        tenantId: tenantA,
        senderEmailDomain: "unverified.spoofed.com",
      })
    ).rejects.toThrow("Sender email domain must be an active custom domain");
  });
});
