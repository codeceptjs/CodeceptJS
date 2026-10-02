---
permalink: /alternative-browsers
title: Alternative Browser Engines
---

# Alternative Browser Engines

::: warning Experimental
The `Obscura`, `Lightpanda` and `Kitesurf` helpers are experimental in CodeceptJS 4.2. Pin browser versions in CI and retain Playwright or WebDriver coverage for compatibility-critical tests.
:::

Playwright and Puppeteer drive full Chromium — the most accurate way to test what users see.
But a new class of lightweight, agent-era browsers has appeared, and CodeceptJS can drive them
through dedicated helpers:

- **[Obscura](https://github.com/h4ckf0r0day/obscura)** — an open-source Rust browser with a real
  V8 engine. From v0.2.0, the default release build also renders — real layout, computed styles,
  and screenshots — with `-no-render` builds still available for pure-speed, nothing-painted
  scraping mode. Release archives are available for Linux, macOS, and Windows.
- **[Lightpanda](https://lightpanda.io)** — an open-source browser written from scratch in Zig for
  automation, with a real V8 engine and broad Web API coverage. It never paints: no screenshots,
  but it does compute enough style and layout for visibility checks. Binaries are available for
  Linux and macOS.
- **[Kitesurf](https://blog.cloudflare.com/kitesurf/)** — Cloudflare's browser that runs in V8
  isolates on Cloudflare Workers, with a real layout and rendering pipeline. Cloud-only,
  free in beta, planned to be open-sourced.

All of them speak Chrome DevTools Protocol. CodeceptJS drives them with raw CDP — one round-trip per
action, no stale element handles — which is why suites on these browsers run fast and never hang
on navigation races.

## Try Lightpanda with your Playwright suite

If your suite already runs on the Playwright helper, you can point the same tests at Lightpanda
without changing them: `I.amOnPage`, `I.click`, `I.fillField`, `I.see`, `I.seeElement`,
`I.waitForVisible` and the rest of the `I.*` web API behave the same. There is no
`npx playwright install` step and no Chromium download — Lightpanda is a single binary.

**1. Get the binary.** Lightpanda ships for Linux and macOS; on Windows use WSL2.

    # Linux x64
    curl -L -o lightpanda https://github.com/lightpanda-io/browser/releases/download/1.0.0/lightpanda-x86_64-linux

    # macOS Apple Silicon
    curl -L -o lightpanda https://github.com/lightpanda-io/browser/releases/download/1.0.0/lightpanda-aarch64-macos

    chmod +x lightpanda
    sudo mv lightpanda /usr/local/bin/

Other builds (`lightpanda-aarch64-linux`, `lightpanda-x86_64-macos`) are on the
[releases page](https://github.com/lightpanda-io/browser/releases).

You don't have to put it on `PATH`. Keep the binary anywhere and tell the helper where it is,
the way Playwright's `executablePath` points at a custom browser — either in the config:

    helpers: {
      Lightpanda: {
        url: 'http://localhost:3000',
        binaryPath: './bin/lightpanda',
      },
    }

or with an environment variable, handy when the location differs between machines:

    LIGHTPANDA_PATH=/opt/lightpanda/lightpanda npx codeceptjs run

The helper looks in this order: `binaryPath`, then `LIGHTPANDA_PATH`, then `lightpanda` on `PATH`.
A relative path is resolved from the directory you run `npx codeceptjs` in. A wrong path fails
the first test with `Failed to start lightpanda at <path>`.

**2. Add the helper next to Playwright.** Keep one config and choose the engine with an
environment variable, so Playwright stays the default:

    // codecept.conf.js
    const url = 'http://localhost:3000'

    export const config = {
      tests: './tests/*_test.js',
      output: './output',
      helpers:
        process.env.ENGINE === 'lightpanda'
          ? { Lightpanda: { url } }
          : { Playwright: { url, browser: 'chromium' } },
    }

That is the whole setup. There is no browser to start: the helper launches `lightpanda serve` on a
free port before the first test and stops it after the last one, the way the Playwright helper
manages Chromium.

**3. Run.**

    ENGINE=lightpanda npx codeceptjs run

    # each worker starts its own Lightpanda on its own port
    ENGINE=lightpanda npx codeceptjs run-workers 8

    # list every I.* action available on the active helper
    ENGINE=lightpanda npx codeceptjs list

**4. Leave out what Lightpanda cannot do.** Most functional tests pass unchanged. The ones that
will not are those relying on something only a full browser has:

| In your Playwright tests | On Lightpanda |
|---|---|
| `I.saveScreenshot`, visual regression, failure screenshots | not available — nothing is painted |
| `I.switchTo` (iframes), `I.openNewTab`, popups and dialogs | not available |
| `I.usePlaywrightTo`, `I.mockRoute`, downloads | Playwright-only |
| `I.dragAndDrop`, `I.moveCursorTo`, `I.clickXY` | not available — no coordinate input |
| `I.scrollTo`, `I.scrollPageToBottom` | no effect — there is no viewport to scroll |
| `I.grabCssPropertyFrom`, `I.seeCssPropertiesOnElements` | reliable only for `display`, `visibility`, `opacity` |
| clipboard actions | not available |
| TinyMCE, Trix, Monaco editors | do not finish loading |

Tag those scenarios once and exclude them from the Lightpanda run:

    Scenario('checkout page matches the design @visual', ({ I }) => { /* ... */ })

    ENGINE=lightpanda npx codeceptjs run --grep @visual --invert

**5. Run it in CI.** Download a pinned version and let the helper find it through `LIGHTPANDA_PATH`:

    # .github/workflows/e2e-lightpanda.yml
    - name: Download Lightpanda
      run: |
        curl -sfL -o lightpanda https://github.com/lightpanda-io/browser/releases/download/1.0.0/lightpanda-x86_64-linux
        chmod +x lightpanda
    - name: Run tests
      run: npx codeceptjs run --grep @visual --invert
      env:
        ENGINE: lightpanda
        LIGHTPANDA_PATH: ${{ github.workspace }}/lightpanda

Keep the Playwright job for the scenarios you excluded and for cross-browser coverage; use the
Lightpanda job as the fast first gate.

**Good to know**

- The helper starts Lightpanda with its usage telemetry turned off (`LIGHTPANDA_DISABLE_TELEMETRY=true`).
- Lightpanda is AGPL-3.0. It runs as a separate process, so it does not affect the license of your tests.
- Linux binaries need glibc, so Alpine-based images will not run them.
- Every option is listed in the [Lightpanda helper reference](/helpers/Lightpanda).

## When are they better than Playwright?

**Smoke suites where startup and execution time matter.** Obscura is distributed as a standalone
binary and is designed for lightweight browser automation. Benchmark it against your own pages and
CI environment before choosing it for a PR gate.

**Massive parallel scale.** Kitesurf sessions are Cloudflare Workers — they spawn in about a
second, cost nothing while idle, and there is no practical ceiling on how many you run at once.
Combined with `run-workers`, every worker acquires its own cloud browser:

    // codecept.conf.js — each worker independently loads the config,
    // so each one gets its own Kitesurf session automatically
    export const config = {
      helpers: {
        Kitesurf: {
          url: 'https://staging.myapp.com',
        },
      },
    }

    npx codeceptjs run-workers 16

Sixteen cloud browsers, zero local resources, feedback in the time of your slowest test.
Scale the number up as far as your suite can split — the browsers are no longer
the bottleneck, and your CI runner only coordinates.

**Testing the DOM, not the pixels.** Most functional assertions — text appears, form submits,
redirect happens, cookie is set — do not need a GPU raster pipeline. Obscura executes your
app's real JavaScript in real V8; it only skips painting. For API-adjacent flows
(login → dashboard data appears), that is exactly the right amount of browser.

Lightpanda takes the same trade further: it has no rendering pipeline at all, which is what makes
it start in milliseconds and use a fraction of Chromium's memory. Pick it when the suite never
needs a screenshot; pick Obscura when it does.

**Constrained environments.** ARM CI runners, thin containers, air-gapped machines:
a static binary with no system dependencies goes where Chromium will not.

**Optional stealth builds.** Obscura publishes separate `-stealth` archives. Treat their behaviour
as an Obscura capability rather than a browser-compatibility guarantee from CodeceptJS.

## When to stay with Playwright

- Anything visual: visual regression, PDF (none of these helpers exposes PDF output). Lightpanda
  has no screenshots at all, no scrolling, and only computes the CSS properties visibility checks
  need. Obscura's v0.2.0+ rendering/CSS engine is new and independently implemented — expect edge
  cases and gaps versus a real browser, especially around inherited properties and less common
  computed-style values.
- Visibility semantics on `-no-render` Obscura builds (and v0.1.x): every element reports as
  visible — `seeElement`/`dontSeeElement` throw and point you to `seeElementInDOM`. On v0.2.0+
  default builds, `CDPBrowser` detects the real layout engine per binary and visibility works
  normally.
- Complex input: drag-and-drop, hover chains, file uploads, iframes, multi-tab, service workers.
- Cross-browser coverage (Firefox, WebKit).
- Testing local apps with Kitesurf: the cloud browser must reach your app; use a tunnel
  (`cloudflared tunnel --url http://localhost:3000`) or a deployed environment.

## Configuration

CodeceptJS 4.2 is tested in CI with Obscura 0.2.2. Obscura 0.2.x is recommended; 0.1.x and
`-no-render` builds operate without layout, visibility assertions, or screenshots. See
[Installation](/installation#obscura-experimental) for platform-specific archive names.

    helpers: {
      Obscura: {
        url: 'http://localhost:3000',
      },
    }

    helpers: {
      Lightpanda: {
        url: 'http://localhost:3000',
      },
    }

    helpers: {
      Kitesurf: {
        url: 'https://staging.myapp.com',
        accountId: process.env.CF_ACCOUNT_ID,
        apiToken: process.env.CF_API_TOKEN,
      },
    }

### Obscura's three connection modes

Obscura manages its own `obscura serve` process, the same way Playwright manages its own browser
process — there is nothing to start by hand in the common case:

- **Self-launch (default)** — leave `endpoint` unset. The helper resolves a binary
  (`binaryPath` in the config, then `OBSCURA_PATH`, then `obscura` on `PATH`), spawns
  `obscura serve` on a free port, and kills it when the run ends. Not setting `port` is
  intentional: a free port is picked automatically, which is what makes `run-workers`
  collision-free — every worker gets its own instance without any config.

      helpers: {
        Obscura: {
          url: 'http://localhost:3000',
          binaryPath: '/usr/local/bin/obscura', // optional override, like Playwright's executablePath
        },
      }

- **Attach** — set `endpoint` explicitly to connect to an Obscura instance you manage yourself
  (already running locally, in a container, or on a remote host). The helper only connects; it
  never spawns or kills anything.

      helpers: {
        Obscura: {
          url: 'http://localhost:3000',
          endpoint: 'http://127.0.0.1:9222',
        },
      }

- **Courtesy-attach** — only relevant when `endpoint` is unset and no binary can be resolved
  either. If something is already answering on the conventional `http://127.0.0.1:9222`, the
  helper attaches to it (and, again, never kills it) instead of failing outright. This exists so
  that "start Obscura by hand and just run the tests" keeps working without any config, while
  self-launch is still the default for everyone else.

### Lightpanda's connection modes

Lightpanda has the same three modes, with `lightpanda` in place of `obscura`:

- **Self-launch (default)** — the binary is resolved from `binaryPath`, then `LIGHTPANDA_PATH`,
  then `lightpanda` on `PATH`; `lightpanda serve` is started on a free port and stopped when the
  run ends.
- **Attach** — set `endpoint` to use an instance you started yourself, locally or in a container:

      LIGHTPANDA_DISABLE_TELEMETRY=true lightpanda serve --host 127.0.0.1 --port 9222

      helpers: {
        Lightpanda: {
          url: 'http://localhost:3000',
          endpoint: 'http://127.0.0.1:9222',
        },
      }

  The helper only disables telemetry for processes it launches; set the variable yourself here. A
  browser running in a container must be able to reach the `url` under test.
- **Courtesy-attach** — with no `endpoint` and no binary, the helper attaches to whatever answers
  on `http://127.0.0.1:9222` and never kills it.

CodeceptJS is tested in CI with Lightpanda 1.0.0.

## Capability matrix

| | Playwright | Obscura | Lightpanda | Kitesurf |
|---|---|---|---|---|
| Real JS execution (V8) | yes | yes | yes | yes |
| Layout / getBoundingClientRect | yes | yes (v0.2.0+ default builds); synthetic on `-no-render`/v0.1.x | computed boxes, nothing painted | yes |
| Screenshots | yes | yes (v0.2.0+ default builds); no on `-no-render`/v0.1.x | no | yes |
| Visibility assertions | yes | yes (v0.2.0+ default builds); no, DOM-presence only, on `-no-render`/v0.1.x | yes | yes |
| Screencast / video (`screencast` plugin) | yes — WebM via `page.screencast`, with caption burn-in | yes — APNG via CDP `Page.startScreencast`, assembled in-process (v0.2.0+ default builds; verified PNG frames on the live server); no caption burn-in | no | untested |
| Startup model | local browser process | standalone local binary | standalone local binary | remote cloud session |
| Parallel scale | machine-bound | machine-bound (light) | machine-bound (light) | near-unlimited (cloud) |
| Where it runs | local/grid | local | local (Linux, macOS) | Cloudflare only |
| License / cost | open source | Apache-2.0 | AGPL-3.0 | proprietary, free beta |

See helper reference pages: [Obscura](/helpers/Obscura), [Lightpanda](/helpers/Lightpanda), [Kitesurf](/helpers/Kitesurf).
