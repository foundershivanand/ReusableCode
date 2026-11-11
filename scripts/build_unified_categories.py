#!/usr/bin/env python3
import json
import os

ROOT_DIR = "/home/shiva/reusable"
REGISTRY_DIR = os.path.join(ROOT_DIR, "registry")

with open(os.path.join(REGISTRY_DIR, "modules.json")) as f:
    master = json.load(f)

categories_by_domain = {
    "web": {},
    "bots": {},
    "agents": {},
    "apps": {}
}

all_categories = {}

for m in master.get("modules", []):
    domain = m.get("domain", "web")
    cat = m.get("category", "general")
    if cat not in categories_by_domain[domain]:
        categories_by_domain[domain][cat] = []
    categories_by_domain[domain][cat].append(m["id"])

    full_cat_key = f"{domain}:{cat}"
    if full_cat_key not in all_categories:
        all_categories[full_cat_key] = {
            "domain": domain,
            "category": cat,
            "modules": []
        }
    all_categories[full_cat_key]["modules"].append({
        "id": m["id"],
        "name": m["name"],
        "path": m["path"],
        "description": m.get("description", "")
    })

output = {
    "version": "2.0.0",
    "total_domains": 4,
    "domains": master["domains"],
    "categories_by_domain": categories_by_domain,
    "all_categories": all_categories
}

with open(os.path.join(REGISTRY_DIR, "categories.json"), "w") as f:
    json.dump(output, f, indent=2)

print("✅ Generated unified categories.json!")
