#!/usr/bin/env python3
"""Mine the Lincoln Digital Brain ERP repo into src/data/system-map.json.

Stdlib only. Extraction (permissions, pages, tables, status vocabularies,
notification events, glossary, seed personas) is merged with the hand-curated
files in extractor/curation/. Curation wins on prose and positions; extraction
wins on anything the code is authoritative for.

    python3 extractor/extract.py --erp-root ../Lincoln-ERP-product-demo
    python3 extractor/extract.py --check      # exit 1 if the committed JSON is stale
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
CURATION = HERE / "curation"
DEFAULT_OUT = REPO / "src" / "data" / "system-map.json"
DEFAULT_ERP = REPO.parent / "Lincoln-ERP-product-demo"

# Sidebar array variable → human section label (AppSidebar.tsx).
SIDEBAR_SECTIONS = {
    "adminItems": "Admin",
    "coreFlowItems": "Core Flow",
    "quotationItems": "Quotation",
    "salesManagementItems": "Sales",
    "salesManagerItems": "Sales Manager",
    "operationsItems": "Operations",
    "inventoryItems": "Inventory",
    "financeItems": "Finance",
    "poWorkspaceItems": "PO Workspace",
    "customerMasterItems": "Customer Master",
}

# Driver app has no sidebar; its routes live in App.tsx under /driver.
DRIVER_PAGES = [
    {"title": "Orders", "url": "/driver/orders", "permission": "driver.app"},
    {"title": "Order detail", "url": "/driver/orders/:id", "permission": "driver.app"},
    {"title": "Notifications", "url": "/driver/notifications", "permission": "driver.app"},
    {"title": "Profile", "url": "/driver/profile", "permission": "driver.app"},
]

MATURITIES = ("live", "prototype", "schema-only", "target")


# ---------------------------------------------------------------- parsers ---
def parse_role_permissions(src: str) -> dict[str, list[str]]:
    """`role: [ "a.b", ... ],` blocks inside SEED_ROLE_PERMISSIONS."""
    src = re.sub(r"//[^\n]*", "", src)
    body_match = re.search(r"SEED_ROLE_PERMISSIONS[^=]*=\s*\{(.*)\};", src, re.S)
    if not body_match:
        raise ValueError("SEED_ROLE_PERMISSIONS not found")
    roles: dict[str, list[str]] = {}
    for m in re.finditer(r"(\w+):\s*\[(.*?)\]", body_match.group(1), re.S):
        perms = re.findall(r'"([a-z_]+\.[a-z_]+)"', m.group(2))
        roles[m.group(1)] = sorted(set(perms))
    return roles


def parse_permission_catalog(src: str) -> list[dict]:
    """PERMISSIONS object: `KEY: "resource.action"` under `// Section` comments."""
    body = re.search(r"export const PERMISSIONS = \{(.*?)\} as const;", src, re.S)
    if not body:
        raise ValueError("PERMISSIONS not found")
    group = "Other"
    out = []
    for line in body.group(1).splitlines():
        s = line.strip()
        gm = re.match(r"//\s*([A-Z][A-Za-z /()]+?)\s*$", s)
        if gm and ":" not in s:
            group = gm.group(1).strip()
            continue
        km = re.match(r'([A-Z_]+):\s*"([a-z_]+\.[a-z_]+)"', s)
        if km:
            out.append({"key": km.group(2), "const": km.group(1), "group": group})
    return out


def parse_sidebar(src: str) -> dict[str, list[dict]]:
    """`const xItems = [ { title, url, ... }, ... ]` → section label → items."""
    sections: dict[str, list[dict]] = {}
    for var, label in SIDEBAR_SECTIONS.items():
        m = re.search(rf"const {var}\s*(?::[^=]+)?=\s*\[(.*?)\n\];", src, re.S)
        if not m:
            continue
        items = []
        for im in re.finditer(r'title:\s*"([^"]+)",\s*url:\s*"([^"]+)"', m.group(1)):
            items.append({"title": im.group(1), "url": im.group(2)})
        sections[label] = items
    return sections


def parse_route_permissions(src: str) -> dict[str, str]:
    """protectedRoutes.ts → '/path' → 'resource.action' (via PERMISSIONS.CONST)."""
    out: dict[str, str] = {}
    for m in re.finditer(r'path:\s*"([^"]+)"(?:(?!path:).)*?requiredPermission:\s*PERMISSIONS\.([A-Z_]+)', src, re.S):
        out["/" + m.group(1)] = m.group(2)
    return out


def parse_schema_tables(schema_dir: Path) -> dict[str, dict]:
    """Every pgTable("name") under server/domains/*/schema → name → {domain, file, checks}."""
    tables: dict[str, dict] = {}
    for f in sorted(schema_dir.glob("*/schema/**/*.ts")):
        src = f.read_text(encoding="utf-8")
        domain = f.relative_to(schema_dir).parts[0]
        for tm in re.finditer(r'pgTable\(\s*"([a-z_]+)"', src):
            name = tm.group(1)
            tables[name] = {
                "domain": domain,
                "file": str(f.relative_to(schema_dir.parent.parent)),
                "checks": parse_check_constraints(src),
            }
    return tables


def parse_check_constraints(src: str) -> dict[str, list[str]]:
    r"""`sql\`col IN ('a', 'b')\`` and `col = ANY (ARRAY['a'::text, ...])` → col → values."""
    out: dict[str, list[str]] = {}
    for m in re.finditer(r"sql`\s*([a-z_]+)\s+IN\s*\(([^)]*)\)", src):
        out[m.group(1)] = re.findall(r"'([^']+)'", m.group(2))
    for m in re.finditer(r"sql`\s*([a-z_]+)\s*=\s*ANY\s*\(ARRAY\[(.*?)\]\)", src, re.S):
        out[m.group(1)] = re.findall(r"'([^']+)'", m.group(2))
    return out


def parse_notifications(src: str) -> dict:
    deps = re.search(r"NOTIFICATION_DEPARTMENTS = \[(.*?)\] as const", src, re.S)
    departments = re.findall(r'"([a-z]+)"', deps.group(1)) if deps else []
    events = []
    for m in re.finditer(
        r'eventType:\s*"([a-z_.]+)",(?:(?!eventType:).)*?audienceScope:\s*"([a-z]+)",\s*department:\s*(null|"[a-z]+")',
        src, re.S,
    ):
        events.append({
            "eventType": m.group(1),
            "audienceScope": m.group(2),
            "department": None if m.group(3) == "null" else m.group(3).strip('"'),
        })
    return {"departments": departments, "events": events}


def parse_glossary(md: str) -> list[dict]:
    """`- **Term** — definition` bullets (with wrapped continuation lines), grouped by ## heading."""
    terms = []
    section = None
    current = None
    for raw in md.splitlines():
        if raw.startswith("## "):
            section = raw[3:].strip()
            current = None
            continue
        m = re.match(r"- \*\*(.+?)\*\*\s+—\s+(.*)", raw)
        if m:
            current = {"term": m.group(1).replace("`", ""), "definition": m.group(2).strip(), "section": section}
            terms.append(current)
        elif current and raw.startswith("  ") and raw.strip():
            current["definition"] += " " + raw.strip()
    for t in terms:
        t["definition"] = re.sub(r"\s*→\s*\[[^\]]*\]\([^)]*\)", "", t["definition"]).strip()
        t["definition"] = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t["definition"])
    return terms


def parse_seed_users(src: str) -> list[dict]:
    users = []
    for m in re.finditer(r"\{[^{}]*?email:\s*\"([^\"]+)\"[^{}]*?firstName:\s*\"([^\"]+)\"[^{}]*?lastName:\s*\"([^\"]+)\"[^{}]*?role:\s*\"([^\"]+)\"", src, re.S):
        users.append({"email": m.group(1), "name": f"{m.group(2)} {m.group(3)}", "role": m.group(4)})
    return users


# ------------------------------------------------------------------ merge ---
def load_curation() -> dict:
    return {p.stem: json.loads(p.read_text(encoding="utf-8")) for p in CURATION.glob("*.json")}


def git_head(erp: Path) -> str | None:
    try:
        return subprocess.check_output(["git", "-C", str(erp), "rev-parse", "--short", "HEAD"], text=True).strip()
    except Exception:  # noqa: BLE001
        return None


def build(erp: Path) -> dict:
    cur = load_curation()
    read = lambda rel: (erp / rel).read_text(encoding="utf-8")  # noqa: E731

    role_perms = parse_role_permissions(read("seed/data/role-permissions.ts"))
    catalog = parse_permission_catalog(read("src/lib/permissions.ts"))
    sidebar = parse_sidebar(read("src/shared/components/layout/AppSidebar.tsx"))
    route_perm = parse_route_permissions(read("src/routes/protectedRoutes.ts"))
    const_to_key = {c["const"]: c["key"] for c in catalog}
    tables = parse_schema_tables(erp / "server" / "domains")
    notifications = parse_notifications(read("src/lib/notifications.ts"))
    glossary = parse_glossary(read("docs/reference/glossary.md"))
    seed_users = parse_seed_users(read("seed/seed-auth.ts"))
    by_email = {u["email"]: u for u in seed_users}

    problems: list[str] = []

    # Departments
    departments = []
    for d in cur["departments"]["departments"]:
        pages = list(d.get("pages", []))
        for section in d.get("navSections", []):
            for item in sidebar.get(section, []):
                perm = route_perm.get(item["url"])
                pages.append({
                    "title": item["title"], "url": item["url"], "section": section,
                    "permission": const_to_key.get(perm, perm) if perm else None,
                })
        if d["id"] == "driver":
            pages = DRIVER_PAGES + pages
        seen = set()
        pages = [p for p in pages if not (p["url"] in seen or seen.add(p["url"]))]
        dept_tables = []
        for t in d.get("tables", []):
            info = tables.get(t)
            dept_tables.append({"name": t, "domain": info["domain"] if info else None, "inSchema": bool(info)})
        if d["maturity"] not in MATURITIES:
            problems.append(f"department {d['id']}: bad maturity {d['maturity']}")
        for r in d["responsibilities"]:
            if r["maturity"] not in MATURITIES:
                problems.append(f"department {d['id']} responsibility '{r['label']}': bad maturity")
        departments.append({
            **{k: v for k, v in d.items() if k not in ("navSections", "tables", "pages")},
            "pages": pages,
            "tables": dept_tables,
        })
    dept_ids = {d["id"] for d in departments}

    # Roles
    roles = []
    for r in cur["roles"]["roles"]:
        role = dict(r)
        email = role.pop("seedEmail", None)
        if role["maturity"] == "target":
            role["permissions"] = []
            role.setdefault("proposedPermissions", [])
        else:
            if role["id"] not in role_perms:
                problems.append(f"role {role['id']} is not in SEED_ROLE_PERMISSIONS")
            role["permissions"] = role_perms.get(role["id"], [])
            role["proposedPermissions"] = []
        role["seedUser"] = {"name": by_email[email]["name"], "email": email} if email and email in by_email else None
        if role["department"] is not None and role["department"] not in dept_ids:
            problems.append(f"role {role['id']}: unknown department {role['department']}")
        roles.append(role)
    role_ids = {r["id"] for r in roles}
    for d in departments:
        for rid in d["roles"]:
            if rid not in role_ids:
                problems.append(f"department {d['id']} references unknown role {rid}")
    for rid in role_perms:
        if rid not in role_ids:
            problems.append(f"seed role {rid} has no curation entry")

    # Edges
    edges = []
    for e in cur["edges"]["edges"]:
        for ev in e["evidence"]:
            if not (erp / ev).exists():
                problems.append(f"edge {e['id']}: evidence path missing: {ev}")
        for end in ("from", "to"):
            if e[end] not in dept_ids:
                problems.append(f"edge {e['id']}: unknown department {e[end]}")
        if e["maturity"] not in MATURITIES:
            problems.append(f"edge {e['id']}: bad maturity")
        edges.append(e)

    # Terms
    terms = [
        {"term": g["term"], "definition": g["definition"], "department": None, "source": "docs/reference/glossary.md", "section": g["section"]}
        for g in glossary
    ] + [{**t, "section": "Department vocabulary"} for t in cur["terminology"]["terms"]]

    # Status vocabularies worth surfacing (from CHECK constraints)
    vocab = {name: info["checks"] for name, info in tables.items() if info["checks"]}

    if problems:
        raise SystemExit("extract.py: curation does not match the ERP repo:\n  - " + "\n  - ".join(problems))

    return {
        "erpCommit": git_head(erp),
        "departments": departments,
        "roles": roles,
        "edges": edges,
        "terms": terms,
        "permissions": catalog,
        "rolePermissions": role_perms,
        "statusVocabularies": vocab,
        "notifications": notifications,
        "seedUsers": seed_users,
        "targetModel": cur["target-model"],
        "schemaTableCount": len(tables),
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--erp-root", type=Path, default=DEFAULT_ERP)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--check", action="store_true", help="fail if the committed output is stale")
    args = ap.parse_args(argv)
    if not args.erp_root.exists():
        print(f"ERP repo not found at {args.erp_root}", file=sys.stderr)
        return 2
    data = build(args.erp_root.resolve())
    text = json.dumps(data, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    if args.check:
        if not args.out.exists():
            print(f"{args.out} missing", file=sys.stderr)
            return 1
        old = json.loads(args.out.read_text(encoding="utf-8"))
        new = json.loads(text)
        old.pop("erpCommit", None); new.pop("erpCommit", None)
        if old != new:
            print(f"{args.out} is stale — run `bun run extract`", file=sys.stderr)
            return 1
        print("system-map.json is up to date")
        return 0
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(text, encoding="utf-8")
    print(f"wrote {args.out} — {len(data['departments'])} departments, {len(data['roles'])} roles, "
          f"{len(data['edges'])} edges, {len(data['terms'])} terms, {data['schemaTableCount']} schema tables")
    return 0


if __name__ == "__main__":
    sys.exit(main())
