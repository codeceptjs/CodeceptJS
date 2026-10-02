---
permalink: /alternative-browsers
title: Alternative Browser Engines
---

# Alternative Browser Engines

::: warning Experimental
The `Lightpanda`, `Obscura` and `Kitesurf` helpers are experimental. Keep a Playwright or WebDriver job for compatibility-critical tests.
:::

Your tests stay the same. `I.amOnPage`, `I.click`, `I.fillField`, `I.see`, `I.seeElement` and the rest of the `I.*` web API work on every engine below; only the helper in the config changes.

| Engine | What it is | Screenshots | Runs on |
|---|---|---|---|
| [Lightpanda](https://lightpanda.io) | headless browser built for automation, nothing painted | no | Linux, macOS |
| [Obscura](https://github.com/h4ckf0r0day/obscura) | lightweight browser with its own rendering engine | yes | Linux, macOS, Windows |
| [Kitesurf](https://blog.cloudflare.com/kitesurf/) | Cloudflare's browser in the cloud | yes | Cloudflare |

All three speak Chrome DevTools Protocol. There is no `npx playwright install` step: Lightpanda and Obscura are single binaries, Kitesurf is a cloud service.

## When to use which

- **Lightpanda**: fastest start and smallest memory footprint. Functional tests that never need a screenshot.
- **Obscura**: lightweight like Lightpanda, but renders, so screenshots and failure screenshots work.
- **Kitesurf**: as many parallel browsers as you have workers, with nothing running on your machine.
- **Stay on Playwright** for visual checks, iframes, multiple tabs, drag-and-drop, network mocking, and Firefox or WebKit.

## Install Lightpanda

Download the binary for your platform. These links always point to the latest release.

Linux x64:

```sh
curl -L -o lightpanda https://github.com/lightpanda-io/browser/releases/latest/download/lightpanda-x86_64-linux
```

Linux ARM64:

```sh
curl -L -o lightpanda https://github.com/lightpanda-io/browser/releases/latest/download/lightpanda-aarch64-linux
```

macOS Apple Silicon:

```sh
curl -L -o lightpanda https://github.com/lightpanda-io/browser/releases/latest/download/lightpanda-aarch64-macos
```

macOS Intel:

```sh
curl -L -o lightpanda https://github.com/lightpanda-io/browser/releases/latest/download/lightpanda-x86_64-macos
```

Windows has no native build: install it inside WSL2 with the Linux command.

Make it executable and put it on `PATH`:

```sh
chmod +x lightpanda
sudo mv lightpanda /usr/local/bin/
```

Linux builds need glibc, so they do not run on Alpine images.

## Install Obscura

Download and extract the archive for your platform. These links always point to the latest release.

Linux x64:

```sh
curl -L https://github.com/h4ckf0r0day/obscura/releases/latest/download/obscura-x86_64-linux.tar.gz | tar xz
```

Linux ARM64:

```sh
curl -L https://github.com/h4ckf0r0day/obscura/releases/latest/download/obscura-aarch64-linux.tar.gz | tar xz
```

macOS Apple Silicon:

```sh
curl -L https://github.com/h4ckf0r0day/obscura/releases/latest/download/obscura-aarch64-macos.tar.gz | tar xz
```

macOS Intel:

```sh
curl -L https://github.com/h4ckf0r0day/obscura/releases/latest/download/obscura-x86_64-macos.tar.gz | tar xz
```

Windows (PowerShell):

```powershell
Invoke-WebRequest https://github.com/h4ckf0r0day/obscura/releases/latest/download/obscura-x86_64-windows.zip -OutFile obscura.zip
Expand-Archive obscura.zip -DestinationPath obscura
```

Put `obscura` (`obscura.exe` on Windows) on `PATH`:

```sh
sudo mv obscura /usr/local/bin/
```

Archives ending in `-no-render` skip the rendering engine: no layout, visibility checks or screenshots. Use the default archives above unless you only need DOM checks.

## Set up Kitesurf

Kitesurf needs a Cloudflare account with Browser Run enabled and an API token with the **Browser Rendering → Edit** permission (My Profile → API Tokens → Create Token → Custom token). Export both:

```sh
export CF_ACCOUNT_ID=your-account-id
export CF_API_TOKEN=your-api-token
```

The browser runs in Cloudflare, so it cannot reach `localhost`. Test a deployed environment, or expose your local app with a tunnel:

```sh
cloudflared tunnel --url http://localhost:3000
```

## Configure

Pick the engine with an environment variable, so one config serves every engine and Playwright stays the default:

```js
// codecept.conf.js
const url = 'http://localhost:3000'

const engines = {
  playwright: { Playwright: { url, browser: 'chromium' } },
  lightpanda: { Lightpanda: { url } },
  obscura: { Obscura: { url } },
  kitesurf: { Kitesurf: { url: 'https://staging.myapp.com' } },
}

export const config = {
  tests: './tests/*_test.js',
  output: './output',
  helpers: engines[process.env.ENGINE || 'playwright'],
}
```

There is nothing to start by hand. Lightpanda and Obscura are launched on a free port before the first test and stopped after the last one, the way Playwright manages Chromium.

If the binary is not on `PATH`, point the helper at it, like Playwright's `executablePath`:

```js
Lightpanda: { url, binaryPath: './bin/lightpanda' }
```

Or set it per machine with an environment variable:

```sh
LIGHTPANDA_PATH=/opt/lightpanda/lightpanda npx codeceptjs run
```

The helper checks `binaryPath`, then `LIGHTPANDA_PATH` (`OBSCURA_PATH` for Obscura), then `PATH`. Relative paths resolve from the directory you run `npx codeceptjs` in.

## Run

```sh
ENGINE=lightpanda npx codeceptjs run
```

Each worker starts its own browser on its own port:

```sh
ENGINE=lightpanda npx codeceptjs run-workers 8
```

See which `I.*` actions the engine supports:

```sh
ENGINE=lightpanda npx codeceptjs list
```

## Exclude what an engine cannot do

Most functional tests pass unchanged. These Playwright features do not carry over:

| Feature | Lightpanda | Obscura |
|---|---|---|
| `saveScreenshot`, failure screenshots, `screencast` plugin | no | yes |
| `seeElement`, `waitForVisible` and other visibility checks | yes | yes |
| `switchTo` (iframes), new tabs, popups | no | no |
| `dragAndDrop`, `moveCursorTo` | no | no |
| `clickXY` | no | yes |
| `scrollTo`, `scrollPageToBottom` | no effect | yes |
| `grabCssPropertyFrom`, `seeCssPropertiesOnElements` | `display`, `visibility`, `opacity` only | most properties |
| clipboard actions | no | no |
| `usePlaywrightTo`, `mockRoute`, downloads | no | no |

Tag the scenarios that need a full browser:

```js
Scenario('checkout matches the design @visual', ({ I }) => {
  I.amOnPage('/checkout')
  I.saveScreenshot('checkout.png')
})
```

And skip them on the lightweight engine:

```sh
ENGINE=lightpanda npx codeceptjs run --grep @visual --invert
```

## Run in CI

Use the lightweight engine as a fast first job and keep Playwright for the full run. GitHub Actions:

```yaml
- name: Install Lightpanda
  run: |
    curl -sfL -o lightpanda https://github.com/lightpanda-io/browser/releases/latest/download/lightpanda-x86_64-linux
    chmod +x lightpanda

- name: Run tests on Lightpanda
  run: npx codeceptjs run --grep @visual --invert
  env:
    ENGINE: lightpanda
    LIGHTPANDA_PATH: ${{ github.workspace }}/lightpanda
```

## Connect to a running browser

To use a browser you started yourself (a container, a remote host), set `endpoint`. The helper then only connects and never starts or stops anything:

```js
Lightpanda: { url, endpoint: 'http://127.0.0.1:9222' }
```

Start Lightpanda yourself with telemetry turned off:

```sh
LIGHTPANDA_DISABLE_TELEMETRY=true lightpanda serve --host 127.0.0.1 --port 9222
```

Start Obscura yourself with access to local apps and files:

```sh
obscura serve --port 9222 --allow-private-network --allow-file-access
```

Without `endpoint` and without a binary, the helper attaches to whatever already answers on `http://127.0.0.1:9222`.

## Good to know

- The helper starts Lightpanda with its telemetry turned off.
- Lightpanda is AGPL-3.0 and Obscura is Apache-2.0. Both run as separate processes, so neither affects the license of your tests.
- All options are in the helper references: [Lightpanda](/helpers/Lightpanda), [Obscura](/helpers/Obscura), [Kitesurf](/helpers/Kitesurf).
