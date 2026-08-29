# Lincoln System Map

An interactive 3D map of the **Lincoln Digital Brain** ERP: every department as a
block, the roles inside it as pill tags, the crucial data each department enters,
and how that data flows block-to-block. Built for onboarding and product
discussions — hover a block to see its correlations light up, click to open it.

**Live:** https://sunnies-daise.github.io/lincoln-system-map/ (GitHub Pages) — the
repo also ships `vercel.json` and `render.yaml`, so importing it into Vercel or
Render gives a custom URL with zero configuration.

## What it shows

| Interaction | What you get |
| --- | --- |
| **Hover a block** | roles · tasks count, top responsibilities, and every department it exchanges data with lights up while the flow animates |
| **Click a block** | the department panel: blurb, role pills, responsibilities, crucial data entered, data flowing out / in, screens in the ERP, tables |
| **Click a role pill** | what the role does, how they handle their work, permission chips, demo login |
| **Click a flow** | highlights that path on the map with trigger, status path and source-file evidence |
| **Target / As-built** | switch between the organisation model being designed and what the code does today |
| **Terminology** | searchable glossary — core-flow docs + department vocabulary |

Every block, role, task and flow carries a **maturity**:

- **Live** — shipped in the ERP
- **Prototype** — on the `demo` branch (`prototypes/INDEX.md` in the ERP repo)
- **Schema only** — tables exist (mirrored from the legacy ERP), no screens yet
- **Target** — from the PM's organisation brief; nothing in the code yet

## Departments

Sales → Quotation → Operations (+ Driver) → Finance on the main row;
Procurement · Store / Inventory · Plant on the back row.

## Run it

```sh
bun install
bun run dev          # http://localhost:5173
bun run build        # static site in dist/
bun run check        # typecheck + lint + extractor freshness + extractor tests
bun run test:e2e     # Playwright smoke (needs `bunx playwright install chromium`)
```

## Keeping the data honest

`src/data/system-map.json` is **generated**, not hand-edited. A stdlib-only
Python script mines the ERP repo and merges it with the curated content in
`extractor/curation/`:

```sh
# ERP repo checked out next to this one (../Lincoln-ERP-product-demo) — or pass --erp-root
bun run extract
bun run extract:check   # exit 1 if the committed JSON is stale
```

| Extracted from the ERP repo (authoritative) | Curated here (`extractor/curation/`) |
| --- | --- |
| role → permission bundles (`seed/data/role-permissions.ts`) | `departments.json` — blocks, blurbs, responsibilities, crucial inputs, positions |
| permission catalog + groups (`src/lib/permissions.ts`) | `roles.json` — role blurbs, "how they work", target-only roles |
| sidebar sections → pages + route permission gates | `edges.json` — directed data flows with evidence paths |
| every `pgTable` + CHECK vocabularies (`server/domains/*/schema`) | `target-model.json` — approval ladder today vs target, gaps |
| notification departments + events (`src/lib/notifications.ts`) | `terminology.json` — vocabulary the glossary doesn't cover |
| glossary (`docs/reference/glossary.md`), seed personas | |

The extractor **fails** if curation drifts from the code: an evidence path that
no longer exists, a role missing from the seed, a department id that isn't
defined. Unit tests: `bun run test:extractor`.

## Deploy

- **GitHub Pages** — `.github/workflows/deploy.yml` builds on every push to
  `main` (`VITE_BASE=/lincoln-system-map/`). Enable *Settings → Pages → Source:
  GitHub Actions* once.
- **Vercel** — import the repo; `vercel.json` sets the Bun build + `dist/`.
- **Render** — *New → Blueprint* on this repo; `render.yaml` defines a static site.

## Stack

React 18 · Vite · TypeScript · three.js via `@react-three/fiber` + `@react-three/drei`
· zustand · Playwright · Python 3.10+ (stdlib only) for the extractor.
