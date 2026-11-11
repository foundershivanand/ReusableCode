import 'package:test/test.dart';
import 'package:mod_34_deep_link_system/mod_34_deep_link_system.dart';

void main() {
  test('Parses valid deep link route', () {
    final uri = Uri.parse('https://app.example.com/items/42?ref=twitter');
    final route = DeepLinkRouter.parseUri(uri, expectedHost: 'app.example.com');

    expect(route, isNotNull);
    expect(route?.path, equals('/items/42'));
    expect(route?.queryParams['ref'], equals('twitter'));
  });

  test('Rejects unrecognized host', () {
    final uri = Uri.parse('https://malicious.com/items/42');
    final route = DeepLinkRouter.parseUri(uri, expectedHost: 'app.example.com');
    expect(route, isNull);
  });
}
