import 'package:test/test.dart';
import 'package:mod_40_data_validation/mod_40_data_validation.dart';

void main() {
  test('Validates RFC-compliant emails', () {
    expect(InputSanitizer.isValidEmail('user@domain.com'), isTrue);
    expect(InputSanitizer.isValidEmail('invalid-email'), isFalse);
  });

  test('Sanitizes HTML injection characters', () {
    final clean = InputSanitizer.sanitizeHtml('<script>alert("xss")</script>');
    expect(clean, equals('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'));
  });

  test('Detects malicious SQL injection fragments', () {
    expect(InputSanitizer.isSafeString('John Doe'), isTrue);
    expect(InputSanitizer.isSafeString('admin; DROP TABLE users;--'), isFalse);
  });
}
