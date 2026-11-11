class PushNotificationPayload {
  final String title;
  final String body;
  final Map<String, dynamic> data;

  PushNotificationPayload({required this.title, required this.body, required this.data});
}

abstract class PushNotificationHandler {
  Future<String?> getDeviceToken();
  void onNotificationReceived(PushNotificationPayload payload);
}

class MockPushNotificationHandler implements PushNotificationHandler {
  @override
  Future<String?> getDeviceToken() async => "mock_fcm_token_12345";

  @override
  void onNotificationReceived(PushNotificationPayload payload) {
    // Process notification payload
  }
}
