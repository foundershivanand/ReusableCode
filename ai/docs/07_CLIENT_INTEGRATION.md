# Module 10: AI Infrastructure - Client Integration

## Setup
Wrap your application or page tree with `AIContextProvider`:

```tsx
import React from "react";
import { AIContextProvider } from "@ai";

export function App() {
  return (
    <AIContextProvider
      baseUrl="/api/ai"
      getAuthToken={() => localStorage.getItem("auth_token")}
      getTenantId={() => localStorage.getItem("active_tenant_id")}
    >
      <MainLayout />
    </AIContextProvider>
  );
}
```

## Using Hooks

### 1. Interactive Chat (`useAIChat`)
Handles message state, sending requests, streaming/response loading, and error states:

```tsx
import { useAIChat } from "@ai";

export function ChatWidget() {
  const { messages, input, setInput, sendMessage, isLoading, error } = useAIChat();

  return (
    <div>
      {messages.map((m, i) => (
        <p key={i}><strong>{m.role}:</strong> {m.content}</p>
      ))}
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={() => sendMessage(input)} disabled={isLoading}>
        {isLoading ? "Thinking..." : "Send"}
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### 2. AI Budget & Kill Switch Tracking (`useAIUsage`)
```tsx
import { useAIUsage } from "@ai";

export function BudgetBanner() {
  const { budget, loading, error, refresh } = useAIUsage();

  if (loading) return <div>Loading budget...</div>;
  if (!budget) return null;

  return (
    <div>
      <p>Daily Spend: ${(budget.currentDailyMicroCents / 100_000_000).toFixed(2)}</p>
      {budget.killSwitchActive && <p className="text-red-500">Kill switch is active!</p>}
    </div>
  );
}
```

### 3. Background Job Polling (`useAIJob`)
```tsx
import { useAIJob } from "@ai";

export function JobTracker({ jobId }: { jobId: string }) {
  const { job, loading, error, cancel } = useAIJob(jobId);

  if (loading || !job) return <div>Loading job...</div>;

  return (
    <div>
      <h4>{job.name} ({job.status})</h4>
      <progress value={job.progress} max="100" />
      <button onClick={cancel}>Cancel Job</button>
    </div>
  );
}
```
