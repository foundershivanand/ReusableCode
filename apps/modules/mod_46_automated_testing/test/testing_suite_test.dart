import 'package:test/test.dart';
import 'package:mod_46_automated_testing/mod_46_automated_testing.dart';

void main() {
  test('TestHttpMockClient responds with registered mock', () {
    final client = TestHttpMockClient();
    client.registerRoute('/api/v1/test', 200, '{"ok": true}');

    final resp = client.request('/api/v1/test');
    expect(resp?.statusCode, equals(200));
    expect(resp?.body, equals('{"ok": true}'));
  });
}
