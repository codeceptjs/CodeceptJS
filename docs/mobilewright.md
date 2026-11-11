---
permalink: /mobilewright
title: Mobile Testing with Mobilewright
---

> Warning! Mobilewright support in CodeceptJS is experimental. Please try it and help us to test it and improve it. [See Mobilewright helper repository](https://github.com/codeceptjs/mobilewright-helper).

[Appium](/mobile) is the default choice for mobile testing with CodeceptJS, but it requires a running Appium server and slow UI-dump based automation. [Mobilewright](https://mobilewright.dev) takes a different approach: it talks to simulators, emulators and real devices directly via adb (Android) and mobilecli (iOS), and reads the accessibility tree instead of taking UI snapshots.

**Pros** (vs Appium):

* no Appium server, no WebDriver — a device and `adb` is all you need
* fast startup: a full suite of 4 scenarios runs in about a minute, ~7-10s per test including app installation
* Playwright-like locators: `{ role: 'button', name: 'Sign In' }`, test ids, accessibility labels, and human-style "label next to the field" matching
* same locator conventions as the Appium helper, so most tests move between the two helpers unchanged
* interactive [pause](/basics#pause), auto-retries and other CodeceptJS features work out of the box

**Cons**:

* experimental (v0.1.x), the API may change
* no XPath or CSS locators — only accessibility-based ones
* text on screen ≠ text in the accessibility tree: some visible messages can't be asserted by text (common for React Native error labels)
* iOS + React Native: taps may not reach RN controls (known mobilecli issue); Android works

CodeceptJS allows you to try different options and choose the one which works best for you. If Mobilewright covers your app, tests run dramatically faster than with Appium.

## Installation

Requirements: Node.js 22.12+, CodeceptJS 4, a booted simulator or emulator, or a connected device.

```
npm i @codeceptjs/mobilewright --save-dev
```

Check your environment with one command:

```
npx mobilewright doctor
```

It reports Node.js, mobilecli versions, connected devices and common misconfigurations. List available devices:

```
npx mobilewright devices
```

## Configuration

```js
exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    Mobilewright: {
      require: '@codeceptjs/mobilewright',
      platform: 'android',                      // or 'ios'
      app: 'com.saucelabs.mydemoapp.rn',        // package name (Android) or bundle id (iOS)
      installApps: './MyDemoApp.apk',           // installed before tests
      actionTimeout: 10000,
      waitForTimeout: 10000,
      animations: 'off',                        // disables system animations on device
    },
  },
  plugins: {
    screenshot: { enabled: true },
    retryFailedStep: { enabled: true },
  },
}
```

| Option | Default | Description |
| --- | --- | --- |
| `platform` | required | `ios` or `android` |
| `app` | — | bundle id (iOS) or package name (Android) of the app under test |
| `installApps` | — | path or list of paths to `.apk`, `.app` or `.ipa` files installed before tests |
| `deviceId` | first booted device | UDID or serial of the device |
| `deviceName` | — | string or RegExp matched against device names |
| `url` | — | URL of a running mobilecli server; when set, the helper does not start one |
| `restart` | `'app'` | `'app'` relaunches the app before every test, `'session'` launches it once, `false` never launches it |
| `animations` | unchanged | `'off'` disables system animations |

The helper starts and stops a mobilecli server automatically; with `restart: 'app'` (default) the app is relaunched before every test, so no `Before()` hook is needed.

## Locators

Mobilewright reads the accessibility tree. Locators follow the [Appium helper](/mobile) conventions:

| Locator | Finds |
| --- | --- |
| `'~login'` | test id, then accessibility label |
| `'#login'` | test id; on Android also matches `com.app:id/login` |
| `{ role: 'button', name: 'Sign In' }` | element by role and accessible name |
| `{ label }`, `{ text }`, `{ placeholder }`, `{ testId }` | the matching attribute; `text` accepts a RegExp |
| `{ android: '#a', ios: '~b' }` | a different locator per platform |

For `fillField` a plain name matches a text field by its accessibility label, its placeholder, or **the text label displayed next to the field** — the way a human reads a form. XPath and CSS are not supported and fail with an error suggesting a supported locator.

## A Test

A test against the [Sauce Labs My Demo App](https://github.com/saucelabs/my-demo-app-rn) (React Native):

```js
import { secret } from 'codeceptjs'

Feature('Sauce Labs Store')

Scenario('Open a product and add it to cart', ({ I }) => {
  I.waitForText('Products', 30)
  I.click('Sauce Labs Backpack')               // click by visible text
  I.waitForElement('~Add To Cart button', 15)
  I.click('~Add To Cart button')               // ~ = accessibility id / label
  I.see('1', '~cart badge')
  I.saveElementScreenshot('~cart badge', 'cart-badge.png')  // element screenshot
})

Scenario('Deep link and fill fields by label', ({ I }) => {
  I.waitForText('Products', 30)
  I.amOnPage('mydemoapprn://login')            // deep link
  I.fillField('Username', 'bob@example.com')   // found by the label next to the field
  I.fillField('Password', secret('10203040'))  // secret() keeps the password out of logs
  I.click('~Login button')
  I.waitForText('Products', 15)
})

Scenario('Rotate the screen', ({ I }) => {
  I.setOrientation('LANDSCAPE')
  I.seeOrientationIs('LANDSCAPE')
  I.setOrientation('PORTRAIT')
})
```

Run tests as usual:

```
npx codeceptjs run --steps
```

## Debugging

* [Interactive pause](/basics#pause) works: drop `pause()` into a test and try steps and locators by hand.
* `DEBUG='mw:*' npx codeceptjs run` prints the whole device dialogue over WebSocket.
* `await I.grabSource()` returns the accessibility tree as JSON — the main tool for debugging locators: it shows every label, testId and element type on the current screen.
* `npx mobilewright screenshot -o screen.png` takes a device screenshot without any test.
* `npx mobilewright codegen` records taps on the device and generates a test; `npx mobilewright inspect` opens a live element inspector in the browser.

## Appium vs Mobilewright

| | Appium | Mobilewright |
| --- | --- | --- |
| Server | Appium server + WebDriver required | none (adb / mobilecli direct) |
| Automation basis | UI dumps | accessibility tree |
| Speed | slow startup, minutes per suite | ~7-10s per test incl. app install |
| Locators | XPath, CSS, accessibility ids | accessibility ids, roles, labels, text |
| App instrumentation | none needed | none needed |
| Maturity | industry standard, huge ecosystem | experimental (v0.1.x) |
| Cloud (SauceLabs, BrowserStack) | yes | not yet |

Both helpers share locator conventions, so most tests move between them with little change — start with Mobilewright for fast local runs and keep an Appium job for cloud testing and XPath-heavy suites.

## Known Pitfalls

1. **Text on screen ≠ text in the accessibility tree.** Error messages may be visible on a screenshot but missing from the tree — text assertions on such elements fail. Check with `I.grabSource()` before asserting by text.
2. **`clearField` on React Native fields is unstable**; the helper falls back to backspaces, but masked values (passwords) report the wrong length. Filling a password field twice is a flakiness candidate.
3. **React Native components may not expose testIds** — on such apps `#id` locators don't match; `~` locators fall back to labels and usually work.
4. **App state persists between tests**: `restart` relaunches the app but does not clear its data.
5. **iOS + React Native**: taps may not reach RN controls (known mobilecli issue); Android works.
