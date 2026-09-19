import { describe, it, expect, beforeEach } from "vitest";
import { SupportService } from "../server/support-service.js";
import { InMemorySupportRepository } from "../server/repository.js";

describe("Module 14: Customer Support, Live Chat & Feedback", () => {
  let repository: InMemorySupportRepository;
  let service: SupportService;

  beforeEach(() => {
    repository = new InMemorySupportRepository();
    service = new SupportService(repository);
  });

  it("creates a support ticket and sanitizes metadata", async () => {
    const ticket = await service.createTicket({
      tenantId: "tenant_alpha",
      userId: "u_1",
      userEmail: "user@alpha.com",
      type: "BUG_REPORT",
      subject: "Login page 500 error",
      description: "When submitting credentials I receive a 500 status",
      browserMetadata: {
        url: "https://app.company.com/login?token=sensitive_jwt_token_123&state=active",
        browser: "Chrome",
        os: "macOS"
      },
      attachments: []
    });

    expect(ticket.id).toBeDefined();
    expect(ticket.status).toBe("CREATED");
    // Sensitive token must be stripped from the URL
    expect(ticket.browserMetadata?.url).not.toContain("sensitive_jwt_token_123");
    expect(ticket.browserMetadata?.url).toContain("state=active");
  });

  it("prevents duplicate tickets submitted in quick succession", async () => {
    const t1 = await service.createTicket({
      tenantId: "tenant_alpha",
      userId: "u_dup",
      userEmail: "dup@alpha.com",
      type: "FEATURE_REQUEST",
      subject: "Dark Mode Support",
      description: "Please add dark mode to the dashboard",
      attachments: []
    });

    const t2 = await service.createTicket({
      tenantId: "tenant_alpha",
      userId: "u_dup",
      userEmail: "dup@alpha.com",
      type: "FEATURE_REQUEST",
      subject: "Dark Mode Support",
      description: "Please add dark mode to the dashboard",
      attachments: []
    });

    // Both should return the same ticket instance without creating a duplicate
    expect(t1.id).toBe(t2.id);
  });

  it("enforces rate limits on ticket submissions", async () => {
    // 5 submissions are allowed
    for (let i = 0; i < 5; i++) {
      await service.createTicket({
        tenantId: "tenant_alpha",
        userId: "u_spammer",
        userEmail: "spam@alpha.com",
        type: "FEEDBACK",
        subject: `Feedback #${i}`,
        description: `This is feedback number ${i}`,
        attachments: []
      });
    }

    // 6th submission must fail with rate limit error
    await expect(
      service.createTicket({
        tenantId: "tenant_alpha",
        userId: "u_spammer",
        userEmail: "spam@alpha.com",
        type: "FEEDBACK",
        subject: "Feedback #6",
        description: "This should be blocked",
        attachments: []
      })
    ).rejects.toThrow(/Rate limit exceeded/);
  });

  it("tracks SLA timestamps across status transitions", async () => {
    const ticket = await service.createTicket({
      tenantId: "tenant_alpha",
      userId: "u_sla",
      userEmail: "sla@alpha.com",
      type: "CONTACT_SUPPORT",
      subject: "Billing invoice question",
      description: "Need explanation for charge",
      attachments: []
    });

    expect(ticket.firstResponseAt).toBeUndefined();

    // Transition to FIRST_RESPONSE
    const responded = await service.updateStatus(ticket.id, "FIRST_RESPONSE");
    expect(responded.status).toBe("FIRST_RESPONSE");
    expect(responded.firstResponseAt).toBeDefined();

    // Transition to RESOLVED
    const resolved = await service.updateStatus(ticket.id, "RESOLVED");
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolvedAt).toBeDefined();
  });

  it("creates time-limited support impersonation session with mandatory reason", async () => {
    await expect(
      service.createImpersonationSession("admin_1", "user_target", "tenant_alpha", "   ")
    ).rejects.toThrow(/Impersonation requires an explicit reason/);

    const session = await service.createImpersonationSession(
      "admin_1",
      "user_target",
      "tenant_alpha",
      "Customer requested help with workspace DNS",
      30
    );

    expect(session.id).toBeDefined();
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(session.revoked).toBe(false);
  });

  it("handles legal hold to protect tickets from purge", async () => {
    const ticket = await service.createTicket({
      tenantId: "tenant_alpha",
      userId: "u_legal",
      userEmail: "legal@alpha.com",
      type: "CONTACT_SUPPORT",
      subject: "Compliance audit inquiry",
      description: "Inquiry under review",
      attachments: []
    });

    const onHold = await service.setLegalHold(ticket.id, true);
    expect(onHold.isLegalHold).toBe(true);
  });
});
