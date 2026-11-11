library mod_27_ai_client_module;

import 'dart:async';
import 'dart:convert';

class AiStreamChunk {
  final String textDelta;
  final bool isFinished;
  final int? promptTokens;
  final int? completionTokens;

  const AiStreamChunk({
    required this.textDelta,
    this.isFinished = false,
    this.promptTokens,
    this.completionTokens,
  });
}

abstract class AiGatewayClient {
  Stream<AiStreamChunk> streamCompletion({
    required String prompt,
    String modelTier = 'fast', // 'fast' -> Claude 3.5 Haiku / GPT-4o-mini; 'pro' -> Sonnet / GPT-4o
    Map<String, dynamic>? parameters,
  });

  Future<String> completePrompt({
    required String prompt,
    String modelTier = 'fast',
  });
}

class MockAiGatewayClient implements AiGatewayClient {
  @override
  Stream<AiStreamChunk> streamCompletion({
    required String prompt,
    String modelTier = 'fast',
    Map<String, dynamic>? parameters,
  }) async* {
    final tokens = ['Synthesizing', ' ', 'your', ' ', 'response', ' ', 'securely', '.'];
    for (int i = 0; i < tokens.length; i++) {
      await Future.delayed(const Duration(milliseconds: 20));
      yield AiStreamChunk(
        textDelta: tokens[i],
        isFinished: i == tokens.length - 1,
      );
    }
  }

  @override
  Future<String> completePrompt({required String prompt, String modelTier = 'fast'}) async {
    return 'Completed response for prompt: $prompt';
  }
}
