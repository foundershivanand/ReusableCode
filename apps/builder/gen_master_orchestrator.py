#!/usr/bin/env python3
"""
Master Orchestrator Generator: creates root configuration, docs, and sets permissions.
"""
import os
import stat

ROOT_DIR = "/home/shiva/appreusable"

def write_root_file(rel_path, content):
    full_path = os.path.join(ROOT_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Created root file: {rel_path}")

# Root melos.yaml
write_root_file("melos.yaml", """name: mobile_product_factory
repository: https://github.com/yourcompany/mobile-product-factory

packages:
  - modules/**
  - apps/**

command:
  bootstrap:
    usePubspecOverrides: true

scripts:
  analyze:
    run: melos exec -- "dart analyze . || flutter analyze ."
    description: "Analyze all factory modules"

  test:
    run: melos exec -- "dart test || flutter test"
    description: "Run tests across all modules"
""")

# Root package.json
write_root_file("package.json", """{
  "name": "mobile-product-factory",
  "version": "1.0.0",
  "description": "Enterprise Mobile App Factory - 60 Modular, Production-Grade, Hardened Modules for Android + iOS",
  "scripts": {
    "audit:all": "python3 modules/mod_49_release_checklist/preflight_auditor.py",
    "lint:boundaries": "python3 modules/mod_59_architecture_boundary/boundary_linter.py",
    "factory:cli": "python3 modules/mod_56_automated_cli/factory-cli",
    "test:python": "pytest modules/"
  },
  "keywords": ["flutter", "mobile-factory", "android", "ios", "clean-architecture", "zero-trust"],
  "author": "Mobile App Factory",
  "license": "UNLICENSED"
}
""")

# Root README.md
write_root_file("README.md", """# 🚀 Android + iOS Mobile Product Factory

> **"100 apps ≠ one giant mobile application."**  
> Build a reusable **Mobile App Factory infrastructure**, while every individual app remains an independent, securely deployed, independently branded product.

---

## 🏛️ Core Architectural Model

```text
                               MOBILE APP FACTORY
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
      FACTORY INFRASTRUCTURE                            PRODUCT APPS
      (60 Reusable Modules)                             (100+ Independent)
                │                                             │
      ├── Mod 01-10: Architecture & Auth              ├── App 001 (PulseZen)
      ├── Mod 11-20: Data, Offline & Design           ├── App 002 (VoiceNotes AI)
      ├── Mod 21-30: Hardware, AI & Subscriptions     ├── App 003 (HabitForge)
      ├── Mod 31-40: Deep Links, Security & Life      ├── App 004 (DocScanner)
      ├── Mod 41-50: Storage, CI/CD & Testing         └── ...100+
      └── Mod 51-60: ASO, CLI & Swarm Governance
```

---

## 📦 The 60 Production Modules

| # | Module Name | Description & Security Capabilities |
|---|-------------|-------------------------------------|
| **01** | `mod_01_product_idea_engine` | Market demand, competition density, willingness to pay, and lifecycle state machine. |
| **02** | `mod_02_tech_stack_standard` | Strict typing (`strict-casts`, `strict-inference`), zero raw prints, architecture linter. |
| **03** | `mod_03_app_starter_template` | Production Flutter starter scaffold with Clean Architecture and Service Locator DI. |
| **04** | `mod_04_core_architecture` | Functional `Result<S, F>`, `UseCase<Type, Params>`, and zero unhandled exception primitives. |
| **05** | `mod_05_app_config_system` | Strongly-typed app configuration (Dev, Staging, Production) with compile-time assertions. |
| **06** | `mod_06_android_identity` | 4096-bit RSA keystore generation, ProGuard/R8 obfuscation, and strict cleartext traffic blocks. |
| **07** | `mod_07_ios_identity` | Hardened `Info.plist`, App Transport Security (ATS) enforcement, and Entitlements templates. |
| **08** | `mod_08_environment_system` | Multi-environment `.env` manager with runtime schema validation and encrypted secrets. |
| **09** | `mod_09_auth_module` | OAuth2 + PKCE verifier/challenge, token rotation, and hardware-backed secure storage. |
| **10** | `mod_10_authorization_system` | Zero-Trust RBAC & granular permission enforcement engine. |
| **11** | `mod_11_local_data_system` | Encrypted Key-Value and SQLCipher database contracts with hardware keystore keys. |
| **12** | `mod_12_offline_first_sync` | Outbox Pattern sync engine with UUIDv4 idempotency keys and exponential backoff. |
| **13** | `mod_13_api_layer` | Resilient HTTP engine with SSL/TLS pinning, jittered retry policy, and standard envelope. |
| **14** | `mod_14_error_handling` | Centralized error taxonomy; scrubs internal stack traces and server addresses from user errors. |
| **15** | `mod_15_state_management` | Standardized state machine (`Initial`, `Loading`, `Success`, `Empty`, `Error`, `Offline`, `Refreshing`). |
| **16** | `mod_16_design_system` | Atomic mobile component specifications (`AppButton`, `AppCard`, `AppTextField`, `AppSkeleton`). |
| **17** | `mod_17_design_tokens` | Atomic design tokens: `AppSpacing`, `AppRadius`, `AppElevation`, and color scales. |
| **18** | `mod_18_responsive_ui` | Adaptive breakpoints for compact phones (<600dp), foldables (600-840dp), and tablets (>840dp). |
| **19** | `mod_19_accessibility` | WCAG 2.1 AA/AAA contrast ratio validator and minimum 48x48dp touch target checks. |
| **20** | `mod_20_dark_mode` | Dynamic theme engine: System, Light, Dark, and AMOLED black modes. |
| **21** | `mod_21_device_features` | Native hardware bridges: Haptics, Secure Clipboard (auto-cleared after 60s), and Biometrics. |
| **22** | `mod_22_permission_architecture` | Zero-crash permission manager with educational rationale dialogs before OS prompt. |
| **23** | `mod_23_push_notifications` | Push notification handler for FCM / APNs with deep linking and encrypted payloads. |
| **24** | `mod_24_analytics` | Privacy-first analytics engine; strictly scrubs PII and enforces GDPR consent mode. |
| **25** | `mod_25_crash_monitoring` | Enterprise crash reporting (Sentry/Crashlytics) with rolling breadcrumbs and PII scrubbing. |
| **26** | `mod_26_performance_monitoring` | Performance trace watchdog measuring startup duration, screen render latency, and API times. |
| **27** | `mod_27_ai_client_module` | AI mobile client supporting Server-Sent Events (SSE) streaming and prompt hydration. |
| **28** | `mod_28_ai_cost_gateway` | Token budgeting, user tier quotas (Free/Pro), rate-limiting, and model fallback. |
| **29** | `mod_29_subscription_system` | Cross-platform IAP abstraction (StoreKit 2, Google Play Billing, RevenueCat). |
| **30** | `mod_30_purchase_security` | Server-side receipt verification and HMAC SHA-256 webhook signature validation. |
| **31** | `mod_31_ads_module` | Privacy-friendly ads manager with frequency capping and remote kill-switch. |
| **32** | `mod_32_remote_config` | Remote configuration client with local cache fallbacks and type-safe getters. |
| **33** | `mod_33_feature_flags` | Deterministic SHA-256 user hashing for gradual percentage rollouts (10%, 50%, 100%). |
| **34** | `mod_34_deep_link_system` | Universal & App Links router with URI validation and path parameter sanitization. |
| **35** | `mod_35_sharing_system` | Native share sheet integration and shareable attribution text formatter. |
| **36** | `mod_36_viral_loops` | Cryptographic referral code generator and viral loop reward unlocking engine. |
| **37** | `mod_37_onboarding_engine` | Multi-step interactive onboarding state machine with permission priming. |
| **38** | `mod_38_app_lifecycle` | App execution state observer with automatic flush hooks before suspension. |
| **39** | `mod_39_security_hardening` | Anti-tamper security suite: Root/Jailbreak detection, emulator check, anti-debugger. |
| **40** | `mod_40_data_validation` | Strict input sanitization, anti-SQLi parameter validation, and anti-XSS HTML entity escaping. |
| **41** | `mod_41_database_architecture` | Encrypted SQLite migration engine with atomic versioning and rollback capability. |
| **42** | `mod_42_file_storage` | Direct presigned URL cloud upload manager with MIME-type and size validation. |
| **43** | `mod_43_background_jobs` | Battery-optimized background scheduler with charging and unmetered network constraints. |
| **44** | `mod_44_app_backend_template` | Zero-trust isolated FastAPI backend with JWT validation, SlowAPI rate-limiting, and isolated DB. |
| **45** | `mod_45_cicd_factory` | GitHub Actions & Fastlane CI/CD pipelines for automated AAB and IPA release builds. |
| **46** | `mod_46_automated_testing` | Unit test harness, MockWebServer, and test fixtures. |
| **47** | `mod_47_golden_user_journey` | Maestro / Patrol E2E automation script testing the complete golden conversion funnel. |
| **48** | `mod_48_device_test_matrix` | Device farm matrix covering 12 device archetypes across Android and iOS versions. |
| **49** | `mod_49_release_checklist` | Automated Python pre-flight release auditor verifying 32 release criteria. |
| **50** | `mod_50_aso_factory` | ASO metadata engine validating title, subtitle, keywords, and character limits. |
| **51** | `mod_51_screenshot_factory` | Automated screenshot capture (Fastlane Snapshot) and 5-slide layout generator. |
| **52** | `mod_52_review_monitoring` | Review scraper and sentiment classifier categorizing Bugs, Pricing, and Feature Requests. |
| **53** | `mod_53_analytics_dashboard` | Portfolio metrics aggregator computing DAU, MAU, Retention, and MRR. |
| **54** | `mod_54_health_scorecard` | Algorithmic product health evaluator (Grades A-D based on stability, retention, monetization). |
| **55** | `mod_55_app_factory_db` | Central SQLite portfolio database managing all 100+ app definitions and credentials. |
| **56** | `mod_56_automated_cli` | `factory-cli`: 1-command product scaffolding tool (`./factory-cli new --id app-042`). |
| **57** | `mod_57_ai_agent_team` | Roster and prompt specifications for the 15 specialized AI product agents. |
| **58** | `mod_58_dev_pipeline` | 16-phase gatekeeper pipeline engine enforcing strict phase transition criteria. |
| **59** | `mod_59_architecture_boundary` | AST linter prohibiting cross-app pollution and ensuring shared modules remain product-agnostic. |
| **60** | `mod_60_portfolio_registry` | Melos monorepo orchestrator for portfolio-wide dependency, test, and build management. |

---

## ⚡ Quick Start: Scaffold a New Independent App

To create a new, independently deployable app that uses the factory modules:

```bash
# Using the Factory CLI
./modules/mod_56_automated_cli/factory-cli new \\
  --id app-001 \\
  --name "PulseZen" \\
  --bundle com.factory.pulsezen
```

This creates an isolated app inside `apps/app-001/` with its own `pubspec.yaml`, clean architecture structure, and configured dependencies on the factory modules.
""")

print("Master configuration and README generated successfully!")

# Make scripts executable
for script in [
    "/home/shiva/appreusable/modules/mod_06_android_identity/generate_keystore.sh",
    "/home/shiva/appreusable/modules/mod_49_release_checklist/preflight_auditor.py",
    "/home/shiva/appreusable/modules/mod_50_aso_factory/aso_generator.py",
    "/home/shiva/appreusable/modules/mod_52_review_monitoring/review_classifier.py",
    "/home/shiva/appreusable/modules/mod_53_analytics_dashboard/metrics_aggregator.py",
    "/home/shiva/appreusable/modules/mod_54_health_scorecard/health_scorecard.py",
    "/home/shiva/appreusable/modules/mod_55_app_factory_db/db_manager.py",
    "/home/shiva/appreusable/modules/mod_56_automated_cli/factory-cli",
    "/home/shiva/appreusable/modules/mod_58_dev_pipeline/pipeline_gatekeeper.py",
    "/home/shiva/appreusable/modules/mod_59_architecture_boundary/boundary_linter.py",
]:
    if os.path.exists(script):
        os.chmod(script, os.stat(script).st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
        print(f"Made executable: {script}")
