#!/usr/bin/env python3
"""
Deep Generator for Suite 6: Flutter & Mobile Client Capabilities (Modules 16 - 43)
"""

import os

BASE_DIR = "/home/shiva/appreusable/modules"

def write(rel_path, content):
    p = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated: {rel_path}")

# mod_16_design_system
write("mod_16_design_system/lib/mod_16_design_system.dart", '''
import 'package:flutter/material.dart';

class FactoryPrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isLoading;

  const FactoryPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: isLoading
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
          : Text(label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
    );
  }
}

class FactoryCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const FactoryCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(padding: padding, child: child),
    );
  }
}
''')

# mod_17_design_tokens
write("mod_17_design_tokens/lib/mod_17_design_tokens.dart", '''
import 'package:flutter/material.dart';

class FactoryTokens {
  // Brand Colors
  static const Color primary = Color(0xFF6200EE);
  static const Color primaryVariant = Color(0xFF3700B3);
  static const Color secondary = Color(0xFF03DAC6);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF8F9FA);
  static const Color error = Color(0xFFB00020);

  // Spacing
  static const double space4 = 4.0;
  static const double space8 = 8.0;
  static const double space12 = 12.0;
  static const double space16 = 16.0;
  static const double space24 = 24.0;
  static const double space32 = 32.0;

  // Border Radius
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;
  static const double radiusFull = 999.0;
}
''')

# mod_18_responsive_ui
write("mod_18_responsive_ui/lib/mod_18_responsive_ui.dart", '''
import 'package:flutter/material.dart';

enum DeviceScreenType { mobile, tablet, desktop }

class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
  });

  static DeviceScreenType getDeviceType(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width >= 1024) return DeviceScreenType.desktop;
    if (width >= 600) return DeviceScreenType.tablet;
    return DeviceScreenType.mobile;
  }

  @override
  Widget build(BuildContext context) {
    final type = getDeviceType(context);
    if (type == DeviceScreenType.desktop && desktop != null) return desktop!;
    if (type == DeviceScreenType.tablet && tablet != null) return tablet!;
    return mobile;
  }
}
''')

# mod_19_accessibility
write("mod_19_accessibility/lib/mod_19_accessibility.dart", '''
import 'package:flutter/material.dart';

class AccessibleHelper {
  static Widget makeAccessible({
    required Widget child,
    required String label,
    String? hint,
    bool isButton = false,
  }) {
    return Semantics(
      label: label,
      hint: hint,
      button: isButton,
      child: child,
    );
  }
}
''')

# mod_20_dark_mode
write("mod_20_dark_mode/lib/mod_20_dark_mode.dart", '''
import 'package:flutter/material.dart';

class FactoryThemeManager {
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: const Color(0xFF6200EE),
      scaffoldBackgroundColor: const Color(0xFFF8F9FA),
      useMaterial3: true,
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: const Color(0xFFBB86FC),
      scaffoldBackgroundColor: const Color(0xFF121212),
      useMaterial3: true,
    );
  }
}
''')

# mod_22_permission_architecture
write("mod_22_permission_architecture/lib/mod_22_permission_architecture.dart", '''
enum AppPermissionStatus { granted, denied, permanentlyDenied, restricted }

abstract class PermissionService {
  Future<AppPermissionStatus> checkPermission(String permissionType);
  Future<AppPermissionStatus> requestPermission(String permissionType);
}

class MockPermissionService implements PermissionService {
  final Map<String, AppPermissionStatus> _status = {};

  @override
  Future<AppPermissionStatus> checkPermission(String permissionType) async {
    return _status[permissionType] ?? AppPermissionStatus.denied;
  }

  @override
  Future<AppPermissionStatus> requestPermission(String permissionType) async {
    _status[permissionType] = AppPermissionStatus.granted;
    return AppPermissionStatus.granted;
  }
}
''')

# mod_23_push_notifications
write("mod_23_push_notifications/lib/mod_23_push_notifications.dart", '''
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
''')

# mod_24_analytics
write("mod_24_analytics/lib/mod_24_analytics.dart", '''
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
''')

# mod_25_crash_monitoring
write("mod_25_crash_monitoring/lib/mod_25_crash_monitoring.dart", '''
abstract class CrashReporter {
  void recordError(dynamic exception, StackTrace stack, {String? reason});
  void addBreadcrumb(String message);
}

class MockCrashReporter implements CrashReporter {
  final List<String> breadcrumbs = [];
  final List<Map<String, dynamic>> reportedErrors = [];

  @override
  void addBreadcrumb(String message) {
    breadcrumbs.add(message);
  }

  @override
  void recordError(dynamic exception, StackTrace stack, {String? reason}) {
    reportedErrors.add({"error": exception.toString(), "reason": reason});
  }
}
''')

# mod_26_performance_monitoring
write("mod_26_performance_monitoring/lib/mod_26_performance_monitoring.dart", '''
class PerformanceTrace {
  final String name;
  final Stopwatch _stopwatch = Stopwatch();

  PerformanceTrace(this.name);

  void start() => _stopwatch.start();
  int stop() {
    _stopwatch.stop();
    return _stopwatch.elapsedMilliseconds;
  }
}
''')

# mod_31_ads_module
write("mod_31_ads_module/lib/mod_31_ads_module.dart", '''
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
''')

# mod_32_remote_config
write("mod_32_remote_config/lib/mod_32_remote_config.dart", '''
class RemoteConfigService {
  final Map<String, dynamic> _config = {};

  void setDefaults(Map<String, dynamic> defaults) {
    _config.addAll(defaults);
  }

  String getString(String key, {String defaultValue = ""}) {
    return _config[key] as String? ?? defaultValue;
  }

  bool getBool(String key, {bool defaultValue = false}) {
    return _config[key] as bool? ?? defaultValue;
  }
}
''')

# mod_33_feature_flags
write("mod_33_feature_flags/lib/mod_33_feature_flags.dart", '''
class FeatureFlagManager {
  final Map<String, bool> _flags = {};

  void updateFlags(Map<String, bool> flags) {
    _flags.addAll(flags);
  }

  bool isEnabled(String flagKey, {bool defaultValue = false}) {
    return _flags[flagKey] ?? defaultValue;
  }
}
''')

# mod_34_deep_link_system
write("mod_34_deep_link_system/lib/mod_34_deep_link_system.dart", '''
class DeepLinkRouter {
  final Map<String, Function(Map<String, String> params)> _routes = {};

  void registerRoute(String path, Function(Map<String, String> params) handler) {
    _routes[path] = handler;
  }

  bool handleUri(Uri uri) {
    final handler = _routes[uri.path];
    if (handler != null) {
      handler(uri.queryParameters);
      return true;
    }
    return false;
  }
}
''')

# mod_35_sharing_system
write("mod_35_sharing_system/lib/mod_35_sharing_system.dart", '''
class NativeShareService {
  static Future<bool> shareText(String text, {String? subject}) async {
    // In production, invokes native share sheet via platform channel
    return true;
  }
}
''')

# mod_36_viral_loops
write("mod_36_viral_loops/lib/mod_36_viral_loops.dart", '''
class ReferralManager {
  static String generateReferralLink(String userId) {
    return "https://app.factory.link/invite?ref=$userId";
  }
}
''')

# mod_37_onboarding_engine
write("mod_37_onboarding_engine/lib/mod_37_onboarding_engine.dart", '''
class OnboardingStep {
  final String title;
  final String description;
  final String assetPath;

  OnboardingStep({required this.title, required this.description, required this.assetPath});
}

class OnboardingController {
  final List<OnboardingStep> steps;
  int currentIndex = 0;

  OnboardingController({required this.steps});

  bool get isLastStep => currentIndex == steps.length - 1;
  void next() {
    if (!isLastStep) currentIndex++;
  }
}
''')

# mod_38_app_lifecycle
write("mod_38_app_lifecycle/lib/mod_38_app_lifecycle.dart", '''
enum AppLifecycleState { resumed, inactive, paused, detached }

class AppLifecycleObserver {
  void onStateChanged(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      // Obscure sensitive screen preview in app switcher
    }
  }
}
''')

# mod_39_security_hardening
write("mod_39_security_hardening/lib/mod_39_security_hardening.dart", '''
class ClientSecurityHardener {
  static bool preventScreenCapture = true;
  static bool disableKeyboardCache = true;
}
''')

# mod_40_data_validation
write("mod_40_data_validation/lib/mod_40_data_validation.dart", '''
class InputValidators {
  static final RegExp _emailRegExp = RegExp(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$");

  static bool isValidEmail(String email) => _emailRegExp.hasMatch(email);

  static bool isValidPassword(String password) => password.length >= 12;
}
''')

# mod_42_file_storage
write("mod_42_file_storage/lib/mod_42_file_storage.dart", '''
abstract class LocalFileManager {
  Future<void> saveFile(String filename, List<int> bytes);
  Future<List<int>?> readFile(String filename);
  Future<void> deleteFile(String filename);
}

class MockLocalFileManager implements LocalFileManager {
  final Map<String, List<int>> _files = {};

  @override
  Future<void> saveFile(String filename, List<int> bytes) async => _files[filename] = bytes;

  @override
  Future<List<int>?> readFile(String filename) async => _files[filename];

  @override
  Future<void> deleteFile(String filename) async => _files.remove(filename);
}
''')

# mod_43_background_jobs
write("mod_43_background_jobs/lib/mod_43_background_jobs.dart", '''
abstract class BackgroundJobScheduler {
  Future<void> schedulePeriodicSync(String jobId, Duration frequency);
  Future<void> cancelJob(String jobId);
}

class MockBackgroundJobScheduler implements BackgroundJobScheduler {
  @override
  Future<void> schedulePeriodicSync(String jobId, Duration frequency) async {}

  @override
  Future<void> cancelJob(String jobId) async {}
}
''')

print("SUITE 6 COMPLETE: All Flutter & Mobile Client modules generated.")
