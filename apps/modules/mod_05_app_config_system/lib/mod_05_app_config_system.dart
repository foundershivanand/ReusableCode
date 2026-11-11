import 'package:meta/meta.dart';

enum Environment { dev, staging, production }

@immutable
class AppConfig {
  final String appName;
  final String packageName;
  final String bundleId;
  final String appVersion;
  final Environment environment;
  final String apiBaseUrl;
  final String firebaseProjectId;
  final String sentryDsn;
  final bool enableLogging;

  const AppConfig({
    required this.appName,
    required this.packageName,
    required this.bundleId,
    required this.appVersion,
    required this.environment,
    required this.apiBaseUrl,
    required this.firebaseProjectId,
    required this.sentryDsn,
    this.enableLogging = false,
  });

  void validate() {
    if (appName.trim().isEmpty) throw ArgumentError('appName cannot be empty');
    if (packageName.trim().isEmpty) throw ArgumentError('packageName cannot be empty');
    if (bundleId.trim().isEmpty) throw ArgumentError('bundleId cannot be empty');
    if (!apiBaseUrl.startsWith('https://') && environment == Environment.production) {
      throw ArgumentError('Production API must use HTTPS');
    }
    if (environment == Environment.production && sentryDsn.trim().isEmpty) {
      throw ArgumentError('Production builds must have Sentry DSN configured');
    }
  }

  bool get isProduction => environment == Environment.production;
  bool get isStaging => environment == Environment.staging;
  bool get isDev => environment == Environment.dev;
}
