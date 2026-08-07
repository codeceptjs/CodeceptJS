---
permalink: /alternative-browsers
title: Alternative Browser Engines
---

# Alternative Browser Engines

Playwright and Puppeteer drive full Chromium — the most accurate way to test what users see.
But a new class of lightweight, agent-era browsers has appeared, and CodeceptJS can drive them
through the `CDPBrowser` helper family:

- **[Obscura](https://github.com/h4ckf0r0day/obscura)** — an open-source Rust browser with a real
  V8 engine but no rendering. A single 70 MB binary, ~30 MB RAM per instance, page loads in
  tens of milliseconds.
- **[Kitesurf](https://blog.cloudflare.com/kitesurf/)** — Cloudflare's browser that runs in V8
  isolates on Cloudflare Workers, with a real layout and rendering pipeline. Cloud-only,
  free in beta, planned to be open-sourced.

Both speak Chrome DevTools Protocol. CodeceptJS drives them with raw CDP — one round-trip per
action, no stale element handles — which is why suites on these browsers run fast and never hang
on navigation races.

## When are they better than Playwright?

**Smoke suites where seconds matter.** An Obscura scenario (navigate, fill a form, submit,
assert) completes in 150–500 ms. There is no browser binary to download in CI — a 70 MB
static binary starts instantly. If your PR gate runs 50 smoke scenarios, Obscura turns
minutes into seconds.

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

**Constrained environments.** ARM CI runners, thin containers, air-gapped machines:
a static binary with no system dependencies goes where Chromium will not.

**Scraping-grade network realism.** Obscura's stealth mode presents a consistent Chrome TLS
fingerprint — useful when your tests must pass through bot-protection layers that block
headless Chromium.

## When to stay with Playwright

- Anything visual: screenshots, visual regression, PDF (Obscura cannot; Kitesurf can).
- Visibility semantics: on Obscura every element reports as visible — `seeElement`/`dontSeeElement`
  throw and point you to `seeElementInDOM`.
- Complex input: drag-and-drop, hover chains, file uploads, iframes, multi-tab, service workers.
- Cross-browser coverage (Firefox, WebKit).
- Testing local apps with Kitesurf: the cloud browser must reach your app; use a tunnel
  (`cloudflared tunnel --url http://localhost:3000`) or a deployed environment.

## Configuration

    helpers: {
      Obscura: {
        url: 'http://localhost:3000',
        binaryPath: '/usr/local/bin/obscura',
      },
    }

    helpers: {
      Kitesurf: {
        url: 'https://staging.myapp.com',
        accountId: process.env.CF_ACCOUNT_ID,
        apiToken: process.env.CF_API_TOKEN,
      },
    }

Any other CDP endpoint works through the base helper:

    helpers: {
      CDPBrowser: {
        url: 'http://localhost:3000',
        endpoint: 'http://127.0.0.1:9222',
      },
    }

## Capability matrix

| | Playwright | Obscura | Kitesurf |
|---|---|---|---|
| Real JS execution (V8) | yes | yes | yes |
| Layout / getBoundingClientRect | yes | synthetic | yes |
| Screenshots | yes | no | yes |
| Visibility assertions | yes | no (DOM-presence only) | yes |
| Startup cost | seconds + ~300 MB install | instant, 70 MB binary | ~1 s, zero local |
| Parallel scale | machine-bound | machine-bound (light) | near-unlimited (cloud) |
| Where it runs | local/grid | local | Cloudflare only |
| License / cost | open source | Apache-2.0 | proprietary, free beta |

See helper reference pages: [CDPBrowser](/helpers/CDPBrowser), [Obscura](/helpers/Obscura),
[Kitesurf](/helpers/Kitesurf).
