# Context history — archived 2026-09-30
Full pre-trim copy of this directory's CLAUDE.md, archived during the lean-context pass. Read on demand for incident detail, superseded procedures, per-feature reference and old IDs. NOT loaded at session start. May contain stale claims — trust the live CLAUDE.md first.

---

# Agent Instructions for n8n-nodes-freedom24

This repository contains a native n8n community node for the Freedom24 (Tradernet) Trading API. It was migrated from an MCP server and is designed to work both as a workflow node and an AI agent tool.

## 1. Commands

### Build and Lint

- **Build**: `npm run build` (Compiles TS and copies static files to `dist/`)
- **Lint**: `npm run lint` (Checks for style and n8n-specific rules)
- **Fix Lint**: `npm run lint:fix` (Automatically fixes most issues)
- **Watch**: `npm run build:watch` (Automatic recompilation on changes)

### Testing

- **Unit tests**: `npm test` (Vitest, offline — pure payload/response/auth logic, no live API calls)
- **Watch mode**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`
- **Type check only**: `npm run typecheck` (uses `tsconfig.test.json`, which also covers `test/` — the plain root `tsconfig.json` only covers `nodes/`+`credentials/` and is what `npm run build` uses)

Live-instance verification is still required for anything a unit test can't reach (real HTTP round-trips, n8n's own parameter-visibility engine):

1. Building the project (`npm run build`).
2. Deploying to a test n8n instance (copying `dist/` and `package.json`).
3. Running a manual trigger workflow.

**Node type string when building/deploying a workflow programmatically (e.g. via n8n-mcp) against a `~/.n8n/custom`-installed instance:** it is `CUSTOM.freedom24`, **not** the npm package's node type. Verified 2026-08-25 by reading n8n's own loader source on the live instance (`n8n-core`'s `CustomDirectoryLoader` hardcodes `packageName = CUSTOM_NODES_PACKAGE_NAME` — the literal string `"CUSTOM"` — for every node loaded from the custom folder, regardless of its `package.json` name or on-disk subfolder name; the fully-qualified type registered globally is `` `${packageName}.${node.description.name}` ``, i.e. `CUSTOM.freedom24`). Using the npm package's own type string fails workflow activation with `Unrecognized node type`, even though the package itself is loaded correctly (icon serves fine, no boot errors) — this is a distinct failure mode from a broken install, easy to misdiagnose as one. This is a property of the custom-folder loader itself, not specific to this node — applies to any node installed the same way on this instance (e.g. `n8n-nodes-beehiiv` too, despite its on-disk folder happening to match its package name).

**Package renamed to `@indiegoweb/n8n-nodes-freedom24` (2026-08-25):** the published npm package moved from the unscoped `n8n-nodes-freedom24` (0.2.0/0.2.1, still live) to the scoped `@indiegoweb/n8n-nodes-freedom24` (0.2.2+), matching `@indiegoweb/n8n-nodes-beehiiv`'s naming. npm has no package rename — this is a new, separate package identity, so the old unscoped package gets `npm deprecate`d pointing at the new one rather than updated in place. The node's type string when installed via n8n's Community Nodes UI/API (not the custom-folder dev path above) changes accordingly, from `n8n-nodes-freedom24.freedom24` to `@indiegoweb/n8n-nodes-freedom24.freedom24`; any instance with the old unscoped package installed that way needs to uninstall it and install the new scoped one — this is a breaking change for that install path, not a cosmetic rename. **First publish of the new scoped package can't go through the existing OIDC trusted-publishing workflow** — npm requires a package to already exist before a trusted publisher can be configured for it on npmjs.com, so v0.2.2 needs one manual `npm publish --access public` (authenticated npm login + 2FA) before `git tag v0.2.2 && git push origin v0.2.2` will work through CI; only subsequent releases can use the tag-push workflow. Same bootstrap constraint `n8n-nodes-beehiiv`'s `install_node.sh` header documents for its own scoped rename.

## 2. Project Structure

- `nodes/Freedom24/Freedom24.node.ts`: Node description assembly, `execute()` loop (auth setup, pairedItem, continueOnFail), `methods` (credentialTest/listSearch).
- `nodes/Freedom24/descriptions/`: Per-resource property definitions. Each resource owns its own copies of shared-name fields (Ticker, Confirm, Dry Run) scoped to exactly the operations that use them — don't reintroduce one shared field with a show/hide matrix spanning multiple resources; that's what caused the original displayOptions leakage bugs.
- `nodes/Freedom24/actions/`: One handler per resource (`execute(this, i, operation, auth)`), plus `router.ts` — the single dispatch point, and the only place a pure helper's `PayloadValidationError`/`JsonParamParseError` gets translated into `NodeOperationError` with `itemIndex`.
- `nodes/Freedom24/transport/`: `signing.ts` (pure HMAC), `request.ts` (endpoint resolution/fallback, `makeRequest`), `session.ts` (User Login).
- `nodes/Freedom24/helpers/`: Pure payload builders (`payloads.ts`), response unwrapping/error detection (`responses.ts`), guarded JSON parsing (`parse.ts`), the ticker resourceLocator adapter (`ticker.ts`), the confirm/dryRun guard (`guard.ts`), the `dynamic.call` mutation heuristic (`mutation.ts`) — none of these touch `IExecuteFunctions`, which is what makes them directly unit-testable.
- `nodes/Freedom24/methods/`: Real `credentialTest` probes and Ticker's `listSearch`.
- `nodes/Freedom24/types/`: Shared Tradernet API types.
- `credentials/Freedom24Api.credentials.ts`: API Key authentication definition — declarative `test:` + function-based `authenticate` (since 0.2.4; see §3's credential-testing note for why this one credential could go declarative and `Freedom24UserApi` couldn't).
- `credentials/Freedom24UserApi.credentials.ts`: User Login (session-based) authentication definition (same pattern, `freedom24UserApiCredentialTest`).
- `icons/`: SVG icons for the node.
- `test/`: Vitest specs, mirroring the `nodes/Freedom24/` layout.

There is no `freedom-mcp-server/` reference checkout in this repo — it previously existed as a git-tracked symlink to a path on the author's machine, which broke on every other clone and leaked a local filesystem path on a public repo. It was removed; the MCP server it pointed to is a separate, unrelated project.

## 3. Code Style Guidelines

### Formatting & Types

- **Indentation**: Use **Tabs** (Mandatory).
- **Quotes**: Use **Single Quotes** for strings.
- **Naming**:
  - Classes: `PascalCase`
  - Variables/Methods: `camelCase`
  - UI Labels: `Title Case` (e.g., `Take Profit`)
- **Types**:
  - Always prefer explicit typing.
  - Use `IDataObject` for general API payloads.
  - Use `JsonObject` when required by n8n error classes.
  - Use `INodeProperties` for UI field definitions.

### Imports

- Group imports: `n8n-workflow` first, then standard libraries, then local files.
- Always include `JsonObject` if using `NodeApiError`.

### Error Handling

- Prefer a pure helper that throws a domain error (`PayloadValidationError` in `helpers/payloads.ts`) over reaching for `NodeOperationError` inside a pure function that has no way to get one — `actions/router.ts` is the one place `PayloadValidationError` gets translated into a real `NodeOperationError` with `itemIndex` attached. `helpers/parse.ts`'s `parseJsonParam`/`parseJsonArrayParam` are the one exception: they take `(node: INode, itemIndex: number, ...)` and throw `NodeOperationError` directly, because the portal's stricter linter (below) flags a domain-error class thrown from inside a `catch` block (unavoidable there — parsing JSON can only signal failure by throwing) even when it's just meant for translation by a caller. Taking a plain `INode` doesn't cost the function its purity/testability — it's a data object, not `IExecuteFunctions` — only a full execution-context dependency would.
- Where an action does need to throw directly (a confirm-gate, an unmatched operation), use `NodeOperationError` and **always** provide `{ itemIndex: i }`.
- Use `NodeApiError` for low-level HTTP failures and API-level rejections (`transport/request.ts`'s `makeRequest` is the only place that constructs these directly from a raw HTTP failure). Every catch-all fallback elsewhere (`Freedom24.node.ts`'s two outer catches, `actions/router.ts`'s non-`PayloadValidationError` branch) also rewraps via `new NodeApiError(this.getNode(), error as JsonObject, ...)` rather than a bare `throw error` — never rely on plain rethrow in a catch block that might be the last stop before the error reaches the n8n UI. `NodeApiError`'s constructor returns an already-`NodeApiError` argument unchanged (`if (errorResponse instanceof NodeApiError) return errorResponse;`), so this is a lossless no-op for the common case (an untranslated `NodeApiError` from `makeRequest` passing through) and a message/description-preserving rewrap for anything else (e.g. an already-thrown `NodeOperationError`).
- **n8n Creator Portal review uses a stricter linter than `npm run lint`.** `npx @n8n/scan-community-package@beta <pkg>` runs `@n8n/eslint-plugin-community-nodes`'s `recommended` config (verified 2026-08-25 by reading `scan-community-package`'s own source), which this repo's local `n8n-node lint` does not include at all — passing local lint is not evidence the portal scan will pass. Its `require-node-api-error` rule flags *any* `throw` inside a `catch` block whose argument isn't a fresh `new NodeApiError(...)`/`new NodeOperationError(...)` call — including a bare rethrow of the caught error, which is otherwise idiomatic. The scanner also runs with `allowInlineConfig: false`, so `// eslint-disable-next-line` (the normal escape hatch, still valid for local lint and genuinely-no-alternative cases) is silently ignored for the portal check — there is no way to suppress a portal-scan finding without actually changing the code. To check locally before publishing, `import { analyzePackage } from '@n8n/scan-community-package/scanner/scanner.mjs'` and call it against the working tree directly (it accepts a local directory, not just a published package name).
- **Credential testing splits by credential type — re-verified against current n8n source 2026-09-01, not just the live API:** `Freedom24Api` (API Key) uses a declarative `test:` + function-based `authenticate` on `Freedom24Api.credentials.ts` (reusing `signPayload`/`buildApiKeyHeaders` unchanged) — a bad public key or bad signature both come back as a real HTTP 403 with `{"error": "..."}`, not Tradernet's usual 200-with-error-body shape, so the default non-2xx check is a genuine test. `Freedom24UserApi` (User Login) stays on the custom `methods.credentialTest.freedom24UserApiCredentialTest` (`testedBy`): a deliberately wrong login/password still comes back HTTP 200 with `{"error": "Incorrect email or password"}` (message varies by failure reason), and Tradernet issues a session cookie either way — so status code and cookie presence are both useless, and only body inspection catches it. The n8n Creator Portal reviewer pushed back on this 2026-09-01, asking whether the declarative approach could work instead — confirmed it genuinely can't, by cloning `n8n-io/n8n` and reading the current rule engine directly (not the npm `latest` dist-tag, which turned out to be ~5 months stale versus actual publishing — checked `stable` 2.36.7 and newest `beta` 2.38.0 too, same result across all of them). The rule type is `ICredentialTestRequest.rules: IAuthenticateRuleResponseCode[] | IAuthenticateRuleResponseSuccessBody[]` (not `ICredentialTestRequestRule` — that name doesn't exist in current source), evaluated in `packages/cli/src/services/credentials-tester.service.ts`: `responseCode` only fires inside the catch branch after a thrown non-2xx, which Tradernet's login endpoint never produces (always 200); `responseSuccessBody` only supports one fixed `lodash.get(body, key) === value` pair via strict equality — no presence-check, no negation, no wildcard — so a *varying* error message can't be matched (one rule per exact known string doesn't cover a message that changes per failure reason). `ICredentialTestFunctions.helpers` for `testedBy` functions is still just `SSHTunnelFunctions & { request }` — no `httpRequest` alternative — confirmed against the same current source, not just `n8n-core@2.16.1`. Corroborating evidence: current n8n master has a new `probeCredentialAuth`/`resolveAuthProbeVerdict` mechanism (`credentials-tester.service.ts` L255-403) built for exactly this "2xx regardless of credential" ambiguity — but it's driven by a `testUrl` field on the built-in "Templated Custom Auth" credential type's own stored data, isn't reachable from a community credential's own `test`/`testedBy`, and its own doc comment explicitly says it *hedges* (returns `status: 'OK'` with caveated copy) rather than resolving the ambiguity — n8n's own newest verification code punts on the same problem this repo hit. There is no non-deprecated way to make an HTTP call from inside a `testedBy` credential-test function, and switching this one credential to declarative would regress to the "always passes" bug 0.2.0 fixed by adding real `testedBy` functions in the first place. Left as-is with a justifying inline comment; this is a confirmed, current platform gap, not something to code around — the reply sent to the portal reviewer cited this evidence directly.

### Resource/Operation Pattern

The node follows the standard n8n Resource -> Operation pattern.

- Every field should have `displayOptions` to only show up when the correct resource and operation are selected.
- Use `noDataExpression: true` for Resource and Operation options.

## 4. Trading & AI Agent Readiness

### Mutation Safety

All operations that modify state (Place Order, Cancel, Create Watchlist, etc.) **must** include:

- `confirm`: A boolean toggle to prevent accidental execution.
- `dryRun`: A boolean toggle that returns the request payload without sending it to the API.

Use `helpers/guard.ts`'s `requireConfirmed()` rather than hand-rolling the check.

`dynamic.call` can't rely on a fixed operation list — the command is arbitrary user input — so it uses `helpers/mutation.ts`'s `looksLikeMutatingCommand()`, a conservative prefix-based heuristic (`put`, `delete`/`del`, `add`, `update`, `toggle`, `make`, `cancel`, `remove`, `create`, `set`, `save`, `edit`). If you add a new mutating Tradernet command name that doesn't start with one of these, add its prefix to the list — the heuristic must stay biased toward over-blocking (annoying but safe) rather than under-blocking (a real mutation slipping through unconfirmed).

### AI Tooling

- The node has `usableAsTool: true`.
- Descriptions for properties should be descriptive enough for an LLM to understand their purpose.
- Tickers should consistently mention the format (e.g., `AAPL.US`).

## 5. API Implementation Notes

- HMAC signing for API Key auth lives in `transport/signing.ts` (pure — `signPayload`/`buildApiKeyHeaders`) and is exercised by `transport/request.ts`.
- Session-based auth (User Login) involves `transport/session.ts`'s `getSessionId()` — a separate login call (**form-urlencoded**, not JSON — Tradernet's documented contract) and a `SID` cookie extraction. Accounts requiring SMS/2FA confirmation on login are not supported; `getSessionId` throws a message saying so rather than hanging or silently failing.
- Every request goes through `transport/request.ts`'s `makeRequest(this, command, params, auth, strategy)`. `strategy` is mandatory, not defaulted, so every call site states its intent explicitly:
  - `'fixedV2'` — the two proven trading mutations (`putOrderV2`, `putStopLoss`). No fallback, ever.
  - `'fixedV1'` — every other built-in mutating command (`delTradeOrder`, `addStockList`, `updateStockList`, `deleteStockList`, `makeStockListSelected`, `addStockListTicker`, `deleteStockListTicker`, `togglePriceAlert`). No fallback.
  - `'auto'` — every read-only command, and `dynamic.call` regardless of what it turns out to be. Falls back v2 → v1 → v1-wrapped-query, but **only** on an unambiguous 404 or `{error: "Command not found"}` — never on a 5xx/timeout, because a mutating command may have already executed server-side and a fallback retry there could resubmit it.
- **`BASE_URL`/`V2_BASE_URL` in `transport/request.ts` point at `freedom24.com` (fixed 2026-09-10, was `tradernet.com`):** found while migrating `investing-private`'s live trading workflows onto this node's credential — that system's own proven-live production code (reads and writes alike) has always called `freedom24.com/api/{command}`, never `tradernet.com`. `tradernet.com` happens to work for reads (this credential's own `test` probe verified that live 2026-08-26), but was unverified for writes and is the likely cause if a mutating call ever returned `"Invalid signature provided"` against this package before 0.2.5. Also fixed in the same pass: `Order.cancel`/`bulkCancel` sent the command `deleteOrder`, which isn't real — Tradernet's own API reference names it `delTradeOrder`. **`transport/session.ts` and `methods/credentialTest.ts` (both User Login's cookie-session endpoint only) were deliberately left on `tradernet.com`** — no live evidence either way for that separate, non-HMAC auth path; don't "fix" them to match without first verifying against the live API the way 0.2.5's changelog entry did for the HMAC path.
- **Tradernet returns HTTP 200 with `{error}`/`{errMsg}` bodies on failure.** `makeRequest` checks the body for this on every response, in addition to the HTTP status — don't add a new call path that skips this check.
- **No retry-with-delay.** n8n community nodes run sandboxed for cloud compatibility, and `setTimeout`/`setInterval` are banned globals there (`@n8n/community-nodes/no-restricted-globals`). There's no way to implement a real backoff delay inside `execute()`. Don't reach for one — a same-tick retry on 429 just hits the rate limit again, so failures surface immediately instead of faking a backoff that isn't one.
- **`eslint.config.mjs` must stay byte-identical to the `@n8n/node-cli` default template.** `package.json`'s `n8n.strict: true` enforces this at lint time (`n8n-node lint` diffs it against the shipped template and hard-fails on any difference). If a file genuinely needs an exemption from a rule (test files needing `vitest`/`no-restricted-imports`, `ICredentialTestFunctions.helpers.request` being deprecated with no alternative in that context), use an inline `// eslint-disable-next-line <rule>` comment with a one-line reason, not a config change.

## 6. Adding a New Operation

1. Add the property definitions to the relevant `descriptions/<Resource>.description.ts` — scoped to that resource+operation only (see §2 on shared-name fields).
2. If the operation mutates state, add it to that resource's `buildConfirmAndDryRun(...)` operation list.
3. If payload construction is non-trivial, add a pure builder to `helpers/payloads.ts` (parameters in, `IDataObject` out, no `IExecuteFunctions`) and a test in `test/helpers/payloads.test.ts`.
4. Add the branch to the resource's `actions/<resource>.ts` `execute()` — read parameters, call the builder, gate on confirm/dryRun via `requireConfirmed()` if mutating, call `makeRequest` with an explicit `strategy`.
5. `npm run build && npm run lint && npm test` before considering it done.

## 7. Deployment Checklist

**Git gotcha — stray duplicate tag refs from iCloud Drive sync (found 2026-09-10):** `~/Documents` is iCloud-synced, and two near-simultaneous local `git tag` writes during the 0.2.1 release (Aug 25, 21:47 and 22:02) left a corrupt second ref file on disk — literally `.git/refs/tags/v0.2.1 2` (note the space), iCloud's usual conflict-duplicate naming applied to git's own ref-file storage. Git silently ignores it for normal commands ("ignoring ref with broken name"), but it broke `git fetch`/`git ls-remote --tags` outright (`fatal: bad object refs/tags/v0.2.1 2` / `did not send all necessary objects`) — not a sandbox or network problem, confirmed by reproducing the same failure with the sandbox disabled. Fix: `rm ".git/refs/tags/v0.2.1 2"` (or whatever the stray file is named — check `ls .git/refs/tags/` for any name with a trailing ` 2`/` 3` when fetch/tag-push misbehaves). The real `v0.2.1` tag (no suffix) is untouched and correct. Watch for this again around any release where a tag gets created twice in quick succession.

Before finalizing any changes, ensure:

1. `npm run build` completes without errors. **Run `rm -rf dist .tsbuildinfo` first** if `dist/` already exists from a prior build — TypeScript's incremental cache (`.tsbuildinfo/build.tsbuildinfo`) can think nothing changed and silently emit zero `.js` files (only the static SVG/JSON assets get copied) even though `n8n-node build` still reports "✓ Build successful". Always verify with `find dist -name "*.js" | wc -l` before deploying `dist/` anywhere.
2. `npm run lint` passes all n8n-specific rules.
3. `npm test` passes.
4. Version in `package.json` is appropriately incremented if releasing.
5. Static files (SVG icons, JSON schemas) are correctly copied to `dist/`.

## 8. Open todos

- [x] **7 open Dependabot PRs (opened 2026-09-09, closed 2026-09-10)** — all
  stale against a pre-CI-fix base commit, not a new bug (their Node 20.x leg
  was hitting the already-fixed `4e0eb88`/`ca17b8d` EBADENGINE issue). Applied
  directly instead of merging the stale branches: `dd95738` (actions/checkout +
  actions/setup-node → v7, PR #1) and `2b237a7` (devDependency refresh +
  `allowScripts` + lint cleanup, superseding #2-#7 — brace-expansion/js-yaml/
  ip-address/@humanfs/node all landed naturally via a fresh lockfile
  regeneration, no manual override needed). Fixed 68 of 70 open Dependabot
  security alerts in the same push; the remaining 2 (`uuid`, `stream-json`) are
  tracked below. All 7 PRs closed with a comment pointing at the superseding
  commit.
- [ ] **typescript held at 5.9.3, not bumped to 7.0.2 — `@typescript-eslint` doesn't
  support it yet (found 2026-09-10).** Dependabot's grouped PR proposed
  `typescript@7.0.2`; installing it crashes eslint entirely (`ts-api-utils`
  reads a `ts.Intrinsic*` shape TS 7 no longer exposes) because
  `@typescript-eslint/typescript-estree@8.46.1` — bundled inside `@n8n/node-cli`,
  confirmed at true latest `0.47.2`, not a stale copy — declares a peer range of
  `typescript@">=4.8.4 <6.0.0"`. Revisit once `@n8n/node-cli` ships with a
  `@typescript-eslint` major that supports TS 7; don't retry by just bumping
  typescript again without checking that first.
- [ ] **eslint held at 9.39.5 (latest 9.x), not bumped to 10.10.0 — `eslint-plugin-
  n8n-nodes-base` doesn't support ESLint 10 yet (found 2026-09-10).** Same shape
  of issue: ESLint 10 removed the deprecated `context.getFilename()` API, and
  the plugin's `node-dirname-against-convention` rule (confirmed on its own
  latest `1.16.7`) still calls it — crashes `npm run lint` outright, not a lint
  warning. Also revisit once `@n8n/node-cli` bundles a compatible version.
- [ ] **10 moderate npm-audit findings, all inside `@n8n/node-cli`'s own AI-tooling
  devDependency subtree (`uuid`, `stream-json`, `qs`, `@n8n/ai-node-sdk`,
  `@n8n/ai-utilities`, `@n8n/backend-network`), confirmed genuinely unfixable from
  this repo 2026-09-10 — two independent hard walls, not a shortage of effort:**
  1. **`package.json`'s `overrides` field would technically clear all of them
     (verified: pinning `uuid@^11.1.1`, `stream-json@^3.5.0`, `qs@^6.16.0` gets
     `npm audit` to 0 findings) but is an ERROR-level rule in
     `@n8n/eslint-plugin-community-nodes` (`no-overrides-field`) — now bundled
     directly into local `n8n-node lint` since the `@n8n/node-cli` 0.47.2 upgrade
     (it wasn't before; CLAUDE.md §3's note that local lint "does not include" the
     portal's stricter ruleset is now stale for this specific rule). The rule's own
     rationale isn't stylistic: a community node installs into an isolated
     dependency tree at runtime, so an `overrides` entry in *this* package's
     `package.json` has no effect on what actually runs once installed into a live
     n8n instance — it only affects the local dev/build tree, which is exactly
     where these findings already live and don't matter (nothing here ships in
     `dist/`).
  2. Bumping eslint/typescript far enough to naturally pull patched versions isn't
     available either — see the two entries above (TS 7 crashes `@typescript-eslint`
     even at its own latest; ESLint 10 crashes `eslint-plugin-n8n-nodes-base`) — and
     `@n8n/node-cli` is already pinned `"*"`/true latest, so there's no newer
     version of the CLI itself to pull a fixed subtree from.

  Net: these 10 findings are structurally out of this repo's reach until
  `@n8n/node-cli` ships a release that itself updates its own AI-tooling
  dependency versions. Don't re-attempt `overrides` as a workaround — it's not
  overlooked, it's policy-forbidden for the exact reason it wouldn't help. Re-check
  next time `@n8n/node-cli` bumps past `0.47.2`.
- [x] **`dist/package.json` staleness (found 2026-09-06)** — resolved.
  `publish.yml` does a clean `actions/checkout` + `npm ci` + `npm run build`
  on every tag push, so there's no incremental-cache carryover between
  releases to go stale. Verified 2026-09-10: the actually-published 0.2.5
  tarball's `dist/package.json` correctly reads `0.2.5`. §7's warning about
  `rm -rf dist .tsbuildinfo` before a build still applies to **local** manual
  builds/testing — just isn't a real risk on the CI publish path.
- [x] **`ci.yml`'s Node 20.x matrix job was broken — found and fixed
  2026-09-10.** The `v0.2.5` tag push exercised both workflows for the first
  time (previously untested, as this item used to warn); `publish.yml`
  succeeded, `ci.yml` failed with `EBADENGINE` (`npm@12.0.2` requires Node
  `>=22.22.2`, incompatible with the matrix's own `20.x` leg). Fixed by
  splitting both the npm-pin step and the `npm ci` step per Node major (see
  §5's routing-strategy note for the full mechanics) — confirmed clean on a
  real run, both legs green. A follow-up automated commit review caught that
  the first version of this fix was itself a real regression: skipping
  `strict-allow-scripts` on the 20.x leg let `npm ci` reach real installs
  using npm <12, which has **no** script-approval gate at all — every
  install script would run unconditionally there, unreviewed, which is
  worse than the crash it replaced (nothing ran before). Closed with
  `npm ci --ignore-scripts` on that leg instead — strictly safer than
  either prior state. Canonical pattern (with this hardening included) now
  lives in `systems/npm-dependency-policy/reference/ci-npm-pin-snippet.yml`;
  same bug + same fix also applied to `n8n-nodes-beehiiv/ci.yml`.
- [ ] **Don't tighten `engines.node`.** It is deliberately `>=20.0.0`, a
  permissive floor, not an oversight. This package's real runtime is whatever
  Node major the live self-hosted `n8nio/n8n` Docker image bundles — not
  something this repo controls or can verify. n8n supports Node 20.19–24.x and
  explicitly **not** 25 (odd/Current releases break `isolated-vm`'s native
  ABI). Pinning this to `24.x` would assert a guarantee the package can't
  keep. Recorded as a tracked variant in
  `indiegoweb-global/systems/npm-dependency-policy/variants.yaml`.
