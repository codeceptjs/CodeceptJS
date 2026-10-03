---
permalink: /alternative-browsers
title: Alternative Browser Engines
---

# Alternative Browser Engines

::: warning Experimental
The `Obscura`, `Lightpanda` and `Kitesurf` helpers are experimental. Keep a Playwright or WebDriver job for compatibility-critical tests.
:::

Playwright drives full Chromium, Firefox and WebKit: the most accurate way to test what users see, at the cost of a heavy browser per worker. Alternative engines trade part of that accuracy for speed, a small footprint, or cloud scale. They are a good fit for functional tests (text appears, form submits, redirect happens, cookie is set) and a poor one for anything visual.

Your tests do not change. `I.amOnPage`, `I.click`, `I.fillField`, `I.see`, `I.seeElement` and the rest of the `I.*` web API work the same; you only swap the helper in the config. All engines below speak Chrome DevTools Protocol, so there is no `npx playwright install` step.

Compared to Playwright, none of them supports iframes (`switchTo`), multiple tabs, popups, `dragAndDrop`, `moveCursorTo`, or Playwright-only APIs such as `usePlaywrightTo` and `mockRoute`. Tag scenarios that need those and skip them on the alternative engine:

```sh
npx codeceptjs run --grep @playwright-only --invert
```

To see which `I.*` actions the configured engine supports:

```sh
npx codeceptjs list
```

## Obscura

[Obscura](https://github.com/h4ckf0r0day/obscura) is a lightweight open-source browser with a real V8 engine and its own rendering engine, distributed as a single binary for Linux, macOS and Windows. Unlike Lightpanda it renders: layout, visibility checks, screenshots and the `screencast` plugin work.

Limitations:

- `attachFile` does not upload files.
- Clicks inside nested shadow DOM do not work.
- `focus` and `blur` have no effect.
- Clipboard actions do not work.
- A `<select multiple>` submits only its first selected option.
- An element inside a `visibility: hidden` parent is reported as visible.
- Some computed styles (`cursor`, `user-select`) differ from Chromium.
- Rich text editors TinyMCE, Trix, Monaco and ProseMirror do not work.

### Setup

Install Obscura following the [official instructions](https://github.com/h4ckf0r0day/obscura#installation) and put `obscura` on `PATH`. Then enable the helper:

```js
// codecept.conf.js
export const config = {
  helpers: {
    Obscura: {
      url: 'http://localhost:3000',
    },
  },
}
```

If the binary is not on `PATH`, set `binaryPath` in the config or the `OBSCURA_PATH` environment variable.

### Usage

```sh
npx codeceptjs run
```

The helper starts `obscura serve` on a free port before the first test and stops it after the last one, like Playwright manages Chromium. Each worker gets its own instance:

```sh
npx codeceptjs run-workers 8
```

To connect to an Obscura you started yourself, set `endpoint`; the helper then never starts or stops it:

```sh
obscura serve --port 9222 --allow-private-network --allow-file-access
```

```js
Obscura: {
  url: 'http://localhost:3000',
  endpoint: 'http://127.0.0.1:9222',
}
```

All options: [Obscura helper reference](/helpers/Obscura).

## Lightpanda

[Lightpanda](https://lightpanda.io) is an open-source headless browser built from scratch for automation. It runs your app's JavaScript in V8 but never paints anything, which makes it start in milliseconds and use a fraction of Chromium's memory. It computes enough layout for `seeElement`, `waitForVisible` and other visibility checks.

Limitations:

- No screenshots: `saveScreenshot`, failure screenshots and the `screencast` plugin do not work.
- No scrolling: `scrollTo` and `scrollPageToBottom` have no effect.
- `clickXY` does not work.
- Clipboard actions do not work.
- Computed styles cover `display`, `visibility` and `opacity`; other CSS properties are unreliable.
- Rich text editors TinyMCE, Trix and Monaco do not work.
- Linux and macOS only; on Windows use WSL2.
- Licensed under AGPL-3.0. It runs as a separate process, so it does not affect the license of your tests.

### Setup

Install Lightpanda following the [official instructions](https://lightpanda.io/docs/open-source/installation) and put `lightpanda` on `PATH`. Then enable the helper:

```js
// codecept.conf.js
export const config = {
  helpers: {
    Lightpanda: {
      url: 'http://localhost:3000',
    },
  },
}
```

If the binary is not on `PATH`, set `binaryPath` in the config or the `LIGHTPANDA_PATH` environment variable.

### Usage

```sh
npx codeceptjs run
```

The helper starts `lightpanda serve` on a free port with telemetry turned off, and stops it after the last test. Each worker gets its own instance:

```sh
npx codeceptjs run-workers 8
```

To connect to a Lightpanda you started yourself, set `endpoint`; the helper then never starts or stops it:

```sh
LIGHTPANDA_DISABLE_TELEMETRY=true lightpanda serve --host 127.0.0.1 --port 9222
```

```js
Lightpanda: {
  url: 'http://localhost:3000',
  endpoint: 'http://127.0.0.1:9222',
}
```

All options: [Lightpanda helper reference](/helpers/Lightpanda).

## Kitesurf

[Kitesurf](https://blog.cloudflare.com/kitesurf/) is Cloudflare's browser running on Cloudflare Workers, with a real layout and rendering pipeline. Sessions start in about a second and nothing runs on your machine, so the number of parallel browsers is limited only by how far your suite splits.

Limitations:

- Cloud only, currently a free beta.
- The browser cannot reach `localhost`: test a deployed environment or expose your app with a tunnel such as `cloudflared tunnel --url http://localhost:3000`.

### Setup

Enable [Cloudflare Browser Run](https://developers.cloudflare.com/browser-run/) and create an API token with the **Browser Rendering → Edit** permission. Export the credentials:

```sh
export CF_ACCOUNT_ID=your-account-id
export CF_API_TOKEN=your-api-token
```

Then enable the helper:

```js
// codecept.conf.js
export const config = {
  helpers: {
    Kitesurf: {
      url: 'https://staging.myapp.com',
    },
  },
}
```

### Usage

Every worker opens its own cloud session:

```sh
npx codeceptjs run-workers 16
```

All options: [Kitesurf helper reference](/helpers/Kitesurf).
