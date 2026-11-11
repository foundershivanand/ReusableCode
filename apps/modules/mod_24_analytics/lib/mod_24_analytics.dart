abstract class AnalyticsClient {
  Future<void> logEvent(String name, {Map<String, dynamic>? parameters});
  Future<void> setUserId(String? userId);
}

class MockAnalyticsClient implements AnalyticsClient {
  final List<Map<String, dynamic>> loggedEvents = [];

  @override
  Future<void> logEvent(String name, {Map<String, dynamic>? parameters}) async {
    loggedEvents.add({"name": name, "params": parameters, "ts": DateTime.now()});
  }

  @override
  Future<void> setUserId(String? userId) async {}
}
