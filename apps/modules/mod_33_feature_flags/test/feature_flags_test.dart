import 'package:test/test.dart';
import 'package:mod_33_feature_flags/mod_33_feature_flags.dart';

void main() {
  test('Deterministic rollout buckets users consistently', () {
    const feature = 'new_editor';
    final userA1 = FeatureFlagEngine.isFeatureEnabled(featureKey: feature, userId: 'user_123', rolloutPercentage: 50);
    final userA2 = FeatureFlagEngine.isFeatureEnabled(featureKey: feature, userId: 'user_123', rolloutPercentage: 50);

    expect(userA1, equals(userA2));

    expect(FeatureFlagEngine.isFeatureEnabled(featureKey: feature, userId: 'user_123', rolloutPercentage: 0), isFalse);
    expect(FeatureFlagEngine.isFeatureEnabled(featureKey: feature, userId: 'user_123', rolloutPercentage: 100), isTrue);
  });
}
