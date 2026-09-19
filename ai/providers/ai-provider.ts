import type {
  AIProviderName,
  GenerateTextParsed,
  GenerateTextResult,
  StreamChunk,
  EmbeddingInput,
  EmbeddingResult,
  AIToolDefinition
} from "../schemas/index.js";

export interface IAIProvider {
  readonly name: AIProviderName;
  generateCompletion(
    input: GenerateTextParsed,
    tools?: AIToolDefinition[]
  ): Promise<GenerateTextResult>;
  generateStream(
    input: GenerateTextParsed,
    tools?: AIToolDefinition[]
  ): AsyncIterable<StreamChunk>;
  generateEmbeddings(input: EmbeddingInput): Promise<EmbeddingResult>;
  calculateCost(
    model: string,
    promptTokens: number,
    completionTokens: number
  ): number;
}

