abstract class AdManager {
  Future<void> loadBanner();
  Future<void> showInterstitial();
  Future<bool> showRewarded();
}

class MockAdManager implements AdManager {
  @override
  Future<void> loadBanner() async {}
  @override
  Future<void> showInterstitial() async {}
  @override
  Future<bool> showRewarded() async => true;
}
