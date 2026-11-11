import 'package:test/test.dart';
import 'package:mod_24_analytics/mod_24_analytics.dart';

class MockAnalyticsProvider implements AnalyticsProvider {
  @override String get name => 'mock';
  final List<Map<String, dynamic>> logged = [];

  @override
  Future<void> logEvent(String name, Map<String, dynamic> parameters) async {
    logged.add({'event': name, 'params': parameters});
  }

  @override
  Future<void> setUserId(String? userId) async {}
}

void main() {
  test('Does not log events without consent', () async {
    final engine = AnalyticsEngine();
    final provider = MockAnalyticsProvider();
    engine.addProvider(provider);

    await engine.logEvent('test_event');
    expect(provider.logged, isEmpty);
  });

  test('Sanitizes PII from event parameters', () async {
    final engine = AnalyticsEngine();
    final provider = MockAnalyticsProvider();
    engine.addProvider(provider);
    engine.hasConsent = true;

    await engine.logEvent('signup', {'user_email': 'test@example.com', 'tier': 'pro'});
    expect(provider.logged.length, equals(1));
    expect(provider.logged.first['params']['user_email'], equals('[REDACTED]'));
    expect(provider.logged.first['params']['tier'], equals('pro'));
  });
}
