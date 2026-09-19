import type { IAIProvider } from "../providers/ai-provider.js";
import type { IAIRepository } from "./repository.js";
import {
  GenerateTextInputSchema,
  type GenerateTextInput,
  type GenerateTextParsed,
  type GenerateTextResult,
  type StreamChunk,
  type EmbeddingInput,
  type EmbeddingResult,
  type AIToolDefinition,
  type AIToolCall,
  type AIToolResult,
  type PromptMessage
} from "../schemas/index.js";


export interface AIServiceConfig {
  primaryProvider: IAIProvider;
  fallbackProviders?: IAIProvider[];
  repository: IAIRepository;
}

export interface SecurityContext {
  tenantId: string;
  userId: string;
  userPermissions: string[];
}

export class BudgetExceededError extends Error {
  constructor(public tenantId: string, message = "AI budget limit reached or kill switch active") {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export class UnauthorizedToolError extends Error {
  constructor(public toolName: string, message = "User not authorized to execute this tool") {
    super(message);
    this.name = "UnauthorizedToolError";
  }
}

export class AIService {
  private primaryProvider: IAIProvider;
  private fallbackProviders: IAIProvider[];
  private repository: IAIRepository;

  // Known injection patterns to flag / neutralize
  private injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+prompt\s+override/i,
    /you\s+are\s+now\s+dan/i,
    /jailbreak/i,
    /reveal\s+(the\s+)?system\s+prompt/i
  ];

  constructor(config: AIServiceConfig) {
    this.primaryProvider = config.primaryProvider;
    this.fallbackProviders = config.fallbackProviders || [];
    this.repository = config.repository;
  }

  public async generateText(
    input: GenerateTextInput,
    secContext?: SecurityContext,
    tools?: AIToolDefinition[]
  ): Promise<GenerateTextResult> {
    const validatedInput = GenerateTextInputSchema.parse(input);

    // 1. Budget & Kill switch check
    await this.assertBudgetAvailable(validatedInput.tenantId);

    // 2. Tool authorization check
    if (tools && tools.length > 0 && secContext) {
      this.authorizeTools(tools, secContext.userPermissions);
    }

    // 3. Prompt injection sanitization and role isolation
    const sanitizedMessages = this.sanitizeAndIsolateMessages(validatedInput.messages);
    const sanitizedInput: GenerateTextParsed = {
      ...validatedInput,
      messages: sanitizedMessages
    };


    // 4. Provider execution with failover
    let result: GenerateTextResult | null = null;
    let lastError: Error | null = null;

    const providersToTry = [this.primaryProvider, ...this.fallbackProviders];
    for (const provider of providersToTry) {
      try {
        result = await provider.generateCompletion(sanitizedInput, tools);
        break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!result) {
      throw (
        lastError ||
        new Error("All AI providers failed to generate completion")
      );
    }

    // 5. Response Guardrails (Hallucination / Safety checks)
    result.text = this.applyResponseGuards(result.text);

    // 6. Record usage in ledger and budget
    await this.repository.recordUsage({
      id: result.id,
      tenantId: sanitizedInput.tenantId,
      userId: sanitizedInput.userId,
      feature: sanitizedInput.feature,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
      idempotencyKey: sanitizedInput.idempotencyKey,
      createdAt: new Date()
    });

    await this.repository.incrementBudgetUsage(
      sanitizedInput.tenantId,
      result.usage.estimatedCostMicroCents
    );

    return result;
  }

  public async *generateStream(
    input: GenerateTextInput,
    secContext?: SecurityContext,
    tools?: AIToolDefinition[]
  ): AsyncIterable<StreamChunk> {
    const validatedInput = GenerateTextInputSchema.parse(input);
    await this.assertBudgetAvailable(validatedInput.tenantId);

    if (tools && tools.length > 0 && secContext) {
      this.authorizeTools(tools, secContext.userPermissions);
    }

    const sanitizedMessages = this.sanitizeAndIsolateMessages(validatedInput.messages);
    const sanitizedInput: GenerateTextParsed = {
      ...validatedInput,
      messages: sanitizedMessages
    };


    let totalTokens = 0;
    let cost = 0;

    for await (const chunk of this.primaryProvider.generateStream(sanitizedInput, tools)) {
      if (chunk.usage) {
        totalTokens = chunk.usage.totalTokens;
        cost = chunk.usage.estimatedCostMicroCents;
      }
      yield chunk;
    }

    // Record stream usage at end of stream
    if (totalTokens > 0) {
      await this.repository.recordUsage({
        id: `stream-${Date.now()}`,
        tenantId: sanitizedInput.tenantId,
        userId: sanitizedInput.userId,
        feature: sanitizedInput.feature,
        provider: this.primaryProvider.name,
        model: sanitizedInput.model,
        usage: {
          promptTokens: Math.round(totalTokens * 0.4),
          completionTokens: Math.round(totalTokens * 0.6),
          totalTokens,
          estimatedCostMicroCents: cost
        },
        createdAt: new Date()
      });

      await this.repository.incrementBudgetUsage(sanitizedInput.tenantId, cost);
    }
  }

  public async generateEmbeddings(
    input: EmbeddingInput
  ): Promise<EmbeddingResult> {
    await this.assertBudgetAvailable(input.tenantId);
    const result = await this.primaryProvider.generateEmbeddings(input);

    await this.repository.incrementBudgetUsage(
      input.tenantId,
      result.usage.estimatedCostMicroCents
    );

    return result;
  }

  public async executeToolCall(
    call: AIToolCall,
    definitions: AIToolDefinition[],
    secContext: SecurityContext,
    executor: (name: string, args: Record<string, any>) => Promise<any>
  ): Promise<AIToolResult> {
    const toolDef = definitions.find((d) => d.name === call.name);
    if (!toolDef) {
      throw new Error(`Tool "${call.name}" not found in provided definitions`);
    }

    // Verify user has permissions required by this tool
    for (const reqPerm of toolDef.requiredPermissions) {
      if (!secContext.userPermissions.includes(reqPerm)) {
        await this.repository.logToolExecution({
          id: `toolexec-${Date.now()}`,
          tenantId: secContext.tenantId,
          userId: secContext.userId,
          toolName: call.name,
          arguments: call.arguments,
          authorized: false,
          error: `Missing permission: ${reqPerm}`,
          createdAt: new Date()
        });
        throw new UnauthorizedToolError(call.name, `Missing required permission: ${reqPerm}`);
      }
    }

    try {
      const output = await executor(call.name, call.arguments);
      await this.repository.logToolExecution({
        id: `toolexec-${Date.now()}`,
        tenantId: secContext.tenantId,
        userId: secContext.userId,
        toolName: call.name,
        arguments: call.arguments,
        authorized: true,
        result: output,
        createdAt: new Date()
      });

      return {
        toolCallId: call.id,
        name: call.name,
        output,
        isError: false
      };
    } catch (err: any) {
      await this.repository.logToolExecution({
        id: `toolexec-${Date.now()}`,
        tenantId: secContext.tenantId,
        userId: secContext.userId,
        toolName: call.name,
        arguments: call.arguments,
        authorized: true,
        error: err.message,
        createdAt: new Date()
      });

      return {
        toolCallId: call.id,
        name: call.name,
        output: err.message,
        isError: true
      };
    }
  }

  private async assertBudgetAvailable(tenantId: string): Promise<void> {
    const budget = await this.repository.getBudget(tenantId);
    if (!budget) return;

    if (budget.killSwitchActive) {
      throw new BudgetExceededError(tenantId, "AI Kill Switch is active for this tenant");
    }

    if (
      budget.currentDailyMicroCents >= budget.dailyMicroCentsLimit ||
      budget.currentMonthlyMicroCents >= budget.monthlyMicroCentsLimit
    ) {
      throw new BudgetExceededError(tenantId, "Tenant AI budget limit has been reached");
    }
  }

  private authorizeTools(tools: AIToolDefinition[], userPermissions: string[]): void {
    for (const tool of tools) {
      for (const perm of tool.requiredPermissions) {
        if (!userPermissions.includes(perm)) {
          throw new UnauthorizedToolError(
            tool.name,
            `User lacking required permission "${perm}" for tool "${tool.name}"`
          );
        }
      }
    }
  }

  private sanitizeAndIsolateMessages(messages: PromptMessage[]): PromptMessage[] {
    return messages.map((m) => {
      let content = m.content;

      // Scan for prompt injection phrases in untrusted or retrieved inputs
      if (m.role === "UNTRUSTED_USER" || m.role === "RETRIEVED_CONTEXT") {
        for (const pattern of this.injectionPatterns) {
          if (pattern.test(content)) {
            // Neutralize pattern by enclosing in harmless quotes
            content = content.replace(pattern, "[SUSPICIOUS_OVERRIDE_FLAGGED]");
          }
        }
      }

      return {
        ...m,
        content
      };
    });
  }

  private applyResponseGuards(text: string): string {
    // 1. Strip raw internal system tokens if model hallucinated them
    let cleaned = text
      .replace(/<\|endoftext\|>/g, "")
      .replace(/<\|im_start\|>/g, "")
      .replace(/<\|im_end\|>/g, "");

    return cleaned.trim();
  }
}
