# Module 02: API Reference & Integration Guide

## 1. Server-Side Usage

```typescript
import { BillingService, InMemoryBillingRepository } from "./billing/server/index.js";

const repo = new InMemoryBillingRepository();
const billing = new BillingService(repo);

// Register plans
await billing.registerPlan({
  id: "plan_pro",
  name: "Pro Plan",
  amountMinorUnits: 2900, // $29.00
  currency: "USD",
  interval: "month",
  features: ["analytics", "export"],
  limits: { projects: 10 },
});

// Check entitlements in application code
const hasAnalytics = await billing.hasFeature("cust_123", "analytics");
const maxProjects = await billing.getPlanLimit("cust_123", "projects");
```

---

## 2. Frontend React Integration

```tsx
import React from "react";
import { BillingProvider, useBilling, useEntitlements } from "./billing/client/index.js";
import { Pricing, Subscription, Invoices } from "./billing/components/index.js";

export function App() {
  return (
    <BillingProvider customerId="cust_123">
      <BillingDashboard />
    </BillingProvider>
  );
}

function BillingDashboard() {
  const { plans, createCheckout, openBillingPortal } = useBilling();
  const { hasFeature, getLimit } = useEntitlements();

  return (
    <div>
      <Pricing
        plans={plans}
        onSelectPlan={async (planId) => {
          const url = await createCheckout(planId);
          window.location.href = url;
        }}
      />
    </div>
  );
}
```
