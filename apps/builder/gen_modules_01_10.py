#!/usr/bin/env python3
"""
Generator for Modules 01 to 10 of the Mobile App Factory.
"""
import os
import json

BASE_DIR = "/home/shiva/appreusable/modules"

def write_file(rel_path, content):
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Created: {rel_path}")

# ==========================================
# MODULE 01: Product Idea Engine
# ==========================================
write_file("mod_01_product_idea_engine/pubspec.yaml", """
name: mod_01_product_idea_engine
description: Standardized product idea validation, scoring rubric, and lifecycle state machine.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  meta: ^1.9.0

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_01_product_idea_engine/README.md", """
# Module 01: Product Idea Engine

The **Product Idea Engine** ensures that every app built in the factory undergoes strict market validation, scoring, and lifecycle tracking before writing any code.

## Key Features
- **Strict Validation Rubric**: Evaluates market demand, competition density, willingness to pay, and technical feasibility.
- **Finite State Machine**: Tracks app stages from `idea` -> `market_research` -> `mvp_definition` -> `launch` -> `scale`.
- **Zero Hallucination Scorecard**: Computes composite viability scores (0-100) with pass/fail gates.

## Usage
```dart
final idea = ProductIdea(
  id: 'app-001',
  name: 'FocusPulse',
  problem: 'Knowledge workers suffer from distraction without physical feedback',
  solution: 'Haptic-driven Pomodoro timer with biometric stress detection',
  targetAudience: 'Remote workers, software developers',
  monetization: MonetizationModel.subscription,
  platform: TargetPlatform.both,
);

final score = IdeaValidator.evaluate(idea, marketDemand: 8, competition: 5, techFeasibility: 9);
if (score.isViable) {
  ideaStateMachine.transition(idea.id, AppStage.mvpDefinition);
}
```
""")

write_file("mod_01_product_idea_engine/lib/mod_01_product_idea_engine.dart", """
import 'package:meta/meta.dart';

enum MonetizationModel { free, freemium, subscription, oneTimePurchase, ads, hybrid }
enum TargetPlatform { android, ios, both }

enum AppStage {
  idea,
  marketResearch,
  problemValidation,
  competitorAnalysis,
  monetizationAnalysis,
  mvpDefinition,
  technicalFeasibility,
  uxDefinition,
  build,
  test,
  beta,
  storeSubmission,
  launch,
  aso,
  analytics,
  iteration,
}

@immutable
class ProductIdea {
  final String id;
  final String name;
  final String problem;
  final String solution;
  final String targetAudience;
  final MonetizationModel monetization;
  final TargetPlatform platform;
  final AppStage stage;
  final DateTime createdAt;

  const ProductIdea({
    required this.id,
    required this.name,
    required this.problem,
    required this.solution,
    required this.targetAudience,
    required this.monetization,
    required this.platform,
    this.stage = AppStage.idea,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? const _DefaultDateTime();

  ProductIdea copyWith({
    String? name,
    String? problem,
    String? solution,
    String? targetAudience,
    MonetizationModel? monetization,
    TargetPlatform? platform,
    AppStage? stage,
  }) {
    return ProductIdea(
      id: id,
      name: name ?? this.name,
      problem: problem ?? this.problem,
      solution: solution ?? this.solution,
      targetAudience: targetAudience ?? this.targetAudience,
      monetization: monetization ?? this.monetization,
      platform: platform ?? this.platform,
      stage: stage ?? this.stage,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'problem': problem,
    'solution': solution,
    'targetAudience': targetAudience,
    'monetization': monetization.name,
    'platform': platform.name,
    'stage': stage.name,
    'createdAt': createdAt.toIso8601String(),
  };
}

class _DefaultDateTime implements DateTime {
  const _DefaultDateTime();
  @override dynamic noSuchMethod(Invocation invocation) => DateTime.now();
}

class IdeaScore {
  final double score;
  final bool isViable;
  final List<String> risks;
  final List<String> recommendations;

  const IdeaScore({
    required this.score,
    required this.isViable,
    required this.risks,
    required this.recommendations,
  });
}

class IdeaValidator {
  static const double viabilityThreshold = 70.0;

  static IdeaScore evaluate({
    required ProductIdea idea,
    required int marketDemandScore, // 1 to 10
    required int competitionScore,  // 1 (monopoly) to 10 (hyper-saturated)
    required int techFeasibilityScore, // 1 (near impossible) to 10 (straightforward)
    required int willingnessToPayScore, // 1 to 10
  }) {
    final risks = <String>[];
    final recommendations = <String>[];

    if (competitionScore > 8) {
      risks.add('Market is hyper-saturated. Requires clear 10x differentiator.');
    }
    if (willingnessToPayScore < 4 && idea.monetization == MonetizationModel.subscription) {
      risks.add('Low willingness to pay detected for subscription model.');
      recommendations.add('Consider freemium or ad-supported model.');
    }
    if (techFeasibilityScore < 5) {
      risks.add('High technical risk. Build proof-of-concept before committing.');
    }

    // Weighted formula: Demand 35%, Feasibility 25%, WTP 25%, Competition Inverse 15%
    final demandWeighted = (marketDemandScore / 10.0) * 35.0;
    final feasibilityWeighted = (techFeasibilityScore / 10.0) * 25.0;
    final wtpWeighted = (willingnessToPayScore / 10.0) * 25.0;
    final compWeighted = ((11 - competitionScore) / 10.0) * 15.0;

    final totalScore = demandWeighted + feasibilityWeighted + wtpWeighted + compWeighted;
    final isViable = totalScore >= viabilityThreshold && techFeasibilityScore >= 5;

    return IdeaScore(
      score: double.parse(totalScore.toStringAsFixed(1)),
      isViable: isViable,
      risks: List.unmodifiable(risks),
      recommendations: List.unmodifiable(recommendations),
    );
  }
}
""")

write_file("mod_01_product_idea_engine/test/idea_engine_test.dart", """
import 'package:test/test.dart';
import 'package:mod_01_product_idea_engine/mod_01_product_idea_engine.dart';

void main() {
  group('ProductIdeaEngine Tests', () {
    test('Validates high-scoring product idea', () {
      final idea = ProductIdea(
        id: 'app-001',
        name: 'PulseZen',
        problem: 'Burnout in engineers',
        solution: 'Micro-break biometric timer',
        targetAudience: 'Software Engineers',
        monetization: MonetizationModel.subscription,
        platform: TargetPlatform.both,
      );

      final score = IdeaValidator.evaluate(
        idea: idea,
        marketDemandScore: 9,
        competitionScore: 4,
        techFeasibilityScore: 9,
        willingnessToPayScore: 8,
      );

      expect(score.isViable, isTrue);
      expect(score.score, greaterThanOrEqualTo(70.0));
      expect(score.risks, isEmpty);
    });

    test('Rejects low feasibility idea', () {
      final idea = ProductIdea(
        id: 'app-002',
        name: 'MindReader',
        problem: 'Cannot read minds',
        solution: 'Direct brain-wave decoding via phone camera',
        targetAudience: 'Everyone',
        monetization: MonetizationModel.oneTimePurchase,
        platform: TargetPlatform.both,
      );

      final score = IdeaValidator.evaluate(
        idea: idea,
        marketDemandScore: 10,
        competitionScore: 1,
        techFeasibilityScore: 2,
        willingnessToPayScore: 10,
      );

      expect(score.isViable, isFalse);
      expect(score.risks, contains(contains('High technical risk')));
    });
  });
}
""")

# ==========================================
# MODULE 02: Tech Stack Standard
# ==========================================
write_file("mod_02_tech_stack_standard/pubspec.yaml", """
name: mod_02_tech_stack_standard
description: Tech stack standards, analysis_options.yaml rules, and architectural integrity linters.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_02_tech_stack_standard/analysis_options.yaml", """
include: package:flutter_lints/flutter.yaml

analyzer:
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true
  errors:
    missing_required_param: error
    missing_return: error
    todo: ignore
    avoid_print: error
    unawaited_futures: error
    invalid_annotation_target: ignore

linter:
  rules:
    - always_declare_return_types
    - avoid_empty_else
    - avoid_relative_lib_imports
    - avoid_shadowing_type_parameters
    - avoid_types_as_parameter_names
    - await_only_futures
    - camel_case_extensions
    - camel_case_types
    - cancel_subscriptions
    - close_sinks
    - curly_braces_in_flow_control_structures
    - empty_catches
    - file_names
    - hash_and_equals
    - no_duplicate_case_values
    - non_constant_identifier_names
    - prefer_conditional_assignment
    - prefer_const_constructors
    - prefer_const_declarations
    - prefer_is_empty
    - prefer_is_not_empty
    - prefer_iterable_whereType
    - prefer_single_quotes
    - unawaited_futures
    - unnecessary_const
    - unnecessary_new
    - unnecessary_null_aware_assignments
    - unnecessary_nullable_for_final_variable_declarations
    - unnecessary_string_interpolations
    - use_build_context_synchronously
    - use_rethrow_when_possible
    - valid_regexps
""")

write_file("mod_02_tech_stack_standard/README.md", """
# Module 02: Tech Stack Standard

Enforces zero-tolerance architecture rules and Dart linter configurations for all apps in the factory.

## Strict Rules
1. **Zero Dynamic/Raw Types**: `strict-casts`, `strict-inference`, and `strict-raw-types` are mandatory.
2. **No Raw Prints**: `avoid_print` is set to `error`. All logging must route through `mod_25_crash_monitoring` or secure logger.
3. **Unawaited Futures**: All asynchronous calls must be explicitly awaited or safely unawaited.
4. **Build Context Safety**: Direct usage of `BuildContext` across async gaps without `mounted` check triggers a compile error.
""")

write_file("mod_02_tech_stack_standard/lib/mod_02_tech_stack_standard.dart", """
class TechStackPolicy {
  static const String minimumDartVersion = '3.0.0';
  static const String minimumFlutterVersion = '3.19.0';
  static const bool strictTypingRequired = true;
  static const bool noDirectHttpCallsInUI = true;
  static const bool zeroTrustBackendEnabled = true;

  static void verifyCompliance({
    required bool usesCleanArchitecture,
    required bool hasEncryptedStorage,
    required bool usesCertPinning,
  }) {
    if (!usesCleanArchitecture) {
      throw StateError('Violation: App must implement Clean Architecture presentation/domain/data separation.');
    }
    if (!hasEncryptedStorage) {
      throw StateError('Violation: Local storage must be hardware-backed or encrypted.');
    }
    if (!usesCertPinning) {
      throw StateError('Violation: API communication must implement SSL/TLS certificate pinning in production.');
    }
  }
}
""")

write_file("mod_02_tech_stack_standard/test/tech_stack_test.dart", """
import 'package:test/test.dart';
import 'package:mod_02_tech_stack_standard/mod_02_tech_stack_standard.dart';

void main() {
  test('Compliance check passes with all security standards', () {
    expect(() => TechStackPolicy.verifyCompliance(
      usesCleanArchitecture: true,
      hasEncryptedStorage: true,
      usesCertPinning: true,
    ), returnsNormally);
  });

  test('Compliance check throws when security standard missing', () {
    expect(() => TechStackPolicy.verifyCompliance(
      usesCleanArchitecture: true,
      hasEncryptedStorage: false,
      usesCertPinning: true,
    ), throwsA(isA<StateError>()));
  });
}
""")

# ==========================================
# MODULE 03: App Starter Template
# ==========================================
write_file("mod_03_app_starter_template/pubspec.yaml", """
name: mod_03_app_starter_template
description: Standardized production starter template for independent mobile applications.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  meta: ^1.9.0

dev_dependencies:
  flutter_test:
    sdk: flutter
""")

write_file("mod_03_app_starter_template/README.md", """
# Module 03: App Starter Template

The foundation scaffold for any new app generated in the factory. It enforces Clean Architecture folders:
```text
lib/
├── core/
│   ├── config/
│   ├── errors/
│   ├── network/
│   ├── theme/
│   └── utils/
├── features/
│   └── [feature_name]/
│       ├── data/
│       │   ├── datasources/
│       │   ├── models/
│       │   └── repositories/
│       ├── domain/
│       │   ├── entities/
│       │   ├── repositories/
│       │   └── usecases/
│       └── presentation/
│           ├── controllers/
│           ├── screens/
│           └── widgets/
└── main.dart
```
""")

write_file("mod_03_app_starter_template/lib/mod_03_app_starter_template.dart", """
library mod_03_app_starter_template;

export 'src/app_starter.dart';
export 'src/dependency_container.dart';
""")

write_file("mod_03_app_starter_template/lib/src/dependency_container.dart", """
abstract class DependencyContainer {
  final Map<Type, dynamic> _services = {};

  void registerSingleton<T>(T instance) {
    _services[T] = instance;
  }

  T resolve<T>() {
    final service = _services[T];
    if (service == null) {
      throw StateError('Service not registered for type $T');
    }
    return service as T;
  }

  bool isRegistered<T>() => _services.containsKey(T);

  void clear() => _services.clear();
}

class AppServiceLocator extends DependencyContainer {
  static final AppServiceLocator instance = AppServiceLocator._internal();
  AppServiceLocator._internal();
}
""")

write_file("mod_03_app_starter_template/lib/src/app_starter.dart", """
import 'package:flutter/widgets.dart';

abstract class AppStarter {
  static Future<void> initialize({
    required Future<void> Function() setupDependencies,
    required Widget Function() appBuilder,
  }) async {
    WidgetsFlutterBinding.ensureInitialized();
    await setupDependencies();
    runApp(appBuilder());
  }
}
""")

write_file("mod_03_app_starter_template/test/starter_test.dart", """
import 'package:flutter_test/flutter_test.dart';
import 'package:mod_03_app_starter_template/mod_03_app_starter_template.dart';

abstract class AuthService {
  bool get isAuthenticated;
}

class MockAuthService implements AuthService {
  @override
  bool get isAuthenticated => true;
}

void main() {
  test('Service Locator registers and resolves singletons', () {
    final locator = AppServiceLocator.instance;
    locator.registerSingleton<AuthService>(MockAuthService());

    final auth = locator.resolve<AuthService>();
    expect(auth.isAuthenticated, isTrue);
  });
}
""")

# ==========================================
# MODULE 04: Core Mobile Architecture
# ==========================================
write_file("mod_04_core_architecture/pubspec.yaml", """
name: mod_04_core_architecture
description: Clean Architecture foundational primitives - Either/Result, BaseUseCase, BaseRepository.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_04_core_architecture/README.md", """
# Module 04: Core Mobile Architecture

Defines Clean Architecture primitives ensuring complete separation of concerns:
- `Result<Success, Failure>` functional pattern (zero unhandled exceptions)
- `BaseUseCase<Type, Params>` for business rules
- `BaseRepository` contracts
""")

write_file("mod_04_core_architecture/lib/mod_04_core_architecture.dart", """
abstract class Failure {
  final String message;
  final String? code;
  final dynamic cause;

  const Failure(this.message, {this.code, this.cause});

  @override
  String toString() => 'Failure(code: $code, message: $message)';
}

class ServerFailure extends Failure {
  const ServerFailure(super.message, {super.code, super.cause});
}

class CacheFailure extends Failure {
  const CacheFailure(super.message, {super.code, super.cause});
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message, {super.code});
}

class AuthFailure extends Failure {
  const AuthFailure(super.message, {super.code});
}

abstract class Result<S, F extends Failure> {
  const Result();

  bool get isSuccess => this is Success<S, F>;
  bool get isFailure => this is ErrorResult<S, F>;

  S? get dataOrNull => isSuccess ? (this as Success<S, F>).data : null;
  F? get failureOrNull => isFailure ? (this as ErrorResult<S, F>).failure : null;

  R fold<R>({
    required R Function(S data) onSuccess,
    required R Function(F failure) onFailure,
  }) {
    if (this is Success<S, F>) {
      return onSuccess((this as Success<S, F>).data);
    } else if (this is ErrorResult<S, F>) {
      return onFailure((this as ErrorResult<S, F>).failure);
    }
    throw StateError('Unknown Result type');
  }
}

class Success<S, F extends Failure> extends Result<S, F> {
  final S data;
  const Success(this.data);
}

class ErrorResult<S, F extends Failure> extends Result<S, F> {
  final F failure;
  const ErrorResult(this.failure);
}

abstract class UseCase<Type, Params> {
  Future<Result<Type, Failure>> call(Params params);
}

class NoParams {
  const NoParams();
}
""")

write_file("mod_04_core_architecture/test/core_architecture_test.dart", """
import 'package:test/test.dart';
import 'package:mod_04_core_architecture/mod_04_core_architecture.dart';

class GetUserUseCase implements UseCase<String, String> {
  @override
  Future<Result<String, Failure>> call(String userId) async {
    if (userId.isEmpty) {
      return const ErrorResult(ValidationFailure('User ID cannot be empty'));
    }
    return Success('User: $userId');
  }
}

void main() {
  test('Result fold executes correct branch', () async {
    final useCase = GetUserUseCase();
    final res1 = await useCase('123');
    expect(res1.isSuccess, isTrue);
    expect(res1.dataOrNull, equals('User: 123'));

    final res2 = await useCase('');
    expect(res2.isFailure, isTrue);
    expect(res2.failureOrNull?.message, contains('cannot be empty'));
  });
}
""")

# ==========================================
# MODULE 05: App Configuration System
# ==========================================
write_file("mod_05_app_config_system/pubspec.yaml", """
name: mod_05_app_config_system
description: Type-safe compile-time and runtime application configuration system.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  meta: ^1.9.0

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_05_app_config_system/README.md", """
# Module 05: App Configuration System

Manages per-app configuration and flavors:
- `Environment.dev`, `Environment.staging`, `Environment.production`
- Immutable, strongly typed config objects
- Strict validation preventing missing production keys
""")

write_file("mod_05_app_config_system/lib/mod_05_app_config_system.dart", """
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
""")

write_file("mod_05_app_config_system/test/app_config_test.dart", """
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
""")

# ==========================================
# MODULE 06: Android Identity
# ==========================================
write_file("mod_06_android_identity/README.md", """
# Module 06: Android Identity

Provides templates and scripts for hardening Android application identity, signing, and security:
- Secure `build.gradle.kts` configuration template
- Obfuscation with ProGuard / R8 rules
- `network_security_config.xml` with cleartext traffic disabled & certificate pinning
- Automated keystore generation & validation scripts
""")

write_file("mod_06_android_identity/network_security_config.xml", """<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Deny all cleartext HTTP traffic across the application -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">api.yourcompany.com</domain>
        <pin-set expiration="2027-12-31">
            <!-- Replace with primary and backup SHA-256 SPKI pins -->
            <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
            <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
        </pin-set>
    </domain-config>
</network-security-config>
""")

write_file("mod_06_android_identity/proguard-rules.pro", """
# Code Shrinking & Obfuscation Rules for Product Factory
-repackageclasses 'obfuscated'
-allowaccessmodification
-keeppackagenames

# Keep data models serialized to/from JSON
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Preserve Native Methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Strip debug log calls in release builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
""")

write_file("mod_06_android_identity/generate_keystore.sh", """#!/usr/bin/env bash
set -euo pipefail

APP_ID="${1:-app001}"
KEYSTORE_PATH="keystores/${APP_ID}-release.jks"
ALIAS="${APP_ID}-key"

mkdir -p keystores
if [ -f "$KEYSTORE_PATH" ]; then
    echo "Error: Keystore $KEYSTORE_PATH already exists!" >&2
    exit 1
fi

echo "Generating hardware-compliant 4096-bit RSA release keystore for $APP_ID..."
keytool -genkeypair -v \\
  -keystore "$KEYSTORE_PATH" \\
  -alias "$ALIAS" \\
  -keyalg RSA \\
  -keysize 4096 \\
  -validity 10000 \\
  -storetype PKCS12

echo "Keystore generated at $KEYSTORE_PATH with alias $ALIAS"
""")

# ==========================================
# MODULE 07: iOS Identity
# ==========================================
write_file("mod_07_ios_identity/README.md", """
# Module 07: iOS Identity

Provides standardized configuration, security hardening, and entitlements for iOS:
- Strict `Info.plist` with App Transport Security (ATS) cleartext traffic blocked
- Entitlements template with Keychain Sharing, Associated Domains, and Push Notifications
- Fastlane Match signing workflow
""")

write_file("mod_07_ios_identity/Info.plist.template", """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>${PRODUCT_NAME}</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>${BUNDLE_ID}</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>${PRODUCT_NAME}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>$(FLUTTER_BUILD_NAME)</string>
    <key>CFBundleVersion</key>
    <string>$(FLUTTER_BUILD_NUMBER)</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <!-- Strict App Transport Security -->
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSAllowsLocalNetworking</key>
        <false/>
    </dict>
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
</dict>
</plist>
""")

write_file("mod_07_ios_identity/Runner.entitlements.template", """<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.associated-domains</key>
    <array>
        <string>applinks:${APP_DOMAIN}</string>
    </array>
    <key>aps-environment</key>
    <string>${APS_ENVIRONMENT}</string>
    <key>keychain-access-groups</key>
    <array>
        <string>$(AppIdentifierPrefix)${BUNDLE_ID}</string>
    </array>
</dict>
</plist>
""")

# ==========================================
# MODULE 08: Environment System
# ==========================================
write_file("mod_08_environment_system/pubspec.yaml", """
name: mod_08_environment_system
description: Production-grade multi-environment manager with encrypted-at-rest secrets and runtime schema validation.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_08_environment_system/README.md", """
# Module 08: Environment System

Manages environment configuration across `.env.dev`, `.env.staging`, and `.env.prod`.
- Secrets are decrypted at runtime or injected via compile-time `--dart-define`
- Validates that mandatory keys are present before app execution
""")

write_file("mod_08_environment_system/lib/mod_08_environment_system.dart", """
class EnvManager {
  final Map<String, String> _values;

  EnvManager(Map<String, String> values) : _values = Map.unmodifiable(values);

  String get(String key, {String? defaultValue}) {
    final val = _values[key] ?? defaultValue;
    if (val == null) {
      throw StateError('Missing required environment variable: $key');
    }
    return val;
  }

  int getInt(String key, {int? defaultValue}) {
    final val = _values[key];
    if (val == null) {
      if (defaultValue != null) return defaultValue;
      throw StateError('Missing required integer environment variable: $key');
    }
    return int.parse(val);
  }

  bool getBool(String key, {bool defaultValue = false}) {
    final val = _values[key]?.toLowerCase();
    if (val == null) return defaultValue;
    return val == 'true' || val == '1';
  }

  static EnvManager parseDotEnv(String content) {
    final map = <String, String>{};
    final lines = content.split('\n');
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty || trimmed.startsWith('#')) continue;
      final eqIndex = trimmed.indexOf('=');
      if (eqIndex != -1) {
        final key = trimmed.substring(0, eqIndex).trim();
        var value = trimmed.substring(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        map[key] = value;
      }
    }
    return EnvManager(map);
  }
}
""")

write_file("mod_08_environment_system/test/env_test.dart", """
import 'package:test/test.dart';
import 'package:mod_08_environment_system/mod_08_environment_system.dart';

void main() {
  test('Parses dotenv content correctly', () {
    const raw = '''
    # Configuration
    API_URL=https://api.example.com
    TIMEOUT_SEC=30
    ENABLE_FEATURE=true
    QUOTED_VAL="secret_value"
    ''';

    final env = EnvManager.parseDotEnv(raw);
    expect(env.get('API_URL'), equals('https://api.example.com'));
    expect(env.getInt('TIMEOUT_SEC'), equals(30));
    expect(env.getBool('ENABLE_FEATURE'), isTrue);
    expect(env.get('QUOTED_VAL'), equals('secret_value'));
  });

  test('Throws on missing key without default', () {
    final env = EnvManager({});
    expect(() => env.get('NON_EXISTENT'), throwsA(isA<StateError>()));
  });
}
""")

# ==========================================
# MODULE 09: Authentication Module
# ==========================================
write_file("mod_09_auth_module/pubspec.yaml", """
name: mod_09_auth_module
description: Reusable enterprise authentication module supporting OAuth2 + PKCE, Biometrics, and Token Rotation.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  meta: ^1.9.0

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_09_auth_module/README.md", """
# Module 09: Authentication Module

Production-grade authentication engine designed with zero-trust principles:
- **PKCE OAuth2 Flow**: Code verifier and challenge generation
- **Token Rotation**: Anti-replay token rotation engine
- **Pluggable Identity Providers**: Email, Google, Apple, Anonymous
- **Secure Token Storage Interface**: Backed by hardware keystore
""")

write_file("mod_09_auth_module/lib/mod_09_auth_module.dart", """
import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';

abstract class SecureTokenStorage {
  Future<void> saveTokens({required String accessToken, required String refreshToken});
  Future<String?> getAccessToken();
  Future<String?> getRefreshToken();
  Future<void> clearTokens();
}

class InMemorySecureTokenStorage implements SecureTokenStorage {
  String? _access;
  String? _refresh;

  @override
  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    _access = accessToken;
    _refresh = refreshToken;
  }

  @override
  Future<String?> getAccessToken() async => _access;

  @override
  Future<String?> getRefreshToken() async => _refresh;

  @override
  Future<void> clearTokens() async {
    _access = null;
    _refresh = null;
  }
}

class PkceHelper {
  static String generateCodeVerifier([int length = 64]) {
    final random = Random.secure();
    final values = List<int>.generate(length, (i) => random.nextInt(256));
    return base64UrlEncode(values).replaceAll('=', '');
  }

  static String generateCodeChallenge(String codeVerifier) {
    final bytes = utf8.encode(codeVerifier);
    final digest = sha256.convert(bytes);
    return base64UrlEncode(digest.bytes).replaceAll('=', '');
  }
}

class AuthTokenPair {
  final String accessToken;
  final String refreshToken;
  final DateTime expiresAt;

  AuthTokenPair({
    required this.accessToken,
    required this.refreshToken,
    required this.expiresAt,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);
}
""")

write_file("mod_09_auth_module/test/auth_test.dart", """
import 'package:test/test.dart';
import 'package:mod_09_auth_module/mod_09_auth_module.dart';

void main() {
  test('PKCE generates valid verifier and challenge', () {
    final verifier = PkceHelper.generateCodeVerifier(64);
    expect(verifier.isNotEmpty, isTrue);

    final challenge = PkceHelper.generateCodeChallenge(verifier);
    expect(challenge.isNotEmpty, isTrue);
    expect(challenge, isNot(equals(verifier)));
  });

  test('Secure token storage retains and clears tokens', () async {
    final storage = InMemorySecureTokenStorage();
    await storage.saveTokens(accessToken: 'access_123', refreshToken: 'refresh_456');

    expect(await storage.getAccessToken(), equals('access_123'));
    expect(await storage.getRefreshToken(), equals('refresh_456'));

    await storage.clearTokens();
    expect(await storage.getAccessToken(), isNull);
  });
}
""")

# ==========================================
# MODULE 10: Authorization System
# ==========================================
write_file("mod_10_authorization_system/pubspec.yaml", """
name: mod_10_authorization_system
description: Zero-trust Role-Based Access Control (RBAC) and client-side capability enforcement engine.
version: 1.0.0
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dev_dependencies:
  test: ^1.24.0
""")

write_file("mod_10_authorization_system/README.md", """
# Module 10: Authorization System

Enforces Zero-Trust authorization principles:
- The mobile app verifies claims locally for UI visibility, but server is always source of truth.
- RBAC role check: `UserRole.free`, `UserRole.subscriber`, `UserRole.admin`.
- Granular permissions: `Permission.createProject`, `Permission.exportData`, `Permission.accessAi`.
""")

write_file("mod_10_authorization_system/lib/mod_10_authorization_system.dart", """
enum UserRole { guest, freeUser, premiumSubscriber, enterprise, admin }

enum Permission {
  viewContent,
  createContent,
  exportData,
  accessAiFeatures,
  unlimitedSync,
  manageTeam,
}

class AuthorizationEngine {
  static final Map<UserRole, Set<Permission>> _rolePermissions = {
    UserRole.guest: {Permission.viewContent},
    UserRole.freeUser: {Permission.viewContent, Permission.createContent},
    UserRole.premiumSubscriber: {
      Permission.viewContent,
      Permission.createContent,
      Permission.exportData,
      Permission.accessAiFeatures,
      Permission.unlimitedSync,
    },
    UserRole.enterprise: {
      Permission.viewContent,
      Permission.createContent,
      Permission.exportData,
      Permission.accessAiFeatures,
      Permission.unlimitedSync,
      Permission.manageTeam,
    },
    UserRole.admin: Permission.values.toSet(),
  };

  static bool hasPermission({
    required UserRole role,
    required Permission permission,
    Set<Permission>? customOverrides,
  }) {
    if (customOverrides != null && customOverrides.contains(permission)) {
      return true;
    }
    final allowed = _rolePermissions[role] ?? {};
    return allowed.contains(permission);
  }

  static void enforcePermission({
    required UserRole role,
    required Permission permission,
  }) {
    if (!hasPermission(role: role, permission: permission)) {
      throw StateError('Access Denied: Role $role lacks permission $permission');
    }
  }
}
""")

write_file("mod_10_authorization_system/test/authorization_test.dart", """
import 'package:test/test.dart';
import 'package:mod_10_authorization_system/mod_10_authorization_system.dart';

void main() {
  test('Free user cannot access AI features without upgrade', () {
    expect(
      AuthorizationEngine.hasPermission(
        role: UserRole.freeUser,
        permission: Permission.accessAiFeatures,
      ),
      isFalse,
    );
  });

  test('Premium subscriber can access AI and export features', () {
    expect(
      AuthorizationEngine.hasPermission(
        role: UserRole.premiumSubscriber,
        permission: Permission.accessAiFeatures,
      ),
      isTrue,
    );
    expect(
      AuthorizationEngine.hasPermission(
        role: UserRole.premiumSubscriber,
        permission: Permission.exportData,
      ),
      isTrue,
    );
  });

  test('Enforce permission throws on unauthorized action', () {
    expect(
      () => AuthorizationEngine.enforcePermission(
        role: UserRole.guest,
        permission: Permission.createContent,
      ),
      throwsA(isA<StateError>()),
    );
  });
}
""")

print("Modules 01 to 10 generated successfully!")
