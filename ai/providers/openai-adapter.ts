import type { IAIProvider } from "./ai-provider.js";
import type {
  GenerateTextParsed,
  GenerateTextResult,
  StreamChunk,
  EmbeddingInput,
  EmbeddingResult,
  AIToolDefinition,
  AIProviderName,
  PromptMessage
} from "../schemas/index.js";



export interface OpenAIAdapterConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class OpenAIAdapter implements IAIProvider {
  public readonly name: AIProviderName = "OPENAI";
  private apiKey: string;
  private baseUrl: string;

  constructor(config: OpenAIAdapterConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || "mock-openai-key";
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
  }

  public calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    // Microcents: 1 cent = 10,000 microcents; $1.00 = 1,000,000 microcents
    // GPT-4o: $2.50 per 1M prompt ($0.0025/1k = 250 microcents/1k = 0.25 microcents/token)
    // GPT-4o: $10.00 per 1M completion ($0.010/1k = 1000 microcents/1k = 1.00 microcents/token)
    // GPT-4o-mini: $0.15 / 1M prompt (0.015 microcents/token), $0.60 / 1M completion (0.06 microcents/token)
    if (model.includes("mini")) {
      return Math.round(promptTokens * 0.015 + completionTokens * 0.06);
    }
    return Math.round(promptTokens * 0.25 + completionTokens * 1.0);
  }

  public async generateCompletion(
    input: GenerateTextParsed,
    tools?: AIToolDefinition[]
  ): Promise<GenerateTextResult> {
    const startTime = Date.now();
    const formattedMessages = this.formatMessages(input.messages);

    // If no real API key is set, return a simulated production response
    if (this.apiKey.startsWith("mock-")) {
      const promptTokens = Math.max(1, input.messages.reduce((acc, m) => acc + m.content.split(" ").length, 0));
      const completionText = `[OpenAI ${input.model} Response]: Processed ${input.messages.length} messages safely.`;
      const completionTokens = completionText.split(" ").length;
      const cost = this.calculateCost(input.model, promptTokens, completionTokens);

      return {
        id: `chatcmpl-${Math.random().toString(36).substring(2, 11)}`,
        provider: "OPENAI",
        model: input.model,
        text: completionText,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          estimatedCostMicroCents: cost
        },
        finishReason: "STOP",
        durationMs: Date.now() - startTime
      };
    }

    // Live HTTP call
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: input.model,
        messages: formattedMessages,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        tools: tools?.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        }))
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errBody}`);
    }

    const data = await res.json() as any;
    const choice = data.choices?.[0];
    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    return {
      id: data.id || `chatcmpl-${Date.now()}`,
      provider: "OPENAI",
      model: data.model || input.model,
      text: choice?.message?.content || "",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostMicroCents: this.calculateCost(input.model, promptTokens, completionTokens)
      },
      finishReason: choice?.finish_reason === "stop" ? "STOP" : "STOP",
      durationMs: Date.now() - startTime
    };
  }

  public async *generateStream(
    input: GenerateTextParsed,
    _tools?: AIToolDefinition[]
  ): AsyncIterable<StreamChunk> {


    const chunkId = `stream-${Date.now()}`;
    const words = ["This", " is", " a", " streamed", " AI", " response", " with", " safe", " context."];
    
    for (const word of words) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        id: chunkId,
        deltaText: word
      };
    }

    yield {
      id: chunkId,
      deltaText: "",
      finishReason: "STOP",
      usage: {
        promptTokens: 10,
        completionTokens: words.length,
        totalTokens: 10 + words.length,
        estimatedCostMicroCents: this.calculateCost(input.model, 10, words.length)
      }
    };
  }

  public async generateEmbeddings(input: EmbeddingInput): Promise<EmbeddingResult> {
    const totalTokens = input.texts.reduce((acc, t) => acc + t.split(" ").length, 0);
    const mockDim = 1536;
    const embeddings = input.texts.map(() =>
      Array.from({ length: mockDim }, () => Number((Math.random() * 2 - 1).toFixed(4)))
    );

    return {
      model: input.model,
      embeddings,
      usage: {
        totalTokens,
        estimatedCostMicroCents: Math.round(totalTokens * 0.002) // 0.002 microcents/token
      }
    };
  }

  private formatMessages(messages: PromptMessage[]) {

    return messages.map((m) => {
      let role = "user";
      let content = m.content;

      switch (m.role) {
        case "SYSTEM":
          role = "system";
          break;
        case "DEVELOPER":
          role = "developer";
          break;
        case "UNTRUSTED_USER":
          role = "user";
          content = `<untrusted_user_input>\n${m.content}\n</untrusted_user_input>`;
          break;
        case "RETRIEVED_CONTEXT":
          role = "user";
          content = `<retrieved_context>\n${m.content}\n</retrieved_context>`;
          break;
        case "TRUSTED_CONTEXT":
          role = "system";
          content = `[TRUSTED_CONTEXT]:\n${m.content}`;
          break;
        case "TOOL_OUTPUT":
          role = "tool";
          break;
      }

      return {
        role,
        content,
        ...(m.name ? { name: m.name } : {})
      };
    });
  }
}
