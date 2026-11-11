import 'package:test/test.dart';
import 'package:mod_27_ai_client_module/mod_27_ai_client_module.dart';

void main() {
  test('Streams AI chunks cleanly', () async {
    final client = MockAiGatewayClient();
    final chunks = await client.streamPrompt(const AiPromptRequest(prompt: 'Hi')).toList();
    expect(chunks.join(''), equals('Hello from AI Gateway!'));
  });
}
