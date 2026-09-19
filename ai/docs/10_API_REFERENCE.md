# Module 10: AI Infrastructure - API Reference

## Classes & Services

### `AIService`
Primary orchestration service for text generation, streaming, tool calling, and budget enforcement.

```typescript
class AIService {
  constructor(config: AIServiceConfig);

  generateText(
    input: GenerateTextInput,
    secContext?: SecurityContext,
    tools?: AIToolDefinition[]
  ): Promise<GenerateTextResult>;

  generateStream(
    input: GenerateTextInput,
    secContext?: SecurityContext,
    tools?: AIToolDefinition[]
  ): AsyncIterable<StreamChunk>;

  generateEmbeddings(
    input: EmbeddingInput
  ): Promise<EmbeddingResult>;

  executeToolCall(
    call: AIToolCall,
    definitions: AIToolDefinition[],
    secContext: SecurityContext,
    executor: (name: string, args: Record<string, any>) => Promise<any>
  ): Promise<AIToolResult>;
}
```

### `AIJobQueue`
BullMQ-style background worker queue.

```typescript
class AIJobQueue {
  constructor(repository: IAIRepository, options?: { pollIntervalMs?: number; concurrency?: number });

  registerWorker<T, R>(name: string, handler: JobHandler<T, R>): void;

  enqueue<T>(
    name: string,
    tenantId: string,
    userId: string,
    payload: T,
    options?: EnqueueJobOptions
  ): Promise<BackgroundJob>;

  cancel(jobId: string): Promise<boolean>;

  start(): void;
  stop(): void;
  tick(): Promise<void>;
}
```

### `AIClient`
Client SDK for web and mobile consumers.

```typescript
class AIClient {
  constructor(options?: AIClientOptions);

  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
  generateStream(input: GenerateTextInput, onChunk: (chunk: StreamChunk) => void): Promise<void>;
  getBudget(): Promise<AIBudget>;
  listJobs(status?: JobStatus): Promise<BackgroundJob[]>;
  enqueueJob(name: string, payload: any): Promise<BackgroundJob>;
  cancelJob(jobId: string): Promise<boolean>;
}
```

## Errors
- `BudgetExceededError`: Thrown when a tenant exceeds daily or monthly micro-cents limit or when the emergency kill switch is activated.
- `UnauthorizedToolError`: Thrown when a tool execution is requested by the model or user without the requisite permissions declared in `AIToolDefinition`.
