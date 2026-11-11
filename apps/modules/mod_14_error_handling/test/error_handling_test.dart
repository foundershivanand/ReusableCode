import 'package:test/test.dart';
import 'package:mod_14_error_handling/mod_14_error_handling.dart';

void main() {
  test('Maps 401 to unauthorized with user-friendly text', () {
    final err = AppError.fromStatusCode(401);
    expect(err.type, equals(ErrorType.unauthorized));
    expect(err.userMessage, equals('Session expired. Please sign in again.'));
  });

  test('Sanitizes raw socket exceptions', () {
    final msg = AppError.sanitizeUserMessage('SocketException: OS Error: Connection refused');
    expect(msg, contains('Please check your internet connection'));
  });
}
