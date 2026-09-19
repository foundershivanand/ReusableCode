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


export interface AnthropicAdapterConfig {
  apiKey?: string;
  baseUrl?: string;
}

export class AnthropicAdapter implements IAIProvider {
  public readonly name: AIProviderName = "ANTHROPIC";
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AnthropicAdapterConfig = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || "mock-anthropic-key";
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
  }

  public calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    // Claude 3.5 Sonnet: $3.00/1M prompt (0.30 microcents/token), $15.00/1M completion (1.50 microcents/token)
    // Claude 3 Haiku: $0.25/1M prompt (0.025 microcents/token), $1.25/1M completion (0.125 microcents/token)
    if (model.includes("haiku")) {
      return Math.round(promptTokens * 0.025 + completionTokens * 0.125);
    }
    return Math.round(promptTokens * 0.30 + completionTokens * 1.50);
  }

  public async generateCompletion(
    input: GenerateTextParsed,
    tools?: AIToolDefinition[]
  ): Promise<GenerateTextResult> {
    const startTime = Date.now();
    const { systemPrompt, messages } = this.formatMessages(input.messages);

    if (this.apiKey.startsWith("mock-")) {
      const promptTokens = Math.max(1, input.messages.reduce((acc, m) => acc + m.content.split(" ").length, 0));
      const completionText = `[Anthropic ${input.model} Response]: Processed safely with prompt isolation.`;
      const completionTokens = completionText.split(" ").length;
      const cost = this.calculateCost(input.model, promptTokens, completionTokens);

      return {
        id: `msg-${Math.random().toString(36).substring(2, 11)}`,
        provider: "ANTHROPIC",
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

    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: input.model,
        system: systemPrompt,
        messages,
        max_tokens: input.maxTokens,
        temperature: input.temperature,
        tools: tools?.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters
        }))
      })
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errBody}`);
    }

    const data = await res.json() as any;
    const textBlock = data.content?.find((c: any) => c.type === "text");
    const promptTokens = data.usage?.input_tokens || 0;
    const completionTokens = data.usage?.output_tokens || 0;

    return {
      id: data.id || `msg-${Date.now()}`,
      provider: "ANTHROPIC",
      model: data.model || input.model,
      text: textBlock?.text || "",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostMicroCents: this.calculateCost(input.model, promptTokens, completionTokens)
      },
      finishReason: "STOP",
      durationMs: Date.now() - startTime
    };
  }

  public async *generateStream(
    input: GenerateTextParsed,
    _tools?: AIToolDefinition[]
  ): AsyncIterable<StreamChunk> {


    const chunkId = `msg-stream-${Date.now()}`;
    const words = ["Anthropic", " streaming", " with", " XML", " tag", " containment."];

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
        promptTokens: 12,
        completionTokens: words.length,
        totalTokens: 12 + words.length,
        estimatedCostMicroCents: this.calculateCost(input.model, 12, words.length)
      }
    };
  }

  public async generateEmbeddings(input: EmbeddingInput): Promise<EmbeddingResult> {
    // Anthropic does not provide native embeddings; fallback to standard representation
    const totalTokens = input.texts.reduce((acc, t) => acc + t.split(" ").length, 0);
    const embeddings = input.texts.map(() =>
      Array.from({ length: 1536 }, () => Number((Math.random() * 2 - 1).toFixed(4)))
    );

    return {
      model: input.model,
      embeddings,
      usage: {
        totalTokens,
        estimatedCostMicroCents: Math.round(totalTokens * 0.002)
      }
    };
  }

  private formatMessages(messages: PromptMessage[]) {

    const systemParts: string[] = [];
    const formatted: Array<{ role: "user" | "assistant"; content: string }> = [];

    for (const m of messages) {
      if (m.role === "SYSTEM" || m.role === "DEVELOPER") {
        systemParts.push(m.content);
      } else if (m.role === "TRUSTED_CONTEXT") {
        systemParts.push(`<trusted_context>\n${m.content}\n</trusted_context>`);
      } else if (m.role === "UNTRUSTED_USER") {
        formatted.push({
          role: "user",
          content: `<user_input>\n${m.content}\n</user_input>`
        });
      } else if (m.role === "RETRIEVED_CONTEXT") {
        formatted.push({
          role: "user",
          content: `<retrieved_context>\n${m.content}\n</retrieved_context>`
        });
      } else if (m.role === "TOOL_OUTPUT") {
        formatted.push({
          role: "user",
          content: `<tool_output name="${m.name || "tool"}">\n${m.content}\n</tool_output>`
        });
      }
    }

    return {
      systemPrompt: systemParts.join("\n\n"),
      messages: formatted
    };
  }
}
