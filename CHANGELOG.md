# Changelog

## [0.2.1] - 2026-08-25

No functional changes. Republished via the new GitHub Actions workflow so this version carries an
npm provenance attestation — required for n8n Creator Portal verification submission, which a
locally-published version (0.2.0) can never satisfy since provenance can only be generated inside
GitHub Actions' OIDC environment.

## [0.2.0] - 2026-08-23

### Fixed
- Login posted a JSON body; Tradernet's API requires `application/x-www-form-urlencoded`. User
  Login authentication was broken outright.
- Tradernet returns HTTP 200 with `{error}`/`{errMsg}` bodies on failure — never inspected before,
  so a rejected order or a bad request looked like a success. The transport layer now raises on
  either signal, including a plain non-2xx status with no JSON error body.
- `order.place` accepted a limit order with no price validation.
- `quote.search` rendered a Limit field that was never sent to the API.
- Unguarded `JSON.parse` on the JSON-string parameters threw a bare `SyntaxError` with no item
  context.
- `order.bulkCancel` used `Promise.all`, so one failing cancellation discarded every other result.
- `history.getCashflows` could throw — `From`/`Till` were read unconditionally for the whole
  History resource, but aren't displayed for that operation.
- `dynamic.call`'s mutation-safety gate was a 6-keyword substring match with real gaps (`cancel*`,
  `remove*`, `create*`, `set*`, `save*`, `edit*` all bypassed it unconfirmed).
- `watchlist.update` could fail if Name/Picture were left blank; it now backfills both from the
  current record.
- `watchlist.update`/`addTicker`'s `index` field was gated behind a check that could never be
  false, silently repositioning entries on every call. Documented and left intentional.
- An unmatched resource/operation fell through to `undefined` instead of a clear error.
- A login failure wasn't covered by Continue On Fail.
- No output item carried `pairedItem`.
- Both credentials shared one unauthenticated, always-passing connection test.
- Read-only commands and `dynamic.call` 404'd against the v1 API with no fallback.
- `dynamic.call`'s mutation-safety heuristic still under-blocked real Tradernet verbs (`buy`,
  `sell`, `close`, `confirm`, `reject`, `withdraw`, `transfer`, `convert`, `exercise`), letting a
  real mutation through unconfirmed.
- `watchlist.update` fired a live API call to backfill Name/Picture before the Dry Run check —
  `dryRun: true` still touched the network when those fields were left blank.
- Login failure detection only checked the response body's `error` field, missing `errMsg` (both
  are valid Tradernet failure signals); a non-JSON login response could also crash with a raw
  `SyntaxError` instead of a clean error.
- The session cookie regex could match inside another cookie's name ending in "SID" (e.g.
  `PHPSESSID`), extracting the wrong session value.
- `filtersJson`/`sortJson` that parsed as valid JSON but not an array were silently dropped
  instead of raising a clear error.
- `history.getTrades`/`fx.getRates` date parameters were truncated to a calendar date using a
  naive UTC split, ignoring the workflow's configured timezone — could be off by a day.
- `quote.get` with Simplify on returned the entire raw API envelope instead of an empty result
  when a ticker had no matching quote record.

### Added
- Ticker is now a searchable `resourceLocator` (raw string entry stays the default).
- A `Simplify` toggle (on by default) unwraps Tradernet's response envelope and returns one item
  per record for Portfolio, Quote, and Order/Watchlist list operations.
- Real credential tests (an HMAC-signed probe for API Key, an actual login attempt for User Login).
- A Vitest unit test suite (offline, no live API calls) and GitHub Actions CI.

### Changed
- Split the single 1,555-line node file into `descriptions/`, `actions/`, `transport/`, and
  `helpers/` modules.

## [0.1.0] - 2026-04-14

### Added
- Initial release: Freedom24/Tradernet n8n community node
- Portfolio, Quote, Order, Market, Watchlist, Security, History, Alert, FX, Dynamic resources
- API Key (HMAC) and User Login (session) authentication
- `usableAsTool: true` for AI agent compatibility
- Dry run and confirm safety flags on all mutating operations
