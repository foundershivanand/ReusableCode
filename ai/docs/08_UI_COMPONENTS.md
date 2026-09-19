# Module 10: AI Infrastructure - UI Components

## Overview
Module 10 provides ready-to-use, Tailwind-styled React components designed for multi-tenant SaaS dashboards.

## Component Library

### 1. `AIChat`
Interactive chat UI featuring prompt role tags, responsive design, streaming indicator, and input controls.

```tsx
import { AIChat } from "@ai";

export function AssistantView() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <AIChat
        placeholder="Type a message or instruction..."
        initialMessages={[
          { role: "SYSTEM", content: "Welcome! How can I assist you today?" }
        ]}
      />
    </div>
  );
}
```

### 2. `AIUsageCard`
Dashboard card visualizing daily and monthly spend against tenant quotas, complete with status pills and warning states.

```tsx
import { AIUsageCard } from "@ai";

export function TenantBillingDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AIUsageCard />
    </div>
  );
}
```

### 3. `BackgroundJobList`
List component rendering background asynchronous jobs with status badges, progress bars, retry counters, and cancel actions.

```tsx
import { BackgroundJobList } from "@ai";

export function JobsDashboard() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <BackgroundJobList />
    </div>
  );
}
```
