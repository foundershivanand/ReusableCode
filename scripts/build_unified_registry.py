#!/usr/bin/env python3
import json
import os
import shutil

ROOT_DIR = "/home/shiva/reusable"
REGISTRY_DIR = os.path.join(ROOT_DIR, "registry")
os.makedirs(REGISTRY_DIR, exist_ok=True)

# 1. Back up / copy individual domain registries
web_reg_path = os.path.join(REGISTRY_DIR, "web.json")
if not os.path.exists(web_reg_path):
    shutil.copy(os.path.join(REGISTRY_DIR, "modules.json"), web_reg_path)

bots_src = os.path.join(ROOT_DIR, "bots", "registry", "modules.json")
bots_dest = os.path.join(REGISTRY_DIR, "bots.json")
if os.path.exists(bots_src):
    shutil.copy(bots_src, bots_dest)

agents_src = os.path.join(ROOT_DIR, "agents", "registry", "modules.json")
agents_dest = os.path.join(REGISTRY_DIR, "agents.json")
if os.path.exists(agents_src):
    shutil.copy(agents_src, agents_dest)

apps_src = os.path.join(ROOT_DIR, "apps", "registry", "modules.json")
apps_dest = os.path.join(REGISTRY_DIR, "apps.json")
if os.path.exists(apps_src):
    shutil.copy(apps_src, apps_dest)

with open(web_reg_path) as f:
    web_data = json.load(f)
with open(bots_dest) as f:
    bots_data = json.load(f)
with open(agents_dest) as f:
    agents_data = json.load(f)
with open(apps_dest) as f:
    apps_data = json.load(f)

unified_modules = []

# Process Web Modules (33)
for m in web_data.get("modules", []):
    item = dict(m)
    item["domain"] = "web"
    item["domain_name"] = "Web Applications"
    item["domain_icon"] = "🌐"
    item["pull_command"] = f"bash scripts/pull-module.sh web/{m['path']}"
    unified_modules.append(item)

# Process Bot Modules (27)
for m in bots_data.get("modules", []):
    item = dict(m)
    item["domain"] = "bots"
    item["domain_name"] = "Conversational & Messaging Bots"
    item["domain_icon"] = "🤖"
    raw_path = m.get("path", "")
    item["path"] = f"bots/{raw_path}" if not raw_path.startswith("bots/") else raw_path
    item["pull_command"] = f"bash scripts/pull-module.sh {item['path']}"
    unified_modules.append(item)

# Process Agent Modules (40)
for m in agents_data.get("modules", []):
    item = dict(m)
    item["domain"] = "agents"
    item["domain_name"] = "Autonomous AI Agents"
    item["domain_icon"] = "🧠"
    raw_path = m.get("path", "")
    item["path"] = f"agents/{raw_path}" if not raw_path.startswith("agents/") else raw_path
    item["pull_command"] = f"bash scripts/pull-module.sh {item['path']}"
    item["framework"] = "Python / Typer / LLM Gateway"
    unified_modules.append(item)

# Process Apps Modules (163)
for m in apps_data.get("modules", []):
    item = dict(m)
    item["domain"] = "apps"
    item["domain_name"] = "Mobile Applications"
    item["domain_icon"] = "📱"
    raw_path = m.get("path", "")
    item["path"] = f"apps/{raw_path}" if not raw_path.startswith("apps/") else raw_path
    item["pull_command"] = f"bash scripts/pull-module.sh {item['path']}"
    item["framework"] = m.get("platform", "Flutter / Dart")
    unified_modules.append(item)

unified_registry = {
    "name": "Personal Product Factory — Master Reusable Code Library",
    "version": "2.0.0",
    "repository": "https://github.com/sh15aa/Web-Reusable",
    "description": "Unified enterprise reusable code library spanning Web Apps (33), Conversational Bots (27), Autonomous AI Agents (40), and Mobile Applications (163).",
    "total_modules": len(unified_modules),
    "domains": {
        "web": {
            "name": "Web Applications",
            "count": len(web_data.get("modules", [])),
            "framework": "Node.js / TypeScript / React / Next.js",
            "icon": "🌐",
            "description": "33 production-hardened web modules with 40-dimension resilience, Crockford IDs, UnitOfWork, and multi-tenancy."
        },
        "bots": {
            "name": "Conversational & Messaging Bots",
            "count": len(bots_data.get("modules", [])),
            "framework": "Python / FastAPI / Async Redis",
            "icon": "🤖",
            "description": "27 enterprise bot modules for WhatsApp, Telegram, Chatwoot, anti-loop guards, and distributed workers."
        },
        "agents": {
            "name": "Autonomous AI Agents",
            "count": len(agents_data.get("modules", [])),
            "framework": "Python / Multi-Agent Factory / Evaluation",
            "icon": "🧠",
            "description": "40 autonomous agent modules including memory hierarchies, tool sandboxing, regression judges, and workflows."
        },
        "apps": {
            "name": "Mobile Applications",
            "count": len(apps_data.get("modules", [])),
            "framework": "Flutter / Dart / FastAPI / 1M Scale",
            "icon": "📱",
            "description": "163 production-grade mobile modules for Flutter, offline-first sync, zero-trust security, and 1M user scale."
        }
    },
    "modules": unified_modules
}

master_path = os.path.join(REGISTRY_DIR, "modules.json")
with open(master_path, "w") as f:
    json.dump(unified_registry, f, indent=2)

print(f"✅ Generated master registry with {len(unified_modules)} modules across 4 domains at {master_path}!")
