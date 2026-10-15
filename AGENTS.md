# n8n-nodes-freedom24

Published n8n community node (`@indiegoweb/n8n-nodes-freedom24`, npm 0.2.6) for the Freedom24/Tradernet trading API. Works as a workflow node and an AI-agent tool (`usableAsTool: true`). It is the execution venue for the personal trading system (`misc/investing-private`), so real orders move through it.

Belongs to the personal trading entity. This file's facts override the entity and root tiers.

**History & reference (not loaded at start):** `docs/context-history.md` — pre-2026-09-30 detail: the n8n Creator Portal reviewer credential-testing evidence, package-rename/first-publish notes, 2026-09 dependency and audit write-ups.

## Map (non-obvious parts)

- `nodes/Freedom24/Freedom24.node.ts` — description assembly, `execute()` loop (auth, pairedItem, continueOnFail), `methods`.
- `descriptions/` — per-resource properties. Each resource owns its own copies of shared-name fields (Ticker, Confirm, Dry Run) scoped to exactly its operations; one shared field with a show/hide matrix caused the original `displayOptions` leakage bugs.
- `actions/` — one handler per resource plus `router.ts`, the single dispatch point and the only place `PayloadValidationError` becomes a `NodeOperationError` with `itemIndex`.
- `transport/` — `signing.ts` (pure HMAC), `request.ts` (`makeRequest`), `session.ts` (User Login).
- `helpers/` — pure builders/guards (`payloads`, `responses`, `parse`, `ticker`, `guard`, `mutation`); none touch `IExecuteFunctions`, which keeps them unit-testable.
- `credentials/` — `Freedom24Api` (API key + HMAC), `Freedom24UserApi` (session login). `test/` mirrors `nodes/Freedom24/`.

## Commands

- `npm run typecheck` uses `tsconfig.test.json` (covers `test/`); the root `tsconfig.json` covers only `nodes/` + `credentials/` and is what `npm run build` uses.
- Run `rm -rf dist .tsbuildinfo` before `npm run build` when `dist/` exists: the incremental cache can emit zero `.js` files while still printing "Build successful". Confirm with `find dist -name "*.js" | wc -l`.
- Unit tests are offline (Vitest). For anything they can't reach (real HTTP, n8n's parameter-visibility engine): build, copy `dist/` + `package.json` to a test n8n instance, run a manual-trigger workflow.

## Node type strings

- Installed under `~/.n8n/custom/`: type is `CUSTOM.freedom24`. n8n's `CustomDirectoryLoader` hardcodes the package name `CUSTOM` for every node loaded from that folder, whatever `package.json` says.
- Installed via n8n Community Nodes (UI/API): `@indiegoweb/n8n-nodes-freedom24.freedom24`.
- The wrong string fails workflow activation with `Unrecognized node type` while the icon loads fine, so it reads like a broken install when it isn't.

## Conventions

- Tabs, single quotes, PascalCase classes, camelCase variables, Title Case UI labels. Explicit types: `IDataObject` for payloads, `JsonObject` for n8n error classes, `INodeProperties` for fields. Imports: `n8n-workflow`, then stdlib, then local.
- Resource -> Operation pattern: every field carries `displayOptions`; Resource and Operation use `noDataExpression: true`.
- Errors: pure helpers throw `PayloadValidationError` (`helpers/payloads.ts`); `router.ts` translates it. `parseJsonParam`/`parseJsonArrayParam` (`helpers/parse.ts`) take `(node: INode, itemIndex, ...)` and throw `NodeOperationError` directly, because the portal linter flags a domain-error class thrown inside `catch`. Direct throws in actions use `NodeOperationError` with `{ itemIndex: i }`.
- Only `makeRequest` builds a `NodeApiError` from a raw HTTP failure. Every catch-all rewraps with `new NodeApiError(this.getNode(), error as JsonObject, ...)` instead of rethrowing (lossless for an existing `NodeApiError`).
- The Creator Portal scan (`@n8n/scan-community-package`) is stricter than `npm run lint` and runs with `allowInlineConfig: false`, so `eslint-disable` comments are ignored there. `require-node-api-error` flags any `throw` in a `catch` that isn't a fresh `new NodeApiError/NodeOperationError`. Before publishing, call `analyzePackage` from `@n8n/scan-community-package/scanner/scanner.mjs` against the working tree.
- `eslint.config.mjs` stays byte-identical to the `@n8n/node-cli` template (`n8n.strict: true` diffs it at lint time). For a genuine exemption use an inline `// eslint-disable-next-line <rule>` with a one-line reason, never a config change.
- No retry/backoff: `setTimeout`/`setInterval` are banned globals in sandboxed community nodes, and a same-tick retry on 429 just hits the limit again. Failures surface immediately.
- Dependency holds: `typescript` 5.9.3 (TS 7 crashes the `@typescript-eslint` bundled in `@n8n/node-cli`, peer range `<6.1`) and `eslint` 9.39.5 (ESLint 10 crashes `eslint-plugin-n8n-nodes-base` 1.x, which calls the removed `context.getFilename()`). Check both against the current `@n8n/node-cli` before bumping.
- Don't add `overrides` to `package.json` to clear `npm audit`: `no-overrides-field` is an ERROR-level lint rule, and overrides don't affect an installed community node anyway. The remaining moderate findings sit in `@n8n/node-cli`'s dev-dependency subtree and don't ship in `dist/`.
- `engines.node` stays `>=20.0.0`: the real runtime is whatever Node the live n8n image bundles. This is a tracked variant (`n8n_node_package_engines_node` in `~/Documents/indiegoweb/indiegoweb-ltd/systems/npm-dependency-policy/variants.yaml`).
- Before editing `ci.yml`, `publish.yml`, `allowScripts` or `engines`, read `~/Documents/indiegoweb/indiegoweb-ltd/systems/npm-dependency-policy/CONTRACT.md` (and `n8n-node-package-skeleton`). The Node 20.x CI leg deliberately runs `npm ci --ignore-scripts` on npm 10.8.2 (npm < 12 has no script-approval gate).

## Trading safety

- Every state-changing operation needs `confirm` and `dryRun` toggles: gate with `requireConfirmed()` (`helpers/guard.ts`), have `dryRun` return the payload without sending, and add the operation to its resource's `buildConfirmAndDryRun(...)` list.
- `dynamic.call` runs arbitrary commands, so it uses `looksLikeMutatingCommand()` (`helpers/mutation.ts`), a prefix heuristic. Add the prefix of any new mutating Tradernet command, and keep it biased toward over-blocking.
- Property descriptions must be clear enough for an LLM; ticker fields state the format (`AAPL.US`).

## API facts

- Every call goes through `makeRequest(this, command, params, auth, strategy)`; `strategy` is mandatory so each call site states intent:
  - `'fixedV2'`: `putTradeOrder`, `putStopLoss`.
  - `'fixedV1'`: `delTradeOrder`, the watchlist mutations, `togglePriceAlert`.
  - `'auto'`: reads and `dynamic.call`. Falls back to the wrapped `q`-param form only on an unambiguous 404 or `{error: "Command not found"}`, never on a 5xx/timeout, because a mutation may already have executed.
- Under header-HMAC auth `fixedV2` and `fixedV1` resolve to the same endpoint, `freedom24.com/api/{command}`. `/api/v2/cmd/{command}` returns "Invalid signature provided" for every command (live-verified 2026-09-11), so don't reintroduce it.
- Host: the HMAC path uses `freedom24.com`, matching the trading system's proven-live calls. `session.ts` and `methods/credentialTest.ts` (User Login only) stay on `tradernet.com`; verify against the live API before changing them.
- Real command names are `putTradeOrder` (place), `delTradeOrder` (cancel) and `putStopLoss`. `putOrderV2` and `deleteOrder` don't exist.
- Tradernet answers failures with HTTP 200 and an `{error}`/`{errMsg}` body. `makeRequest` checks the body on every response, so every new call path must go through it.
- User Login: the login call is form-urlencoded (not JSON) and reads the `SID` cookie. Accounts needing SMS/2FA are unsupported and throw a clear message.
- Credential tests: `Freedom24Api` uses a declarative `test:` plus function `authenticate` (bad key or signature returns a real 403). `Freedom24UserApi` keeps a custom `testedBy` because a wrong password still returns HTTP 200 with a varying `{error}` message and a session cookie, and n8n's declarative rules can't match that (checked against n8n source 2026-09-01). Don't convert it to declarative.

## Adding an operation

1. Add properties to `descriptions/<Resource>.description.ts`, scoped to that resource and operation only.
2. If it mutates, add it to that resource's `buildConfirmAndDryRun(...)` list.
3. Put non-trivial payload construction in a pure builder in `helpers/payloads.ts` with a test in `test/helpers/payloads.test.ts`.
4. Add the branch to `actions/<resource>.ts`: read params, call the builder, gate with `requireConfirmed()` if mutating, call `makeRequest` with an explicit `strategy`.

## Releasing

- Push tag `vX.Y.Z` (must equal `package.json` version); `publish.yml` publishes via npm trusted publishing (OIDC, provenance automatic) after lint, typecheck, build and test.
- `~/Documents` is iCloud-synced: quick successive `git tag` writes can leave a duplicate ref such as `.git/refs/tags/v0.2.1 2`, which breaks `git fetch` and `git ls-remote --tags` (`bad object refs/tags/...`). Delete any tag-ref file with a trailing ` 2`/` 3` (`ls .git/refs/tags/`).

## Open items

- Confirm the 0.2.6 mutating-endpoint fix live: run `Order.updateProtection` (`putStopLoss`) and place/cancel via the disposable T09 test workflow in the trading system against the real account. CHANGELOG 0.2.6 lists this as the next step; completion is unrecorded.
- Re-check the dependency holds and the moderate `npm audit` findings against the current `@n8n/node-cli` (0.50.x); they were last verified on 0.47.2.

## Definition of Done

- `npm run build` (clean `dist/` first, `.js` count checked), `npm run lint`, `npm run typecheck` and `npm test` pass.
- Mutating operations have `confirm`/`dryRun` and an explicit `makeRequest` strategy; the Creator Portal scan is clean for anything touching error handling.
- Static assets (SVG icons, JSON) are copied to `dist/`; anything unit tests can't reach was checked on a live n8n instance.
- Version in `package.json` bumped and matching the tag when releasing.
