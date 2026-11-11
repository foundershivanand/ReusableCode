import 'package:test/test.dart';
import 'package:mod_28_ai_cost_gateway/mod_28_ai_cost_gateway.dart';

void main() {
  test('Enforces daily user quota', () {
    final quota = UserAiQuota(userId: 'u1', dailyLimit: 10);
    expect(quota.canConsume(5), isTrue);
    quota.consume(5);
    expect(quota.usedToday, equals(5));

    expect(quota.canConsume(6), isFalse);
    expect(() => quota.consume(6), throwsA(isA<StateError>()));
  });
}
