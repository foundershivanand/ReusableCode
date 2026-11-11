# PROJECT INSTRUCTIONS: REUSABLE CODE INTEGRATION

## 🏛️ REUSABLE CODE LIBRARY
This project has direct access to the enterprise **Mobile Product Factory** reusable code library containing **163 production-grade, hardened, zero-trust modules**:

- **Repository**: `https://github.com/sh15aa/Appreusable`
- **Default Branch**: `main`
- **Catalog Registry**: `registry/modules.json` (163 cataloged modules)

---

## ⚡ CORE RULE: REUSE FIRST. BUILD SECOND.

Before creating new code, services, or architecture for any common mobile or backend feature:

1. **SEARCH**: Query the reusable code library before implementing anything from scratch.
2. **MATCH**: Check the 163-module catalog to find the production-grade module matching the requirement.
3. **READ**: Inspect the module's README and interface before integration.
4. **REUSE**: Integrate using one of the methods below.
5. **NEVER**: Do not reinvent authentication, encrypted local storage, HTTP networking, state machines, design tokens, in-app purchases, or security gates.

---

## 🛠️ HOW TO USE MODULES DIRECTLY FROM GITHUB

### Method 1: Direct Flutter Git Dependency (`pubspec.yaml`) — *Recommended for Flutter*
Flutter supports pulling sub-directory modules directly from GitHub without copying code into your project:

```yaml
dependencies:
  flutter:
    sdk: flutter

  # Authentication (PKCE OAuth2, JWT rotation, Keystore tokens)
  mod_09_auth_module:
    git:
      url: https://github.com/sh15aa/Appreusable.git
      path: modules/mod_09_auth_module
      ref: main

  # Encrypted Local Storage (SQLCipher + Hardware Keystore)
  mod_11_local_data_system:
    git:
      url: https://github.com/sh15aa/Appreusable.git
      path: modules/mod_11_local_data_system
      ref: main

  # Resilient HTTP Client (SSL Pinning, Jitter Retry, ApiResponse Envelope)
  mod_13_api_layer:
    git:
      url: https://github.com/sh15aa/Appreusable.git
      path: modules/mod_13_api_layer
      ref: main

  # State Management Machine
  mod_15_state_management:
    git:
      url: https://github.com/sh15aa/Appreusable.git
      path: modules/mod_15_state_management
      ref: main

  # Design System & UI Components
  mod_16_design_system:
    git:
      url: https://github.com/sh15aa/Appreusable.git
      path: modules/mod_16_design_system
      ref: main
```

---

### Method 2: Direct Python Git Dependency (`requirements.txt`) — *Recommended for FastAPI Backends*
For backend services, install individual modules directly from GitHub via pip:

```text
# Isolated Zero-Trust FastAPI Backend Template
git+https://github.com/sh15aa/Appreusable.git#subdirectory=modules/mod_44_app_backend_template

# Object Authorization (BOLA Defense)
git+https://github.com/sh15aa/Appreusable.git#subdirectory=modules/mod_67_object_authorization
```

---

### Method 3: Pull & Copy Code Files into Local Project (Sparse-Checkout)
If you need to customize or embed a module's source code directly into your repository:

```bash
# 1-line pull using git shallow sparse checkout:
git clone --filter=blob:none --no-checkout --depth 1 https://github.com/sh15aa/Appreusable.git .reusable_tmp && \
cd .reusable_tmp && \
git sparse-checkout set modules/<MODULE_ID> && \
git checkout && \
mkdir -p ../lib/shared && \
cp -r modules/<MODULE_ID> ../lib/shared/ && \
cd .. && rm -rf .reusable_tmp
```

Or using the `factory-pull` helper tool:
```bash
./factory-pull pull <MODULE_ID> --dest ./lib/shared/<MODULE_ID>
```

---

## 🔍 MODULE DISCOVERY CHEAT SHEET (TOP CAPABILITIES)

| Requirement | Module ID | What it Provides |
|---|---|---|
| **Starter App** | `mod_03_app_starter_template` | Clean Architecture Flutter boilerplate with DI |
| **Auth & OAuth** | `mod_09_auth_module` | PKCE OAuth2, Google/Apple/Email login, token rotation |
| **RBAC / Permissions**| `mod_10_authorization_system` | Zero-Trust granular user permission checks |
| **Offline DB** | `mod_11_local_data_system` | SQLCipher database + hardware keystore keys |
| **Offline Sync** | `mod_12_offline_first_sync` | Outbox pattern sync with UUIDv4 idempotency keys |
| **API Client** | `mod_13_api_layer` | TLS pinning, jitter retry, standardized envelope |
| **State Machine** | `mod_15_state_management` | Standard `Loading/Success/Error/Empty/Offline` states |
| **UI Components** | `mod_16_design_system` | Atomic buttons, cards, text fields, skeletons |
| **Dark Mode** | `mod_20_dark_mode` | Dynamic System, Light, Dark, AMOLED themes |
| **Biometrics/Haptics**| `mod_21_device_features` | Biometric auth, haptics, secure auto-clear clipboard |
| **Push Notifications**| `mod_23_push_notifications` | FCM / APNs router with encrypted payloads |
| **Analytics (Privacy)**|`mod_24_analytics` | PII-scrubbed PostHog / Mixpanel with GDPR consent |
| **AI Client (SSE)** | `mod_27_ai_client_module` | Streaming LLM client with prompt hydration |
| **Subscriptions/IAP** | `mod_29_subscription_system` | StoreKit 2 & Google Play Billing abstraction |
| **Backend API** | `mod_44_app_backend_template` | Isolated FastAPI backend with JWT & rate limiting |
| **OWASP MASVS** | `mod_119_owasp_masvs_test` | Automated mobile security compliance test suite |
| **1M Scale Gate** | `mod_155_1m_user_scale_gate` | Load, capacity, RPS, and scale validator |

*(For the complete list of all 163 modules, see `registry/modules.json` in the library repository).*

---

## 📋 AGENT EXECUTION PROTOCOL

When the user asks you to implement a feature in this project:

1. **Check Requirement**: Identify what components are needed (e.g. "Google login + encrypted SQLite storage").
2. **Search Library**: Match to `mod_09_auth_module` and `mod_11_local_data_system`.
3. **Declare Reuse Plan**:
   ```text
   Requirement          Reusable Library Module
   --------------------------------------------
   Google Login     ->  mod_09_auth_module
   Local DB         ->  mod_11_local_data_system
   ```
4. **Integrate**: Add the git dependencies to `pubspec.yaml` (or pull via sparse checkout).
5. **Implement**: Wire the application code to use the reusable module abstractions.
