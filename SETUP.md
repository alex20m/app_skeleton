# Setup

Standing up this app from nothing. Written so that **someone holding the tokens
— or an agent — can run it top to bottom without opening a browser**, except for
the few steps listed under [Has to be done by hand](#has-to-be-done-by-hand).

> **This is the skeleton's copy.** Rewrite it as you provision, so it describes
> *this* app: real project names, the variables you actually set, the choices
> you actually made. Keeping it current is part of the change that alters setup,
> not a follow-up.

Roughly 30 minutes end to end, most of it waiting on DNS if you add a domain.

## Prerequisites

| You need | For | Notes |
| --- | --- | --- |
| A GitHub repository | Everything | Deploys come from its Git integration |
| A Vercel account | Hosting | `VERCEL_TOKEN` from Account Settings → Tokens |
| A database | Postgres | Provisioned *through* Vercel, not separately |

Set tokens in your environment rather than passing them inline, and never echo
one to check it is set — test it with a call that uses it.

```bash
export VERCEL_TOKEN=...
```

## 1. The code

```bash
npm install
npm run lint && npm run typecheck && npm test && npm run build
```

All four pass before any service exists. If they do not, stop here.

## 2. The hosting project

Everything else attaches to this, so it comes first. `vercel link` writes
`.vercel/project.json`, which later commands read to know which project you
mean.

```bash
npx vercel link --yes --project <your-app>
npx vercel project ls
```

## 3. The database

Provision it as an integration on the project — that is what makes the
connection details arrive as managed environment variables that stay in sync
when they rotate, rather than a string someone pasted once.

```bash
npx vercel integration add neon
npx vercel env ls                      # DATABASE_URL and DATABASE_URL_UNPOOLED present
```

Then apply the schema:

```bash
npx vercel env pull .env.local
npm run migrate
```

From here on, **every deployment migrates before it builds** — `vercel.json`
sets the build command to `npm run migrate && next build`. A failed migration
fails the build, so the previous deployment keeps serving rather than being
replaced by code its schema cannot support.

Two things that follow, and one that does not change:

- The database must be reachable for a deploy to succeed at all.
- Rolling a deployment back does **not** roll the schema back; `up` only applies
  what is outstanding.
- Migrations must still be additive. The migration runs while the previous
  deployment is serving, so old code meets the new schema.

## 4. Your own variables

Set them for every environment you will use, including development, so local
development pulls from the same source of truth.

```bash
npx vercel env add APP_URL production preview development
npx vercel env pull .env.local
```

**Variables apply at build time, not to a running deployment.** Adding one
without redeploying is the most common "I set it and nothing happened".

## 5. Auth

See [`INIT.md`](INIT.md) step 4 — the provider is a decision, and the SDK's
surface has to be read back from its own CLI rather than assumed. Record here
what you chose and why, along with the variables it supplies.

## 6. Deploys

Connect the repository to the Vercel project and leave automatic deploys **on**.
Every pull request gets a preview; every merge to `main` goes to production.

Nothing in `.github/workflows/` deploys or migrates, and `tests/pipeline.test.ts`
fails if that changes. Two routes to production race each other and deploy
everything twice.

Check it came up:

```bash
curl https://<your-app>/api/health
```

Every field should read `true`.

## 7. A custom domain (optional)

Ask the platform what record it wants rather than hardcoding a target:

```bash
npx vercel domains add <domain> <your-app>
npx vercel domains inspect <domain>
npx vercel domains verify <domain>
```

If the DNS lives behind a proxy (Cloudflare's orange cloud), **turn it off** for
this record. A proxy in front of a host that terminates its own TLS shows up as
certificate issuance that never completes or a redirect loop — neither of which
points back at the toggle.

## Has to be done by hand

Keep this list short and honest; it is what shrinks over time.

- **Minting the first token.** The credential every CLI needs cannot itself be
  created by one.
- **Billing and accepting terms.** Providers gate these on a human deliberately.

## Environment variables

| Name | What it is | Who supplies it |
| --- | --- | --- |
| `DATABASE_URL` | Pooled connection, for app queries | The database integration |
| `DATABASE_URL_UNPOOLED` | Direct connection, for migrations | The database integration |
| `APP_URL` | Where the app is served | You |

Provider-managed variables and ones you generate are maintained completely
differently. Never copy a managed one into a second place.

## Checklist

- [ ] `npm run lint && npm run typecheck && npm test && npm run build` passes locally
- [ ] Vercel project created and linked
- [ ] Database provisioned through Vercel; `DATABASE_URL` visible in `vercel env ls`
- [ ] `npm run migrate` applied against it
- [ ] Your own variables set for production, preview and development
- [ ] Auth enabled, its variables present, deployed URL trusted
- [ ] Git integration connected with automatic deploys on
- [ ] `/api/health` reports everything configured
- [ ] `INIT.md` deleted and this file rewritten for the real app

## Troubleshooting

**`DATABASE_URL is not set`** — you have not pulled the variables, or you pulled
them before the integration was added. `npx vercel env pull .env.local`.

**A deployment reports `databaseConfigured: false`** — the variable exists but
the deployment predates it. Variables apply at build time; redeploy.

**The build fails in the migration step** — read the migration, not the build.
The deployment did not happen, which is the intended behaviour: the previous one
is still serving.

**A preview has no data** — expected. A preview gets its own database branch,
seeded with the schema and not the rows.
