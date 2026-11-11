import 'package:test/test.dart';
import 'package:mod_05_app_config_system/mod_05_app_config_system.dart';

void main() {
  test('Throws if production API does not use HTTPS', () {
    final config = AppConfig(
      appName: 'App1',
      packageName: 'com.example.app1',
      bundleId: 'com.example.app1',
      appVersion: '1.0.0',
      environment: Environment.production,
      apiBaseUrl: 'http://insecure.api.com',
      firebaseProjectId: 'proj-1',
      sentryDsn: 'https://key@sentry.io/1',
    );

    expect(() => config.validate(), throwsArgumentError);
  });

  test('Passes validation for valid production config', () {
    final config = AppConfig(
      appName: 'App1',
      packageName: 'com.example.app1',
      bundleId: 'com.example.app1',
      appVersion: '1.0.0',
      environment: Environment.production,
      apiBaseUrl: 'https://secure.api.com',
      firebaseProjectId: 'proj-1',
      sentryDsn: 'https://key@sentry.io/1',
    );

    expect(() => config.validate(), returnsNormally);
  });
}
