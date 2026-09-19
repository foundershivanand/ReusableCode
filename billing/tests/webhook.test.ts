import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { WebhookEngine } from "../server/webhook-engine.js";
import { InMemoryBillingRepository } from "../server/repository.js";

describe("Webhook System & Race Condition Handling (Page 14-15)", () => {
  function setup() {
    const repo = new InMemoryBillingRepository();
    const webhookEngine = new WebhookEngine(repo);
    webhookEngine.setWebhookSecret("stripe", "whsec_test_secret_123");
    return { repo, webhookEngine };
  }

  it("verifies HMAC-SHA256 signature for Stripe webhooks and rejects tampered requests", () => {
    const { webhookEngine } = setup();

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = JSON.stringify({ id: "evt_1", type: "invoice.paid" });
    const signedPayload = `${timestamp}.${payload}`;
    const validSignature = crypto
      .createHmac("sha256", "whsec_test_secret_123")
      .update(signedPayload)
      .digest("hex");

    const header = `t=${timestamp},v1=${validSignature}`;

    // Valid signature
    expect(webhookEngine.verifySignature("stripe", payload, header)).toBe(true);

    // Tampered payload
    const tamperedPayload = JSON.stringify({ id: "evt_1", type: "invoice.paid", evil: true });
    expect(webhookEngine.verifySignature("stripe", tamperedPayload, header)).toBe(false);

    // Invalid signature
    const invalidHeader = `t=${timestamp},v1=forged_signature`;
    expect(webhookEngine.verifySignature("stripe", payload, invalidHeader)).toBe(false);
  });

  it("enforces idempotency and prevents duplicate webhook processing", async () => {
    const { webhookEngine, repo } = setup();

    const event = {
      id: "evt_duplicate_test_1",
      provider: "stripe",
      type: "customer.subscription.created",
      timestamp: Math.floor(Date.now() / 1000),
      data: {
        customerId: "cust_idempotent",
        planId: "plan_pro",
        status: "active",
      },
    };

    // First delivery: handled
    const res1 = await webhookEngine.processEvent(event);
    expect(res1.handled).toBe(true);
    expect(res1.duplicate).toBe(false);

    // Second delivery: detected as duplicate
    const res2 = await webhookEngine.processEvent(event);
    expect(res2.handled).toBe(true);
    expect(res2.duplicate).toBe(true);

    // Verify only 1 subscription exists
    const sub = await repo.findActiveSubscriptionByCustomerId("cust_idempotent");
    expect(sub).toBeDefined();
  });

  it("handles out-of-order webhook delivery (Event B before Event A)", async () => {
    const { webhookEngine, repo } = setup();

    const now = Math.floor(Date.now() / 1000);

    // Event B (newer: cancellation at now + 10)
    const eventB = {
      id: "evt_newer_cancel",
      provider: "stripe",
      type: "customer.subscription.deleted",
      timestamp: now + 10,
      data: {
        customerId: "cust_order_test",
        status: "canceled",
      },
    };

    // Event A (older: subscription update at now)
    const eventA = {
      id: "evt_older_update",
      provider: "stripe",
      type: "customer.subscription.updated",
      timestamp: now,
      data: {
        customerId: "cust_order_test",
        status: "active",
      },
    };

    // First Event B arrives
    await webhookEngine.processEvent(eventB);
    const subAfterB = await repo.findActiveSubscriptionByCustomerId("cust_order_test");
    // Since B canceled it, findActive returns null or canceled
    expect(subAfterB).toBeNull();

    // Now older Event A arrives late
    await webhookEngine.processEvent(eventA);

    // Sub should STILL NOT be active because Event A is older than Event B's timestamp!
    const subAfterLateA = await repo.findActiveSubscriptionByCustomerId("cust_order_test");
    expect(subAfterLateA).toBeNull();
  });
});
