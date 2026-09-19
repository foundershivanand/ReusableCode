import { describe, it, expect, beforeEach } from "vitest";
import { ComplianceService } from "../server/compliance-service.js";
import { InMemoryComplianceRepository } from "../server/repository.js";

describe("Module 16: Legal & Compliance Layer", () => {
  let repository: InMemoryComplianceRepository;
  let service: ComplianceService;

  beforeEach(() => {
    repository = new InMemoryComplianceRepository();
    service = new ComplianceService(repository);
  });

  it("records separated consent with immutable hash evidence", async () => {
    const consent = await service.recordConsent({
      userId: "u_1",
      tenantId: "t_1",
      termsVersion: "2026.1",
      privacyVersion: "2026.1",
      acceptedTerms: true,
      acceptedPrivacy: true,
      marketingConsent: false,
      cookieConsent: {
        essential: true,
        analytics: true,
        marketing: false,
        functional: true
      },
      acceptedIp: "192.168.1.50",
      jurisdiction: "EU"
    });

    expect(consent.id).toBeDefined();
    expect(consent.immutableHash).toBeDefined();
    expect(consent.acceptedTerms).toBe(true);
    expect(consent.acceptedPrivacy).toBe(true);
    expect(consent.marketingConsent).toBe(false);
    expect(consent.cookieConsent.analytics).toBe(true);
  });

  it("allows users to withdraw optional marketing and cookie consent", async () => {
    await service.recordConsent({
      userId: "u_withdraw",
      tenantId: "t_1",
      termsVersion: "2026.1",
      privacyVersion: "2026.1",
      acceptedTerms: true,
      acceptedPrivacy: true,
      marketingConsent: true,
      cookieConsent: {
        essential: true,
        analytics: true,
        marketing: true,
        functional: true
      },
      jurisdiction: "US"
    });

    const updated = await service.withdrawConsent("u_withdraw", "t_1", {
      marketing: true,
      analyticsCookies: true
    });

    expect(updated.marketingConsent).toBe(false);
    expect(updated.cookieConsent.analytics).toBe(false);
    expect(updated.cookieConsent.functional).toBe(true); // preserved
  });

  it("handles DSR state machine with two-factor verification", async () => {
    const dsr = await service.submitDataSubjectRequest(
      "u_dsr",
      "t_1",
      "dsr@example.com",
      "EXPORT",
      "Personal data export under GDPR Article 20"
    );

    expect(dsr.status).toBe("VERIFYING_IDENTITY");
    expect(dsr.identityVerified).toBe(false);
    expect(dsr.verificationToken).toBeDefined();

    // Invalid verification token
    await expect(
      service.verifyDsrIdentity(dsr.id, "wrong-token")
    ).rejects.toThrow(/Invalid identity verification token/);

    // Valid verification
    const verified = await service.verifyDsrIdentity(dsr.id, dsr.verificationToken!);
    expect(verified.identityVerified).toBe(true);
    expect(verified.status).toBe("IN_PROGRESS");

    // Completion
    const completed = await service.completeDsr(dsr.id, "https://storage.acme.com/exports/123.zip");
    expect(completed.status).toBe("COMPLETED");
    expect(completed.resultDownloadUrl).toBeDefined();
    expect(completed.downloadExpiresAt).toBeDefined();
  });

  it("prevents deletion DSR when user is under a mandatory legal hold", async () => {
    await service.setLegalHold("u_litigation", "t_1", true);

    const dsr = await service.submitDataSubjectRequest(
      "u_litigation",
      "t_1",
      "lit@example.com",
      "DELETION",
      "Delete my account"
    );

    expect(dsr.status).toBe("HELD_UNDER_LEGAL_HOLD");
    expect(dsr.rejectionReason).toContain("legal hold");
  });

  it("manages retention policies and vendor data processor inventory", async () => {
    await service.registerRetentionPolicy({
      category: "AUDIT_LOGS",
      retentionPeriodDays: 365,
      legalHoldExempt: true,
      autoPurge: false,
      description: "Financial and security audit events"
    });

    const policies = await service.listRetentionPolicies();
    expect(policies.length).toBe(1);
    expect(policies[0].category).toBe("AUDIT_LOGS");

    await service.registerVendor({
      name: "Stripe, Inc.",
      category: "PAYMENT",
      purposes: ["Subscription billing", "Payment processing"],
      dataCategories: ["Credit card last 4", "Billing address", "Transaction totals"],
      region: "US",
      dpaSigned: true
    });

    const vendors = await service.listVendors();
    expect(vendors.length).toBe(1);
    expect(vendors[0].name).toBe("Stripe, Inc.");
    expect(vendors[0].dpaSigned).toBe(true);
  });
});
