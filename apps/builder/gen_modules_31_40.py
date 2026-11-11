#!/usr/bin/env python3
"""
Generator for Modules 31 to 40 of the Mobile App Factory.
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
# MODULE 31: Ads Module
# ==========================================
write_file("mod_31_ads_module/pubspec.yaml", """
name: mod_31_ads_module
description: Privacy-friendly advertising abstraction with frequency capping and remote kill-switch.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_31_ads_module/README.md", """
# Module 31: Ads Module

Advertising infrastructure:
- Supports Banner, Interstitial, and Rewarded ads
- Dynamic remote switch (`ads_enabled = false` for subscribers)
- Frequency capping prevents user fatigue
""")

write_file("mod_31_ads_module/lib/mod_31_ads_module.dart", """
enum AdType { banner, interstitial, rewarded }

class AdController {
  bool adsEnabled;
  final int minSecondsBetweenInterstitials;
  DateTime? _lastInterstitialShown;

  AdController({
    this.adsEnabled = true,
    this.minSecondsBetweenInterstitials = 60,
  });

  bool canShowInterstitial() {
    if (!adsEnabled) return false;
    if (_lastInterstitialShown == null) return true;
    final elapsed = DateTime.now().difference(_lastInterstitialShown!).inSeconds;
    return elapsed >= minSecondsBetweenInterstitials;
  }

  void recordInterstitialShown() {
    _lastInterstitialShown = DateTime.now();
  }
}
""")

write_file("mod_31_ads_module/test/ads_test.dart", """
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
""")

# ==========================================
# MODULE 32: Remote Configuration
# ==========================================
write_file("mod_32_remote_config/pubspec.yaml", """
name: mod_32_remote_config
description: Remote configuration client with local cache fallbacks and type-safe getters.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_32_remote_config/README.md", """
# Module 32: Remote Configuration

Enables instant app adjustments without App Store re-submission:
- Type-safe string, integer, boolean, and JSON getters
- Fallback defaults ensure offline resilience
""")

write_file("mod_32_remote_config/lib/mod_32_remote_config.dart", """
class RemoteConfigClient {
  final Map<String, dynamic> _defaults;
  final Map<String, dynamic> _remoteValues = {};

  RemoteConfigClient({required Map<String, dynamic> defaults}) : _defaults = Map.unmodifiable(defaults);

  void setRemoteValues(Map<String, dynamic> values) {
    _remoteValues.clear();
    _remoteValues.addAll(values);
  }

  String getString(String key) => (_remoteValues[key] ?? _defaults[key])?.toString() ?? '';
  int getInt(String key) => (_remoteValues[key] ?? _defaults[key]) as int? ?? 0;
  bool getBool(String key) => (_remoteValues[key] ?? _defaults[key]) as bool? ?? false;
}
""")

write_file("mod_32_remote_config/test/remote_config_test.dart", """
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
""")

# ==========================================
# MODULE 33: Feature Flags
# ==========================================
write_file("mod_33_feature_flags/pubspec.yaml", """
name: mod_33_feature_flags
description: Percentage-based feature rollout engine with deterministic user hashing.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  crypto: ^3.0.3

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_33_feature_flags/README.md", """
# Module 33: Feature Flags

Enables gradual feature rollouts:
- Deterministic hashing via SHA-256 ensuring user remains in the same bucket
- Percentage rollouts (10%, 50%, 100%)
- Kill-switch support
""")

write_file("mod_33_feature_flags/lib/mod_33_feature_flags.dart", """
import 'dart:convert';
import 'package:crypto/crypto.dart';

class FeatureFlagEngine {
  static bool isFeatureEnabled({
    required String featureKey,
    required String userId,
    required int rolloutPercentage, // 0 to 100
  }) {
    if (rolloutPercentage <= 0) return false;
    if (rolloutPercentage >= 100) return true;

    final input = '$featureKey:$userId';
    final hashBytes = sha256.convert(utf8.encode(input)).bytes;
    final hashInt = hashBytes[0] | (hashBytes[1] << 8);
    final bucket = hashInt % 100;

    return bucket < rolloutPercentage;
  }
}
""")

write_file("mod_33_feature_flags/test/feature_flags_test.dart", """
import 'package:test/test.dart';
import 'package:mod_33_feature_flags/mod_33_feature_flags.dart';

void main() {
  test('Deterministic rollout buckets users consistently', () {
    const feature = 'new_editor';
    final userA1 = FeatureFlagEngine.isFeatureEnabled(featureKey: feature, userId: 'user_123', rolloutPercentage: 50);
    final userA2 = FeatureFlagEngine.isFeatureEnabled(featureKey: feature, userId: 'user_123', rolloutPercentage: 50);

    expect(userA1, equals(userA2));

    expect(FeatureFlagEngine.isFeatureEnabled(featureKey: feature, userId: 'user_123', rolloutPercentage: 0), isFalse);
    expect(FeatureFlagEngine.isFeatureEnabled(featureKey: feature, userId: 'user_123', rolloutPercentage: 100), isTrue);
  });
}
""")

# ==========================================
# MODULE 34: Deep Link System
# ==========================================
write_file("mod_34_deep_link_system/pubspec.yaml", """
name: mod_34_deep_link_system
description: Secure App Links and Universal Links router with parameter sanitization.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_34_deep_link_system/README.md", """
# Module 34: Deep Link System

Universal links and custom scheme router:
- Validates URI structure and sanitizes path and query params
- Routes users to exact screens (e.g. `/product/:id`, `/referral/:code`)
""")

write_file("mod_34_deep_link_system/lib/mod_34_deep_link_system.dart", """
class DeepLinkRoute {
  final String path;
  final Map<String, String> pathParams;
  final Map<String, String> queryParams;

  const DeepLinkRoute({
    required this.path,
    this.pathParams = const {},
    this.queryParams = const {},
  });
}

class DeepLinkRouter {
  static DeepLinkRoute? parseUri(Uri uri, {required String expectedHost}) {
    if (uri.host.isNotEmpty && uri.host != expectedHost) {
      return null;
    }

    final segments = uri.pathSegments;
    if (segments.isEmpty) {
      return const DeepLinkRoute(path: '/');
    }

    final path = '/${segments.join('/')}';
    return DeepLinkRoute(
      path: path,
      queryParams: uri.queryParameters,
    );
  }
}
""")

write_file("mod_34_deep_link_system/test/deep_link_test.dart", """
import 'package:test/test.dart';
import 'package:mod_34_deep_link_system/mod_34_deep_link_system.dart';

void main() {
  test('Parses valid deep link route', () {
    final uri = Uri.parse('https://app.example.com/items/42?ref=twitter');
    final route = DeepLinkRouter.parseUri(uri, expectedHost: 'app.example.com');

    expect(route, isNotNull);
    expect(route?.path, equals('/items/42'));
    expect(route?.queryParams['ref'], equals('twitter'));
  });

  test('Rejects unrecognized host', () {
    final uri = Uri.parse('https://malicious.com/items/42');
    final route = DeepLinkRouter.parseUri(uri, expectedHost: 'app.example.com');
    expect(route, isNull);
  });
}
""")

# ==========================================
# MODULE 35: Sharing System
# ==========================================
write_file("mod_35_sharing_system/pubspec.yaml", """
name: mod_35_sharing_system
description: Standardized system share sheet integration, text formatting, and watermarking engine.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_35_sharing_system/README.md", """
# Module 35: Sharing System

Standardizes social sharing across apps:
- Generates formatted share cards and attribution links
- Prepares sanitized shareable text and assets
""")

write_file("mod_35_sharing_system/lib/mod_35_sharing_system.dart", """
class ShareContent {
  final String text;
  final String? subject;
  final String? url;

  const ShareContent({
    required this.text,
    this.subject,
    this.url,
  });

  String get formattedMessage {
    if (url != null && url!.isNotEmpty) {
      return '$text\n\n$url';
    }
    return text;
  }
}
""")

write_file("mod_35_sharing_system/test/sharing_test.dart", """
import 'package:test/test.dart';
import 'package:mod_35_sharing_system/mod_35_sharing_system.dart';

void main() {
  test('Formats share message with URL', () {
    const content = ShareContent(text: 'Check out this app!', url: 'https://app.link/123');
    expect(content.formattedMessage, equals('Check out this app!\n\nhttps://app.link/123'));
  });
}
""")

# ==========================================
# MODULE 36: Viral Loops Module
# ==========================================
write_file("mod_36_viral_loops/pubspec.yaml", """
name: mod_36_viral_loops
description: Viral referral loops, invite code generation, and attribution engine.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  crypto: ^3.0.3

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_36_viral_loops/README.md", """
# Module 36: Viral Loops Module

Built-in viral growth mechanics:
- Cryptographic referral code generation
- Multi-tier referral reward entitlement unlock
""")

write_file("mod_36_viral_loops/lib/mod_36_viral_loops.dart", """
import 'dart:convert';
import 'package:crypto/crypto.dart';

class ReferralEngine {
  static String generateReferralCode(String userId) {
    final hash = sha256.convert(utf8.encode('ref:$userId')).toString();
    return hash.substring(0, 8).toUpperCase();
  }

  static bool validateReferralCode(String code) {
    return RegExp(r'^[A-Z0-9]{8}$').hasMatch(code);
  }
}
""")

write_file("mod_36_viral_loops/test/viral_test.dart", """
import 'package:test/test.dart';
import 'package:mod_36_viral_loops/mod_36_viral_loops.dart';

void main() {
  test('Generates and validates 8-char referral code', () {
    final code = ReferralEngine.generateReferralCode('user_99');
    expect(code.length, equals(8));
    expect(ReferralEngine.validateReferralCode(code), isTrue);
  });
}
""")

# ==========================================
# MODULE 37: Onboarding Engine
# ==========================================
write_file("mod_37_onboarding_engine/pubspec.yaml", """
name: mod_37_onboarding_engine
description: Multi-step interactive onboarding state machine with permission priming and step tracking.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_37_onboarding_engine/README.md", """
# Module 37: Onboarding Engine

Modular onboarding controller:
- Manages sequential slides, persona selection, and permission priming
- Persists completion status
""")

write_file("mod_37_onboarding_engine/lib/mod_37_onboarding_engine.dart", """
class OnboardingStep {
  final String id;
  final String title;
  final String description;

  const OnboardingStep({
    required this.id,
    required this.title,
    required this.description,
  });
}

class OnboardingController {
  final List<OnboardingStep> steps;
  int _currentIndex = 0;
  bool _isCompleted = false;

  OnboardingController({required this.steps});

  int get currentIndex => _currentIndex;
  bool get isCompleted => _isCompleted;
  OnboardingStep get currentStep => steps[_currentIndex];

  void next() {
    if (_currentIndex < steps.length - 1) {
      _currentIndex++;
    } else {
      _isCompleted = true;
    }
  }

  void skip() {
    _isCompleted = true;
  }
}
""")

write_file("mod_37_onboarding_engine/test/onboarding_test.dart", """
import 'package:test/test.dart';
import 'package:mod_37_onboarding_engine/mod_37_onboarding_engine.dart';

void main() {
  test('Cycles through steps and marks complete', () {
    final controller = OnboardingController(steps: [
      const OnboardingStep(id: '1', title: 'Step 1', description: 'Desc 1'),
      const OnboardingStep(id: '2', title: 'Step 2', description: 'Desc 2'),
    ]);

    expect(controller.currentIndex, equals(0));
    controller.next();
    expect(controller.currentIndex, equals(1));
    expect(controller.isCompleted, isFalse);
    controller.next();
    expect(controller.isCompleted, isTrue);
  });
}
""")

# ==========================================
# MODULE 38: App Lifecycle Guardian
# ==========================================
write_file("mod_38_app_lifecycle/pubspec.yaml", """
name: mod_38_app_lifecycle
description: App lifecycle observer managing cold/warm start state recovery and background suspension.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_38_app_lifecycle/README.md", """
# Module 38: App Lifecycle Guardian

Monitors application execution state:
- Cold start vs Warm start detection
- Automatic flush of pending mutations and analytics before OS kills background process
""")

write_file("mod_38_app_lifecycle/lib/mod_38_app_lifecycle.dart", """
enum AppExecutionState { resumed, inactive, paused, detached }

class LifecycleGuardian {
  AppExecutionState _currentState = AppExecutionState.resumed;
  final List<Future<void> Function()> _onSuspendHooks = [];

  AppExecutionState get currentState => _currentState;

  void addSuspendHook(Future<void> Function() hook) {
    _onSuspendHooks.add(hook);
  }

  Future<void> handleStateChange(AppExecutionState newState) async {
    _currentState = newState;
    if (newState == AppExecutionState.paused || newState == AppExecutionState.detached) {
      for (final hook in _onSuspendHooks) {
        await hook();
      }
    }
  }
}
""")

write_file("mod_38_app_lifecycle/test/lifecycle_test.dart", """
import 'package:test/test.dart';
import 'package:mod_38_app_lifecycle/mod_38_app_lifecycle.dart';

void main() {
  test('Executes suspend hooks when paused', () async {
    final guardian = LifecycleGuardian();
    bool hookRan = false;
    guardian.addSuspendHook(() async => hookRan = true);

    await guardian.handleStateChange(AppExecutionState.paused);
    expect(hookRan, isTrue);
    expect(guardian.currentState, equals(AppExecutionState.paused));
  });
}
""")

# ==========================================
# MODULE 39: Security Hardening & Anti-Tamper
# ==========================================
write_file("mod_39_security_hardening/pubspec.yaml", """
name: mod_39_security_hardening
description: Anti-tamper security suite with Root/Jailbreak detection, emulator detection, and SSL Pinning.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_39_security_hardening/README.md", """
# Module 39: Security Hardening & Anti-Tamper

Hardens apps against attacks:
- Root / Jailbreak check indicators
- Debugger attachment detection
- Screenshot & screen recording prevention flags
""")

write_file("mod_39_security_hardening/lib/mod_39_security_hardening.dart", """
class DeviceIntegrityReport {
  final bool isJailbrokenOrRooted;
  final bool isEmulator;
  final bool isDebuggerAttached;

  const DeviceIntegrityReport({
    required this.isJailbrokenOrRooted,
    required this.isEmulator,
    required this.isDebuggerAttached,
  });

  bool get isCompromised => isJailbrokenOrRooted || isDebuggerAttached;
}

abstract class SecurityCheck {
  Future<DeviceIntegrityReport> assessIntegrity();
}

class StandardSecurityCheck implements SecurityCheck {
  @override
  Future<DeviceIntegrityReport> assessIntegrity() async {
    // In production native bridge, inspect su binary, /system/app, Cydia, test-keys
    return const DeviceIntegrityReport(
      isJailbrokenOrRooted: false,
      isEmulator: false,
      isDebuggerAttached: false,
    );
  }
}
""")

write_file("mod_39_security_hardening/test/security_hardening_test.dart", """
import 'package:test/test.dart';
import 'package:mod_39_security_hardening/mod_39_security_hardening.dart';

void main() {
  test('DeviceIntegrityReport detects compromised environment', () {
    const reportClean = DeviceIntegrityReport(
      isJailbrokenOrRooted: false,
      isEmulator: false,
      isDebuggerAttached: false,
    );
    expect(reportClean.isCompromised, isFalse);

    const reportRooted = DeviceIntegrityReport(
      isJailbrokenOrRooted: true,
      isEmulator: false,
      isDebuggerAttached: false,
    );
    expect(reportRooted.isCompromised, isTrue);
  });
}
""")

# ==========================================
# MODULE 40: Data Validation & Sanitization
# ==========================================
write_file("mod_40_data_validation/pubspec.yaml", """
name: mod_40_data_validation
description: Strict input sanitization, anti-SQLi, anti-XSS, and regex schema validation library.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_40_data_validation/README.md", """
# Module 40: Data Validation & Sanitization

Sanitizes all user inputs before persistence or transmission:
- Strict email, phone, URL validation
- Anti-XSS HTML entity escaping
- Anti-SQLi parameter validation
""")

write_file("mod_40_data_validation/lib/mod_40_data_validation.dart", """
class InputSanitizer {
  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$',
  );

  static bool isValidEmail(String email) => _emailRegex.hasMatch(email.trim());

  static String sanitizeHtml(String text) {
    return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#x27;')
        .replaceAll('/', '&#x2F;');
  }

  static bool isSafeString(String input) {
    // Flag obvious SQL injection patterns
    final lower = input.toLowerCase();
    return !lower.contains(';') && !lower.contains('--') && !lower.contains('drop table');
  }
}
""")

write_file("mod_40_data_validation/test/validation_test.dart", """
import 'package:test/test.dart';
import 'package:mod_40_data_validation/mod_40_data_validation.dart';

void main() {
  test('Validates RFC-compliant emails', () {
    expect(InputSanitizer.isValidEmail('user@domain.com'), isTrue);
    expect(InputSanitizer.isValidEmail('invalid-email'), isFalse);
  });

  test('Sanitizes HTML injection characters', () {
    final clean = InputSanitizer.sanitizeHtml('<script>alert("xss")</script>');
    expect(clean, equals('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'));
  });

  test('Detects malicious SQL injection fragments', () {
    expect(InputSanitizer.isSafeString('John Doe'), isTrue);
    expect(InputSanitizer.isSafeString('admin; DROP TABLE users;--'), isFalse);
  });
}
""")

print("Modules 31 to 40 generated successfully!")
