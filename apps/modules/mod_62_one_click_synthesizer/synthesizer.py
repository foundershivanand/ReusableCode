#!/usr/bin/env python3
import os
import json
import argparse
from typing import Dict

class ProductSynthesizer:
    @staticmethod
    def synthesize_product(
        app_id: str,
        name: str,
        problem: str,
        target_user: str,
        features: list,
        monetization: str,
        output_base: str = "/home/shiva/appreusable/apps"
    ) -> Dict[str, str]:
        app_dir = os.path.join(output_base, app_id)
        os.makedirs(f"{app_dir}/docs", exist_ok=True)
        os.makedirs(f"{app_dir}/mobile/lib/core", exist_ok=True)
        os.makedirs(f"{app_dir}/mobile/lib/features", exist_ok=True)
        os.makedirs(f"{app_dir}/mobile/test", exist_ok=True)
        os.makedirs(f"{app_dir}/backend/app", exist_ok=True)

        bundle_id = f"com.factory.{app_id.replace('-', '_')}"

        # 1. Generate PRD
        prd_content = f"""# Product Requirements Document: {name} ({app_id})

## 1. Executive Summary
- **Problem**: {problem}
- **Target User**: {target_user}
- **Monetization**: {monetization}
- **Platform**: Android + iOS (Flutter)

## 2. Core Features & Scope
"""
        for idx, feat in enumerate(features, 1):
            prd_content += f"- **Feature {idx}**: {feat}\n"

        prd_content += f"""
## 3. Non-Functional Requirements
- **Security**: Hardware Keystore token storage, certificate pinning, biometric unlock.
- **Offline First**: Outbox sync pattern with SQLite persistence.
- **Latency**: P95 UI interaction < 16ms (60 fps), API response < 300ms.
"""
        with open(f"{app_dir}/docs/PRD.md", "w") as f:
            f.write(prd_content.strip() + "\n")

        # 2. Generate OpenAPI Spec
        openapi_spec = {
            "openapi": "3.0.3",
            "info": {"title": f"{name} API", "version": "1.0.0", "description": f"Isolated API for {name}"},
            "paths": {
                "/health": {"get": {"summary": "Health check", "responses": {"200": {"description": "Healthy"}}}},
                "/api/v1/data": {"get": {"summary": "Fetch user data", "security": [{"bearerAuth": []}], "responses": {"200": {"description": "Success"}}}}
            }
        }
        with open(f"{app_dir}/docs/openapi.json", "w") as f:
            json.dump(openapi_spec, f, indent=2)

        # 3. Generate Database Schema
        schema_sql = f"""-- Isolated Database Schema for {name} ({app_id})
CREATE TABLE IF NOT EXISTS user_profile (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscription_tier TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    synced_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profile(id)
);
"""
        with open(f"{app_dir}/docs/schema.sql", "w") as f:
            f.write(schema_sql.strip() + "\n")

        # 4. Generate ASO Plan
        aso_plan = f"""# ASO Strategy for {name}
- **Title (<=30 chars)**: {name[:30]}
- **Subtitle (<=30 chars)**: {problem[:30]}
- **Keywords**: {', '.join([f.lower() for f in features])}, {app_id}
"""
        with open(f"{app_dir}/docs/ASO.md", "w") as f:
            f.write(aso_plan.strip() + "\n")

        # 5. Generate Isolated Backend (FastAPI)
        backend_main = f"""# Isolated Backend for {name} ({app_id})
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel

app = FastAPI(title="{name} API", version="1.0.0")

@app.get("/health")
def health():
    return {{"status": "healthy", "product_id": "{app_id}", "name": "{name}"}}

@app.get("/api/v1/sync")
def sync_data():
    return {{"success": True, "product": "{app_id}", "records": []}}
"""
        with open(f"{app_dir}/backend/app/main.py", "w") as f:
            f.write(backend_main.strip() + "\n")

        # 6. Generate Mobile pubspec.yaml
        pubspec_yaml = f"""name: {app_id.replace('-', '_')}
description: {name} - Independent mobile product
version: 1.0.0+1
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  mod_04_core_architecture:
    path: ../../../modules/mod_04_core_architecture
  mod_05_app_config_system:
    path: ../../../modules/mod_05_app_config_system
  mod_09_auth_module:
    path: ../../../modules/mod_09_auth_module
  mod_13_api_layer:
    path: ../../../modules/mod_13_api_layer
  mod_15_state_management:
    path: ../../../modules/mod_15_state_management
  mod_16_design_system:
    path: ../../../modules/mod_16_design_system
"""
        with open(f"{app_dir}/mobile/pubspec.yaml", "w") as f:
            f.write(pubspec_yaml.strip() + "\n")

        # 7. Generate Mobile main.dart
        main_dart = f"""// {name} ({bundle_id}) - Main Mobile Entrypoint
void main() {{
  print('Running {name} ({app_id})');
}}
"""
        with open(f"{app_dir}/mobile/lib/main.dart", "w") as f:
            f.write(main_dart.strip() + "\n")

        return {
            "app_id": app_id,
            "name": name,
            "bundle_id": bundle_id,
            "directory": app_dir,
            "status": "Synthesized successfully with isolated backend, DB schema, PRD, and mobile app."
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="One-Click Product Synthesizer")
    parser.add_argument("--id", required=True, help="App ID e.g. app-037")
    parser.add_argument("--name", required=True, help="App Name e.g. SoundScape AI")
    parser.add_argument("--problem", required=True, help="Problem statement")
    parser.add_argument("--target", required=True, help="Target audience")
    parser.add_argument("--monetization", default="subscription", help="Monetization model")
    parser.add_argument("--features", nargs="+", default=["Smart Ambient Generator", "Binaural Beats", "Sleep Timer"])

    args = parser.parse_args()
    res = ProductSynthesizer.synthesize_product(
        app_id=args.id,
        name=args.name,
        problem=args.problem,
        target_user=args.target,
        features=args.features,
        monetization=args.monetization
    )
    print(json.dumps(res, indent=2))
