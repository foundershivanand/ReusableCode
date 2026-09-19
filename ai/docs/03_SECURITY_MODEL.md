# Module 10: AI Infrastructure - Security Model

## Overview
The AI module operates under a zero-trust model. Neither user inputs nor model outputs are assumed to be safe or authoritative.

## 1. Zero Cross-Module Coupling
Module 10 does not import repositories or services from `auth`, `tenancy`, or `admin`. Security context is passed cleanly via `SecurityContext`:
```typescript
export interface SecurityContext {
  tenantId: string;
  userId: string;
  userPermissions: string[];
}
```

## 2. Tool-Call Authorization
When LLMs are given access to tools (function calling):
1. **Definition Check**: Each `AIToolDefinition` declares `requiredPermissions: string[]`.
2. **Pre-execution Authorization**: Before allowing a tool call to run, `AIService` verifies that `secContext.userPermissions` contains all required permissions.
3. **Execution Denial**: If the user lacks any required permission, `UnauthorizedToolError` is thrown, the tool is not invoked, and an audit entry is logged to `ai_tool_executions` with `authorized: false`.
4. **Audit Trail**: Every tool call attempt (authorized or unauthorized, successful or failed) is permanently logged with its arguments and output.

## 3. Automated Budget Kill Switch
1. Tenants are assigned strict daily and monthly budget ceilings in micro-cents.
2. If `currentDailyMicroCents >= dailyMicroCentsLimit` or `currentMonthlyMicroCents >= monthlyMicroCentsLimit`, `AIService` immediately blocks all subsequent generation requests with `BudgetExceededError`.
3. Administrators can manually toggle `killSwitchActive: true` at any time to instantly freeze all AI operations for a compromised or runaway tenant.

## 4. Sensitive Data Defense & PII
- User messages are wrapped in containment tags (`<untrusted_user_input>`, `<retrieved_context>`) to prevent the model from misinterpreting text as instructions.
- Sensitive control sequences (`<|endoftext|>`, `<|im_start|>`) are stripped from outputs before returning responses to clients.
