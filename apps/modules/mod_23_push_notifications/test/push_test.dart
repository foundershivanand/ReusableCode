import 'package:test/test.dart';
import 'package:mod_23_push_notifications/mod_23_push_notifications.dart';

void main() {
  test('Parses PushPayload and routes tap', () {
    final router = PushNotificationRouter();
    PushPayload? received;
    router.onNotificationTapped = (payload) => received = payload;

    final payload = PushPayload.fromMap({
      'id': 'notif_100',
      'title': 'New Message',
      'body': 'You have 1 new lead',
      'deep_link': 'app://leads/100',
      'data': {'urgent': true},
    });

    router.handleReceivedNotification(payload, isUserTap: true);
    expect(received, isNotNull);
    expect(received?.id, equals('notif_100'));
    expect(received?.deepLink, equals('app://leads/100'));
  });
}
