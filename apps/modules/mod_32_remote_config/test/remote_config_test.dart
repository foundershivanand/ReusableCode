import 'package:test/test.dart';
import 'package:mod_32_remote_config/mod_32_remote_config.dart';

void main() {
  test('Falls back to defaults when remote values are absent', () {
    final client = RemoteConfigClient(defaults: {'paywall_v2': false, 'trial_days': 7});
    expect(client.getBool('paywall_v2'), isFalse);
    expect(client.getInt('trial_days'), equals(7));

    client.setRemoteValues({'paywall_v2': true});
    expect(client.getBool('paywall_v2'), isTrue);
    expect(client.getInt('trial_days'), equals(7));
  });
}
