import 'package:test/test.dart';
import 'package:mod_31_ads_module/mod_31_ads_module.dart';

void main() {
  test('Enforces frequency capping for interstitials', () {
    final controller = AdController(adsEnabled: true, minSecondsBetweenInterstitials: 60);
    expect(controller.canShowInterstitial(), isTrue);

    controller.recordInterstitialShown();
    expect(controller.canShowInterstitial(), isFalse);

    controller.adsEnabled = false;
    expect(controller.canShowInterstitial(), isFalse);
  });
}
