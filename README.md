# Flight Search

A single-page flight-search app built for the Journey Mentor frontend assignment. Search for
flights via the [Duffel](https://duffel.com) sandbox API, then sort, filter, and browse nearby
departure dates — with the whole session surviving a reload.

**Live demo:** _(deployed on Vercel — URL in the submission)_

## Features

**Core**

- Search form with origin/destination, departure + optional return date, traveller count and
  cabin class — validated before anything is sent.
- Results list with airline, departure/arrival times, total duration, stops and price, plus
  explicit loading (skeletons), empty, and error states.
- Sorting by price and total duration.
- Filtering by stops (nonstop / 1 / 2+) and price range.
- Offer details expanded in place: per-segment times, aircraft, cabin, baggage allowance,
  layover durations, fare brand and change/refund conditions.
- Shifting date window: a ±3-day strip around the active departure date. Each date's results are
  cached per search, so browsing back and forth is instant; only uncached dates trigger a request.
- Persistence: the current search, its results, filters and sort order are restored after a reload.
- Responsive layout from mobile (filters in a bottom sheet) to desktop (sticky filter sidebar).

**Bonus (all four)**

- Debounced origin/destination autocomplete backed by Duffel place suggestions, with full
  keyboard support (WAI-ARIA combobox pattern).
- Sorting by departure time.
- Filtering by departure time window.
- Persisted search history (last 10 searches, one click to re-run).

**Extras**

- Airline filter (listed as a bonus under filtering in the brief).
- Stale-offer handling: Duffel offers carry an `expires_at`; expired results get a
  "refresh to get current prices" banner instead of being silently trusted or discarded.
- 54 unit tests over the pure logic (parsing, formatting, filtering, sorting, persistence codecs,
  API normalization).

## Running locally

Requires Node 20+.

```bash
npm install
cp .env.example .env   # then paste your Duffel sandbox token into .env
npm run dev
```

Create a free sandbox token at [app.duffel.com](https://app.duffel.com) under
**Developers → Access tokens** (starts with `duffel_test_`). The token lives only in the
gitignored `.env` file — never commit it.

> Sandbox note: searches return Duffel's test airline ("Duffel Airways") with synthetic schedules
> and prices. Known-good routes to try: LHR → JFK, LON → NYC.

Other scripts:

```bash
npm test            # Vitest unit suite
npm run typecheck   # vue-tsc over app + node/api code
npm run lint        # ESLint (vue + typescript + prettier)
npm run build       # production build
```

## The CORS constraint

Duffel deliberately blocks browser calls (no CORS headers), because a browser call would expose
the access token. The app therefore never talks to `api.duffel.com` directly — it only calls
relative `/api/duffel/*` paths, and a thin server-side proxy injects the credentials:

- **Development:** the Vite dev server proxies `/api/duffel/*` → `https://api.duffel.com`
  ([vite.config.ts](vite.config.ts)), adding the `Authorization` and `Duffel-Version` headers
  server-side.
- **Production:** two Vercel serverless functions, one per endpoint
  ([api/duffel/places/suggestions.ts](api/duffel/places/suggestions.ts) and
  [api/duffel/air/offer_requests.ts](api/duffel/air/offer_requests.ts)). Because Vercel's zero-config
  `/api` routes only by concrete file path, allowlisting is enforced by the filesystem: only these
  two paths exist, so the URL can't be abused as an open Duffel proxy. Each function is
  self-contained (no cross-module imports — the project is ESM, and a Vercel function importing from
  outside `/api` fails to resolve at cold start). Neither forwards client headers, and both pass
  Duffel's status codes and error envelope through verbatim so the frontend handles one error shape
  everywhere.

The token is read from `DUFFEL_ACCESS_TOKEN` **without** a `VITE_` prefix on purpose: Vite only
inlines prefixed variables into the client bundle, so the token cannot end up in shipped JS. Same
env var name locally and on Vercel, and the frontend code path is identical in both environments.

## Key decisions & trade-offs

**TypeScript** — used throughout, in strict mode. A search result flows through normalization,
filtering, sorting, persistence and rendering; typed models catch shape mistakes at the boundary
instead of at runtime. The Duffel wire types live in [src/api/duffel/types.ts](src/api/duffel/types.ts)
and never leak past the API layer.

**Pinia (with composables where they fit better)** — the search domain (params, per-date results
cache, filters, sort) is one reactive dependency graph consumed by the form, the results list, the
filter panel and the date strip. A store gives that shared state a single owner, devtools
visibility, and a natural single entry point for the race-condition guards. Concerns that are
*not* shared app state stayed composables: `usePlaceSuggestions` (debounced autocomplete data) and
`useSearchFormValidation`. Store getters are one-liners over pure functions in
[src/lib/offersView.ts](src/lib/offersView.ts), which is where the unit tests bite.

**Normalize at the API boundary** — raw Duffel offers are 20–50 KB each of deeply nested JSON.
[mapOffer.ts](src/api/duffel/mapOffer.ts) reduces each to a ~1–2 KB domain object (amounts parsed
from strings, ISO-8601 durations parsed to minutes, baggage counted per segment). Rendering,
filtering and localStorage all get simpler and faster; the trade-off is a mapping layer to
maintain, which the fixture-based spec covers.

**Race handling** — two guards. A *generation counter* invalidates every in-flight request when
the search identity changes (any param except the departure date — see
[searchKey.ts](src/lib/searchKey.ts)); per-date `AbortController`s cancel superseded requests for
the same date. Abort errors are never written into UI state. Rapid date-chip clicking or
re-submitting mid-flight can't interleave stale results.

**Date window = per-date cache** — results are cached per departure date under the current search
key (LRU-capped at 9 dates, 15-minute freshness TTL). Deliberately **no prefetching** of
neighbouring dates: 7 parallel offer requests per search would hammer the sandbox rate limit and
slow the primary result down; chip prices fill in as the user actually browses.

**Persistence** — versioned localStorage keys (`fs:v1:*`) with runtime validation on load, so a
schema change or corrupt data degrades to a clean start instead of a crash. Persisted offers are
capped (50 cheapest per date, 9 dates ≈ well under quota); on `QuotaExceededError` it retries with
params only. Restored offers past their `expires_at` show the refresh banner rather than being
silently shown as bookable.

**Local wall-clock times** — Duffel returns `departing_at`/`arriving_at` as zone-less local
strings. They are displayed by string slicing, never round-tripped through `Date` (which would
shift them into the viewer's timezone). Durations come from Duffel's ISO-8601 `duration` field;
layovers are diffed as same-airport wall clocks. See [src/lib/datetime.ts](src/lib/datetime.ts).

**Zero runtime dependencies beyond Vue + Pinia** — validation, debounce, the combobox and the
bottom sheet are hand-rolled (~60 lines each). For this scope, libraries would add more surface
area than they remove; the assignment also caps styling to Tailwind only.

## What was skipped, and why

- **Booking flow / seat maps / ancillaries** — out of scope; the brief covers search only.
- **Multi-city and child/infant passengers** — the form models one adult count and up to two
  slices (outbound + optional return). The API layer already builds slices as a list, so
  extending is mechanical, but the UI would have grown well past the two-day budget.
- **Component tests** — the trickiest UI logic (filtering, sorting, normalization, persistence,
  duration/time math) is extracted into pure modules and unit-tested there; component specs would
  mostly re-test Vue itself. With more time: a few Testing Library specs for the combobox
  keyboard interaction and an E2E smoke test.
- **Virtualized result lists** — sandbox searches return well under a thousand offers; the capped
  list renders fine without the complexity.

## Deploying (Vercel)

1. Import the repo in the Vercel dashboard (framework preset: **Vite** — auto-detected).
2. Add an environment variable `DUFFEL_ACCESS_TOKEN` = your `duffel_test_…` token.
3. Deploy. The SPA is served statically and `/api/duffel/*` is handled by the serverless proxy.

## Project structure

```
api/duffel/                Vercel serverless proxy (the production CORS workaround)
  places/suggestions.ts    GET  proxy → Duffel /places/suggestions
  air/offer_requests.ts    POST proxy → Duffel /air/offer_requests
src/
  api/                    fetch wrapper + Duffel client, wire types, offer normalization
  components/
    ui/                   five small primitives (button, field, badge, spinner, empty state)
    search/               search form, autocomplete combobox, search history
    results/              results orchestration, date strip, sort bar, filters, skeletons
    offer/                offer card, slice summary, expanded details, segment rows
  composables/            usePlaceSuggestions, useSearchFormValidation
  lib/                    pure logic: durations, wall-clock datetimes, money, filter/sort,
                          search identity, localStorage codecs
  stores/                 searchStore (cache + race guards), historyStore
tests/                    Vitest specs for lib/, the offer mapper and persistence
```
