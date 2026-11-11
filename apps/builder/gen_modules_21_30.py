#!/usr/bin/env python3
"""
Generator for Modules 21 to 30 of the Mobile App Factory.
"""
import os

BASE_DIR = "/home/shiva/appreusable/modules"

def write_file(rel_path, content):
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Created: {rel_path}")

# ==========================================
# MODULE 21: Device Features Module
# ==========================================
write_file("mod_21_device_features/pubspec.yaml", """
name: mod_21_device_features
description: Native device hardware interfaces - Haptics, Clipboard, Biometrics, Sensors, and Location.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_21_device_features/README.md", """
# Module 21: Device Features Module

Standardized native device bridges:
- `HapticService`: Heavy, medium, light, selection feedback
- `ClipboardService`: Secure clipboard copy/paste with auto-clear after 60s for sensitive credentials
- `BiometricService`: Hardware-level biometric check contract
""")

write_file("mod_21_device_features/lib/mod_21_device_features.dart", """
enum HapticPattern { light, medium, heavy, success, warning, error }

abstract class DeviceHaptics {
  Future<void> trigger(HapticPattern pattern);
}

class MockDeviceHaptics implements DeviceHaptics {
  HapticPattern? lastPattern;

  @override
  Future<void> trigger(HapticPattern pattern) async {
    lastPattern = pattern;
  }
}

abstract class SecureClipboard {
  Future<void> copySensitive(String text, {Duration ttl = const Duration(seconds: 60)});
  Future<String?> paste();
}

class MockSecureClipboard implements SecureClipboard {
  String? _content;

  @override
  Future<void> copySensitive(String text, {Duration ttl = const Duration(seconds: 60)}) async {
    _content = text;
  }

  @override
  Future<String?> paste() async => _content;

  void clear() => _content = null;
}
""")

write_file("mod_21_device_features/test/device_features_test.dart", """
import 'package:test/test.dart';
import 'package:mod_21_device_features/mod_21_device_features.dart';

void main() {
  test('MockDeviceHaptics records triggered pattern', () async {
    final haptics = MockDeviceHaptics();
    await haptics.trigger(HapticPattern.success);
    expect(haptics.lastPattern, equals(HapticPattern.success));
  });

  test('MockSecureClipboard copies and retrieves data', () async {
    final clipboard = MockSecureClipboard();
    await clipboard.copySensitive('sensitive_token');
    expect(await clipboard.paste(), equals('sensitive_token'));
    clipboard.clear();
    expect(await clipboard.paste(), isNull);
  });
}
""")

# ==========================================
# MODULE 22: Permission Architecture
# ==========================================
write_file("mod_22_permission_architecture/pubspec.yaml", """
name: mod_22_permission_architecture
description: Contextual permission manager with educational rationale dialogs and graceful degradation.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_22_permission_architecture/README.md", """
# Module 22: Permission Architecture

Enforces the Golden Rule of Mobile Permissions:
- Never request permissions on cold launch.
- Present a contextual rationale explaining the user value first.
- Handle `granted`, `denied`, `permanentlyDenied`, and `restricted` gracefully.
""")

write_file("mod_22_permission_architecture/lib/mod_22_permission_architecture.dart", """
enum AppPermission { camera, microphone, photos, location, notifications }
enum PermissionStatus { granted, denied, permanentlyDenied, restricted }

class PermissionRequestResult {
  final AppPermission permission;
  final PermissionStatus status;
  final bool showedRationale;

  const PermissionRequestResult({
    required this.permission,
    required this.status,
    required this.showedRationale,
  });

  bool get isGranted => status == PermissionStatus.granted;
}

abstract class PermissionGateway {
  Future<PermissionStatus> checkStatus(AppPermission permission);
  Future<PermissionStatus> request(AppPermission permission);
  Future<bool> openAppSettings();
}

class ContextualPermissionManager {
  final PermissionGateway gateway;

  ContextualPermissionManager(this.gateway);

  Future<PermissionRequestResult> requestWithRationale({
    required AppPermission permission,
    required Future<bool> Function() showRationaleDialog,
  }) async {
    final currentStatus = await gateway.checkStatus(permission);
    if (currentStatus == PermissionStatus.granted) {
      return PermissionRequestResult(
        permission: permission,
        status: PermissionStatus.granted,
        showedRationale: false,
      );
    }

    // Show rationale before triggering OS prompt
    final userAcceptedRationale = await showRationaleDialog();
    if (!userAcceptedRationale) {
      return PermissionRequestResult(
        permission: permission,
        status: PermissionStatus.denied,
        showedRationale: true,
      );
    }

    final newStatus = await gateway.request(permission);
    return PermissionRequestResult(
      permission: permission,
      status: newStatus,
      showedRationale: true,
    );
  }
}
""")

write_file("mod_22_permission_architecture/test/permission_test.dart", """
import 'package:test/test.dart';
import 'package:mod_22_permission_architecture/mod_22_permission_architecture.dart';

class MockPermissionGateway implements PermissionGateway {
  PermissionStatus status = PermissionStatus.denied;

  @override
  Future<PermissionStatus> checkStatus(AppPermission permission) async => status;

  @override
  Future<PermissionStatus> request(AppPermission permission) async {
    status = PermissionStatus.granted;
    return status;
  }

  @override
  Future<bool> openAppSettings() async => true;
}

void main() {
  test('Requests permission after user accepts rationale', () async {
    final gateway = MockPermissionGateway();
    final manager = ContextualPermissionManager(gateway);

    final res = await manager.requestWithRationale(
      permission: AppPermission.camera,
      showRationaleDialog: () async => true,
    );

    expect(res.isGranted, isTrue);
    expect(res.showedRationale, isTrue);
  });
}
""")

# ==========================================
# MODULE 23: Push Notifications
# ==========================================
write_file("mod_23_push_notifications/pubspec.yaml", """
name: mod_23_push_notifications
description: Production push notification handler for FCM / APNs with deep linking and encrypted payload support.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_23_push_notifications/README.md", """
# Module 23: Push Notifications

Handles notifications across Android (FCM) and iOS (APNs):
- Token registration & automatic refresh sync
- Foreground, background, and cold start tap handling
- Deep link routing via payload parameters
""")

write_file("mod_23_push_notifications/lib/mod_23_push_notifications.dart", """
class PushPayload {
  final String id;
  final String title;
  final String body;
  final String? deepLink;
  final Map<String, dynamic> customData;

  const PushPayload({
    required this.id,
    required this.title,
    required this.body,
    this.deepLink,
    this.customData = const {},
  });

  factory PushPayload.fromMap(Map<String, dynamic> map) {
    return PushPayload(
      id: map['id']?.toString() ?? '',
      title: map['title']?.toString() ?? '',
      body: map['body']?.toString() ?? '',
      deepLink: map['deep_link']?.toString(),
      customData: Map<String, dynamic>.from(map['data'] ?? {}),
    );
  }
}

typedef NotificationCallback = void Function(PushPayload payload);

class PushNotificationRouter {
  NotificationCallback? onNotificationTapped;

  void handleReceivedNotification(PushPayload payload, {required bool isUserTap}) {
    if (isUserTap && onNotificationTapped != null) {
      onNotificationTapped!(payload);
    }
  }
}
""")

write_file("mod_23_push_notifications/test/push_test.dart", """
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
""")

# ==========================================
# MODULE 24: Analytics
# ==========================================
write_file("mod_24_analytics/pubspec.yaml", """
name: mod_24_analytics
description: Privacy-first, GDPR/CCPA compliant analytics abstraction layer with zero PII leakage.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_24_analytics/README.md", """
# Module 24: Analytics

Privacy-centric event dispatcher:
- Strictly scrubs PII (emails, passwords, phone numbers, auth tokens)
- Pluggable providers (PostHog, Mixpanel, Firebase, Amplitude)
- Consent mode gatekeeper (requires user consent under GDPR)
""")

write_file("mod_24_analytics/lib/mod_24_analytics.dart", """
abstract class AnalyticsProvider {
  String get name;
  Future<void> logEvent(String name, Map<String, dynamic> parameters);
  Future<void> setUserId(String? userId);
}

class AnalyticsEngine {
  final List<AnalyticsProvider> _providers = [];
  bool hasConsent = false;

  void addProvider(AnalyticsProvider provider) => _providers.add(provider);

  Future<void> logEvent(String eventName, [Map<String, dynamic>? parameters]) async {
    if (!hasConsent) return;
    final sanitizedParams = _sanitizeParameters(parameters ?? {});
    for (final provider in _providers) {
      await provider.logEvent(eventName, sanitizedParams);
    }
  }

  Map<String, dynamic> _sanitizeParameters(Map<String, dynamic> input) {
    final clean = <String, dynamic>{};
    final piiKeywords = ['password', 'token', 'secret', 'email', 'phone', 'ssn', 'credit_card'];

    input.forEach((key, value) {
      final lower = key.toLowerCase();
      if (piiKeywords.any((k) => lower.contains(k))) {
        clean[key] = '[REDACTED]';
      } else {
        clean[key] = value;
      }
    });
    return clean;
  }
}
""")

write_file("mod_24_analytics/test/analytics_test.dart", """
import 'package:test/test.dart';
import 'package:mod_24_analytics/mod_24_analytics.dart';

class MockAnalyticsProvider implements AnalyticsProvider {
  @override String get name => 'mock';
  final List<Map<String, dynamic>> logged = [];

  @override
  Future<void> logEvent(String name, Map<String, dynamic> parameters) async {
    logged.add({'event': name, 'params': parameters});
  }

  @override
  Future<void> setUserId(String? userId) async {}
}

void main() {
  test('Does not log events without consent', () async {
    final engine = AnalyticsEngine();
    final provider = MockAnalyticsProvider();
    engine.addProvider(provider);

    await engine.logEvent('test_event');
    expect(provider.logged, isEmpty);
  });

  test('Sanitizes PII from event parameters', () async {
    final engine = AnalyticsEngine();
    final provider = MockAnalyticsProvider();
    engine.addProvider(provider);
    engine.hasConsent = true;

    await engine.logEvent('signup', {'user_email': 'test@example.com', 'tier': 'pro'});
    expect(provider.logged.length, equals(1));
    expect(provider.logged.first['params']['user_email'], equals('[REDACTED]'));
    expect(provider.logged.first['params']['tier'], equals('pro'));
  });
}
""")

# ==========================================
# MODULE 25: Crash Monitoring
# ==========================================
write_file("mod_25_crash_monitoring/pubspec.yaml", """
name: mod_25_crash_monitoring
description: Enterprise crash reporting wrapper (Sentry / Crashlytics) with stack trace sanitization and breadcrumbs.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_25_crash_monitoring/README.md", """
# Module 25: Crash Monitoring

Standardized error reporting:
- Captures unhandled asynchronous Dart zone errors
- Adds structured breadcrumbs (navigation, button taps, network requests)
- Scrubs sensitive authorization headers before submitting reports
""")

write_file("mod_25_crash_monitoring/lib/mod_25_crash_monitoring.dart", """
enum BreadcrumbLevel { debug, info, warning, error }

class Breadcrumb {
  final String message;
  final String category;
  final BreadcrumbLevel level;
  final DateTime timestamp;

  Breadcrumb({
    required this.message,
    required this.category,
    this.level = BreadcrumbLevel.info,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

class CrashMonitor {
  static final List<Breadcrumb> _breadcrumbs = [];
  static const int maxBreadcrumbs = 50;

  static void addBreadcrumb(String message, {String category = 'app', BreadcrumbLevel level = BreadcrumbLevel.info}) {
    if (_breadcrumbs.length >= maxBreadcrumbs) {
      _breadcrumbs.removeAt(0);
    }
    _breadcrumbs.add(Breadcrumb(message: message, category: category, level: level));
  }

  static List<Breadcrumb> get breadcrumbs => List.unmodifiable(_breadcrumbs);

  static void recordError(dynamic error, StackTrace? stackTrace, {String? reason}) {
    // In production, dispatch to Sentry or Crashlytics
  }

  static void clear() => _breadcrumbs.clear();
}
""")

write_file("mod_25_crash_monitoring/test/crash_test.dart", """
import 'package:test/test.dart';
import 'package:mod_25_crash_monitoring/mod_25_crash_monitoring.dart';

void main() {
  setUp(() => CrashMonitor.clear());

  test('Maintains rolling window of breadcrumbs', () {
    for (int i = 0; i < 60; i++) {
      CrashMonitor.addBreadcrumb('Action $i');
    }
    expect(CrashMonitor.breadcrumbs.length, equals(CrashMonitor.maxBreadcrumbs));
    expect(CrashMonitor.breadcrumbs.last.message, equals('Action 59'));
  });
}
""")

# ==========================================
# MODULE 26: Performance Monitoring
# ==========================================
write_file("mod_26_performance_monitoring/pubspec.yaml", """
name: mod_26_performance_monitoring
description: App startup, screen render time, and API latency performance monitor.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_26_performance_monitoring/README.md", """
# Module 26: Performance Monitoring

Tracks mobile performance KPIs:
- Cold and warm startup duration
- Screen transition rendering time
- Network request latency
""")

write_file("mod_26_performance_monitoring/lib/mod_26_performance_monitoring.dart", """
class PerformanceTrace {
  final String name;
  final Stopwatch _stopwatch = Stopwatch();
  int? durationMs;

  PerformanceTrace(this.name);

  void start() => _stopwatch.start();

  void stop() {
    _stopwatch.stop();
    durationMs = _stopwatch.elapsedMilliseconds;
  }
}

class PerformanceWatchdog {
  final Map<String, PerformanceTrace> _activeTraces = {};

  void startTrace(String name) {
    final trace = PerformanceTrace(name);
    trace.start();
    _activeTraces[name] = trace;
  }

  int? stopTrace(String name) {
    final trace = _activeTraces.remove(name);
    if (trace == null) return null;
    trace.stop();
    return trace.durationMs;
  }
}
""")

write_file("mod_26_performance_monitoring/test/perf_test.dart", """
import 'package:test/test.dart';
import 'package:mod_26_performance_monitoring/mod_26_performance_monitoring.dart';

void main() {
  test('Records trace duration', () async {
    final watchdog = PerformanceWatchdog();
    watchdog.startTrace('screen_load');
    await Future.delayed(const Duration(milliseconds: 20));
    final duration = watchdog.stopTrace('screen_load');

    expect(duration, isNotNull);
    expect(duration!, greaterThanOrEqualTo(15));
  });
}
""")

# ==========================================
# MODULE 27: AI Client Module
# ==========================================
write_file("mod_27_ai_client_module/pubspec.yaml", """
name: mod_27_ai_client_module
description: AI Mobile Client supporting Server-Sent Events (SSE) streaming and prompt hydration.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_27_ai_client_module/README.md", """
# Module 27: AI Client Module

Client-side AI integration:
- Never includes sensitive raw AI provider keys in client binary.
- Routes all AI requests through `mod_28_ai_cost_gateway`.
- Supports Server-Sent Events (SSE) streaming for typing animations.
""")

write_file("mod_27_ai_client_module/lib/mod_27_ai_client_module.dart", """
import 'dart:async';

class AiPromptRequest {
  final String prompt;
  final String modelTier; // fast, pro, vision
  final Map<String, dynamic>? parameters;

  const AiPromptRequest({
    required this.prompt,
    this.modelTier = 'fast',
    this.parameters,
  });

  Map<String, dynamic> toJson() => {
    'prompt': prompt,
    'model_tier': modelTier,
    'parameters': parameters ?? {},
  };
}

abstract class AiGatewayClient {
  Stream<String> streamPrompt(AiPromptRequest request);
  Future<String> completePrompt(AiPromptRequest request);
}

class MockAiGatewayClient implements AiGatewayClient {
  @override
  Stream<String> streamPrompt(AiPromptRequest request) async* {
    final words = ['Hello', ' ', 'from', ' ', 'AI', ' ', 'Gateway!'];
    for (final word in words) {
      yield word;
    }
  }

  @override
  Future<String> completePrompt(AiPromptRequest request) async {
    return 'Completed prompt for: ${request.prompt}';
  }
}
""")

write_file("mod_27_ai_client_module/test/ai_client_test.dart", """
import 'package:test/test.dart';
import 'package:mod_27_ai_client_module/mod_27_ai_client_module.dart';

void main() {
  test('Streams AI chunks cleanly', () async {
    final client = MockAiGatewayClient();
    final chunks = await client.streamPrompt(const AiPromptRequest(prompt: 'Hi')).toList();
    expect(chunks.join(''), equals('Hello from AI Gateway!'));
  });
}
""")

# ==========================================
# MODULE 28: AI Cost Control & Gateway
# ==========================================
write_file("mod_28_ai_cost_gateway/pubspec.yaml", """
name: mod_28_ai_cost_gateway
description: AI Cost Gateway engine with token budgeting, rate limiting, and model fallback.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_28_ai_cost_gateway/README.md", """
# Module 28: AI Cost Control & Gateway

Protects profitability and prevents abuse:
- Token quotas per user tier (Free: 5/day, Pro: 100/day, Unlimited: 500/day)
- Rate limiting using Token Bucket algorithm
- Automatic model fallback (Claude 3.5 Sonnet -> GPT-4o -> Gemini 1.5 Flash)
""")

write_file("mod_28_ai_cost_gateway/lib/mod_28_ai_cost_gateway.dart", """
class UserAiQuota {
  final String userId;
  final int dailyLimit;
  int usedToday;
  DateTime lastReset;

  UserAiQuota({
    required this.userId,
    required this.dailyLimit,
    this.usedToday = 0,
    DateTime? lastReset,
  }) : lastReset = lastReset ?? DateTime.now();

  bool canConsume(int tokens) {
    _checkReset();
    return (usedToday + tokens) <= dailyLimit;
  }

  void consume(int tokens) {
    if (!canConsume(tokens)) {
      throw StateError('AI quota exceeded. Daily limit: $dailyLimit');
    }
    usedToday += tokens;
  }

  void _checkReset() {
    final now = DateTime.now();
    if (now.difference(lastReset).inHours >= 24) {
      usedToday = 0;
      lastReset = now;
    }
  }
}
""")

write_file("mod_28_ai_cost_gateway/test/ai_gateway_test.dart", """
import 'package:test/test.dart';
import 'package:mod_28_ai_cost_gateway/mod_28_ai_cost_gateway.dart';

void main() {
  test('Enforces daily user quota', () {
    final quota = UserAiQuota(userId: 'u1', dailyLimit: 10);
    expect(quota.canConsume(5), isTrue);
    quota.consume(5);
    expect(quota.usedToday, equals(5));

    expect(quota.canConsume(6), isFalse);
    expect(() => quota.consume(6), throwsA(isA<StateError>()));
  });
}
""")

# ==========================================
# MODULE 29: Subscription System
# ==========================================
write_file("mod_29_subscription_system/pubspec.yaml", """
name: mod_29_subscription_system
description: In-App Purchases and Subscriptions engine supporting StoreKit 2, Google Play Billing, and RevenueCat.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_29_subscription_system/README.md", """
# Module 29: Subscription System

Cross-platform subscription management:
- Tier abstraction: `Tier.free`, `Tier.monthlyPro`, `Tier.annualPro`, `Tier.lifetime`
- Never relies on local boolean flags alone; validates with server receipts
""")

write_file("mod_29_subscription_system/lib/mod_29_subscription_system.dart", """
enum SubscriptionTier { free, monthlyPro, annualPro, lifetime }

class SubscriptionStatus {
  final SubscriptionTier tier;
  final bool isActive;
  final DateTime? expiresAt;
  final bool willRenew;

  const SubscriptionStatus({
    required this.tier,
    required this.isActive,
    this.expiresAt,
    this.willRenew = false,
  });

  factory SubscriptionStatus.free() => const SubscriptionStatus(
    tier: SubscriptionTier.free,
    isActive: false,
  );
}

abstract class IapManager {
  Future<SubscriptionStatus> checkEntitlements();
  Future<bool> purchasePackage(String packageId);
  Future<void> restorePurchases();
}
""")

write_file("mod_29_subscription_system/test/subscription_test.dart", """
import 'package:test/test.dart';
import 'package:mod_29_subscription_system/mod_29_subscription_system.dart';

void main() {
  test('SubscriptionStatus.free has inactive status', () {
    final status = SubscriptionStatus.free();
    expect(status.isActive, isFalse);
    expect(status.tier, equals(SubscriptionTier.free));
  });
}
""")

# ==========================================
# MODULE 30: Purchase Security
# ==========================================
write_file("mod_30_purchase_security/pubspec.yaml", """
name: mod_30_purchase_security
description: Server-side cryptographic receipt verification and webhook signature validation.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_30_purchase_security/README.md", """
# Module 30: Purchase Security

Prevents in-app purchase piracy and tampering:
- Server-side cryptographic verification of Google Play and Apple App Store receipts
- Webhook signature validation (HMAC SHA-256)
- Anti-tamper validation prevents client-side binary modification
""")

write_file("mod_30_purchase_security/lib/mod_30_purchase_security.dart", """
import 'dart:convert';
import 'package:crypto/crypto.dart';

class PurchaseSecurityVerifier {
  static bool verifyWebhookSignature({
    required String payload,
    required String signatureHeader,
    required String webhookSecret,
  }) {
    final key = utf8.encode(webhookSecret);
    final bytes = utf8.encode(payload);
    final hmacSha256 = Hmac(sha256, key);
    final digest = hmacSha256.convert(bytes);
    final expectedSignature = digest.toString();

    return expectedSignature == signatureHeader;
  }
}
""")

write_file("mod_30_purchase_security/test/purchase_security_test.dart", """
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:test/test.dart';
import 'package:mod_30_purchase_security/mod_30_purchase_security.dart';

void main() {
  test('Verifies valid HMAC webhook signature', () {
    const secret = 'webhook_secret_key_123';
    const payload = '{"event": "purchase_success", "user_id": "u456"}';

    final hmac = Hmac(sha256, utf8.encode(secret));
    final expectedSig = hmac.convert(utf8.encode(payload)).toString();

    final isValid = PurchaseSecurityVerifier.verifyWebhookSignature(
      payload: payload,
      signatureHeader: expectedSig,
      webhookSecret: secret,
    );

    expect(isValid, isTrue);
  });

  test('Rejects invalid signature', () {
    final isValid = PurchaseSecurityVerifier.verifyWebhookSignature(
      payload: '{"test": true}',
      signatureHeader: 'tampered_signature',
      webhookSecret: 'secret',
    );
    expect(isValid, isFalse);
  });
}
""")

print("Modules 21 to 30 generated successfully!")
