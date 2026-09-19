import type { IAIProvider } from "./ai-provider.js";
import type {
  GenerateTextParsed,
  GenerateTextResult,
  StreamChunk,
  EmbeddingInput,
  EmbeddingResult,
  AIToolDefinition,
  AIProviderName
} from "../schemas/index.js";

export class MockAIProvider implements IAIProvider {
  public readonly name: AIProviderName = "MOCK";
  public customResponse?: string;
  public customToolCalls?: any[];
  public shouldFail = false;

  public calculateCost(
    _model: string,
    promptTokens: number,
    completionTokens: number
  ): number {
    return Math.round(promptTokens * 0.1 + completionTokens * 0.2);
  }

  public async generateCompletion(
    input: GenerateTextParsed,
    _tools?: AIToolDefinition[]
  ): Promise<GenerateTextResult> {
    if (this.shouldFail) {
      throw new Error("Mock AI provider simulated failure");
    }

    const promptTokens = input.messages.reduce(
      (acc, m) => acc + m.content.split(" ").length,
      0
    );
    const text =
      this.customResponse ||
      `Mock response for ${input.messages.length} messages (model: ${input.model}).`;
    const completionTokens = text.split(" ").length;

    return {
      id: `mock-${Date.now()}`,
      provider: "MOCK",
      model: input.model,
      text,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostMicroCents: this.calculateCost(
          input.model,
          promptTokens,
          completionTokens
        )
      },
      finishReason: "STOP",
      durationMs: 5
    };
  }

  public async *generateStream(
    input: GenerateTextParsed,
    _tools?: AIToolDefinition[]
  ): AsyncIterable<StreamChunk> {

    if (this.shouldFail) {
      throw new Error("Mock streaming simulated failure");
    }

    const words = ["Mock", " streaming", " token", " chunk."];
    for (const word of words) {
      yield {
        id: "mock-stream",
        deltaText: word
      };
    }

    yield {
      id: "mock-stream",
      deltaText: "",
      finishReason: "STOP",
      usage: {
        promptTokens: 5,
        completionTokens: words.length,
        totalTokens: 5 + words.length,
        estimatedCostMicroCents: this.calculateCost(input.model, 5, words.length)
      }
    };
  }

  public async generateEmbeddings(input: EmbeddingInput): Promise<EmbeddingResult> {
    return {
      model: input.model,
      embeddings: input.texts.map(() => [0.1, 0.2, 0.3, 0.4]),
      usage: {
        totalTokens: 10,
        estimatedCostMicroCents: 1
      }
    };
  }
}
