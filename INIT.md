# Start here

You are about to turn this skeleton into a specific app. Read this file to the
end before running anything — the order below exists because each step produces
something the next one needs, and doing them out of order half-works, which is
worse than failing.

This file is for the person or agent doing the setup **once**. After that it is
dead weight: delete it in the same change that finishes step 6.

---

## What you are starting from

- **Next.js + TypeScript**, building clean, with `lint`, `typecheck`, `test` and
  `build` all wired and passing.
- **CI as two workflows** — one per event, checks only. Nothing in Actions
  deploys or migrates, and `tests/pipeline.test.ts` fails if that changes.
- **Deploys from the platform's Git integration.** No deploy job, no
  `VERCEL_*` secrets.
- **Migrations inside the build** (`vercel.json`), so the schema lands before
  the code that needs it — `node-pg-migrate`, plain `.sql` files, conventions
  enforced by `tests/migrationFiles.test.ts`.
- **A database seam** (`lib/db.ts`) and an **auth seam** (`lib/auth.ts`), the
  latter deliberately unimplemented — see step 4.
- **A health endpoint** (`/api/health`) that reports what is configured, which
  is what every setup step below checks itself against.
- **The workflow rules** (`CLAUDE.md`) and **the skills** (`.claude/skills/`)
  that this project's agents are expected to follow.

## What is deliberately missing

- **A real auth implementation.** The seam is here; the provider is not. Auth
  SDKs move, and a wrong guess builds cleanly and fails at sign-in.
- **Any domain model.** `db/migrations/0001_example.sql` and `examples` exist to
  exercise the migration path. Delete them with your first real migration.
- **Styling.** No CSS framework is chosen for you. Add one deliberately if the
  app needs it.

---

## The order

### 1. Make it yours

- `package.json` → `name`, `description`.
- `app/layout.tsx` → `metadata`.
- `README.md` → what this app *is*, replacing the skeleton's own text.
- Delete `app/page.tsx`'s placeholder content.

Run `npm install` and then `npm test` before touching anything else. A green
suite here is your baseline; if it is red on a fresh clone, fix that first
rather than building on it.

### 2. Provision, by CLI

**Read `.claude/skills/cli-first-provisioning/SKILL.md` and follow it.** It has
the order the pieces must be created in, how to drive each CLI
non-interactively, and the handful of steps that genuinely need a human. Do not
improvise this from memory — the traps it documents (variables that need a
redeploy, proxied DNS records, auth redirect domains) fail quietly.

The short version, expanded in that skill and in `SETUP.md`:

1. Create the hosting project and link it (`vercel link`) — everything else
   attaches to it.
2. Add the database as a platform integration, not as a separate account.
3. Add your own variables for every environment you will use.
4. Connect the Git integration and leave automatic deploys **on**.

### 3. Get the schema in place

```bash
npx vercel env pull .env.local
npm run migrate
```

Then write your first real migration and delete the example:

```bash
npm run migrate:new -- add_whatever_you_need
```

Additive only. The migration runs during the build while the *previous*
deployment is still serving, so old code meets the new schema. Nullable columns
now; renames and drops in a later change once nothing reads the old shape.

### 4. Wire auth

The house default is **Neon Auth (managed Better Auth)**, and the trap is that
most of what is written about "Neon Auth" describes the older Stack Auth
integration — `@stackframe/stack`, `NEXT_PUBLIC_STACK_*` — which is closed to
new projects. Follow the auth section of `cli-first-provisioning`, then:

1. Enable it and add your deployed URL as a trusted domain.
2. **Read the variable names back** from the provider's own CLI (`--output
   json`) rather than assuming them.
3. Implement `AuthProvider` in `lib/auth.ts` against whatever the SDK's current
   README says, and call `setAuthProvider()` once at startup.
4. Leave `unconfiguredAuth` in place as the default. It fails closed, which is
   what keeps a half-finished setup from exposing routes.

`tests/auth.test.ts` already covers the contract — anonymous is refused, a
signed-in caller gets their account, and an anonymous response leaks nothing.
Those tests should keep passing against the real provider; if they need
loosening to pass, the implementation is wrong, not the tests.

A different provider is a fine choice when it suits the app better. Decide it
deliberately, say why in `SETUP.md`, and set it up by CLI like everything else.

### 5. Prove it end to end

```bash
curl https://<your-app>/api/health
```

Every field should read true. `databaseConfigured: false` on a deployment means
the variable is set but the deployment predates it — redeploy; variables apply
at build time.

### 6. Finish the handover

- Rewrite `SETUP.md` so it describes *this* app: someone holding the tokens must
  be able to run it top to bottom without opening a browser. Keep the "has to be
  done by hand" section honest.
- Delete this file.
- Commit, open a PR, let CI go green, merge.

---

## Rules that outlive this file

`CLAUDE.md` is the standing contract — read it, not just this. The parts most
often violated by a fresh project:

- **Never commit to `main`.** One task, one branch, one PR.
- **Tests are the review.** Nobody reads these PRs. Write the test first, watch
  it fail for the right reason, then make it pass.
- **Every bug fix ships a regression test** that fails without the fix.
- **Keep the pipeline tests.** They are what stop a later change from quietly
  removing the gate that makes all the other tests matter.
