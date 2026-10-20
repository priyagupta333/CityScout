# ApnaShehar

**ApnaShehar — apna shehar, har gali mein ek nayi kahani.**

Mumbai discovery and outing planning, built by CtrlFreaks for Techformers 2026. This repository retains the original CityScout repository name; the application brand is ApnaShehar.

## Quick start

```powershell
git clone https://github.com/priyagupta333/CityScout.git
cd CityScout
npm ci
```

Create a file named `.dev.vars` in the repository root with your own private value:

```dotenv
MODERATION_KEY=replace-with-your-own-private-passphrase
```

Then run `npm run dev`. Do not commit `.dev.vars`. No shared administrator password is distributed in this repository.

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
| `db/`, `drizzle/` | D1 schema, migrations and migration metadata |
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

The Curator Desk uses the `x-apnashehar-admin-key` header. A contribution is saved in D1 immediately as `pending`, so it will not appear publicly until approved. The moderation queue returns at most 200 submissions; the public feed returns at most 100 approved notes.

## Data ownership and persistence

The place catalog is bundled TypeScript data. Accounts, sessions, signed-in libraries, submissions and moderation audit records live in D1. Guest lists live in browser storage and are specific to that browser/origin. Local D1 files are stored under the ignored `.wrangler/state` directory; cloning this repository creates a fresh database after migrations, without another developer's accounts or notes.

Database tables are `contributions`, `moderation_audit`, `explorer_users`, `explorer_sessions` and `explorer_library`. Keep migration SQL and metadata together. After schema changes, run `npm run db:generate`, inspect the generated SQL, then apply it with `npm run db:setup` for local development.

## Deployment status

The checked-in configuration is for **local development**, with a placeholder D1 database ID. `npm start` previews a built application locally; it is not a production hosting command.

For Cloudflare Workers, configure a real remote D1 database bound as `DB`, apply the SQL migrations remotely, configure `MODERATION_KEY` as a production secret, and deploy the worker and static assets. Local database contents are not uploaded automatically. Export/import data explicitly if you need to preserve local records.

For Vercel or Render, first adapt the Cloudflare-specific runtime imports and database binding. Vercel needs a hosted database such as PostgreSQL; a writable local SQLite file is not persistent shared storage there. Render can use a hosted database or, on a paid service, SQLite on a persistent disk after backend adaptation. This repository does not claim a ready-to-use Vercel or Render deployment configuration.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Account storage unavailable | Run `npm run db:setup`; verify the `DB` binding |
| Curator access denied | Set `MODERATION_KEY` in `.dev.vars`, restart the server, and enter that exact value |
| Submitted note not public | Open Curator Desk and approve the pending submission |
| No search results | Clear restrictive mood, budget, time or hidden-gem filters |
| Saved guest list missing on another device | Sign in to use the database-backed account library |
| Database empty after deployment | Local and remote databases are separate; apply remote migrations and explicitly migrate records |

## Development and contribution notes

Preserve strict filters, explicit sample-data labels, readable contrast and responsive layouts when changing the UI. Validate changes using the checks below. Do not upload dependency folders, local databases, session data, credentials, ZIP backups or generated build outputs.

The initial Git history imports the existing application in 50 commits grouped by source area and documentation. These commits describe an import of the current snapshot, not 50 separately developed releases. No project-wide open-source license is declared; retain bundled third-party notices, including `build/sites-vite-plugin.LICENSE`.

A Mumbai discovery app for small budgets and free afternoons. Explore 30 places from 24 railway stations plus a Powai road origin, search neighborhoods and venues, rank by Gem Score, switch between grid, street walk and railway map views, and build one- or two-stop outings. The existing mini-plan flow is retained; there are no preset trails.

## Run locally

Requires Node.js 22.13 or newer.

```powershell
npm ci
npm run dev
```

Open the local address printed by the server, normally http://localhost:3000. The `predev` script applies outstanding database migrations automatically. Local Cloudflare D1 data persists in `.wrangler/state` across restarts. `npm run db:setup` can also be run independently and is safe to repeat. The local configuration is in `wrangler.local.json`; this command never targets a remote database.

For the curator desk, set a private `MODERATION_KEY` in the ignored `.dev.vars` file. Hosted installations need the same secret and all SQL migrations applied to their D1 binding before account features are used.

## Working flows

- Guests can discover, plan, contribute and keep a device-local list. Existing saved places from the previous brand migrate automatically.
- Accounts live in D1. Passwords use salted PBKDF2/SHA-256, with expiring HttpOnly session cookies. Sign-out invalidates the server session.
- Each account has its own saved places and plans in D1. Guest lists remain separate. Account lists reload after sign-in, with a local fallback and retry on reconnection. Simultaneous account edits use the latest written list.
- Search covers venue names, areas, stations, moods, subtitles and tags. Budget uses the upper estimated trip cost; time includes the visit and return travel. Filters never silently relax.
- Contributions are pending until reviewed, with a six-per-day device-session limit. Approval publishes a note. Closed/restricted reports remove places from discovery; rejecting those reports restores them. Public updates refresh on window focus and every 30 seconds.
- Saved plans restore the starting station. Shared URLs open the selected place or plan. First- and second-stop directions have separate Google Maps handoffs.
- All pages and authentication panels share warm white, green and terracotta styling, with responsive layouts and visible mobile search.

## Gem Score and the railway map

`lib/gem-score.ts` ranks places using `rating × 20 × (1 − crowd penalty) × verification boost`, capped at 100. Crowd penalty is `min(0.55, 0.30 + 0.25 × log10(review count) / log10(2400))`. The boost adds 6.67% per sample or approved verification, up to 20%. Scores of 55+ qualify for the hidden-gem filter. Every score opens an explanation with its inputs.

Ratings, review counts and seeded verification signals are **sample data**, not live Google reviews. Real moderator-approved “Local verification” contributions are counted separately. Pending, rejected and ordinary local tips do not affect scores. A browser session can have only one active verification per place; the existing daily limit still applies. Approval/rejection updates the moderator's discovery state immediately; other windows refresh on focus or every 30 seconds.

`lib/rail.ts` models connected Western, Central and Harbour corridors with 24 schematic stations. Choose a station by mouse or keyboard, select a place marker, toggle rail lines, or zoom. Routes account for line changes and are reused in the plan builder and time estimates. Powai connects by road to Kanjurmarg; Karnala requires a separate road allowance from Panvel. The diagram omits intermediate stations and is **not to scale or a live timetable**. All fares and travel durations are sample estimates, with route handoff to Google Maps.

## Catalog and imagery

The 30-place catalog retains the existing 22 entries and adds Five Gardens, Shivaji Park, Kamala Nehru Park, Sewri Fort, Durgadi Fort, Karnala Bird Sanctuary, Jewel of Navi Mumbai and Sagar Vihar. New entries use labelled original SVG illustrations and reference links; existing listings retain their photos and available credits.

Prices, opening hours, accessibility, seating and travel times remain **illustrative or unverified**. This pilot has no live routing, fare or availability data. Check venue sources before traveling. Existing photo rights and credits also need review before public release.

## Checks

```powershell
npm test
npm run test:local
npx tsc --noEmit
npm run lint
npm run build
```

`test:local` requires a running local server and moderator key. It tests real D1 account creation, password rejection, session restore, saved-plan persistence, origin validation, contributions, rate limiting, moderation and publication/rejection. It cleans up only its own records.

Catalog tests check IDs, station references, image files, suggested pairs, search, strict budget/time limits, closed-place exclusion, Gem Score ordering, hidden-gem filtering, approved-only boosts, origin handling, plan estimates and all 576 railway station pairs. Local API tests also check duplicate-verification rejection.

## Stack

React / TypeScript, Vinext with Next-compatible routing, Tailwind CSS, Cloudflare D1, Drizzle migrations, OpenStreetMap embeds and Google Maps links. No external map or AI API key is required.
