# Changelog

## [0.2.5] - 2026-09-10

Fixes two request-routing defects found while migrating IndieGoWeb's live trading workflows
(`investing-private`) off hand-rolled HMAC signing onto this node's `Freedom24Api` credential —
until now this package had never actually been wired into a workflow, only installed for its
credential type.

1. **Wrong host for every request.** `transport/request.ts` (and the credential's own `test`
   probe) hardcoded `tradernet.com`. Every proven-live call in `investing-private`'s production
   system — reads and writes alike — has always gone through `freedom24.com/api/{command}`; reads
   happen to work on either host, but the write path was unverified. `BASE_URL`/`V2_BASE_URL` now
   point at `freedom24.com`. `transport/session.ts` and `methods/credentialTest.ts` (both User
   Login-only, unrelated to the API Key HMAC path) are deliberately left on `tradernet.com` —
   no live evidence either way for that cookie-session endpoint.
2. **Wrong command name for cancel.** `actions/order.ts`'s `cancel`/`bulkCancel` sent
   `deleteOrder`, which isn't a real Tradernet command — confirmed against Tradernet's own API
   reference ("Cancel Order" section: *"The method command delTradeOrder"*). Now sends
   `delTradeOrder`, matching what `investing-private`'s own T10 workflow has always used.

Both were also wrong in the offline test suite's own assertions (which is how they went
unnoticed — the suite never makes a network call). Updated alongside the fix; all 121 tests pass.

## [0.2.4] - 2026-08-26

Converts `Freedom24Api` (API Key) credential testing from a custom `testedBy` function to a
declarative `test:` + function-based `authenticate` on `Freedom24Api.credentials.ts`, reusing the
existing `signPayload`/`buildApiKeyHeaders` helpers unchanged — no change to how the node signs
real requests at runtime, only to how the credential's own "Test" probe is wired.

This was verified against the live Tradernet API 2026-08-26, not assumed: a bad public key and a
bad signature both come back as a real HTTP 403 with `{"error": "..."}`, not Tradernet's usual
"200 with the failure in the body" shape — so the declarative test's default non-2xx check is a
genuine credential check, not a weaker one. `Freedom24UserApi` (User Login) was checked the same
way and is **not** converted: a deliberately wrong login/password still comes back HTTP 200 with
`{"error": "Incorrect email or password"}` and a session cookie is issued either way, so only body
inspection catches it, and n8n's declarative `ICredentialTestRequest.rules` can only match a status
code or an exact body key/value — it stays on `methods.credentialTest.freedom24UserApiCredentialTest`
with `this.helpers.request`, the one remaining `no-deprecated-workflow-functions` finding from the
portal's scan (see 0.2.2's note — confirmed to have no non-deprecated alternative in this n8n
version).

## [0.2.3] - 2026-08-25

No functional changes. Republished via the GitHub Actions workflow so this version carries an npm
provenance attestation — required for n8n Creator Portal verification submission, which the manual
bootstrap publish (0.2.2, needed to create the new scoped package identity before trusted
publishing could be configured for it) can never satisfy since provenance can only be generated
inside GitHub Actions' OIDC environment.

## [0.2.2] - 2026-08-25

Renamed the published package from `n8n-nodes-freedom24` to `@indiegoweb/n8n-nodes-freedom24`
(scoped, matching `@indiegoweb/n8n-nodes-beehiiv`). No functional changes to the node itself.
The unscoped `n8n-nodes-freedom24` package on npm is deprecated in favor of this one — npm has no
package rename, so this is a new package identity, not an update to the old one. If installed via
n8n's Community Nodes UI/API (not the `~/.n8n/custom` dev-loader path — that always registers as
`CUSTOM.freedom24` regardless of package name), the old install must be removed and reinstalled
under the new scoped name; the node's type string changes from `n8n-nodes-freedom24.freedom24` to
`@indiegoweb/n8n-nodes-freedom24.freedom24` accordingly.

Also addresses n8n Creator Portal review findings from the original (unscoped) submission, verified
against a fresh `npx @n8n/scan-community-package` run and the portal's own ESLint config
(`@n8n/eslint-plugin-community-nodes`), which are stricter than this repo's own `npm run lint`:

### Fixed
- `require-node-api-error`: every catch-all error rethrow (`Freedom24.node.ts` x2, `router.ts`)
  now goes through `NodeApiError` instead of a bare `throw error` — a no-op passthrough for an
  already-`NodeApiError` (its constructor returns that exact instance unchanged), and a
  message/description-preserving rewrap for anything else, instead of losing HTTP context.
- `helpers/parse.ts`'s `JsonParamParseError` domain-error class is gone; `parseJsonParam`/
  `parseJsonArrayParam` now take `(node, itemIndex, ...)` and throw `NodeOperationError` directly,
  from outside the `catch` block that wraps `JSON.parse` (the portal's linter flags any non-
  `NodeApiError`/`NodeOperationError` thrown from inside a catch clause, even a domain error meant
  to be translated by a caller). `router.ts` no longer needs to translate this error type.
- `valid-peer-dependencies`: `peerDependencies.n8n-workflow` corrected from `">=2.1.0"` to `"*"`,
  per the portal's current requirement.

### Known, not fixed
- `no-deprecated-workflow-functions` still flags `this.helpers.request` (deprecated) in
  `methods/credentialTest.ts`. Confirmed via `n8n-core`'s own `CredentialTestContext` source
  (checked against the latest published `n8n-core@2.16.1`) that `ICredentialTestFunctions.helpers`
  genuinely has no `httpRequest` — `request` is the only HTTP method available in a `testedBy`
  credential-test function, in any current n8n version. Switching to a declarative `test:` block
  would avoid the deprecated call, but Tradernet returns HTTP 200 even on failed auth (the error
  lives in the JSON body, or in a missing `Set-Cookie` header for User Login) and n8n's declarative
  `ICredentialTestRequest.rules` can only match a status code or a body key/value — it can't express
  either check reliably, which is exactly the "always passes" bug 0.2.0 fixed by moving to real
  `testedBy` functions in the first place. Left as-is; flagged for the portal reviewer as a platform
  limitation rather than worked around.
- "Missing credential test" from the original submission looks stale: both credentials are already
  wired to real `testedBy` functions, and a fresh scan of the current source tree does not raise
  `credential-test-required` (it explicitly accepts `testedBy` as an alternative to a declarative
  `test:` property).

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
