---
permalink: /installation
title: Installation
---

# Installation

For the quickest start (CodeceptJS + Playwright) follow the [Quickstart](/quickstart). This page covers every browser, mobile, and API helper and what each one needs installed.

CodeceptJS 4.2 requires **Node.js 22.12 or newer**. Check your installed version before continuing:

```sh
node --version
```

## Set up a project

```sh
npm init -y                  # if you don't have a package.json yet
npm i codeceptjs --save-dev
```

Install one of the helpers below, then scaffold the config and a sample test:

```sh
npx codeceptjs init
```

`init` runs a short wizard, writes `codecept.conf.js` and a sample test, and installs the helper's driver package if it's missing. The [Quickstart](/quickstart) walks through the questions.

## Playwright

Fast, modern browser automation — the recommended helper for web testing.

```sh
npm i playwright --save-dev
npx playwright install --with-deps
```

`playwright install` downloads the browser binaries; `--with-deps` also installs the Linux system libraries they need (run it with `sudo` if your user can't install packages).

Set `browser` in the helper config to one of:

- `chromium` — default
- `firefox`
- `webkit` — the open-source Safari engine
- `electron` — test an Electron app (set `electron.executablePath`)

To drive branded Chrome or Edge instead of bundled Chromium, install that channel — `npx playwright install chrome` (or `msedge`) — and set `channel` in the config. See the [Playwright helper](/playwright).

## Puppeteer

Chrome/Chromium automation over the DevTools protocol.

```sh
npm i puppeteer --save-dev
```

Puppeteer downloads a matching Chromium when it installs — nothing else to set up. To drive an existing Chrome instead, set `chrome.executablePath` in the helper config (or install `puppeteer-core` and point it at your browser). See the [Puppeteer helper](/puppeteer).

## WebDriver

W3C WebDriver — runs Chrome, Firefox, Edge, Safari, and remote or cloud grids.

```sh
npm i webdriverio --save-dev
```

WebdriverIO 9 downloads and starts the matching driver automatically — no Selenium server, ChromeDriver, or GeckoDriver to install or run. Just set `browser` (`chrome`, `firefox`, `MicrosoftEdge`, `safari`) in `codecept.conf.js` — see the [WebDriver helper](/webdriver).

To run against a cloud grid (Sauce Labs, BrowserStack, LambdaTest, and so on) instead, set the grid's `host`, `port`, `user`, and `key` (or `protocol` / `path`) in the helper config. For running this on CI, see [Continuous Integration](/continuous-integration).

## Obscura (experimental)

Obscura is a lightweight browser driven through Chrome DevTools Protocol. CodeceptJS 4.2 is tested with Obscura 0.2.2. Obscura 0.2.x is the recommended version; older 0.1.x and `-no-render` builds have no layout, visibility assertions, or screenshots.

Download the archive for your platform from the [Obscura releases](https://github.com/h4ckf0r0day/obscura/releases):

| Platform | Rendering archive |
| --- | --- |
| Linux x64 | `obscura-x86_64-linux.tar.gz` |
| Linux ARM64 | `obscura-aarch64-linux.tar.gz` |
| macOS Intel | `obscura-x86_64-macos.tar.gz` |
| macOS Apple Silicon | `obscura-aarch64-macos.tar.gz` |
| Windows x64 | `obscura-x86_64-windows.zip` |

Extract the archive and either put `obscura` (`obscura.exe` on Windows) on `PATH`, set `OBSCURA_PATH`, or configure `binaryPath`. The helper then starts and stops `obscura serve` automatically:

```js
export const config = {
  helpers: {
    Obscura: {
      url: 'http://localhost:3000',
      // binaryPath: '/absolute/path/to/obscura', // optional
    },
  },
}
```

See [Alternative Browser Engines](/alternative-browsers) for connection modes and limitations, and the [Obscura helper reference](/helpers/Obscura) for every option.

## Appium (mobile)

Native iOS and Android testing. Appium speaks the WebDriver protocol, so CodeceptJS drives it through `webdriverio`:

```sh
npm i webdriverio --save-dev
npm i -g appium
```

Install the platform driver(s) and start the server:

```sh
appium driver install uiautomator2   # Android
appium driver install xcuitest       # iOS
appium
```

You'll also need the Android SDK and an emulator or device, or Xcode and a simulator or device (or a device-cloud account). Set `platformName`, `deviceName`, and `app` in the helper config — see [Mobile Testing](/mobile).

## API testing

REST and GraphQL tests need no browser — the helpers are built in (they use native `fetch`):

```sh
npm i codeceptjs --save-dev
```

Choose `REST` or `GraphQL` when `init` asks, set `endpoint` in the config, and add the `JSONResponse` helper if you want response assertions. See [Testing APIs](/api).

## ESM

CodeceptJS 4.x uses ECMAScript Modules. A project created by `init` is set up for it; an existing project needs `"type": "module"` in `package.json` and `import` syntax in the config and tests. Coming from 3.x — see the [Migration Guide](/migration-4).

## TypeScript

`npx codeceptjs init` scaffolds a TypeScript project when you answer **Yes** to "Do you plan to write tests in TypeScript?" — it writes `codecept.conf.ts` and `*_test.ts` files.

The config file (`codecept.conf.ts`) and helpers are transpiled automatically. Test files need a loader; install [`tsx`](https://tsx.is) and add it to `require`:

```sh
npm i tsx --save-dev
```

```ts
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['tsx/esm'],   // loads the *_test.ts files as ES Modules (needs "type": "module")
  helpers: {
    Playwright: { url: 'http://localhost', browser: 'chromium' },
  },
}
```

Run tests as usual with `npx codeceptjs run`. For promise-based typings, types for page objects and custom helpers, and custom locator types, see the [TypeScript guide](/typescript).
