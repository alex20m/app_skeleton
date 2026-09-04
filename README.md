# app_skeleton

The starting point for a new app: the workflow rules, the Claude skills, CI, the
database and auth wiring, and the tests that keep all of it from drifting.

**Copying this for a new project? Read [`INIT.md`](INIT.md) first** — it is the
ordered list of what to rename, provision and implement, and what to delete when
you are done.

## Why it exists

Every app here was arriving at the same answers separately, and slightly
differently each time: what CI should and should not do, where migrations run,
how the deploy is ordered against them, what a health endpoint should report.
This is those answers, already applied, so a new project starts from the current
state of that thinking rather than rediscovering it.

## The shape

```
AGENTS.md               the standing rules — branch, test and merge policy
CLAUDE.md               `@AGENTS.md` — Claude Code reads this file, so it imports the real one
INIT.md                 read once, when starting a new project from this
SETUP.md                provisioning, written to be run without a browser
.claude/skills/         the procedures agents are expected to follow (Claude Code)
.agents/skills/         the same procedures, byte-identical, for other agent tools
app/                    Next.js App Router
  api/health/           what is configured, as JSON
  api/me/               the template for an authenticated route
  api/auth/[...path]/   Neon Auth's endpoints, proxied
lib/env.ts              every environment variable, in one place
lib/db.ts               the query handle
lib/auth.ts             the auth seam — an interface, fails closed by default
lib/neonSession.ts      Neon Auth's session mapped onto ours (unit-tested)
lib/neonAuth.ts         the SDK wiring — thin, because it cannot be unit-tested
db/migrate.ts           `npm run migrate` — node-pg-migrate, configured
db/migrations/          numbered .sql files, applied once each
tests/                  behaviour, plus the pipeline's own shape
.github/workflows/      checks only: one per event, neither deploys nor migrates
vercel.json             the build command that migrates before it builds
```

## The decisions it encodes

- **The platform deploys; CI checks.** A workflow that also deploys is not a
  gate, it is a second racing route to production.
- **Migrations run inside the build**, joined with `&&`, so the schema lands
  before the code that needs it and a failed migration leaves the previous
  deployment serving.
- **The pipeline is tested like code.** `tests/pipeline.test.ts` fails if a
  deploy job appears, if migrations move into a workflow, or if a check is
  dropped — the things nothing else would notice.
- **Auth fails closed.** The default provider makes everyone anonymous, so an
  unfinished setup denies rather than exposes.
- **Configuration is reported, never echoed.** `/api/health` says whether things
  are set, never what they are.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm test
```

The full check set, which is exactly what CI runs:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```
