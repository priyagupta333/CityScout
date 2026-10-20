# Final audit — 20 October 2026

Validated the local Next.js application against its configured Neon database. Applied the same source fixes to galli-app and CityScout-publish.

## Fixes
- All four JSON write endpoints now reject null, arrays and scalar payloads with HTTP 400 instead of allowing property-access exceptions.
- Local saved-library normalization tolerates null data and discards invalid saved-plan sizes/timestamps.
- Curator Desk no longer refers to legacy .dev.vars configuration; denied access clears the previously loaded queue.
- Passphrase edits and manual refresh are disabled during moderation. Success messages report the moderation decision without claiming a failed refresh succeeded.
- Long community text wraps within cards; moderation buttons wrap on narrow layouts; reduced-motion preferences are respected.

## Verification
- npm test: passed, 30 places, image assets, search, strict filters, score calculation, approved-only boosts, 24 stations and all 576 station pairs.
- npm run test:local: passed with real Neon storage, including signup, incorrect password, session restore, saved-plan persistence, signout/signin, origin rejection, six-note limit, duplicate verification rejection, moderator authorization, approval/publication/rejection and immediate feed synchronization. Temporary test rows were cleaned up.
- Added regression coverage for null, array and scalar request bodies on all four write endpoints; passed.
- npx tsc --noEmit: passed.
- npm run build: passed, including production TypeScript and all page generation.
- Browser spot checks: narrow discovery layout, readable Curator Desk form and corrected guidance, map view rendering with station and place controls.
- git diff --check: passed in publishing checkout.

## Limits
This is a local source/database audit, not verification of an externally deployed installation. No deployment was performed. Browser checks were focused spot checks, not exhaustive device/browser testing. Existing lint warnings concern raw img elements and potential image optimization; no lint errors were found in the initial full check. Catalog prices, times and ratings remain explicitly illustrative.
