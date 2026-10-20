# CityScout

**CityScout — apna shehar, har gali mein ek nayi kahani.**

Mumbai discovery and outing planning, built by CtrlFreaks for Techformers 2026. The application and repository are both named CityScout.

**Hosting:** Standard Next.js + Neon PostgreSQL, ready for Vercel configuration. See [the deployment guide](docs/DEPLOYMENT.md) for exact settings and environment variables.

## Quick start

```powershell
git clone https://github.com/priyagupta333/CityScout.git
cd CityScout
npm ci
```

Create `.env.local` from `.env.example` and fill in your private values:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
MODERATION_KEY=replace-with-your-own-private-passphrase
```

Then run `npm run db:setup` followed by `npm run dev`. Do not commit `.env.local`. No shared administrator password is distributed in this repository.

## Repository guide

| Path | Purpose |
| --- | --- |
| `app/ui.tsx` | Discovery, authentication, saved library, planner and curator interface |
| `app/globals.css` | Theme, typography and responsive layouts |
| `app/api/` | Account, saved library, contribution, moderation and public community endpoints |
| `components/rail-map.tsx` | Interactive schematic railway map |
| `components/ui/` | Reusable interface primitives |
| `hooks/use-library.ts` | Guest storage and signed-in library synchronization |
| `lib/places.ts`, `lib/more-places.ts` | Place catalog, metadata and estimates |
| `lib/discovery.ts`, `lib/gem-score.ts` | Search, filtering and ranking |
| `lib/rail.ts`, `lib/plan.ts` | Railway graph, routing and outing estimates |
| `db/`, `postgres/` | PostgreSQL schema, query adapter and versioned SQL migrations |
| `public/` | Catalog imagery, icons, manifest and service worker |
| `scripts/` | Development setup and automated checks |
| `build/` | Maintained worker/plugin source, not generated build output |

## API overview

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/account` | GET, POST, DELETE | Current account, signup/signin and signout |
| `/api/library` | GET, PUT | Read or replace the signed-in account's saved list and plans |
| `/api/contributions` | POST | Submit a place suggestion, correction, tip or verification for review |
| `/api/community` | GET | Public approved community notes |
| `/api/moderation` | GET, PATCH | List submissions and approve/reject them using the moderator key |

The Curator Desk uses the `x-apnashehar-admin-key` header. A contribution is saved in Neon immediately as `pending`, so it will not appear publicly until approved. The moderation queue returns at most 200 submissions; the public feed returns at most 100 approved notes.

## Data ownership and persistence

The 30-place catalog is bundled TypeScript data. Accounts, sessions, signed-in libraries, contributions and moderation audits live in Neon PostgreSQL. Guest lists live in browser storage and are specific to that browser/origin.

The server reads `DATABASE_URL` and `MODERATION_KEY` from `.env.local` locally, or from Vercel environment variables when deployed. Neither value is exposed as a public environment variable. Queries are parameterized; moderator status and audit changes use a database transaction.

Run `npm run db:setup` once against the intended Neon database. Ordered SQL files in `postgres/` are applied atomically, with checksums recorded in `_apnashehar_migrations`. Repeating setup verifies the schema without deleting data. Add future reviewed migrations as new SQL files; do not edit already-applied files. The five application tables are `contributions`, `moderation_audit`, `explorer_users`, `explorer_sessions` and `explorer_library`.

The old local Cloudflare D1 files under `.wrangler/state` remain untouched and excluded from Git. Those accounts and notes are not automatically copied into Neon. `drizzle/`, `wrangler.local.json`, the Sites build tooling and the `db:setup:d1` command remain legacy references; normal development and production commands now use Next.js and Neon.

During this Neon setup, the existing local accounts, sessions, saved library, contributions and moderation audit were copied additively using `scripts/import-local-d1.mjs`. No source records were deleted. A fresh clone does not need to repeat this import.

## Deploy on Vercel

Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Import `priyagupta333/CityScout`, select Next.js, use root `./`, Node 22.x, install command `npm ci`, and build command `npm run build`. Leave Output Directory at its framework default. Add server-only `DATABASE_URL` and `MODERATION_KEY` before deploying. A separate backend host is not required.

The database has been prepared separately from the Vercel deployment. Builds do not run migrations. Preview deployments should use a separate Neon branch if you want their data isolated from production. New environment values take effect on the next deployment.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Account storage unavailable | Set `DATABASE_URL` and run `npm run db:setup` |
| Curator access denied | Set `MODERATION_KEY` in `.env.local` or Vercel, restart the server, and enter that exact value |
| Submitted note not public | Open Curator Desk and approve the pending submission |
| No search results | Clear restrictive mood, budget, time or hidden-gem filters |
| Saved guest list missing on another device | Sign in to use the database-backed account library |
| Database empty after deployment | Check the deployed `DATABASE_URL`; local D1 records are not automatically imported |

## Development and contribution notes

Preserve strict filters, explicit sample-data labels, readable contrast and responsive layouts when changing the UI. Validate changes using the checks below. Do not upload dependency folders, local databases, session data, credentials, ZIP backups or generated build outputs.

The initial Git history imports the existing application in 50 commits grouped by source area and documentation. These commits describe an import of the current snapshot, not 50 separately developed releases. No project-wide open-source license is declared; retain bundled third-party notices, including `build/sites-vite-plugin.LICENSE`.

A Mumbai discovery app for small budgets and free afternoons. Explore 30 places from 24 railway stations plus a Powai road origin, search neighborhoods and venues, rank by Gem Score, switch between grid, street walk and railway map views, and build outings with up to four stops. There are no preset trails.

## Personalised finder and student outings

The navbar now includes **Plan my day**, a dedicated page for **Find your kind of escape**, Student Budget Mode and smart mini-itineraries. Choose a vibe, solo/friends, starting point, per-person budget, optional area, time and travel mode. Recommendations show a transparent compatibility percentage and reasons, separate from Gem Score. Budget, area, time and closure restrictions are never silently relaxed. This is rule-based personalisation; no AI key is required.

**Student Budget Mode** adds free walking outings, INR 100/300 presets, custom budgets, study-break and park/view discovery. **Make my day** builds a shortlist within combined estimated cost and time. Study-break tags do not establish permission to use a venue as a study space. Thrift discovery includes nearby external map searches, a sourced vintage-market lead and a contribution flow; no unverified discount or stock is represented as available inventory.

Select two to four recommended places, then build an itinerary. All existing place-based plans now support one to four stops, reordering, removal, estimated walking or rail travel, a return leg, per-person spending breakdown, budget/time warnings and save/share restoration. Stop optimisation evaluates every ordering for the selected stops (at most 24). Maps and times are approximate; opening hours are not verified or automatically enforced. See [the feature guide](docs/SMART_DISCOVERY.md).

## Run locally

Requires Node.js 22.13 or newer.

```powershell
npm ci
npm run dev
```

Open the local address printed by the server, normally http://localhost:3000. Run `npm run db:setup` explicitly before first use. It targets the Neon database specified by `DATABASE_URL`, so use the correct environment. It is safe to repeat and does not delete records.

For Curator Desk, set a private `MODERATION_KEY` in ignored `.env.local`. Hosted installations need both server environment variables and PostgreSQL migrations applied before account features are used.

## Working flows

- Guests can discover, plan, contribute and keep a device-local list. Existing saved places from the previous brand migrate automatically.
- Accounts live in Neon PostgreSQL. Passwords use salted PBKDF2/SHA-256, with expiring HttpOnly session cookies. Sign-out invalidates the server session.
- Each account has its own saved places and plans in Neon PostgreSQL. Guest lists remain separate. Account lists reload after sign-in, with a local fallback and retry on reconnection. Simultaneous account edits use the latest written list.
- Search covers venue names, areas, stations, moods, subtitles and tags. Budget uses the upper estimated trip cost; time includes the visit and return travel. Filters never silently relax.
- Contributions are pending until reviewed, with a six-per-day device-session limit. Approval publishes a note. Closed/restricted reports remove places from discovery; rejecting those reports restores them. Public updates refresh on window focus and every 30 seconds.
- Saved plans restore the starting station. Shared URLs open the selected place or plan. First- and second-stop directions have separate Google Maps handoffs.
- All pages and authentication panels share warm white, green and terracotta styling, with responsive layouts and visible mobile search.

## Gem Score and the railway map

`lib/gem-score.ts` ranks places using `rating × 20 × (1 − crowd penalty) × verification boost`, capped at 100. Crowd penalty is `min(0.55, 0.30 + 0.25 × log10(review count) / log10(2400))`. The boost adds 6.67% per sample or approved verification, up to 20%. Scores of 55+ qualify for the hidden-gem filter. Every score opens an explanation with its inputs.

Ratings, review counts and seeded verification signals are **sample data**, not live Google reviews. Real moderator-approved “Local verification” contributions are counted separately. Pending, rejected and ordinary local tips do not affect scores. A browser session can have only one active verification per place; the existing daily limit still applies. Approval/rejection updates the moderator's discovery state immediately; other windows refresh on focus or every 30 seconds.

`lib/rail.ts` models connected Western, Central and Harbour corridors with 24 schematic stations. Choose a station by mouse or keyboard, select a place marker, toggle rail lines, or zoom. Routes account for line changes and are reused in the plan builder and time estimates. Powai connects by road to Kanjurmarg; Karnala requires a separate road allowance from Panvel. The diagram omits intermediate stations and is **not to scale or a live timetable**. All fares and travel durations are sample estimates, with route handoff to Google Maps.

## Catalog and imagery

The 30-place catalog retains the existing 22 entries and adds Five Gardens, Shivaji Park, Kamala Nehru Park, Sewri Fort, Durgadi Fort, Karnala Bird Sanctuary, Jewel of Navi Mumbai and Sagar Vihar. All 30 listings now use photographs. The 14 entries that previously used repeated illustrated placeholders now have locally bundled destination photos, with photographer attribution and licence links in [PHOTO_CREDITS.md](docs/PHOTO_CREDITS.md) and the in-app Photo credits panel.

Prices, opening hours, accessibility, seating and travel times remain **illustrative or unverified**. This pilot has no live routing, fare or availability data. Check venue sources before traveling. Existing photo rights and credits also need review before public release.

## Checks

```powershell
npm test
npm run test:local
npx tsc --noEmit
npm run lint
npm run build
```

`test:local` requires a running local server and moderator key. It tests real Neon PostgreSQL account creation, password rejection, session restore, saved-plan persistence, origin validation, contributions, rate limiting, moderation and publication/rejection. It cleans up only its own records.

Catalog tests check IDs, station references, image files, suggested pairs, search, strict budget/time limits, closed-place exclusion, Gem Score ordering, hidden-gem filtering, approved-only boosts, origin handling, plan estimates and all 576 railway station pairs. Local API tests also check duplicate-verification rejection.

## Stack

Next.js / React / TypeScript, Tailwind CSS, Neon PostgreSQL over HTTPS, parameterized queries, versioned SQL migrations, OpenStreetMap embeds and Google Maps links. No external map or AI API key is required.
