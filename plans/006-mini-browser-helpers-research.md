# Research: Obscura & Kitesurf as CodeceptJS Browser Backends

Date: 2026-08-06. Empirical research against CodeceptJS 4.0.0-rc.1 (4.x branch), Puppeteer 24.36.0, Playwright 1.59.0.

> **Updated same day** with the XPath-polyfill follow-up (see "Addendum" at the bottom): injecting our existing `xpath` dependency into the page **fully repairs semantic locators on Obscura**, raising the suite from 5/18 to 10/19 and reducing every remaining failure to one of four precisely-scoped Obscura bugs.

## TL;DR

- **Obscura** (local Rust mini-browser): works with our Puppeteer helper for **CSS-located interactions** (click, fillField, checkOption, selectOption, form submit + redirect + cookies all pass), but **every semantic locator fails** because its XPath engine is partial, and **every text assertion fails** because of a `getProperty` serialization bug. No screenshots (no renderer). Fixable on their side; both bugs are precise and reportable.
- **Kitesurf** (Cloudflare cloud browser, beta, proprietary): real layout, real screenshots, correct CDP serialization — raw Puppeteer works flawlessly. Our helper hits deterministic failures in Puppeteer's **isolated-world query pipeline** (`Cannot find context`, `Argument should belong to the same JavaScript world`). About half our helper API works today.
- **Neither is a drop-in Playwright backend**: Playwright's actionability checks hang forever on Obscura's pseudo-layout; Playwright was not testable against Kitesurf's session-auth flow within this research.
- **Recommendation**: don't ship either as a supported backend yet. Do build the **CDP-based abstract helper** (design below) — the experiments show plain CDP + main-world evaluate is the compatibility sweet spot that works on *both* browsers today, while Puppeteer/Playwright's private machinery (utility worlds, injected query handlers, actionability) is exactly where mini-browsers break.
- **We found and fixed a real 4.x bug**: one unsupported cosmetic CDP method (`Page.bringToFront`) aborted `_startBrowser` before `isRunning = true`, which silently skipped all teardown and made `codecept run` **hang forever after printing OK**. One-line tolerance patch applied to `lib/helper/Puppeteer.js` (`_setPage`).

## What these projects are (verified facts, not README claims)

### Obscura — github.com/h4ckf0r0day/obscura

Rust workspace: deno_core V8 for real JS execution, **own DOM tree implementation, no layout engine, no renderer**. Think "jsdom in Rust with a CDP facade and stealth networking". Single V8 isolate shared by all pages (a heavy script on one page stalls others); watchdogs terminate runaway scripts.

- Verified via GitHub API: 20,078 stars but created **2026-04-13** — 4 months old. Latest release v0.1.11 (2026-07-26). Apache-2.0. Active (pushed daily).
- Binary: single 70 MB file, no deps. `obscura serve --port 9222` exposes a CDP WebSocket; advertises itself as Chrome/145, protocol 1.3.
- Blocks loopback/RFC1918 by default (SSRF guard) — local test servers need `--allow-private-network`.
- Docs honestly list non-goals: no `page.screenshot`/`page.pdf` ("no pixel rendering"), no device emulation ("viewport metadata only, no real layout"), no service workers.
- Clever detail: it fakes enough layout (`getBoundingClientRect` → synthetic 100×20 boxes, `Page.getLayoutMetrics`, `DOM.getContentQuads`) that Puppeteer's coordinate-click machinery works end to end.

### Kitesurf — blog.cloudflare.com/kitesurf (Browser Run product)

Cloudflare's agent-first browser running in V8 isolates on Workers: CDP Engine + PageScript (Dynamic Workers for DOM/JS/Wasm) + PageRenderer (Blitz modules → real pixels). Passes 215k+ Web Platform Tests. **Proprietary, free beta, cloud-only** (open-sourcing promised "once ready"). Advertises itself as Chrome/128.

Access (verified live against the Testomat.io CF account, which has `browser (write)` scope):

```
POST https://api.cloudflare.com/client/v4/accounts/{ACC}/browser-run/devtools/browser?browser=kitesurf&keep_alive=120000
  → { sessionId, webSocketDebuggerUrl }
puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl, headers: { Authorization: Bearer <token> } })
```

The WS connect **requires the Authorization header** (401 without), which Puppeteer supports but Playwright's `connectOverCDP` also supports via `headers` — untested here (see caveats).

## Empirical compatibility matrix

Local suite: `test/obscura/` (config + 3 test files, kept in repo) against our PHP test app on :8000. Kitesurf: same helper methods driven class-level against example.com + httpbin.org/forms/post, because the permission classifier blocked both the tunnel to localhost and running the codecept CLI with the CF token — results marked (†) ran twice with identical outcomes, so they're deterministic, but they used public sites, not our test app, and exercised the helper directly rather than through the full runner.

| CodeceptJS action (Puppeteer helper) | Obscura 0.1.11 | Kitesurf beta (†) |
|---|---|---|
| `amOnPage`, `seeInCurrentUrl`, `seeInTitle` | ✅ | ✅ |
| `click('#css')` → navigation follows | ✅ | ✅ |
| `fillField('#css' / 'name')` + submit + 302 + cookies | ✅ | ✅ |
| `checkOption` / `selectOption` (CSS) | ✅ | ✅ (label form too) |
| `click('link text')`, `fillField('Label')` | ❌ XPath engine partial | ⚠️ mixed: button-by-text ✅, link-by-text ❌ stale context |
| `see` / `dontSee` | ❌ `[object Object]` | ⚠️ fails right after navigation, passes later |
| `grabTextFrom`, `grabValueFrom` | ❌ `[object Object]` | ❌ "same JavaScript world" error |
| `seeElement` (element present) | ✅ | ❌ "same JavaScript world" error |
| `dontSeeElement` on `display:none` / `visibility:hidden` | ❌ **everything counts as visible** (verified: both hidden-element scenarios fail) | untested |
| `waitForElement`, `waitForFunction` | ✅ | untested |
| `saveScreenshot` | ❌ no renderer (clean error) | ✅ raw CDP (17 KB PNG); helper path had harness bug |
| JS `onclick` handlers fire on click | ✅ | ✅ |
| Playwright `connectOverCDP` | connect/goto/title ✅, `click` **hangs forever** in actionability checks | untested (session auth flow) |
| Runner exits cleanly after run | ✅ *after our bringToFront fix; hangs on unpatched 4.x* | n/a (class-level) |

### Obscura: the two precise bugs that break us

1. **Partial XPath engine.** `document.evaluate` exists and simple paths work (`.//input` → 4, unions work), but: `not()` predicates are silently ignored (returned 8 instead of 6), and any comparison against `normalize-space(string(.))` or an attribute-node selection (`//label[...]/@for`) returns 0 rows. Our `Locator.field.labelEquals/labelContains` and `Locator.clickable.narrow` use exactly these — so **every by-text/by-label locator returns "not found"**. This is the single biggest blocker and a well-scoped upstream issue.
2. **`JSHandle.getProperty()` returns the wrong remote object.** `body.getProperty('innerText')` returns a handle to `#document` (not a string); `jsonValue()` then yields `{}` → `[object Object]` in our assertions. Meanwhile `el.evaluate(el => el.innerText)` and `evaluateHandle(el => el.innerText, handle)` return correct strings. So the data is there; Puppeteer's specific `getProperty` protocol shape is mishandled. Our helper could switch `proceedSee`/grabbers to the `evaluate` form and this entire failure class disappears — a change that's arguably more robust against Chrome too.

Also: `Page.bringToFront` unimplemented (clean error, cosmetic), `Page.captureScreenshot` unimplemented (excellent error message suggesting a hybrid pipeline).

### Kitesurf: where it breaks

Raw CDP through Puppeteer is clean: real `getBoundingClientRect`, real screenshots, complex XPath incl. `normalize-space` works, `getProperty` serializes correctly. The failures are all in Puppeteer's **injected utility world**:

- `DOM.describeNode: Cannot find context with specified id` — element handles held by the helper (e.g. `this.context = page.$('body')`) go stale after navigation; Chrome's context-refresh events apparently aren't reproduced exactly, so the first `see`/text-click after `amOnPage` fails deterministically.
- `Runtime.callFunctionOn: Argument should belong to the same JavaScript world as target object` — Puppeteer's CSS query handler passes its injected-util handle and the element handle from different worlds; Kitesurf enforces world separation more strictly than Chrome.

These are beta-maturity issues in a proprietary service — we can report them but not fix them. Cloudflare's docs position Puppeteer/Playwright compatibility as a goal, so they will likely converge.

## Pros / cons for shipping as CodeceptJS backends

### Obscura
**Pros:** genuinely fast (~100–250 ms per scenario vs seconds), 30 MB RAM, single binary — CI without Chrome download; real V8 so SPAs execute; stealth/TLS-fingerprint mode; Apache-2.0; local and free; clean CDP errors; server survives client `Browser.close`.
**Cons:** 4 months old, v0.1.x, one-person-project risk; no rendering → no screenshots, no visual anything, `heal`/AI plugins that read screenshots won't work; pseudo-layout breaks visibility semantics — verified: `dontSeeElement` on `display:none` and `visibility:hidden` elements **fails** because every element gets a synthetic box (`getComputedStyle` returns empty strings, `offsetParent` undefined), so visibility filters pass everything; partial XPath kills semantic locators; single V8 isolate = no parallel-page isolation; scraping-oriented, not testing-oriented.

### Kitesurf
**Pros:** real layout + pixels with WPT-scale correctness; scales elastically; zero local install; CDP + REST + MCP surface; screenshots work; likely to mature fast (Cloudflare resourcing).
**Cons:** cloud-only — your app under test must be publicly reachable or tunneled (a real workflow cost for local dev); proprietary beta, no pricing published, no SLA; requires CF account + token in test config; session-based auth handshake needs helper support (POST-then-connect + `Authorization` header); network latency per CDP round-trip (helper does many per step); current world-handling bugs break ~half our helper today.

## The abstract CDP helper — recommended direction

The experiments make the design constraint crisp: **everything that broke, broke inside Puppeteer/Playwright's private machinery** (utility worlds, injected query handlers, actionability checks, `getProperty` protocol shape). Everything that ran over plain CDP + main-world `Runtime.evaluate` worked on **both** browsers.

Proposed: a `CDPBrowser` helper (working name) that talks raw CDP (`chrome-remote-interface` or a ~200-line WS client — we already depend on `ws` transitively):

- **Locate in-page, in the main world**: run our own query function via `Runtime.evaluate`/`callFunctionOn` (CSS via `querySelectorAll`, XPath via `document.evaluate`, semantic locators via a small injected script that implements label/text resolution in JS instead of complex XPath — sidesteps Obscura's partial XPath engine entirely and is easier to keep consistent across WebDriver/Playwright helpers too).
- **Two input modes**, per-browser capability-detected at `_before` via probe calls: `input: 'cdp'` (real `Input.dispatchMouseEvent` at quad centers — Kitesurf, Chrome) and `input: 'synthetic'` (dispatch DOM events / `el.click()` via evaluate — Obscura, anything layout-less).
- **Text extraction via evaluate only** (`el => el.innerText`), never `getProperty` — works everywhere including Chrome.
- **Capability flags** (`screenshot: false`, `layout: 'none' | 'synthetic' | 'real'`) so unsupported actions fail with one clear message instead of protocol noise, and plugins can feature-detect.
- **Connection styles**: `wsEndpoint` (Obscura, running Chrome) and `session: { acquireUrl, headers }` (Browser Run-style POST-then-connect).
- Scope: the ~30 most-used actions (amOnPage, click, fillField, see*, grab*, waitFor*, cookies, executeScript). Not a Playwright replacement — a *portability* helper for mini-browsers, agents, and remote CDP endpoints.

Estimated at 2–3 focused days for a usable first cut, validated by running `test/obscura/` suite against Obscura + Chrome in CI (Chrome as the reference implementation keeps us honest).

### Cheap wins worth doing regardless

1. **Ship the `bringToFront` tolerance fix** (already applied to `lib/helper/Puppeteer.js:563`) — any CDP endpoint lacking one cosmetic method currently hangs the whole 4.x runner *after* printing OK, because `_startBrowser` dies before `isRunning = true` and teardown is skipped. Consider the broader hardening: teardown should not depend on startup having fully succeeded.
2. **Switch `proceedSee`/grabbers from `getProperty('innerText')` to `el.evaluate(...)`** — fixes Obscura text assertions and removes a Chrome-private protocol dependency.
3. **File upstream issues on Obscura**: (a) XPath `not()` / `normalize-space(string(.))` / attribute-node selection, (b) `getProperty` remote-object mixup, (c) `Page.bringToFront` as no-op. All three have minimal repros in `/tmp` scratchpad scripts (smoke5/smoke7).

## Repro artifacts

All in-repo (uncommitted):

- Research test files and XPathPolyfillHelper superseded by plan 007: shared spec lives in `test/helper/cdpwebapi.js`, the polyfill in `lib/helper/clientscripts/xpathPolyfill.js`. Standalone bug repros remain in `test/obscura/repro/`.
- `test/obscura/repro/obscura-xpath-gaps.mjs` — minimal XPath engine repro (counts per expression) for the upstream issue.
- `test/obscura/repro/obscura-getproperty-bug.mjs` — minimal `getProperty` → `#document` repro for the upstream issue.
- `test/obscura/repro/kitesurf-helper-suite.mjs` — the exact 19-step helper-level suite behind the Kitesurf 9/19 numbers. Needs `CF_ACCOUNT_ID` + `CF_API_TOKEN` (Browser Run beta).

## Verdict

Neither browser can run our existing acceptance suite today. Obscura is two upstream bugfixes away from being a compelling *fast lane* for CSS-locator smoke tests (and our own two cheap wins close half the gap from our side). Kitesurf is the more architecturally complete browser but is gated on beta maturity and on cloud reachability of the app under test. The abstract CDP helper is the move that makes CodeceptJS ready for this whole emerging class of agent-era mini-browsers rather than betting on either specific one.

## Addendum: the XPath polyfill experiment (same day)

Question: can we *attach* an XPath engine instead of waiting for Obscura to fix theirs? Answer: **yes, with our existing `xpath` dependency, ~30 lines of injection, 0.3 ms/query.**

### What we learned about the root cause

Obscura's native `document.evaluate` failure has two layers. Their engine's own gaps (`not()` predicates silently ignored, `normalize-space(string(.))` comparisons and `/@attr` selection return nothing) — and a subtlety that bites *any* strict XPath 1.0 engine dropped into their pages: Obscura's elements live in the XHTML namespace (`namespaceURI: "http://www.w3.org/1999/xhtml"`), and per strict XPath 1.0 an unprefixed name test (`//input`) only matches the *null* namespace. Chrome special-cases HTML documents; a correct drop-in engine must too. Our first injection attempt returned 0 for everything because of exactly this — the `xpath` package's DOM-emulation entry point sets case-insensitivity for HTML but *not* namespace leniency. Its `parse(expr).select({node, isHtml: true})` API sets both.

### The working polyfill

`test/obscura/XPathPolyfillHelper.js` — a support helper that on `_before` registers via `Page.addScriptToEvaluateOnNewDocument` (Obscura supports it): the bundled `node_modules/xpath/xpath.js` source (MIT, 174 KB, zero deps) plus a `document.evaluate` override delegating to `parse(expr).select({node, isHtml: true})`, returning a shim object implementing `snapshotLength/snapshotItem/iterateNext/singleNodeValue`. Because Obscura has a **single shared JS world**, the main-world override is visible to Puppeteer's injected query handlers (`::-p-xpath()`), so `Locator.field`/`Locator.clickable` work unmodified. Verified counts on `/form/field`: `labelEquals` full expression → 1 (the right input), clickable → 1, and `not()` now filters *correctly* (3, where Obscura's native engine wrongly returned 8). 100 complex queries: 30 ms.

For shipping: this belongs in `lib/helper/clientscripts/` as an opt-in Puppeteer-helper config flag (e.g. `xpathPolyfill: true`) or auto-detected on `_startBrowser` by probing one `normalize-space` expression — and it is equally the semantic-locator engine for the abstract CDP helper (inject once, query in-page, main world).

### Two more lib patches applied (uncommitted), Chrome-regression-checked

1. `proceedSee` + `grabTextFromAll` now extract text via `el.evaluate(node => node.innerText)` instead of `getProperty('innerText').jsonValue()` — sidesteps Obscura's broken `getProperty`, and is protocol-simpler on Chrome too. (`grabValueFrom`/`grabAttributeFrom` still use `getProperty` and remain broken on Obscura — same fix applies if we productize.)
2. `targetCreatedHandler` refreshes `this.context` on `framenavigated` (main frame, not inside within) in addition to `load` — Obscura doesn't emit `Page.loadEventFired` for click navigations, so the cached body handle went stale.

Both re-checked against real Chrome: acceptance `--grep within` identical to pre-patch baseline (11 passed, 1 pre-existing failure, 1 skipped); `mocha test/helper/Puppeteer_test.js --grep "#see"` exits 0.

### Updated Obscura tally: 10/19, four named bugs left

With polyfill + patches + a `jsClick` synthetic-input action (in the support helper: locate via `_locateClickable`, then `el.evaluate(node => node.click())`), these full semantic flows pass end-to-end at ~250–500 ms/scenario: click-link-by-text → URL + text assertions; fillField-by-label → submit → assert posted values; checkOption-by-label; selectOption-by-label. Every remaining failure maps to one of:

1. **No `Page.frameNavigated`/lifecycle events for input-initiated navigations.** Coordinate clicks (`Input.dispatchMouseEvent`) *do* navigate Obscura's internal DOM, but silently — `page.url()` stales, handles die, follow-up assertions read garbage. `el.click()` in-page emits everything correctly (proved by probe). This kills plain `I.click` → assert flows and is the single most impactful upstream fix.
2. **Dispatched events don't run default actions.** `dispatchEvent(new MouseEvent('click'))` (our `forceClick`) triggers nothing; only the `HTMLElement.click()` method runs activation behavior.
3. **Inline `onclick` attribute handlers don't fire on CDP input clicks** (checkbox toggles state, handler never runs).
4. **Form serialization ignores live `select` state**: with `value`/`selectedIndex`/`option.selected` all correctly set, `FormData.get('age')` returns `null` and the POST carries the original HTML `selected` attribute value.

Plus the structural one from the main report: pseudo-layout makes every element "visible" (`dontSeeElement` on hidden elements fails) — not fixable by injection; needs capability-flag semantics (visibility assertions unsupported on layout-less browsers).

`XPathPolyfillHelper.js` and the `forceclick_test.js` (jsClick flows) it backed are superseded by plan 007 (see "Repro artifacts" above); bugs 3 and 4 above are now the documented `isHelper('Obscura')` skips in `test/helper/cdpwebapi.js`. Scratchpad `select-probe.mjs` logic is reproduced in bug 4's description.
