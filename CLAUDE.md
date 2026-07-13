# Portfolio App

React (Vite) + Express portfolio site, unified deployment on Render. Full planning
history and rationale in `PLAN.md`; this file is the durable reference for decisions
and conventions going forward.

## Stack & structure

npm workspaces monorepo: `client` (Vite + React + TypeScript), `server` (Express),
`shared` (Zod schema + inferred types, consumed by both), `e2e` (Playwright, tests
the seam between client and server — doesn't belong to either).

Data is a single `server/src/data/projects.json`, no database. The `Project` type is
**derived from the Zod schema** via `z.infer` in `shared/src/project.ts`, not
hand-written separately — the type and the runtime validation can't drift apart
because there's only one source of truth.

The schema is a **discriminated union on `type`** (`"software" | "art"`), so
software-only fields (`liveUrl`, `repoUrl`) are inaccessible on art projects at the
type level, not just conventionally optional. It also has a `.superRefine()` check
enforcing unique `id`s across the array — ids double as URL slugs
(`/projects/:id`), so a duplicate would cause silent, hard-to-debug lookup bugs
(`Array.find` just returns whichever one comes first).

**Validation runs once at server startup**, not per-request — `loadProjects.ts`
calls `ProjectsSchema.parse()` at import time. `projects.json` is static file
content, not user input, so re-validating per-request would be wasted work. A
schema violation crashes the server immediately with a specific Zod error (which
field, which array index, which check) instead of surfacing later as a confusing
runtime bug. Verified directly during scaffolding: introducing a duplicate `id`
into `projects.json` and rebuilding causes `node dist/index.js` to crash on boot
with `Duplicate project id(s): ...`, before `app.listen()` is ever reached.

**Deployment is unified** — Express serves both the built client and the API from
one process on Render, chosen over split hosting because this is a low-traffic
site that doesn't need independently scaled tiers, and unified avoids CORS +
dual-pipeline complexity for a first-time single-process setup.

**Express route order matters** (`server/src/index.ts`): `/api/*` and `/images/*`
must be registered before the SPA catch-all (`app.get('*', ...)`), or the
catch-all shadows them — `express.static` calls `next()` on a miss so it's safe to
sit before the catch-all, but the catch-all itself has no `next()` and must be
last. A hard refresh on a client-side route (e.g. `/projects/weather-app`) is
expected to hit the catch-all, get `index.html`, and have React Router re-render
the correct page client-side — this is normal SPA behavior, not a bug, and is
covered by an e2e test.

## Build pipeline (important gotcha)

`shared`'s `package.json` `main`/`types` point at `dist/`, not `src/` — both
`client` and `server` consume it as a **compiled** package, so `shared` must build
before either consumer, in dev and prod alike.

- Root `postinstall` builds `shared` once after a fresh `npm install` (fast path).
- The root `dev` script *also* builds `shared` once before starting the three
  concurrent watchers — this is a safety net for cases `postinstall` doesn't cover
  (`git clean`, a manually deleted `dist/`, etc.), not just the fresh-install path.
  After that, `shared`'s own `tsc --watch` takes over incremental rebuilds, and
  `tsx watch` (server) / Vite (client) both pick up changes automatically through
  the workspace symlink into `shared/dist`.
- Root `build` sequences `shared → server → client` explicitly
  (`npm run build -w shared && npm run build -w server && npm run build -w client`)
  — npm workspaces do not guarantee build order across packages on their own.
- All three of `shared`, `server`, and `client` (via `package.json` `"type":
  "module"`) are ESM. This was a real bug hit during scaffolding: omitting `"type":
  "module"` on `shared`/`server` made `tsc` default to CommonJS output, which broke
  on `import.meta.url` (used for `__dirname` in `server/src/index.ts`) and on JSON
  import attributes (`import raw from "./projects.json" with { type: "json" }` in
  `loadProjects.ts`). If either package's `package.json` loses `"type": "module"`
  again, expect the same class of build failure.
- `dist/` (all three packages) and `*.tsbuildinfo` are gitignored — generated
  output, not checked in. Every consumer of the compiled output is a script in this
  same repo that can always rebuild it, so committing it would just risk drift.

## Environment variables

- `.env` — committed, non-secret (currently just `PORT=4000`).
- `.env.development.local` — gitignored (`*.local`), for dev-only secrets. Empty
  today; no secrets exist yet in this app (no DB, no API keys, no auth).
- `.env.example` — committed template documenting the shape of `.local`.
- `server/src/index.ts` loads env via `dotenv/config`. In production, Render
  injects real env vars (including `PORT`) directly — there's no `.env` file to
  load there, dotenv's load is effectively a dev-only concern.
- Production secrets: added manually in Render's dashboard when a real secret
  exists. Nothing to automate here.

## Images

WebP, hand-optimized (Squoosh.app or editor export) — **remember to convert real
project assets to WebP**, since this is a new step relative to a typical
PNG/JPEG export habit. Rough sizing targets: thumbnails ~600px wide, gallery/detail
images ~1600px wide. Single copy only in `server/public/images/<project-slug>/`, no
source/generated pipeline, no image-processing dependency (e.g. sharp).

## Testing

**Vitest** — `shared/src/project.test.ts` only, as of this commit. Covers the Zod
schema directly: valid software/art parsing, discriminated-union field gating,
malformed `date`/`liveUrl` rejection, unknown `type` literal rejection, and
duplicate-`id` rejection (including the exact error message). Chosen over Jest
because it shares Vite's transform pipeline with effectively zero extra config for
this stack.

**Not yet implemented:** server-level integration tests (e.g. via `supertest`
against the Express app — `GET /api/projects`, `GET /api/projects/:id` including
the 404 path, `loadProjects` throwing on malformed data). This was discussed as a
direction worth pursuing but isn't built yet — `server` currently has zero test
files. If picked up later, keep it consistent with the rest of the stack: Vitest,
not Jest.

**Playwright** — `e2e/`, a separate workspace (tests the client/server seam, not
owned by either). Runs against a **full production build**, not dev mode —
`playwright.config.ts`'s `webServer` runs `npm run build && npm run start` and
waits on `:4000` before tests execute. This exercises the actual deployed code
path (Express serving static `dist/`, the SPA-fallback catch-all), which is the
higher-value thing to protect and is what most of scaffolding's manual
verification already covered. Current coverage: cards render from the live API
(not hardcoded), filter tabs narrow the grid, software/art detail pages gate
`liveUrl`/`repoUrl` correctly, navigation works, and — the one regression this
suite actually caught during scaffolding — a hard refresh on a client-side route
survives via the SPA fallback, and an unknown project id shows a "Project not
found" state rather than hanging on "Loading..." forever (this required adding
`retry: false` to `useProject`'s React Query config, since 404s aren't a
transient failure worth retrying).

Browser binary install (`playwright install chromium`) is a **manual, documented,
per-machine step** (`npm run test:e2e:setup -w e2e`), not wired into
`postinstall` — it's a large (~300MB) download cached outside the project
(`~/.cache/ms-playwright`), keyed by Playwright version rather than by project, and
`--with-deps` can require sudo on a machine missing system libraries. See
`README.md` for the exact commands.

## Review workflow / conventions for this project

- **Commit before reviewing.** Review a clean diff and rollback point, not an
  uncommitted working tree.
- **Run `/code-review` in a fresh session**, not the same session that wrote the
  code — independence from the implementer's own reasoning/context is the point.
- **Prefer `/code-review --comment`** (posts inline PR suggestions) over
  auto-applied fixes. Keeps a human decision point before any review-driven change
  is accepted, rather than letting reviewer and implementer changes stack silently
  on top of each other.
- **If a review pass does auto-apply fixes**, treat that as its own diff to review
  in isolation (diff against the prior commit specifically), not folded into the
  overall cumulative change.

## Git structure

`master` has a single empty root commit (created deliberately, so all real content
lands in a reviewable PR rather than being pre-committed). Scaffolding work lives
on `scaffold-portfolio-app`, opened as PR #1 into `master`. Remote:
`git@github.com:seanboose/agentic-portfolio.git`.

## Sample data

`server/src/data/projects.json` currently has two placeholder entries
(`weather-app` — software, `sunset-study` — art) with 1×1 placeholder WebP images,
used to exercise the full pipeline end-to-end during scaffolding. Replace with real
project data/images before shipping.
