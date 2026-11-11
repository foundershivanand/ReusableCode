import 'package:test/test.dart';
import 'package:mod_29_subscription_system/mod_29_subscription_system.dart';

void main() {
  test('SubscriptionStatus.free has inactive status', () {
    final status = SubscriptionStatus.free();
    expect(status.isActive, isFalse);
    expect(status.tier, equals(SubscriptionTier.free));
  });
}
