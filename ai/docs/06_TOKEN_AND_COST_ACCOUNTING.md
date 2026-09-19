# Module 10: AI Infrastructure - Token & Cost Accounting

## High-Precision Currency Representation
To prevent floating-point rounding errors and accurately capture micro-charges for lightweight models, all costs are represented as integers in **micro-cents**:
- $1\text{ USD} = 100\text{ cents} = 1,000,000\text{ micro-cents}$
- $1\text{ cent} = 10,000\text{ micro-cents}$
- $\$0.0001\text{ (hundredth of a cent)} = 100\text{ micro-cents}$

## Model Pricing Reference Matrix

| Provider | Model | Prompt (per 1M) | Completion (per 1M) | Micro-cents / Prompt Token | Micro-cents / Completion Token |
|---|---|---|---|---|---|
| OpenAI | `gpt-4o` | $2.50 | $10.00 | 0.25 | 1.00 |
| OpenAI | `gpt-4o-mini` | $0.15 | $0.60 | 0.015 | 0.06 |
| OpenAI | `text-embedding-3-small` | $0.02 | N/A | 0.002 | N/A |
| Anthropic | `claude-3-5-sonnet` | $3.00 | $15.00 | 0.30 | 1.50 |
| Anthropic | `claude-3-haiku` | $0.25 | $1.25 | 0.025 | 0.125 |
| Google | `gemini-1.5-pro` | $1.25 | $5.00 | 0.125 | 0.50 |
| Google | `gemini-1.5-flash` | $0.075 | $0.30 | 0.0075 | 0.03 |

## Automated Kill Switch Enforcement
1. Every tenant record in `ai_budgets` specifies:
   - `dailyMicroCentsLimit` (default: 50,000,000 = $50.00)
   - `monthlyMicroCentsLimit` (default: 1,000,000,000 = $1,000.00)
2. Every request calls `repository.incrementBudgetUsage(tenantId, cost)`.
3. If current spend exceeds either daily or monthly ceiling, `killSwitchActive` is flipped to `true`.
4. Subsequent requests immediately fail with `BudgetExceededError`, protecting organizations from runaway billing spikes.
