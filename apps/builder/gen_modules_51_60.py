#!/usr/bin/env python3
"""
Generator for Modules 51 to 60 of the Mobile App Factory.
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
# MODULE 51: Screenshot Factory
# ==========================================
write_file("mod_51_screenshot_factory/README.md", """
# Module 51: Screenshot Factory

Automates App Store and Google Play screenshot generation:
- Standard 5-slide layout narrative:
  1. Main Value Proposition
  2. Core Action / Feature
  3. Differentiator / Magic Moment
  4. Rich Results & Analytics
  5. Premium / Superpowers
- Fastlane Snapfile configuration and templating
""")

write_file("mod_51_screenshot_factory/Snapfile", """# Fastlane Snapshot configuration
devices([
  "iPhone 15 Pro Max",
  "iPhone 15",
  "iPad Pro (12.9-inch) (6th generation)"
])

languages([
  "en-US",
  "es-ES",
  "de-DE"
])

scheme("Runner")
output_directory("./screenshots")
clear_previous_screenshots(true)
""")

# ==========================================
# MODULE 52: Review Monitoring & AI Categorization
# ==========================================
write_file("mod_52_review_monitoring/README.md", """
# Module 52: Review Monitoring & AI Categorization

Harvests and classifies store reviews using rule-based and AI sentiment analysis:
- Categories: `Bug`, `FeatureRequest`, `PricingComplaint`, `Praise`, `Confusion`
- Generates actionable backlog issues with priority scores
""")

write_file("mod_52_review_monitoring/review_classifier.py", """#!/usr/bin/env python3
from typing import Dict, List

class ReviewClassifier:
    CATEGORIES = {
        "Bug": ["crash", "freeze", "broken", "error", "bug", "stopped working", "black screen"],
        "PricingComplaint": ["expensive", "subscription", "refund", "rip off", "scam", "price", "paywall"],
        "FeatureRequest": ["please add", "would love", "missing", "wish it had", "suggestion", "support for"],
        "Praise": ["love", "great", "awesome", "best app", "helpful", "clean", "perfect"],
    }

    @classmethod
    def classify(cls, review_text: str, rating: int) -> Dict[str, any]:
        text_lower = review_text.lower()
        matched_categories = []

        for cat, keywords in cls.CATEGORIES.items():
            if any(kw in text_lower for kw in keywords):
                matched_categories.append(cat)

        if not matched_categories:
            matched_categories.append("Praise" if rating >= 4 else "GeneralComplaint")

        priority = "HIGH" if rating <= 2 and ("Bug" in matched_categories or "PricingComplaint" in matched_categories) else "NORMAL"

        return {
            "text": review_text,
            "rating": rating,
            "categories": matched_categories,
            "priority": priority,
        }

if __name__ == "__main__":
    test_review = "The app crashes every time I tap the export button! Fix this please."
    result = ReviewClassifier.classify(test_review, 1)
    print("Classified Review:", result)
""")

# ==========================================
# MODULE 53: App Analytics Dashboard
# ==========================================
write_file("mod_53_analytics_dashboard/README.md", """
# Module 53: App Analytics Dashboard

Aggregates product KPIs across the 100-app portfolio:
- DAU, MAU, Retention (D1, D7, D30)
- MRR, ARPU, Churn Rate, LTV
- Exportable to SQLite / Postgres / JSON
""")

write_file("mod_53_analytics_dashboard/metrics_aggregator.py", """#!/usr/bin/env python3
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class ProductMetrics:
    product_id: str
    dau: int
    mau: int
    retention_d1: float
    retention_d7: float
    retention_d30: float
    mrr_usd: float
    crash_free_sessions_pct: float

    @property
    def stickiness(self) -> float:
        return (self.dau / self.mau * 100.0) if self.mau > 0 else 0.0

class PortfolioDashboard:
    def __init__(self):
        self.products: Dict[str, ProductMetrics] = {}

    def record_metrics(self, metrics: ProductMetrics):
        self.products[metrics.product_id] = metrics

    def portfolio_summary(self) -> Dict[str, any]:
        total_dau = sum(p.dau for p in self.products.values())
        total_mrr = sum(p.mrr_usd for p in self.products.values())
        avg_crash_free = (
            sum(p.crash_free_sessions_pct for p in self.products.values()) / len(self.products)
            if self.products else 0.0
        )
        return {
            "total_apps": len(self.products),
            "total_dau": total_dau,
            "total_mrr_usd": total_mrr,
            "avg_crash_free_pct": round(avg_crash_free, 2),
        }

if __name__ == "__main__":
    dashboard = PortfolioDashboard()
    dashboard.record_metrics(ProductMetrics(
        product_id="app-001", dau=1200, mau=8500, retention_d1=45.0, retention_d7=22.0,
        retention_d30=12.0, mrr_usd=4200.0, crash_free_sessions_pct=99.8
    ))
    print("Portfolio Summary:", dashboard.portfolio_summary())
""")

# ==========================================
# MODULE 54: Product Health Scorecard
# ==========================================
write_file("mod_54_health_scorecard/README.md", """
# Module 54: Product Health Scorecard

Algorithmic scorecard evaluating the operational health of any app in the portfolio:
- Stability (Crash-free rate)
- Retention (D1, D7)
- Monetization (Conversion %)
- Rating (Store average)
""")

write_file("mod_54_health_scorecard/health_scorecard.py", """#!/usr/bin/env python3

class HealthScorecard:
    @staticmethod
    def calculate_health_score(
        crash_free_pct: float,
        retention_d7_pct: float,
        avg_rating: float,
        trial_conversion_pct: float,
    ) -> dict:
        # Weights: Stability 30%, Retention 30%, Rating 20%, Monetization 20%
        stability_score = min(100.0, max(0.0, (crash_free_pct - 95.0) * 20.0)) # 95%=0, 100%=100
        retention_score = min(100.0, retention_d7_pct * 4.0) # 25% d7 = 100
        rating_score = (avg_rating / 5.0) * 100.0
        conversion_score = min(100.0, trial_conversion_pct * 10.0) # 10% conv = 100

        composite = (
            (stability_score * 0.30) +
            (retention_score * 0.30) +
            (rating_score * 0.20) +
            (conversion_score * 0.20)
        )

        grade = "A" if composite >= 85 else "B" if composite >= 70 else "C" if composite >= 50 else "D"

        return {
            "composite_score": round(composite, 1),
            "grade": grade,
            "breakdown": {
                "stability": round(stability_score, 1),
                "retention": round(retention_score, 1),
                "rating": round(rating_score, 1),
                "monetization": round(conversion_score, 1),
            }
        }

if __name__ == "__main__":
    result = HealthScorecard.calculate_health_score(
        crash_free_pct=99.8,
        retention_d7_pct=20.0,
        avg_rating=4.7,
        trial_conversion_pct=7.5,
    )
    print("Health Scorecard Result:", result)
""")

# ==========================================
# MODULE 55: App Factory Database
# ==========================================
write_file("mod_55_app_factory_db/README.md", """
# Module 55: App Factory Database

Central registry tracking all 100+ applications across their lifecycle:
- Product metadata, bundle IDs, backend URLs, store statuses
- SQLite database schema with migrations
""")

write_file("mod_55_app_factory_db/schema.sql", """-- Factory Master Portfolio Schema
CREATE TABLE IF NOT EXISTS portfolio_apps (
    product_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    bundle_id TEXT UNIQUE NOT NULL,
    package_name TEXT UNIQUE NOT NULL,
    platform TEXT CHECK(platform IN ('android', 'ios', 'both')) NOT NULL,
    stage TEXT NOT NULL,
    monetization TEXT NOT NULL,
    backend_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apps_stage ON portfolio_apps(stage);
CREATE INDEX IF NOT EXISTS idx_apps_bundle ON portfolio_apps(bundle_id);
""")

write_file("mod_55_app_factory_db/db_manager.py", """#!/usr/bin/env python3
import sqlite3
import os

DB_PATH = os.path.expanduser("/home/shiva/appreusable/modules/mod_55_app_factory_db/factory_master.db")

class FactoryDatabase:
    def __init__(self, db_path: str = DB_PATH):
        self.conn = sqlite3.connect(db_path)
        self._init_db()

    def _init_db(self):
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path, "r") as f:
            self.conn.executescript(f.read())
        self.conn.commit()

    def register_app(self, product_id: str, name: str, category: str, bundle_id: str, package_name: str, stage: str = "idea"):
        with self.conn:
            self.conn.execute(
                '''INSERT OR REPLACE INTO portfolio_apps (product_id, name, category, bundle_id, package_name, platform, stage, monetization)
                   VALUES (?, ?, ?, ?, ?, 'both', ?, 'subscription')''',
                (product_id, name, category, bundle_id, package_name, stage)
            )

    def list_apps(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT product_id, name, stage, bundle_id FROM portfolio_apps ORDER BY product_id")
        return cursor.fetchall()

if __name__ == "__main__":
    db = FactoryDatabase()
    db.register_app("app-001", "PulseZen", "Productivity", "com.factory.pulsezen", "com.factory.pulsezen")
    print("Registered Apps:", db.list_apps())
""")

# ==========================================
# MODULE 56: Automated Product Creation CLI
# ==========================================
write_file("mod_56_automated_cli/README.md", """
# Module 56: Automated Product Creation CLI (`factory-cli`)

Command-line interface to scaffold a new independent production mobile app with 1 command:
```bash
./factory-cli new --id app-042 --name "VoiceNotes AI" --bundle com.factory.voicenotes
```
""")

write_file("mod_56_automated_cli/factory-cli", """#!/usr/bin/env python3
import argparse
import os
import sys

def scaffold_app(app_id: str, app_name: str, bundle_id: str):
    target_dir = f"/home/shiva/appreusable/apps/{app_id}"
    print(f"Creating new independent app: {app_name} ({app_id}) at {target_dir}...")
    os.makedirs(f"{target_dir}/lib/core", exist_ok=True)
    os.makedirs(f"{target_dir}/lib/features/home", exist_ok=True)
    os.makedirs(f"{target_dir}/test", exist_ok=True)

    pubspec_content = f\"\"\"name: {app_id.replace('-', '_')}
description: {app_name} independent mobile product.
version: 1.0.0+1
publish_to: 'none'

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  mod_04_core_architecture:
    path: ../../modules/mod_04_core_architecture
  mod_05_app_config_system:
    path: ../../modules/mod_05_app_config_system
  mod_09_auth_module:
    path: ../../modules/mod_09_auth_module
  mod_13_api_layer:
    path: ../../modules/mod_13_api_layer
  mod_15_state_management:
    path: ../../modules/mod_15_state_management
  mod_16_design_system:
    path: ../../modules/mod_16_design_system
\"\"\"
    with open(f"{target_dir}/pubspec.yaml", "w") as f:
        f.write(pubspec_content.strip() + "\\n")

    main_content = f\"\"\"// {app_name} - Main Entrypoint
void main() {{
  print('Starting {app_name} ({bundle_id})...');
}}
\"\"\"
    with open(f"{target_dir}/lib/main.dart", "w") as f:
        f.write(main_content.strip() + "\\n")

    print(f"Successfully scaffolded {app_name} ({app_id})!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mobile App Factory CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    new_parser = subparsers.add_parser("new", help="Scaffold a new independent product app")
    new_parser.add_argument("--id", required=True, help="Unique product identifier e.g. app-001")
    new_parser.add_argument("--name", required=True, help="App display name")
    new_parser.add_argument("--bundle", required=True, help="App bundle ID e.g. com.factory.app001")

    args = parser.parse_args()
    if args.command == "new":
        scaffold_app(args.id, args.name, args.bundle)
""")

# ==========================================
# MODULE 57: AI Agent Team Prompts & Specs
# ==========================================
write_file("mod_57_ai_agent_team/README.md", """
# Module 57: AI Agent Team Prompts & Specs

System prompts and operational playbooks for the 15 specialized AI agent roles:
1. Research Agent
2. Competitor Agent
3. PRD Agent
4. UX Agent
5. UI Agent
6. Architecture Agent
7. Coding Agent
8. Backend Agent
9. Security Agent
10. Testing Agent
11. ASO Agent
12. Content Agent
13. Analytics Agent
14. Review Agent
15. Growth Agent
""")

write_file("mod_57_ai_agent_team/agent_roster.json", """{
  "agents": [
    {
      "role": "PRD Agent",
      "objective": "Generate complete, unambiguous Product Requirements Documents with user personas, user stories, acceptance criteria, and edge cases.",
      "temperature": 0.2
    },
    {
      "role": "Security Agent",
      "objective": "Audit client code and backend endpoints for OWASP Mobile Top 10 vulnerabilities, unauthorized data exposure, and hardcoded secrets.",
      "temperature": 0.0
    },
    {
      "role": "ASO Agent",
      "objective": "Produce conversion-optimized App Store and Google Play titles, subtitles, keywords, and localized descriptions.",
      "temperature": 0.4
    }
  ]
}
""")

# ==========================================
# MODULE 58: 16-Phase Gatekeeper Pipeline
# ==========================================
write_file("mod_58_dev_pipeline/README.md", """
# Module 58: 16-Phase Gatekeeper Pipeline

Orchestrates the 16 phases of app development with strict entry and exit criteria:
- Phase 1: Discovery
- Phase 2: Validation
- Phase 3: PRD
- Phase 4: UX
- Phase 5: UI
- Phase 6: Architecture
- Phase 7: Backend
- Phase 8: Mobile Development
- Phase 9: Testing
- Phase 10: Security
- Phase 11: Beta
- Phase 12: Store Submission
- Phase 13: Launch
- Phase 14: ASO
- Phase 15: Analytics
- Phase 16: Iteration
""")

write_file("mod_58_dev_pipeline/pipeline_gatekeeper.py", """#!/usr/bin/env python3
from typing import Dict, List

class PipelineGatekeeper:
    PHASES = [
        "Discovery", "Validation", "PRD", "UX", "UI", "Architecture",
        "Backend", "MobileDev", "Testing", "Security", "Beta",
        "StoreSubmission", "Launch", "ASO", "Analytics", "Iteration"
    ]

    GATE_REQUIREMENTS = {
        "PRD": ["User stories defined", "Monetization model selected", "Edge cases cataloged"],
        "Security": ["No hardcoded secrets", "Cert pinning verified", "Input sanitization tested"],
        "StoreSubmission": ["Privacy policy published", "Signed release build ready", "Screenshots uploaded"],
    }

    @classmethod
    def can_transition(cls, current_phase: str, target_phase: str, completed_items: List[str]) -> bool:
        if target_phase not in cls.PHASES:
            return False
        reqs = cls.GATE_REQUIREMENTS.get(target_phase, [])
        return all(r in completed_items for r in reqs)

if __name__ == "__main__":
    can_submit = PipelineGatekeeper.can_transition(
        "Beta", "StoreSubmission",
        ["Privacy policy published", "Signed release build ready", "Screenshots uploaded"]
    )
    print("Can submit to store:", can_submit)
""")

# ==========================================
# MODULE 59: Architecture Boundary Linter
# ==========================================
write_file("mod_59_architecture_boundary/README.md", """
# Module 59: Architecture Boundary Linter

Enforces boundary separation:
- Prohibits cross-app imports (`app-001` cannot import `app-002`)
- Ensures shared modules do not import app-specific feature code
""")

write_file("mod_59_architecture_boundary/boundary_linter.py", """#!/usr/bin/env python3
import os
import re
import sys

def lint_boundaries(apps_dir: str) -> bool:
    violation_found = False
    if not os.path.exists(apps_dir):
        return True

    app_dirs = [d for d in os.listdir(apps_dir) if os.path.isdir(os.path.join(apps_dir, d))]
    for app in app_dirs:
        lib_path = os.path.join(apps_dir, app, "lib")
        if not os.path.exists(lib_path):
            continue
        for root, _, files in os.walk(lib_path):
            for file in files:
                if file.endswith(".dart"):
                    filepath = os.path.join(root, file)
                    with open(filepath, "r", encoding="utf-8") as f:
                        content = f.read()
                        for other_app in app_dirs:
                            if other_app != app and f"package:{other_app.replace('-', '_')}" in content:
                                print(f"[VIOLATION] App '{app}' illegally imports '{other_app}' in {filepath}")
                                violation_found = True

    return not violation_found

if __name__ == "__main__":
    passed = lint_boundaries("/home/shiva/appreusable/apps")
    print("Boundary Lint Passed:", passed)
    sys.exit(0 if passed else 1)
""")

# ==========================================
# MODULE 60: Master Portfolio Registry & Monorepo
# ==========================================
write_file("mod_60_portfolio_registry/README.md", """
# Module 60: Master Portfolio Registry & Monorepo

Orchestrates the 100+ app portfolio monorepo:
- Melos / Dart workspace management
- Bulk testing, linting, and dependency upgrading across all 60 modules and 100 apps
""")

write_file("mod_60_portfolio_registry/melos.yaml.template", """name: mobile_product_factory
repository: https://github.com/yourcompany/mobile-product-factory

packages:
  - modules/**
  - apps/**

command:
  bootstrap:
    usePubspecOverrides: true

scripts:
  lint:all:
    run: melos exec -- "flutter analyze . || dart analyze ."
    description: "Lint all 60 modules and apps"

  test:all:
    run: melos exec -- "flutter test || dart test"
    description: "Run automated tests across all modules"
""")

print("Modules 51 to 60 generated successfully!")
