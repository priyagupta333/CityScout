# Deploy CityScout with Neon and Vercel

The application now runs as standard Next.js on Node.js, using Neon PostgreSQL over HTTPS. Cloudflare bindings are no longer required by the running app. The old D1 tooling and migrations remain only as historical/local migration references.

## 1. Neon database

Use your Neon project's pooled PostgreSQL connection string. Keep SSL enabled. Store it in `.env.local` for local development as `DATABASE_URL`; never prefix it with `NEXT_PUBLIC_` and never paste it into application source.

Also set `MODERATION_KEY` in `.env.local` to your private Curator Desk passphrase. The local setup retains the existing passphrase. Vercel must receive that value separately; `.dev.vars` is no longer read by the application.

Run:

```powershell
npm ci
npm run db:setup
```

`db:setup` applies ordered PostgreSQL SQL migrations from `postgres/` transactionally and verifies the five app tables. It can be repeated. It does not delete existing data or copy records from local D1. The catalog of 30 places is bundled in the application and does not need database seeding.

The initial PostgreSQL schema includes accounts, sessions, saved libraries, contributions and moderation audit records, plus indexes for account and queue lookups. Future SQL migrations must be added to `postgres/` in filename order. Applied migration hashes are recorded to prevent accidental changes to deployed migration files.

## 2. Import the GitHub repository in Vercel

1. Sign in to Vercel using the GitHub account that can access `priyagupta333/CityScout`.
2. Select **Add New → Project**, then import that repository.
3. Set the production branch to `main`.
4. Choose **Next.js** as the framework preset.
5. Use repository root `./`. The published repository contains the app directly at its root; do not enter `galli-app`.
6. Set Node.js to **22.x**.
7. Use install command `npm ci`, build command `npm run build`, and leave Output Directory at the Next.js default. Do not enter `dist` or choose a static export.

## 3. Add server environment variables before deploying

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Your Neon pooled PostgreSQL connection string |
| `MODERATION_KEY` | Your private Curator Desk passphrase |

Set the variables for **Production**. If you enable Preview deployments, preferably use a separate Neon branch/database for Preview and apply `npm run db:setup` to that database too. Only enable Preview access to the production database if you intentionally want preview visitors to use production records.

Do not use `NEXT_PUBLIC_DATABASE_URL` or `NEXT_PUBLIC_MODERATION_KEY`. Do not put these values in `vercel.json`. Environment changes require a new deployment to take effect.

Click **Deploy**. Vercel hosts both the frontend and `/api/*` functions; a separate Render backend is not needed. `vercel.json` selects the standard Next.js build and an eastern US function region near the existing Neon database.

## 4. Verify the deployed URL

- Open the home page at wide and narrow widths; search for a known venue and check all three discovery views.
- Create an account, save a place and a plan, sign out and back in, and confirm the library persists.
- Submit a local tip. Open Curator Desk with `MODERATION_KEY`; the note must be pending there.
- Approve the note and verify it appears publicly after refresh. Reject it and verify it disappears.
- Approve a Local verification and check that only approved verification changes the Gem Score.
- Check a station route and the Google Maps handoff.

Automated checks for local production-server verification:

```powershell
npm test
npx tsc --noEmit
npm run build
npm start -- --port 3001
```

In a second terminal, using the same checkout and `.env.local`:

```powershell
$env:APP_URL = 'http://localhost:3001'
npm run test:local
```

The integration test creates temporary account and submission records in the configured database, exercises the actual API, and deletes only its own records afterward. Do not run it against an unrelated server or database. It expects HTTP localhost; production HTTPS cookies are checked separately.

## 5. Updates and existing local records

After Git integration, pushing `main` triggers a production deployment. Database migrations are explicit: run `npm run db:setup` with the intended production `DATABASE_URL` when schema changes are introduced. The Vercel build does not run database migrations automatically.

Local `.wrangler/state` records remain on your laptop. They are not included in Git or uploaded to Neon automatically. Guest lists also remain browser/origin-specific; signing in and saving to the account enables server persistence. Accounts created in the new Neon database are available to the deployed site using that same database.

For this setup, the existing local records were additionally imported into Neon: two accounts, two sessions, one saved library, three contributions and one audit record. Source D1 records were left unchanged. The optional `node scripts/import-local-d1.mjs` performs an additive import with parameterized values and one transaction; records with matching primary keys are preserved. An email conflict aborts the import instead of overwriting an account. Run it only from the original checkout containing the intended local database, not a fresh clone.

If a connection string has been shared outside your password manager/environment settings, reset the database role password in Neon, update local and Vercel `DATABASE_URL` values, and redeploy.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Database unavailable | Add server-side `DATABASE_URL`, check the Neon endpoint, and redeploy |
| Relation does not exist | Run `npm run db:setup` against the same database URL used by Vercel |
| Curator access denied | Check `MODERATION_KEY` in the deployed environment and redeploy |
| Submission not public | Approve it in Curator Desk; pending notes are deliberately private |
| Build tries Cloudflare/Wrangler | Deploy the latest `main`, with Next.js preset and `npm run build` |
| Data differs between preview and production | Check whether they use separate Neon branches |

References: [Vercel environment variables](https://vercel.com/docs/environment-variables), [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver).
