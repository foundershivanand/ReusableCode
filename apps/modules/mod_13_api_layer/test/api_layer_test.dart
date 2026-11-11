import 'package:test/test.dart';
import 'package:mod_13_api_layer/mod_13_api_layer.dart';

void main() {
  test('ApiResponse creates standard envelope for success', () {
    final resp = ApiResponse.success({'id': '123'});
    expect(resp.success, isTrue);
    expect(resp.data?['id'], equals('123'));
    expect(resp.error, isNull);
  });

  test('ApiResponse creates standard envelope for failure', () {
    final resp = ApiResponse.failure('Not found', code: 404);
    expect(resp.success, isFalse);
    expect(resp.data, isNull);
    expect(resp.error?.code, equals(404));
    expect(resp.error?.message, equals('Not found'));
  });

  test('RetryPolicy calculates increasing exponential delays', () {
    const policy = RetryPolicy(baseDelay: Duration(milliseconds: 100));
    final delay0 = policy.calculateDelay(0);
    final delay1 = policy.calculateDelay(1);
    final delay2 = policy.calculateDelay(2);

    expect(delay1.inMilliseconds, greaterThan(delay0.inMilliseconds));
    expect(delay2.inMilliseconds, greaterThan(delay1.inMilliseconds));
  });
}
