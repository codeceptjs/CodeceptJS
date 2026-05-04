# CodeceptJS MCP Server

Model Context Protocol (MCP) server for CodeceptJS. Lets AI agents drive a CodeceptJS browser session — list tests, run arbitrary `I.*` code, pause-and-poke through a scenario, capture artifacts, and read aiTrace markdown — all in-process, sharing one browser and one container.

## Overview

The MCP server exposes the following tools:

- `list_tests` / `list_actions` — enumerate tests and `I.*` methods
- `start_browser` / `stop_browser` — open / close the session (only place plugin overrides go)
- `run_code` — run arbitrary JS with `I` and the full CodeceptJS scope; captures steps, console, return value, and a settled-state snapshot
- `snapshot` — capture URL/HTML/ARIA/screenshot/console/storage at any moment
- `run_test` — run a specific scenario; supports `pauseAt` for programmatic breakpoints
- `run_step_by_step` — pause after every step
- `continue` — release a paused test (run-to-end, run-to-next-pause, or run-to-finish)
- `cancel` — abort the in-progress / paused run without closing the browser

## Invocation

Two ways to launch the server:

- `npx codeceptjs-mcp` — the published bin
- `node node_modules/codeceptjs/bin/mcp-server.js` — direct path, useful for editor / agent configs

> ⚠️ **Run from the project's local `codeceptjs`, never a global install.**
> The MCP server resolves helpers, plugins, page objects, and custom support from the project's `node_modules`. A globally installed `codeceptjs` won't see project-local helpers (`@codeceptjs/helper`, `@codeceptjs/configure`, custom plugins) or your `include:` support objects, and per-project versions can drift from the global one. Always invoke via `npx codeceptjs-mcp` from inside the project directory, or point your MCP client config at `<project>/node_modules/codeceptjs/bin/mcp-server.js` directly.

## Configuration

Set up the MCP server in your client (Claude Desktop, Cursor, Continue, etc.):

### Basic

```json
{
  "mcpServers": {
    "codeceptjs": {
      "command": "npx",
      "args": ["codeceptjs-mcp"]
    }
  }
}
```

The server looks for `codecept.conf.js` (then `.cjs`) in the current working directory.

### With env vars

```json
{
  "mcpServers": {
    "codeceptjs": {
      "command": "npx",
      "args": ["codeceptjs-mcp"],
      "env": {
        "CODECEPTJS_CONFIG": "/absolute/path/to/codecept.conf.js",
        "CODECEPTJS_PROJECT_DIR": "/absolute/path/to/project"
      }
    }
  }
}
```

| Variable | Description |
|----------|-------------|
| `CODECEPTJS_CONFIG` | Absolute path to `codecept.conf.js`. Overrides cwd lookup. |
| `CODECEPTJS_PROJECT_DIR` | Absolute path to the project root. Used as the resolution base for the config file. |

## Session Defaults

When the session starts, the MCP server enforces two plugin defaults so the agent gets useful telemetry out of the box:

- **`aiTrace: { enabled: true, on: 'step' }`** — every step persists DOM/ARIA/screenshot/console artifacts to `output/trace_<TestName>_<hash>/`. Each scenario's `traceFile` is returned in run results so the agent can `Read` the markdown directly.
- **`browser: { enabled: true, show: false }`** — headless. Switch to headed via `start_browser` `plugins` arg.

Both can be overridden (or disabled) via `start_browser`'s `plugins` argument. The `codecept.conf.js`'s own plugin config still merges in for keys the user explicitly set there.

## Available Tools

### `start_browser`

Initializes the session — loads config, builds the container, opens the browser, kicks off the synthetic test scope so `run_code` and `snapshot` work. This is the only tool that customizes initialization; every other tool either uses the active session or auto-inits with project defaults.

**Parameters:**
- `config` (string, optional) — absolute path to `codecept.conf.js`. Defaults to `$CODECEPTJS_CONFIG`, then `./codecept.conf.js` in `$CODECEPTJS_PROJECT_DIR` or cwd.
- `plugins` (object, optional) — plugin configs keyed by name. Same shape as `plugins` in `codecept.conf.js`; `enabled: true` is added automatically. Most useful entries:
  - `{ browser: { show: true } }` — visible browser
  - `{ browser: { browser: "firefox", windowSize: "1280x720" } }` — switch browser + viewport
  - `{ aiTrace: { enabled: false } }` — disable per-step trace overhead on a re-run
  - `{ pause: { on: "fail" } }` / `{ screenshot: { on: "step" } }` — any other plugin works the same way

**Returns:**
```json
{
  "status": "Session started — run_code and snapshot are now available",
  "plugins": { "browser": { "show": false } }
}
```

### `stop_browser`

Closes the browser handles, drops the synthetic test scope, but **keeps the container, codecept, and Mocha alive**. Subsequent `start_browser` reopens the browser without rebuilding everything — important because ESM-loaded test files don't re-execute their top-level `Scenario(...)` on reload, so a fresh Mocha would have no suites.

**Parameters:** none

**Returns:**
```json
{ "status": "Browser stopped — Mocha and config preserved; call start_browser to reopen" }
```

### `cancel`

Aborts the currently paused or in-progress test run **without closing the browser**. Use when you want to bail out of a paused test and start something else. Mocha + container stay alive; the next `run_test` / `run_step_by_step` works immediately.

**Parameters:** none

**Returns:**
```json
{ "status": "Run cancelled — browser kept open" }
```

### `list_tests`

Lists all tests resolved from the project's `tests:` glob.

**Parameters:** none

**Returns:**
```json
{
  "count": 5,
  "tests": [
    { "file": "/abs/path/to/work_orders_test.js", "relativePath": "work_orders_test.js" }
  ]
}
```

### `list_actions`

Lists every `I.*` method from enabled helpers and support objects.

**Parameters:** none

**Returns:**
```json
{
  "count": 120,
  "actions": [
    { "helper": "Playwright", "action": "amOnPage", "signature": "I.amOnPage(url)" },
    { "helper": "SupportObject", "action": "loginAsAdmin", "signature": "I.loginAsAdmin()" }
  ]
}
```

### `run_code`

Run arbitrary JavaScript inside the live test scope. Captures steps, console output, return value, and a final-state snapshot.

**Parameters:**
- `code` (string, required) — JS source. Use `await` on `I.*` calls.
- `timeout` (number, optional) — ms (default `60000`).
- `saveArtifacts` (boolean, optional) — capture final-state artifacts (default `true`).
- `settleMs` (number, optional) — wait this many ms after the code finishes before capturing artifacts (default `300`). Bump to `1000`+ for slow re-renders, `0` to skip.

**Scope (everything reachable as a bare identifier in `code`):**

| Symbol | Source |
|--------|--------|
| `I` | The actor (with all helper methods) |
| Custom support objects | `include:` in `codecept.conf.js` (e.g. page objects, `login` from `auth` plugin) |
| `locate`, `within`, `session`, `secret`, `inject`, `pause`, `share` | from `codeceptjs` |
| `tryTo`, `retryTo`, `hopeThat` | from `codeceptjs/effects` |
| `step` | from `codeceptjs/steps` |
| `element`, `eachElement`, `expectElement`, `expectAnyElement`, `expectAllElements` | from `codeceptjs/els` |
| `container` | the DI container |
| `helpers` | live helpers map (e.g. `helpers.Playwright.page` for raw Playwright access) |

The full live list is returned in every response under `availableObjects`.

**Return-value handling:**
- An explicit `return X` is JSON-stringified (with circular-ref handling). Capped at 20 KB.
- If you forget `return`, the last grabbed step value is returned automatically (`await I.grabTitle()` on the last line works).
- A returned `WebElement` (or array of them, from `I.grabWebElement(s)`) is auto-described to a plain object: `{ text, html, visible, enabled, attrs }`.

**Returns:**
```json
{
  "status": "success",
  "output": "Code executed successfully",
  "error": null,
  "commands": ["I am on page \"/\"", "I grab text from \"h1\""],
  "logs": [{ "level": "log", "message": "headline Welcome", "t": 47 }],
  "returnValue": "{\n  \"url\": \"http://localhost:8000/\",\n  \"text\": \"Welcome\"\n}",
  "availableObjects": ["I", "container", "eachElement", "element", "expectAllElements", "expectAnyElement", "expectElement", "helpers", "hopeThat", "inject", "locate", "login", "pause", "retryTo", "secret", "session", "share", "step", "tryTo", "within"],
  "artifacts": {
    "url": "http://localhost:8000/",
    "html": "file:///output/trace_run_code_.../mcp_page.html",
    "aria": "file:///output/trace_run_code_.../mcp_aria.txt",
    "screenshot": "file:///output/trace_run_code_.../mcp_screenshot.png",
    "console": "file:///output/trace_run_code_.../mcp_console.json",
    "storage": "file:///output/trace_run_code_.../mcp_storage.json",
    "cookieCount": 3,
    "localStorageCount": 5
  },
  "ariaDiff": "...",
  "dir": "/output/trace_run_code_...",
  "traceFile": "file:///output/trace_run_code_.../trace.md"
}
```

- `traceFile` — markdown summary of this call. `Read` it for full context.
- `ariaDiff` — present when the call mutated the page; diff between the previous aiTrace ARIA snapshot and the new one.
- `aiTraceHint` — appears when aiTrace is disabled, suggesting how to re-enable it.

**Example:**
```json
{
  "name": "run_code",
  "arguments": {
    "code": "await I.amOnPage('/'); const t = await I.grabTextFrom('h1'); return { url: await I.grabCurrentUrl(), text: t };"
  }
}
```

### `snapshot`

Capture the current browser state without performing any action.

**Parameters:**
- `fullPage` (boolean, optional) — full-page screenshot (default `false`).
- `settleMs` (number, optional) — wait before capture (default `300`).

**Returns:**
```json
{
  "status": "success",
  "dir": "/output/snapshot_1700000000000_abcd1234",
  "traceFile": "file:///output/snapshot_.../trace.md",
  "artifacts": {
    "url": "http://localhost:8000/dashboard",
    "html": "file:///output/snapshot_.../snapshot_page.html",
    "aria": "file:///output/snapshot_.../snapshot_aria.txt",
    "screenshot": "file:///output/snapshot_.../snapshot_screenshot.png",
    "console": "file:///output/snapshot_.../snapshot_console.json",
    "storage": "file:///output/snapshot_.../snapshot_storage.json",
    "cookieCount": 3,
    "localStorageCount": 5
  }
}
```

### `run_test`

Run a specific scenario. Returns reporter JSON with one entry per scenario; each entry has a `traceFile` (file:// URL) pointing to the per-scenario aiTrace markdown — `Read` it on failures to see the failing step's DOM/ARIA/screenshot.

If the test calls `pause()` — or if `pauseAt` matches a step — returns early with `status: "paused"` so the agent can inspect via `run_code` and release with `continue` (or abort with `cancel`).

**Parameters:**
- `test` (string, required) — file path or partial test name; resolved to a single test file.
- `timeout` (number, optional) — overall ms (default `60000`).
- `grep` (string, optional) — filter scenarios by title; passed to `mocha.grep`. Mirrors `--grep` on the CLI.
- `pauseAt` (number | string, optional) — programmatic breakpoint. Either:
  - `number` — 1-based step index (test pauses after the Nth step completes)
  - `string` — case-insensitive substring match against step name
  - `"/regex/i"` — regex literal (the `/.../i` form is honored verbatim)

**Returns (completed normally):**
```json
{
  "status": "completed",
  "file": "/path/to/test.js",
  "reporterJson": {
    "stats": { "tests": 1, "passes": 1, "failures": 0 },
    "tests": [
      {
        "title": "lists materials",
        "file": "/path/to/materials_test.js",
        "status": "passed",
        "duration": 4123,
        "traceFile": "file:///output/trace_materials__lists_materials_xxxx/trace.md"
      }
    ]
  },
  "error": null
}
```

**Returns (paused):**
```json
{
  "status": "paused",
  "file": "/path/to/test.js",
  "pausedAfter": { "index": 7, "name": "I select option {\"css\":\"main select\"}, \"Flux\"", "status": "success" },
  "page": { "url": "https://app.example.com/materials", "title": "Materials", "contentSize": 18432 },
  "suggestions": [
    "Call snapshot to capture URL/HTML/ARIA/screenshot/console/storage at this point",
    "Call run_code to inspect or manipulate state (e.g. return await I.grabText(\"h1\"))",
    "Call continue to release the pause and let the test run the next step (or finish)"
  ]
}
```

**Examples:**
```json
{ "name": "run_test", "arguments": { "test": "checkout_test", "pauseAt": 5 } }
{ "name": "run_test", "arguments": { "test": "checkout_test", "pauseAt": "fill field" } }
{ "name": "run_test", "arguments": { "test": "checkout_test", "pauseAt": "/grab.*url/i" } }
```

### `run_step_by_step`

Run a test interactively, pausing after every step. The agent advances with `continue` or inspects with `run_code` / `snapshot`.

**Parameters:**
- `test` (string, required)
- `timeout` (number, optional)
- `grep` (string, optional)
- `plugins` (object, optional) — same as `start_browser`. Most useful is `{ browser: { show: true } }` so you can watch the run between pauses.

**Returns (after each step):**
```json
{
  "status": "paused",
  "file": "/path/to/test.js",
  "pausedAfter": { "index": 1, "name": "I am on page \"/\"", "status": "success" },
  "page": { "url": "http://localhost:8000/", "title": "Test App", "contentSize": 1832 },
  "suggestions": [...]
}
```

**Returns (after the last step):** same shape as `run_test`'s completed response — every scenario carries its `traceFile`.

### `continue`

Release a paused test. The test runs until the next pause (`run_step_by_step`), the next `pause()` call, or completion.

**Parameters:**
- `timeout` (number, optional) — ms to wait for the next pause / completion (default `60000`).

**Returns (re-paused):** same shape as `run_test`'s paused response, with the new `pausedAfter` index.

**Returns (completed):** same shape as `run_test`'s completed response.

## Pause-and-poke flow

```json
{ "name": "run_step_by_step", "arguments": { "test": "checkout_test" } }
// → { "status": "paused", "pausedAfter": { "index": 1, ... } }

{ "name": "snapshot", "arguments": {} }
// → full artifact bundle for step 1

{ "name": "run_code", "arguments": { "code": "return await I.grabCurrentUrl()" } }
// → { "status": "success", "returnValue": "http://...", "artifacts": { ... } }

{ "name": "run_code", "arguments": { "code": "await I.click('Save')" } }
// → { "status": "success", ... } — actually mutates the live page

{ "name": "continue", "arguments": {} }
// → { "status": "paused", "pausedAfter": { "index": 2, ... } }

// ... or bail out:
{ "name": "cancel", "arguments": {} }
// → { "status": "Run cancelled — browser kept open" }
```

Notes:
- Pause runs in-process: `run_code` and the test share the same `I` / browser. There's no subprocess, no IPC.
- `run_test` / `run_step_by_step` / `continue` silence stdout/stderr while running so step output doesn't interleave with the MCP JSON-RPC stream.
- TTY behaviour is unchanged — `npx codeceptjs run --debug` at a terminal still opens the readline REPL when `process.stdin.isTTY` is true. The MCP server only intercepts pause when its handler is registered.

## Trace files (aiTrace)

When `aiTrace` is on (the default for MCP sessions), every step in a scenario produces:

```
output/
└── trace_Materials__lists_materials_<hash>/
    ├── 0001_<step>_screenshot.png
    ├── 0001_<step>_page.html       # minified → trash classes/scripts/styles stripped → beautified
    ├── 0001_<step>_aria.txt        # Playwright only
    ├── 0001_<step>_console.json
    ├── 0002_...
    └── trace.md                    # AI-friendly markdown index
```

`run_test` / `run_step_by_step` results expose the `trace.md` URL per scenario (`reporterJson.tests[].traceFile`) — `Read` it on failure to see exactly what the failing step saw.

For ad-hoc `run_code` / `snapshot` runs, only a single set of artifacts is produced (`mcp_*` / `snapshot_*` prefix), packaged with their own `trace.md`.

### `trace.md` shape

```markdown
# Test: Login functionality

**Status**: failed
**File**: tests/login_test.js

## Steps

1. **I.amOnPage("/login")** — passed (150ms)
2. **I.fillField("#username", "user")** — passed (80ms)
3. **I.click("#login")** — passed (100ms)
4. **I.see("Welcome")** — failed (50ms)

## Error

Element "Welcome" not found

## Artifacts

- Screenshot: 0004_screenshot.png
- HTML: 0004_page.html
- ARIA: 0004_aria.txt
```

## HTML formatting

Every HTML snapshot saved by the MCP server (and the `aiTrace` / `pageInfo` plugins, since they all funnel through `captureSnapshot` in `lib/utils/trace.js`) goes through:

1. **Minify** (`html-minifier-terser`) — strip comments, collapse whitespace, drop redundant attributes.
2. **Clean** — drop `<style>`, `<noscript>`, and inline `<script>` (no `src`); keep `<script src="...">`; strip trash class names (Tailwind utilities, framework hashes, `xl:hidden`-style scoped classes); drop `style="..."` attributes. Semantic attributes (`id`, `aria-*`, `data-*`, `role`, `href`, `src`, `alt`, `title`, `name`) are preserved.
3. **Beautify** (`js-beautify`) — re-indent at 2 spaces; keep inline elements with their text.

Result: a multi-line, low-noise HTML doc that's far cheaper for an LLM to reason about than raw page source.

## Storage state

For Playwright, `captureSnapshot` calls `helper.grabStorageState()`. For Puppeteer / WebDriver, it falls back to `helper.grabCookie()` plus an `executeScript` walking `window.localStorage`. Both produce the same shape (`{ cookies: [...], origins: [{ origin, localStorage: [...] }] }`).

Storage capture is **enabled** for `run_code`, `snapshot`, `run_step_by_step` fallback, and `pageInfo`. **Disabled per-step in aiTrace** — cookies / localStorage rarely change between actions, and per-step files would just be noise.

## Architecture

- **In-process.** No subprocess, no IPC. The MCP tool calls and the running test share one container, one helper, one browser.
- **Synthetic test scope.** On first init the server emits `suite.before` + `test.before` and calls each helper's `_beforeSuite` + `_before`, so `run_code` / `snapshot` have a live `helper.page` to act on.
- **Mocha is reused.** `cleanReferencesAfterRun` is forced to `false` (Mocha 11's constructor ignores the option, so the setter is called explicitly). `stop_browser` closes the browser but keeps Mocha alive — re-running `run_test` after `start_browser` works without ESM cache invalidation tricks.
- **Locking.** `run_test` / `run_step_by_step` use a single-call lock so concurrent runs can't trample each other.

## Troubleshooting

### Server doesn't start

- Node 18+ recommended.
- Verify the path / `npx` resolution in your client config.

### Config not found

- Set `CODECEPTJS_CONFIG` to the absolute path of `codecept.conf.js` (or `.cjs`).
- Set `CODECEPTJS_PROJECT_DIR` if your config lives outside cwd.

### Tests not found

- Confirm the project's `tests:` glob in `codecept.conf.js` matches your files.
- `list_tests` runs from the same project — if it returns `[]`, the config is the issue, not MCP.

### Browser launch issues

- Playwright requires its browsers installed (`npx playwright install`).
- For visible runs use `start_browser` with `plugins={ browser: { show: true } }` — the default is headless.

### Tests stuck or timing out

- Bump `timeout` per call.
- Check that the app under test is actually reachable.
- For long re-renders that confuse `snapshot` / `run_code`'s artifact capture, raise `settleMs` (default `300`).

## Security

- The MCP server runs with the same permissions as the calling process.
- `run_code` runs arbitrary JavaScript in the project context — only expose to trusted agents / environments.
- Environment variables may contain absolute project paths; treat them like any other config.

## Contributing

When changing the MCP server:

1. Add coverage in `test/mcp/mcp_server_test.js`.
2. Update this doc with new tools / parameters.
3. Verify against a real project (e.g. the `examples/playwright/` setup) — the in-process recorder + lifecycle integration is sensitive to ordering.
4. Test with both Playwright and Puppeteer.

## License

MIT
