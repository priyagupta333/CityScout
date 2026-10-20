# Personalised discovery, student budgets and smart itineraries

## Try the connected flow

1. Enter as a guest or sign in and open **Plan my day** from the navbar. This dedicated page contains the personalised finder, Student Budget Mode and mini-itinerary flow.
2. Select Quiet, Adventurous, Aesthetic or Social, choose Solo/Friends, and set your starting station. An optional area restricts results to matching catalog text.
3. Set a per-person budget, available time and supported travel estimate. Turn on Student Budget Mode for free/100/300 presets and study-break or parks/views discovery. Free outings select walking; no paid transit is represented as free.
4. Choose **Find my matches** for scored recommendations, or **Make my day under ...** to select a feasible outing automatically.
5. Select one to four stops. The combined estimated outing must fit both budget and time before the finder opens an itinerary. If only one stop fits, it can be opened as a single-stop plan.
6. Review the itinerary, map, visit durations, spending breakdown and return directions. Add/remove stops and optimise the order. Editing a plan can exceed its original constraints; budget/time warnings then block a new save until corrected.
7. Save to your guest or account library, or share the URL. Travel mode and supplied budget/time limits are preserved. Existing one/two-stop plans remain compatible.

## Transparent matching

Vibe-tag suitability contributes up to 40 points, solo/friends tag suitability up to 20, budget headroom up to 20, and proximity up to 20. Text-based vibe/companion matches are heuristic suggestions, not verified atmosphere or access claims. Budget upper bound, time including return travel, area, selected student category and known closure reports are hard constraints. Changing answers requires refreshing the shortlist.

The percentage is a compatibility index, not a probability, statistical confidence or trained AI model output. **Gem Score is separate** and retains its current sample-rating/verification formula. Open **How matching works** for the rule explanation. No external AI API is used.

## Itinerary logic

For up to four distinct selected places, `orderStops` enumerates every ordering and chooses the lowest estimated complete-trip duration that fits the supplied budget/time limits, including return travel. If no ordering fits, the fastest ordering is returned for the UI to flag as over the limits. Ties retain the original order. Automatic day selection greedily considers ranked candidates, retaining additions only when the estimated complete outing remains within the user's caps; it does not claim a globally optimal selection of all catalog places.

Rail mode reuses the existing schematic corridor model, walking allowances and fare estimates. Walking-only mode uses straight-line coordinate distance with a 1.3 detour multiplier and 15 minutes/km. The itinerary now uses Leaflet with OpenStreetMap street tiles, numbered destination pins, place names, zoom/fit controls and a text fallback. It draws no invented walking route. Map tiles require a network connection; navigation links and the stop list remain usable if tiles fail. External Google Maps links hand off each leg and the return for actual navigation. Walking routes include at most three intermediate waypoints so four stops work within mobile browser limits. Transit navigation opens per leg because transit waypoints are unsupported. No real-time routing, traffic, service status, current fares or opening-hours API has been added. Stop details now expand inside the itinerary instead of discarding the plan. GEM badges use the same approved community verification inputs as discovery. Zero total spending displays as INR 0 rather than a venue entry-fee label.

## Thrift and student information

Student mode provides area-specific external thrift/vintage map searches and a suggestion form routed into existing moderation. It also presents Chor Bazaar as a vintage discovery lead, supported by [Incredible India's Mumbai guide](https://www.incredibleindia.gov.in/en/maharashtra/mumbai), reviewed 20 October 2026. This establishes the broad vintage-market description, not current shop hours, inventory or prices. No verified student discounts or curated thrift inventory are currently available; shopping purchases are excluded from the current catalog itinerary model and explicitly labelled.

## Storage and compatibility

No database migration is needed. Existing serialized plan records gain optional travel mode and budget/time fields. Both local library cleaning and `/api/library` validation support one to four unique catalog IDs and validate optional fields. A missing mode defaults to transit. Older share links work; newer links include all stop IDs, origin and travel mode, plus optional caps. Near-me shares use a station approximation rather than storing precise origin coordinates.

## Verification

`npm test` includes matching, strict constraints, free walking, student filtering, four-stop ordering and costs, alongside the existing catalog, Gem Score and 576 rail-pair checks. `npm run test:local` exercises actual account-library persistence for four stops and rejects duplicate/five-stop plans and unsupported travel modes. Use the normal typecheck, lint and production-build checks as well.
