---
id: changelog
title: Releases
---

## 2.3.5

* Set "parse-function" dependency to "5.2.11" to avoid further installation errors.

## 2.3.4

* Fixed installation error "Cannot find module '@babel/runtime/helpers/interopRequireDefault'". The issue came from `parse-function` package. Fixed by **[pablopaul](https://github.com/pablopaul)**.
* **[Puppeteer]** Fixed switching to iframe without an ID by **[johnyb](https://github.com/johnyb)**. See [#1974](https://github.com/Codeception/CodeceptJS/issues/1974)
* Added `--profile` option to `run-workers` by **[orihomie](https://github.com/orihomie)**
* Added a tag definition to `FeatureConfig` and `ScenarioConfig` by **[sseliverstov](https://github.com/sseliverstov)**

## 2.3.3

* **[customLocator plugin](#customlocator) introduced**. Adds a locator strategy for special test attributes on elements.

```js
// when data-test-id is a special test attribute
// enable and configure plugin to replace this
I.click({ css: '[data-test-id=register_button]');
// with this
I.click('$register_button');
```
* [Puppeteer][WebDriver] `pressKey` improvements by **[martomo](https://github.com/martomo)**:
Changed pressKey method to resolve issues and extend functionality.
  * Did not properly recognize 'Meta' (or 'Command') as modifier key.
  * Right modifier keys did not work in WebDriver using JsonWireProtocol.
  * 'Shift' + <key> combination would not reflect actual keyboard behavior.
  * Respect sequence with multiple modifier keys passed to pressKey.
  * Added support to automatic change operation modifier key based on operating system.
* [Puppeteer][WebDriver] Added `pressKeyUp` and `pressKeyDown` to press and release modifier keys like `Control` or `Shift`. By **[martomo](https://github.com/martomo)**.
* [Puppeteer][WebDriver] Added `grabElementBoundingRect` by **[PeterNgTr](https://github.com/PeterNgTr)**.
* **[Puppeteer]** Fixed speed degradation introduced in [#1306](https://github.com/Codeception/CodeceptJS/issues/1306) with accessibility locators support. See [#1953](https://github.com/Codeception/CodeceptJS/issues/1953).
* Added `Config.addHook` to add a function that will update configuration on load.
* Started [`@codeceptjs/configure`](https://github.com/codecept-js/configure) package with a collection of common configuration patterns.
* **[TestCafe]** port's management removed (left on TestCafe itself) by **[orihomie](https://github.com/orihomie)**. Fixes [#1934](https://github.com/Codeception/CodeceptJS/issues/1934).
* **[REST]** Headers are no more declared as singleton variable. Fixes [#1959](https://github.com/Codeception/CodeceptJS/issues/1959)
* Updated Docker image to include run tests in workers with `NUMBER_OF_WORKERS` env variable. By **[PeterNgTr](https://github.com/PeterNgTr)**.

## 2.3.2

* **[Puppeteer]** Fixed Puppeteer 1.20 support by **[davertmik](https://github.com/davertmik)**
* Fixed `run-workers` to run with complex configs. See [#1887](https://github.com/Codeception/CodeceptJS/issues/1887) by **[nitschSB](https://github.com/nitschSB)**
* Added `--suites` option to `run-workers` to split suites by workers (tests of the same suite goes to teh same worker). Thanks **[nitschSB](https://github.com/nitschSB)**.
* Added a guide on [Email Testing](https://codecept.io/email).
* **[retryFailedStepPlugin]** Improved to ignore wait* steps and others. Also added option to ignore this plugin per test bases. See [updated documentation](https://codecept.io/plugins#retryfailedstep). By **[davertmik](https://github.com/davertmik)**
* Fixed using PageObjects as classes by **[Vorobeyko](https://github.com/Vorobeyko)**. See [#1896](https://github.com/Codeception/CodeceptJS/issues/1896)
* **[WebDriver]** Fixed opening more than one tab. See [#1875](https://github.com/Codeception/CodeceptJS/issues/1875) by **[jplegoff](https://github.com/jplegoff)**. Fixes [#1874](https://github.com/Codeception/CodeceptJS/issues/1874)
* Fixed [#1891](https://github.com/Codeception/CodeceptJS/issues/1891) when `I.retry()` affected retries of next steps. By **[davertmik](https://github.com/davertmik)**

## 2.3.1

* **[MockRequest]** Polly helper was renamed to MockRequest.
* [MockRequest][WebDriver] [Mocking requests](https://codecept.io/webdriver#mocking-requests) is now available in WebDriver. Thanks **[radhey1851](https://github.com/radhey1851)**
* **[Puppeteer]** Ensure configured user agent and/or window size is applied to all pages. See [#1862](https://github.com/Codeception/CodeceptJS/issues/1862) by **[martomo](https://github.com/martomo)**
* Improve handling of xpath locators with round brackets by **[nitschSB](https://github.com/nitschSB)**. See [#1870](https://github.com/Codeception/CodeceptJS/issues/1870)
* Use WebDriver capabilities config in wdio plugin. [#1869](https://github.com/Codeception/CodeceptJS/issues/1869) by **[quekshuy](https://github.com/quekshuy)**

## 2.3.0


* **[Parallel testing by workers](https://codecept.io/parallel#parallel-execution-by-workers) introduced** by **[VikalpP](https://github.com/VikalpP)** and **[davertmik](https://github.com/davertmik)**. Use `run-workers` command as faster and simpler alternative to `run-multiple`. Requires NodeJS v12

```
# run all tests in parallel using 3 workers
npx codeceptjs run-workers 3
```
* [GraphQL][GraphQLDataFactory] **Helpers for data management over GraphQL** APIs added. By **[radhey1851](https://github.com/radhey1851)**.
  * Learn how to [use GraphQL helper](https://codecept.io/data#graphql) to access GarphQL API
  * And how to combine it with [GraphQLDataFactory](https://codecept.io/data#graphql-data-factory) to generate and persist test data.
* **Updated to use Mocha 6**. See [#1802](https://github.com/Codeception/CodeceptJS/issues/1802) by **[elukoyanov](https://github.com/elukoyanov)**
* Added `dry-run` command to print steps of test scenarios without running them. Fails to execute scenarios with `grab*` methods or custom code. See [#1825](https://github.com/Codeception/CodeceptJS/issues/1825) for more details.

```
npx codeceptjs dry-run
```

* **[Appium]** Optimization when clicking, searching for fields by accessibility id. See [#1777](https://github.com/Codeception/CodeceptJS/issues/1777) by **[gagandeepsingh26](https://github.com/gagandeepsingh26)**
* **[TestCafe]** Fixed `switchTo` by **[KadoBOT](https://github.com/KadoBOT)**
* **[WebDriver]** Added geolocation actions by **[PeterNgTr](https://github.com/PeterNgTr)**
    * `grabGeoLocation()`
    * `setGeoLocation()`
* **[Polly]** Check typeof arguments for mock requests by **[VikalpP](https://github.com/VikalpP)**. Fixes [#1815](https://github.com/Codeception/CodeceptJS/issues/1815)
* CLI improvements by **[jamesgeorge007](https://github.com/jamesgeorge007)**
  * `codeceptjs` command prints list of all available commands
  * added `codeceptjs -V` flag to print version information
  * warns on unknown command
* Added TypeScript files support to `run-multiple` by **[z4o4z](https://github.com/z4o4z)**
* Fixed element position bug in locator builder. See [#1829](https://github.com/Codeception/CodeceptJS/issues/1829) by **[AnotherAnkor](https://github.com/AnotherAnkor)**
* Various TypeScript typings updates by **[elukoyanov](https://github.com/elukoyanov)** and **[Vorobeyko](https://github.com/Vorobeyko)**
* Added `event.step.comment` event for all comment steps like `I.say` or gherking steps.

## 2.2.1

* **[WebDriver]** A [dedicated guide](https://codecept.io/webdriver) written.
* **[TestCafe]** A [dedicated guide](https://codecept.io/testcafe) written.
* **[Puppeteer]** A [chapter on mocking](https://codecept.io/puppeteer#mocking-requests) written
* [Puppeteer][Nightmare][TestCafe] Window mode is enabled by default on `codeceptjs init`.
* **[TestCafe]** Actions implemented by **[hubidu](https://github.com/hubidu)**
  * `grabPageScrollPosition`
  * `scrollPageToTop`
  * `scrollPageToBottom`
  * `scrollTo`
  * `switchTo`
* Intellisense improvements. Renamed `tsconfig.json` to `jsconfig.json` on init. Fixed autocompletion for Visual Studio Code.
* **[Polly]** Take configuration values from Puppeteer. Fix [#1766](https://github.com/Codeception/CodeceptJS/issues/1766) by **[VikalpP](https://github.com/VikalpP)**
* **[Polly]** Add preconditions to check for puppeteer page availability by **[VikalpP](https://github.com/VikalpP)**. Fixes [#1767](https://github.com/Codeception/CodeceptJS/issues/1767)
* **[WebDriver]** Use filename for `uploadFile` by **[VikalpP](https://github.com/VikalpP)**. See [#1797](https://github.com/Codeception/CodeceptJS/issues/1797)
* **[Puppeteer]** Configure speed of input with `pressKeyDelay` option. By **[hubidu](https://github.com/hubidu)**
* Fixed recursive loading of support objects by **[davertmik](https://github.com/davertmik)**.
* Fixed support object definitions in steps.d.ts by **[johnyb](https://github.com/johnyb)**. Fixes [#1795](https://github.com/Codeception/CodeceptJS/issues/1795)
* Fixed `Data().Scenario().injectDependencies()` is not a function by **[andrerleao](https://github.com/andrerleao)**
* Fixed crash when using xScenario & Scenario.skip with tag by **[VikalpP](https://github.com/VikalpP)**. Fixes [#1751](https://github.com/Codeception/CodeceptJS/issues/1751)
* Dynamic configuration of helpers can be performed with async function. See [#1786](https://github.com/Codeception/CodeceptJS/issues/1786) by **[cviejo](https://github.com/cviejo)**
* Added TS definitions for internal objects by **[Vorobeyko](https://github.com/Vorobeyko)**
* BDD improvements:
  * Fix for snippets command with a .feature file that has special characters by **[asselin](https://github.com/asselin)**
  * Fix `--path` option on `gherkin:snippets` command by **[asselin](https://github.com/asselin)**. See [#1790](https://github.com/Codeception/CodeceptJS/issues/1790)
  * Added `--feature` option to `gherkin:snippets` to enable creating snippets for a subset of .feature files. See [#1803](https://github.com/Codeception/CodeceptJS/issues/1803) by **[asselin](https://github.com/asselin)**.
* Fixed: dynamic configs not reset after test. Fixes [#1776](https://github.com/Codeception/CodeceptJS/issues/1776) by **[cviejo](https://github.com/cviejo)**.

## 2.2.0

* **EXPERIMENTAL** [**TestCafe** helper](https://codecept.io/helpers/TestCafe) introduced. TestCafe allows to run cross-browser tests it its own very fast engine. Supports all browsers including mobile. Thanks to **[hubidu](https://github.com/hubidu)** for implementation! Please test it and send us feedback.
* **[Puppeteer]** Mocking requests enabled by introducing [Polly.js helper](https://codecept.io/helpers/Polly). Thanks **[VikalpP](https://github.com/VikalpP)**

```js
// use Polly & Puppeteer helpers
I.mockRequest('GET', '/api/users', 200);
I.mockRequest('POST', '/users', { user: { name: 'fake' }});
```

* **EXPERIMENTAL** **[Puppeteer]** [Firefox support](https://codecept.io/helpers/Puppeteer-firefox) introduced by **[ngadiyak](https://github.com/ngadiyak)**, see [#1740](https://github.com/Codeception/CodeceptJS/issues/1740)
* **[stepByStepReportPlugin]** use md5 hash to generate reports into unique folder. Fix [#1744](https://github.com/Codeception/CodeceptJS/issues/1744) by **[chimurai](https://github.com/chimurai)**
* Interactive pause improvements:
  * print result of `grab` commands
  * print message for successful assertions
* `run-multiple` (parallel execution) improvements:
  * `bootstrapAll` must be called before creating chunks. [#1741](https://github.com/Codeception/CodeceptJS/issues/1741) by **[Vorobeyko](https://github.com/Vorobeyko)**
  * Bugfix: If value in config has falsy value then multiple config does not overwrite original value. [#1756](https://github.com/Codeception/CodeceptJS/issues/1756) by **[LukoyanovE](https://github.com/LukoyanovE)**
* Fixed hooks broken in 2.1.5 by **[Vorobeyko](https://github.com/Vorobeyko)**
* Fix references to support objects when using Dependency Injection. Fix by **[johnyb](https://github.com/johnyb)**. See [#1701](https://github.com/Codeception/CodeceptJS/issues/1701)
* Fix dynamic config applied for multiple helpers by **[VikalpP](https://github.com/VikalpP)** [#1743](https://github.com/Codeception/CodeceptJS/issues/1743)


## 2.1.5

* **EXPERIMENTAL** [Wix Detox support](https://github.com/Codeception/detox-helper) introduced as standalone helper. Provides a faster alternative to Appium for mobile testing.
* Saving successful commands inside interactive pause into `_output/cli-history` file. By **[hubidu](https://github.com/hubidu)**
* Fixed hanging error handler inside scenario. See [#1721](https://github.com/Codeception/CodeceptJS/issues/1721) by **[haily-lgc](https://github.com/haily-lgc)**.
* Fixed by **[Vorobeyko](https://github.com/Vorobeyko)**: tests did not fail when an exception was raised in async bootstrap.
* **[WebDriver]** Added window control methods by **[emmonspired](https://github.com/emmonspired)**
  * `grabAllWindowHandles` returns all window handles
  * `grabCurrentWindowHandle` returns current window handle
  * `switchToWindow` switched to window by its handle
* **[Appium]** Fixed using `host` as configuration by **[trinhpham](https://github.com/trinhpham)**
* Fixed `run-multiple` command when `tests` config option is undefined (in Gherkin scenarios). By **[gkushang](https://github.com/gkushang)**.
* German translation introduced by **[hubidu](https://github.com/hubidu)**

## 2.1.4

* [WebDriver][Puppeteer][Protractor][Nightmare] A11y locator support introduced by **[Holorium](https://github.com/Holorium)**. Clickable elements as well as fields can be located by following attributes:
  * `aria-label`
  * `title`
  * `aria-labelledby`
* **[Puppeteer]** Added support for React locators.
  * New [React Guide](https://codecept.io/react) added.
* **[Puppeteer]** Deprecated `downloadFile`
* **[Puppeteer]** Introduced `handleDownloads` replacing `downloadFile`
* [puppeteerCoverage plugin] Fixed path already exists error by **[seta-tuha](https://github.com/seta-tuha)**.
* Fixed 'ERROR: ENAMETOOLONG' creating directory names in `run-multiple` with long config. By **[artvinn](https://github.com/artvinn)**
* **[REST]** Fixed url autocompletion combining base and relative paths by **[LukoyanovE](https://github.com/LukoyanovE)**
* [Nightmare][Protractor] `uncheckOption` method introduced by **[PeterNgTr](https://github.com/PeterNgTr)**
* [autoLogin plugin] Enable to use  without `await` by **[tsuemura](https://github.com/tsuemura)**
* **[Puppeteer]** Fixed `UnhandledPromiseRejectionWarning: "Execution context was destroyed...` by **[adrielcodeco](https://github.com/adrielcodeco)**
* **[WebDriver]** Keep browser window dimensions when starting a new session by **[spiroid](https://github.com/spiroid)**
* Replace Ghekrin plceholders with values in files that combine a scenerio outline and table by **[medtoure18](https://github.com/medtoure18)**.
* Added Documentation to [locate elements in React Native](https://codecept.io/mobile-react-native-locators) apps. By **[DimGun](https://github.com/DimGun)**.
* Adding optional `path` parameter to `bdd:snippets` command to append snippets to a specific file. By **[cthorsen31](https://github.com/cthorsen31)**.
* Added optional `output` parameter to `def` command by **[LukoyanovE](https://github.com/LukoyanovE)**.
* **[Puppeteer]** Added `grabDataFromPerformanceTiming` by **[PeterNgTr](https://github.com/PeterNgTr)**.
* axios updated to `0.19.0` by **[SteveShaffer](https://github.com/SteveShaffer)**
* TypeScript defitions updated by **[LukoyanovE](https://github.com/LukoyanovE)**. Added `secret` and `inject` function.

## 2.1.3

* Fixed autoLogin plugin to inject `login` function
* Fixed using `toString()` in DataTablewhen it is defined by **[tsuemura](https://github.com/tsuemura)**

## 2.1.2

* Fixed `inject` to load objects recursively.
* Fixed TypeScript definitions for locators by **[LukoyanovE](https://github.com/LukoyanovE)**
* **EXPERIMENTAL** **[WebDriver]** ReactJS locators support with webdriverio v5.8+:

```js
// locating React element by name, prop, state
I.click({ react: 'component-name', props: {}, state: {} });
I.seeElement({ react: 'component-name', props: {}, state: {} });
```

## 2.1.1

* Do not retry `within` and `session` calls inside `retryFailedStep` plugin. Fix by **[tsuemura](https://github.com/tsuemura)**

## 2.1.0

* Added global `inject()` function to require actor and page objects using dependency injection. Recommended to use in page objects, step definition files, support objects:

```js
// old way
const I = actor();
const myPage = require('../page/myPage');

// new way
const { I, myPage } = inject();
```

* Added global `secret` function to fill in sensitive data. By **[RohanHart](https://github.com/RohanHart)**:

```js
I.fillField('password', secret('123456'));
```

* [wdioPlugin](https://codecept.io/plugins/#wdio) Added a plugin to **support webdriverio services** including *selenium-standalone*, *sauce*, *browserstack*, etc. **Sponsored by **[GSasu](https://github.com/GSasu)****
* **[Appium]** Fixed `swipe*` methods by **[PeterNgTr](https://github.com/PeterNgTr)**
* BDD Gherkin Improvements:
  * Implemented `run-multiple` for feature files.  **Sponsored by **[GSasu](https://github.com/GSasu)****
  * Added `--features` and `--tests` options to `run-multiple`. **Sponsored by **[GSasu](https://github.com/GSasu)****
  * Implemented `Before` and `After` hooks in [step definitions](https://codecept.io/bdd#before)
* Fixed running tests by absolute path. By **[batalov](https://github.com/batalov)**.
* Enabled the adding screenshot to failed test for moch-junit-reporter by **[PeterNgTr](https://github.com/PeterNgTr)**.
* **[Puppeteer]** Implemented `uncheckOption` and fixed behavior of `checkOption` by **[aml2610](https://github.com/aml2610)**
* **[WebDriver]** Fixed `seeTextEquals` on empty strings by **[PeterNgTr](https://github.com/PeterNgTr)**
* **[Puppeteer]** Fixed launch with `browserWSEndpoint` config by **[ngadiyak](https://github.com/ngadiyak)**.
* **[Puppeteer]** Fixed switching back to main window in multi-session mode by **[davertmik](https://github.com/davertmik)**.
* **[autoLoginPlugin]** Fixed using async functions for auto login by **[nitschSB](https://github.com/nitschSB)**

> This release was partly sponsored by **[GSasu](https://github.com/GSasu)**. Thanks for the support!
Do you want to improve this project? [Learn more about sponsorin CodeceptJS


## 2.0.8

* **[Puppeteer]** Added `downloadFile` action by **[PeterNgTr](https://github.com/PeterNgTr)**.

Use it with `FileSystem` helper to test availability of a file:
```js
  const fileName = await I.downloadFile('a.file-link');
  I.amInPath('output');
  I.seeFile(fileName);
```
> Actions `amInPath` and `seeFile` are taken from [FileSystem](https://codecept.io/helpers/FileSystem) helper

* **[Puppeteer]** Fixed `autoLogin` plugin with Puppeteer by **[davertmik](https://github.com/davertmik)**
* **[WebDriver]** `seeInField` should throw error if element has no value attrubite. By **[PeterNgTr](https://github.com/PeterNgTr)**
* **[WebDriver]** Fixed `seeTextEquals` passes for any string if element is empty by **[PeterNgTr](https://github.com/PeterNgTr)**.
* **[WebDriver]** Internal refctoring to use `el.isDisplayed` to match latest webdriverio implementation. Thanks to **[LukoyanovE](https://github.com/LukoyanovE)**
* [allure plugin] Add ability enable [screenshotDiff plugin](https://github.com/allure-framework/allure2/blob/master/plugins/screen-diff-plugin/README.md) by **[Vorobeyko](https://github.com/Vorobeyko)**
* **[Appium]** Fixed `locator.stringify` call by **[LukoyanovE](https://github.com/LukoyanovE)**

## 2.0.7

* [WebDriver][Protractor][Nightmare] `rightClick` method implemented (fixed) in a standard way. By **[davertmik](https://github.com/davertmik)**
* **[WebDriver]** Updated WebDriver API calls in helper. By **[PeterNgTr](https://github.com/PeterNgTr)**
* **[stepByStepReportPlugin]** Added `screenshotsForAllureReport` config options to automatically attach screenshots to allure reports. By **[PeterNgTr](https://github.com/PeterNgTr)**
* **[allurePlugin]** Added `addLabel` method by **[Vorobeyko](https://github.com/Vorobeyko)**
* Locator Builder: fixed `withChild` and `withDescendant` to match deep nested siblings by **[Vorobeyko](https://github.com/Vorobeyko)**.

## 2.0.6

* Introduced [Custom Locator Strategies](https://codecept.io/locators#custom-locators).
* Added [Visual Testing Guide](https://codecept.io/visual) by **[puneet0191](https://github.com/puneet0191)** and **[MitkoTschimev](https://github.com/MitkoTschimev)**.
* **[Puppeteer]** [`puppeteerCoverage`](https://codecept.io/plugins#puppeteercoverage) plugin added to collect code coverage in JS. By **[dvillarama](https://github.com/dvillarama)**
* Make override option in `run-multiple` to respect the generated overridden config by **[kinyat](https://github.com/kinyat)**
* Fixed deep merge for `container.append()`. Introduced `lodash.merge()`. By **[Vorobeyko](https://github.com/Vorobeyko)**
* Fixed saving screenshot on Windows by
* Fix errors on using interactive shell with Allure plugin by tsuemura
* Fixed using dynamic injections with `Scenario().injectDependencies` by **[tsemura](https://github.com/tsemura)**
* [WebDriver][Puppeteer][Nightmare][Protractor] Fixed url protocol detection for non-http urls by **[LukoyanovE](https://github.com/LukoyanovE)**
* **[WebDriver]** Enabled compatibility with `stepByStepReport` by **[tsuemura](https://github.com/tsuemura)**
* **[WebDriver]** Fixed `grabHTMLFrom` to return innerHTML value by **[Holorium](https://github.com/Holorium)**. Fixed compatibility with WebDriverIO.
* **[WebDriver]** `grabHTMLFrom` to return one HTML vlaue for one element matched, array if multiple elements found by **[davertmik](https://github.com/davertmik)**.
* **[Nightmare]** Added `grabHTMLFrom` by **[davertmik](https://github.com/davertmik)**
* Fixed `bootstrapAll` and `teardownAll` launch with path as argument by **[LukoyanovE](https://github.com/LukoyanovE)**
* Fixed `bootstrapAll` and `teardownAll` calls from exported object by **[LukoyanovE](https://github.com/LukoyanovE)**
* **[WebDriver]** Added possibility to define conditional checks interval for `waitUntil` by **[LukoyanovE](https://github.com/LukoyanovE)**
* Fixed storing current data in data driven tests in a test object. By **[Vorobeyko](https://github.com/Vorobeyko)**
* **[WebDriver]** Fixed `hostname` config option overwrite when setting a cloud provider. By **[LukoyanovE](https://github.com/LukoyanovE)**
* **[WebDriver]** `dragSlider` method implemented by **[DavertMik](https://github.com/DavertMik)**
* **[WebDrover]** Fixed `scrollTo` to use new webdriverio API by **[PeterNgTr](https://github.com/PeterNgTr)**
* Added Japanese translation file by **[tsemura](https://github.com/tsemura)**
* Added `Locator.withDescendant()` method to find an element which contains a descendant (child, grandchild) by **[Vorobeyko](https://github.com/Vorobeyko)**
* **[WebDriver]** Fixed configuring capabilities for Selenoid and IE by **[Vorobeyko](https://github.com/Vorobeyko)**
* **[WebDriver]** Restore original window size when taking full size screenshot by **[tsuemura](https://github.com/tsuemura)**
* Enabled `throws()`,` fails()`, `retry()`, `timeout()`, `config()` functions for data driven tests. By **[jjm409](https://github.com/jjm409)**

## 2.0.5

[Broken Release]

## 2.0.4

* [WebDriver][Protractor][Nightmare][Puppeteer] `grabAttributeFrom` returns an array when multiple elements matched. By **[PeterNgTr](https://github.com/PeterNgTr)**
* [autoLogin plugin] Fixed merging users config by **[nealfennimore](https://github.com/nealfennimore)**
* [autoDelay plugin] Added WebDriver to list of supported helpers by **[mattin4d](https://github.com/mattin4d)**
* **[Appium]** Fixed using locators in `waitForElement`, `waitForVisible`, `waitForInvisible`. By **[eduardofinotti](https://github.com/eduardofinotti)**
* [allure plugin] Add tags to allure reports by **[Vorobeyko](https://github.com/Vorobeyko)**
* [allure plugin] Add skipped tests to allure reports by **[Vorobeyko](https://github.com/Vorobeyko)**
* Fixed `Logged Test name | [object Object]` when used Data().Scenario(). By **[Vorobeyko](https://github.com/Vorobeyko)**
* Fixed Data().only.Scenario() to run for all datasets. By **[Vorobeyko](https://github.com/Vorobeyko)**
* **[WebDriver]** `attachFile` to work with hidden elements. Fixed in [#1460](https://github.com/Codeception/CodeceptJS/issues/1460) by **[tsuemura](https://github.com/tsuemura)**



## 2.0.3

* [**autoLogin plugin**](https://codecept.io/plugins#autologin) added. Allows to log in once and reuse browser session. When session expires - automatically logs in again. Can persist session between runs by saving cookies to file.
* Fixed `Maximum stack trace` issue in `retryFailedStep` plugin.
* Added `locate()` function into the interactive shell.
* **[WebDriver]** Disabled smartWait for interactive shell.
* **[Appium]** Updated methods to use for mobile locators
  * `waitForElement`
  * `waitForVisible`
  * `waitForInvisible`
* Helper and page object generators no longer update config automatically. Please add your page objects and helpers manually.

## 2.0.2

* **[Puppeteer]** Improved handling of connection with remote browser using Puppeteer by **[martomo](https://github.com/martomo)**
* **[WebDriver]** Updated to webdriverio 5.2.2 by **[martomo](https://github.com/martomo)**
* Interactive pause improvements by **[davertmik](https://github.com/davertmik)**
  * Disable retryFailedStep plugin in in interactive mode
  * Removes `Interface: parseInput` while in interactive pause
* **[ApiDataFactory]** Improvements
  * added `fetchId` config option to override id retrieval from payload
  * added `onRequest` config option to update request in realtime
  * added `returnId` config option to return ids of created items instead of items themvelves
  * added `headers` config option to override default headers.
  * added a new chapter into [DataManagement](https://codecept.io/data#api-requests-using-browser-session)
* **[REST]** Added `onRequest` config option


## 2.0.1

* Fixed creating project with `codecept init`.
* Fixed error while installing webdriverio@5.
* Added code beautifier for generated configs.
* **[WebDriver]** Updated to webdriverio 5.1.0

## 2.0.0

* **[WebDriver]** **Breaking Change.** Updated to webdriverio v5. New helper **WebDriver** helper introduced.

  * **Upgrade plan**:

    1. Install latest webdriverio
    ```
    npm install webdriverio@5 --save
    ```

    2. Replace `WebDriverIO` => `WebDriver` helper name in config.
    3. Read [webdriverio changelog](https://github.com/webdriverio/webdriverio/blob/master/CHANGELOG.md). If you were using webdriver API in your helpers, upgrade accordingly.
    4. We made WebDriver helper to be compatible with old API so no additional changes required.

    > If you face issues using webdriverio v5 you can still use webdriverio 4.x and WebDriverIO helper. Make sure you have `webdriverio: ^4.0` installed.

  * Known issues: `attachFile` doesn't work with proxy server.

* **[Appium]** **Breaking Change.** Updated to use webdriverio v5 as well. See upgrade plan ↑
* **[REST]** **Breaking Change.** Replaced `unirest` library with `axios`.

  * **Upgrade plan**:

    1. Refer to [axios API](https://github.com/axios/axios).
    2. If you were using `unirest` requests/responses in your tests change them to axios format.
* **Breaking Change.** Generators support in tests removed. Use `async/await` in your tests
* **Using `codecept.conf.js` as default configuration format**
* Fixed "enametoolong" error when saving screenshots for data driven tests by **[PeterNgTr](https://github.com/PeterNgTr)**
* Updated NodeJS to 10 in Docker image
* **[Pupeteer]** Add support to use WSEndpoint. Allows to execute tests remotely. [See [#1350](https://github.com/Codeception/CodeceptJS/issues/1350)] by **[gabrielcaires](https://github.com/gabrielcaires)** (https://github.com/Codeception/CodeceptJS/pull/1350)
* In interactive shell **[Enter]** goes to next step. Improvement by **[PeterNgTr](https://github.com/PeterNgTr)**.
* `I.say` accepts second parameter as color to print colorful comments. Improvement by **[PeterNgTr](https://github.com/PeterNgTr)**.

```js
I.say('This is red', 'red'); //red is used
I.say('This is blue', 'blue'); //blue is used
I.say('This is by default'); //cyan is used
```
* Fixed allure reports for multi session testing by **[PeterNgTr](https://github.com/PeterNgTr)**
* Fixed allure reports for hooks by **[PeterNgTr](https://github.com/PeterNgTr)**

## 1.4.6

* **[Puppeteer]** `dragSlider` action added by **[PeterNgTr](https://github.com/PeterNgTr)**
* **[Puppeteer]** Fixed opening browser in shell mode by **[allenhwkim](https://github.com/allenhwkim)**
* **[Puppeteer]** Fixed making screenshot on additional sessions by **[PeterNgTr](https://github.com/PeterNgTr)**. Fixes [#1266](https://github.com/Codeception/CodeceptJS/issues/1266)
* Added `--invert` option to `run-multiple` command by **[LukoyanovE](https://github.com/LukoyanovE)**
* Fixed steps in Allure reports by **[PeterNgTr](https://github.com/PeterNgTr)**
* Add option `output` to customize output directory in [stepByStepReport plugin](https://codecept.io/plugins/#stepbystepreport). By **[fpsthirty](https://github.com/fpsthirty)**
* Changed type definition of PageObjects to get auto completion by **[rhicu](https://github.com/rhicu)**
* Fixed steps output for async/arrow functions in CLI by **[LukoyanovE](https://github.com/LukoyanovE)**. See [#1329](https://github.com/Codeception/CodeceptJS/issues/1329)

## 1.4.5

* Add **require** param to main config. Allows to require Node modules before executing tests. By **[LukoyanovE](https://github.com/LukoyanovE)**. For example:
    * Use `ts-node/register` to register TypeScript parser
    * Use `should` to register should-style assertions

```js
"require": ["ts-node/register", "should"]
```

* **[WebDriverIO]** Fix timeouts definition to be compatible with W3C drivers. By **[LukoyanovE](https://github.com/LukoyanovE)**
* Fixed: exception in Before block w/ Mocha causes test not to report failure. See [#1292](https://github.com/Codeception/CodeceptJS/issues/1292) by **[PeterNgTr](https://github.com/PeterNgTr)**
* Command `run-parallel` now accepts `--override` flag. Thanks to **[ClemCB](https://github.com/ClemCB)**
* Fixed Allure report with Before/BeforeSuite/After/AfterSuite steps. By **[PeterNgTr](https://github.com/PeterNgTr)**
* Added `RUN_MULTIPLE` env variable to [Docker config](https://codecept.io/docker/). Allows to run tests in parallel inside a container. Thanks to **[PeterNgTr](https://github.com/PeterNgTr)**
* **[Mochawesome]** Fixed showing screenshot on failure. Fix by **[PeterNgTr](https://github.com/PeterNgTr)**
* Fixed running tests filtering by tag names defined via `Scenario.tag()`

## 1.4.4

* [autoDelay plugin](https://codecept.io/plugins/#autoDelay) added. Adds tiny delay before and after an action so the page could react to actions performed.
* **[Puppeteer]** improvements by **[luismanuel001](https://github.com/luismanuel001)**
  * `click` no longer waits for navigation
  * `clickLink` method added. Performs a click and waits for navigation.
* Bootstrap scripts to be started only for `run` command and ignored on `list`, `def`, etc. Fix by **[LukoyanovE](https://github.com/LukoyanovE)**


## 1.4.3

* Groups renamed to Tags for compatibility with BDD layer
* Test and suite objects to contain tags property which can be accessed from internal API
* Fixed adding tags for Scenario Outline in BDD
* Added `tag()` method to ScenarioConfig and FeatureConfig:

```js
Scenario('update user profile', () => {
  // test goes here
}).tag('@slow');
```

* Fixed attaching Allure screenshot on exception. Fix by **[DevinWatson](https://github.com/DevinWatson)**
* Improved type definitions for custom steps. By **[Akxe](https://github.com/Akxe)**
* Fixed setting `multiple.parallel.chunks` as environment variable in config. See [#1238](https://github.com/Codeception/CodeceptJS/issues/1238) by **[ngadiyak](https://github.com/ngadiyak)**

## 1.4.2

* Fixed setting config for plugins (inclunding setting `outputDir` for allure) by **[jplegoff](https://github.com/jplegoff)**

## 1.4.1

* Added `plugins` option to `run-multiple`
* Minor output fixes
* Added Type Definition for Helper class by **[Akxe](https://github.com/Akxe)**
* Fixed extracing devault extension in generators by **[Akxe](https://github.com/Akxe)**

## 1.4.0

* [**Allure Reporter Integration**](https://codecept.io/reports/#allure). Full inegration with Allure Server. Get nicely looking UI for tests,including steps, nested steps, and screenshots. Thanks **Natarajan Krishnamurthy **[krish](https://github.com/krish)**** for sponsoring this feature.
* [Plugins API introduced](https://codecept.io/hooks/#plugins). Create custom plugins for CodeceptJS by hooking into event dispatcher, and using promise recorder.
* **Official [CodeceptJS plugins](https://codecept.io/plugins) added**:
    * **`stepByStepReport` - creates nicely looking report to see test execution as a slideshow**. Use this plugin to debug tests in headless environment without recording a video.
    * `allure` - Allure reporter added as plugin.
    * `screenshotOnFail` - saves screenshot on fail. Replaces similar functionality from helpers.
    * `retryFailedStep` - to rerun each failed step.
* **[Puppeteer]** Fix `executeAsyncScript` unexpected token by **[jonathanz](https://github.com/jonathanz)**
* Added `override` option to `run-multiple` command by **[svarlet](https://github.com/svarlet)**

## 1.3.3

* Added `initGlobals()` function to API of [custom runner](https://codecept.io/hooks/#custom-runner).

## 1.3.2

* Interactve Shell improvements for `pause()`
    * Added `next` command for **step-by-step debug** when using `pause()`.
    * Use `After(pause);` in a to start interactive console after last step.
* **[Puppeteer]** Updated to Puppeteer 1.6.0
    * Added `waitForRequest` to wait for network request.
    * Added `waitForResponse` to wait for network response.
* Improved TypeScript definitions to support custom steps and page objects. By **[xt1](https://github.com/xt1)**
* Fixed XPath detection to accept XPath which starts with `./` by **[BenoitZugmeyer](https://github.com/BenoitZugmeyer)**

## 1.3.1

* BDD-Gherkin: Fixed running async steps.
* **[Puppeteer]** Fixed process hanging for 30 seconds. Page loading timeout default via `getPageTimeout` set 0 seconds.
* **[Puppeteer]** Improved displaying client-side console messages in debug mode.
* **[Puppeteer]** Fixed closing sessions in `restart:false` mode for multi-session mode.
* **[Protractor]** Fixed `grabPopupText` to not throw error popup is not opened.
* **[Protractor]** Added info on using 'direct' Protractor driver to helper documentation by **[xt1](https://github.com/xt1)**.
* **[WebDriverIO]** Added a list of all special keys to WebDriverIO helper by **[davertmik](https://github.com/davertmik)** and **[xt1](https://github.com/xt1)**.
* Improved TypeScript definitions generator by **[xt1](https://github.com/xt1)**

## 1.3.0

* **Cucumber-style BDD. Introduced [Gherkin support](https://codecept.io/bdd). Thanks to [David Vins](https://github.com/dvins) and [Omedym](https://www.omedym.com) for sponsoring this feature**.

Basic feature file:

```gherkin
Feature: Business rules
  In order to achieve my goals
  As a persona
  I want to be able to interact with a system

  Scenario: do anything in my life
    Given I need to open Google
```

Step definition:

```js
const I = actor();

Given('I need to open Google', () => {
  I.amOnPage('https://google.com');
});
```

Run it with `--features --steps` flag:

```
codeceptjs run --steps --features
```

---

* **Brekaing Chnage** `run` command now uses relative path + test name to run exactly one test file.

Previous behavior (removed):
```
codeceptjs run basic_test.js
```
Current behavior (relative path to config + a test name)

```
codeceptjs run tests/basic_test.js
```
This change allows using auto-completion when running a specific test.

---

* Nested steps output enabled for page objects.
    * to see high-level steps only run tests with `--steps` flag.
    * to see PageObjects implementation run tests with `--debug`.
* PageObjects simplified to remove `_init()` extra method. Try updated generators and see [updated guide](https://codecept.io/pageobjects/#pageobject).
* **[Puppeteer]** [Multiple sessions](https://codecept.io/acceptance/#multiple-sessions) enabled. Requires Puppeteer >= 1.5
* **[Puppeteer]** Stability improvement. Waits for for `load` event on page load. This strategy can be changed in config:
    * `waitForNavigation` config option introduced. Possible options: `load`, `domcontentloaded`, `networkidle0`, `networkidle2`. See [Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions)
    * `getPageTimeout` config option to set maximum navigation time in milliseconds. Default is 30 seconds.
    * `waitForNavigation` method added. Explicitly waits for navigation to be finished.
* [WebDriverIO][Protractor][Puppeteer][Nightmare] **Possible BC** `grabTextFrom` unified. Return a text for single matched element and an array of texts for multiple elements.
* [Puppeteer]Fixed `resizeWindow` by **[sergejkaravajnij](https://github.com/sergejkaravajnij)**
* [WebDriverIO][Protractor][Puppeteer][Nightmare] `waitForFunction` added. Waits for client-side JavaScript function to return true by **[GREENpoint](https://github.com/GREENpoint)**.
* **[Puppeteer]** `waitUntil` deprecated in favor of `waitForFunction`.
* Added `filter` function to DataTable.
* Send non-nested array of files to custom parallel execution chunking by **[mikecbrant](https://github.com/mikecbrant)**.
* Fixed invalid output directory path for run-multiple by **[mikecbrant](https://github.com/mikecbrant)**.
* **[WebDriverIO]** `waitUntil` timeout accepts time in seconds (as all other wait* functions). Fix by **[truesrc](https://github.com/truesrc)**.
* **[Nightmare]** Fixed `grabNumberOfVisibleElements` to work similarly to `seeElement`. Thx to **[stefanschenk](https://github.com/stefanschenk)** and Jinbo Jinboson.
* **[Protractor]** Fixed alert handling error with message 'no such alert' by **[truesrc](https://github.com/truesrc)**.


## 1.2.1

* Fixed running `I.retry()` on multiple steps.
* Fixed parallel execution wih chunks.
* **[Puppeteer]** Fixed `grabNumberOfVisibleElements` to return `0` instead of throwing error if no elements are found.

## 1.2.0

* [WebDriverIO][Protractor][Multiple Sessions](https://codecept.io/acceptance/#multiple-sessions). Run several browser sessions in one test. Introduced `session` command, which opens additional browser window and closes it after a test.

```js
Scenario('run in different browsers', (I) => {
  I.amOnPage('/hello');
  I.see('Hello!');
  session('john', () => {
    I.amOnPage('/bye');
    I.dontSee('Hello');
    I.see('Bye');
  });
  I.see('Hello');
});
```

* [Parallel Execution](https://codecept.io/advanced/#parallel-execution) by **[sveneisenschmidt](https://github.com/sveneisenschmidt)**. Run tests in parallel specifying number of chunks:

```js
"multiple": {
  "parallel": {
    // run in 2 processes
    "chunks": 2,
    // run all tests in chrome
    "browsers": ["chrome"]
  },
}
```

* [Locator Builder](https://codecept.io/locators). Write complex locators with simplest API combining CSS and XPath:

```js
// select 'Edit' link inside 2nd row of a table
locate('//table')
  .find('tr')
  .at(2)
  .find('a')
  .withText('Edit');
```

* [Dynamic configuration](https://codecept.io/advanced/#dynamic-configuration) to update helpers config per test or per suite.
* Added `event.test.finished` which fires synchronously for both failed and passed tests.
* [WebDriverIO][Protractor][Nightmare][Puppeteer] Full page screenshots on failure disabled by default. See [issue[#1600](https://github.com/Codeception/CodeceptJS/issues/1600). You can enabled them with `fullPageScreenshots: true`, however they may work unstable in Selenium.
* `within` blocks can return values. See [updated documentation](https://codecept.io/basics/#within).
* Removed doublt call to `_init` in helpers. Fixes issue [#1036](https://github.com/Codeception/CodeceptJS/issues/1036)
* Added scenario and feature configuration via fluent API:

```js
Feature('checkout')
  .timeout(3000)
  .retry(2);

Scenario('user can order in firefox', (I) => {
  // see dynamic configuration
}).config({ browser: 'firefox' })
  .timeout(20000);

Scenario('this test should throw error', (I) => {
  // I.amOnPage
}).throws(new Error);
```

## 1.1.8

* Fixed generating TypeScript definitions with `codeceptjs def`.
* Added Chinese translation ("zh-CN" and "zh-TW") by **[TechQuery](https://github.com/TechQuery)**.
* Fixed running tests from a different folder specified by `-c` option.
* **[Puppeteer]** Added support for hash handling in URL by **[gavoja](https://github.com/gavoja)**.
* **[Puppeteer]** Fixed setting viewport size by **[gavoja](https://github.com/gavoja)**. See [Puppeteer issue](https://github.com/GoogleChrome/puppeteer/issues/1183)


## 1.1.7

* Docker Image updateed. [See updated reference](https://codecept.io/docker/):
    * codeceptjs package is mounted as `/codecept` insde container
    * tests directory is expected to be mounted as `/tests`
    * `codeceptjs` global runner added (symlink to `/codecept/bin/codecept.js`)
* **[Protractor]** Functions added by **[reubenmiller](https://github.com/reubenmiller)**:
    * `_locateCheckable (only available from other helpers)`
    * `_locateClickable (only available from other helpers)`
    * `_locateFields (only available from other helpers)`
    * `acceptPopup`
    * `cancelPopup`
    * `dragAndDrop`
    * `grabBrowserLogs`
    * `grabCssPropertyFrom`
    * `grabHTMLFrom`
    * `grabNumberOfVisibleElements`
    * `grabPageScrollPosition (new)`
    * `rightClick`
    * `scrollPageToBottom`
    * `scrollPageToTop`
    * `scrollTo`
    * `seeAttributesOnElements`
    * `seeCssPropertiesOnElements`
    * `seeInPopup`
    * `seeNumberOfVisibleElements`
    * `switchTo`
    * `waitForEnabled`
    * `waitForValue`
    * `waitInUrl`
    * `waitNumberOfVisibleElements`
    * `waitToHide`
    * `waitUntil`
    * `waitUrlEquals`
* **[Nightmare]** added:
    * `grabPageScrollPosition` (new)
    * `seeNumberOfVisibleElements`
    * `waitToHide`
* **[Puppeteer]** added:
    * `grabPageScrollPosition` (new)
* **[WebDriverIO]** added"
    * `grabPageScrollPosition` (new)
* **[Puppeteer]** Fixed running wait* functions without setting `sec` parameter.
* [Puppeteer][Protractor] Fixed bug with I.click when using an object selector with the xpath property. By **[reubenmiller](https://github.com/reubenmiller)**
* [WebDriverIO][Protractor][Nightmare][Puppeteer] Fixed I.switchTo(0) and I.scrollTo(100, 100) api inconsistencies between helpers.
* **[Protractor]** Fixing bug when `seeAttributesOnElements` and `seeCssPropertiesOnElement` were incorrectly passing when the attributes/properties did not match by **[reubenmiller](https://github.com/reubenmiller)**
* **[WebDriverIO]** Use inbuilt dragAndDrop function (still doesn't work in Firefox). By **[reubenmiller](https://github.com/reubenmiller)**
* Support for Nightmare 3.0
* Enable glob patterns in `config.test` / `Codecept.loadTests` by **[sveneisenschmidt](https://github.com/sveneisenschmidt)**
* Enable overriding of `config.tests` for `run-multiple` by **[sveneisenschmidt](https://github.com/sveneisenschmidt)**


## 1.1.6

* Added support for `async I =>` functions syntax in Scenario by **[APshenkin](https://github.com/APshenkin)**
* [WebDriverIO][Protractor][Puppeteer][Nightmare] `waitForInvisible` waits for element to hide or to be removed from page. By **[reubenmiller](https://github.com/reubenmiller)**
* [Protractor][Puppeteer][Nightmare] Added `grabCurrentUrl` function. By **[reubenmiller](https://github.com/reubenmiller)**
* **[WebDriverIO]** `grabBrowserUrl` deprecated in favor of `grabCurrentUrl` to unify the API.
* **[Nightmare]** Improved element visibility detection by **[reubenmiller](https://github.com/reubenmiller)**
* **[Puppeteer]** Fixing function calls when clearing the cookies and localstorage. By **[reubenmiller](https://github.com/reubenmiller)**
* **[Puppeteer]** Added `waitForEnabled`, `waitForValue` and `waitNumberOfVisibleElements` methods by **[reubenmiller](https://github.com/reubenmiller)**
* **[WebDriverIO]** Fixed `grabNumberOfVisibleElements` to return 0 when no visible elements are on page. By **[michaltrunek](https://github.com/michaltrunek)**
* Helpers API improvements (by **[reubenmiller](https://github.com/reubenmiller)**)
    * `_passed` hook runs after a test passed successfully
    * `_failed` hook runs on a failed test
* Hooks API. New events added by **[reubenmiller](https://github.com/reubenmiller)**:
    * `event.all.before` - executed before all tests
    * `event.all.after` - executed after all tests
    * `event.multiple.before` - executed before all processes in run-multiple
    * `event.multiple.after` - executed after all processes in run-multiple
* Multiple execution
* Allow `AfterSuite` and `After` test hooks to be defined after the first Scenario. By **[reubenmiller](https://github.com/reubenmiller)**
* **[Nightmare]** Prevent `I.amOnpage` navigation if the browser is already at the given url
* Multiple-Run: Added new `bootstrapAll` and `teardownAll` hooks to be executed before and after all processes
* `codeceptjs def` command accepts `--config` option. By **[reubenmiller](https://github.com/reubenmiller)**

## 1.1.5

* **[Puppeteer]** Rerun steps failed due to "Cannot find context with specified id" Error.
* Added syntax to retry a single step:

```js
// retry action once on failure
I.retry().see('Hello');

// retry action 3 times on failure
I.retry(3).see('Hello');

// retry action 3 times waiting for 0.1 second before next try
I.retry({ retries: 3, minTimeout: 100 }).see('Hello');

// retry action 3 times waiting no more than 3 seconds for last retry
I.retry({ retries: 3, maxTimeout: 3000 }).see('Hello');

// retry 2 times if error with message 'Node not visible' happens
I.retry({
  retries: 2,
  when: err => err.message === 'Node not visible'
}).seeElement('#user');
```

* `Scenario().injectDependencies` added to dynamically add objects into DI container by **[Apshenkin](https://github.com/Apshenkin)**. See [Dependency Injection section in PageObjects](https://codecept.io/pageobjects/#dependency-injection).
* Fixed using async/await functions inside `within`
* [WebDriverIO][Protractor][Puppeteer][Nightmare] **`waitUntilExists` deprecated** in favor of `waitForElement`
* [WebDriverIO][Protractor] **`waitForStalenessOf` deprecated** in favor of `waitForDetached`
* [WebDriverIO][Protractor][Puppeteer][Nightmare] `waitForDetached` added
* **[Nightmare]** Added `I.seeNumberOfElements()` by **[pmoncadaisla](https://github.com/pmoncadaisla)**
* **[Nightmare]** Load blank page when starting nightmare so that the .evaluate function will work if _failed/saveScreenshot is triggered by **[reubenmiller](https://github.com/reubenmiller)**
* Fixed using plain arrays for data driven tests by **[reubenmiller](https://github.com/reubenmiller)**
* **[Puppeteer]** Use default tab instead of opening a new tab when starting the browser by **[reubenmiller](https://github.com/reubenmiller)**
* **[Puppeteer]** Added `grabNumberOfTabs` function by **[reubenmiller](https://github.com/reubenmiller)**
* **[Puppeteer]** Add ability to set user-agent by **[abidhahmed](https://github.com/abidhahmed)**
* **[Puppeteer]** Add keepCookies and keepBrowserState **[abidhahmed](https://github.com/abidhahmed)**
* **[Puppeteer]** Clear value attribute instead of innerhtml for TEXTAREA by **[reubenmiller](https://github.com/reubenmiller)**
* **[REST]** fixed sending string payload by **[michaltrunek](https://github.com/michaltrunek)**
* Fixed unhandled rejection in async/await tests by **[APshenkin](https://github.com/APshenkin)**


## 1.1.4

* Removed `yarn` call in package.json
* Fixed `console.log` in Puppeteer by **[othree](https://github.com/othree)**
* **[Appium]** `runOnAndroid` and `runOnIOS` can receive a function to check capabilities dynamically:

```js
I.runOnAndroid(caps => caps.platformVersion >= 7, () => {
  // run code only on Android 7+
});
```

## 1.1.3

* **[Puppeteer]** +25 Functions added by **[reubenmiller](https://github.com/reubenmiller)**
    * `_locateCheckable`
    * `_locateClickable`
    * `_locateFields`
    * `closeOtherTabs`
    * `dragAndDrop`
    * `grabBrowserLogs`
    * `grabCssPropertyFrom`
    * `grabHTMLFrom`
    * `grabNumberOfVisibleElements`
    * `grabSource`
    * `rightClick`
    * `scrollPageToBottom`
    * `scrollPageToTop`
    * `scrollTo`
    * `seeAttributesOnElements`
    * `seeCssPropertiesOnElements`
    * `seeInField`
    * `seeNumberOfElements`
    * `seeNumberOfVisibleElements`
    * `seeTextEquals`
    * `seeTitleEquals`
    * `switchTo`
    * `waitForInvisible`
    * `waitInUrl`
    * `waitUrlEquals`
* **[Protractor]** +8 functions added by **[reubenmiller](https://github.com/reubenmiller)**
    * `closeCurrentTab`
    * `grabSource`
    * `openNewTab`
    * `seeNumberOfElements`
    * `seeTextEquals`
    * `seeTitleEquals`
    * `switchToNextTab`
    * `switchToPreviousTab`
* **[Nightmare]** `waitForInvisible` added by **[reubenmiller](https://github.com/reubenmiller)**
* **[Puppeteer]** Printing console.log information in debug mode.
* **[Nightmare]** Integrated with `nightmare-har-plugin` by mingfang. Added `enableHAR` option. Added HAR functions:
    * `grabHAR`
    * `saveHAR`
    * `resetHAR`
* **[WebDriverIO]** Fixed execution stability for parallel requests with Chromedriver
* **[WebDriverIO]** Fixed resizeWindow when resizing to 'maximize' by **[reubenmiller](https://github.com/reubenmiller)**
* **[WebDriverIO]** Fixing resizing window to full screen when taking a screenshot by **[reubenmiller](https://github.com/reubenmiller)**

## 1.1.2

* **[Puppeteer]** Upgraded to Puppeteer 1.0
* Added `grep` option to config to set default matching pattern for tests.
* **[Puppeteer]** Added `acceptPopup`, `cancelPopup`, `seeInPopup` and `grabPopupText` functions by **[reubenmiller](https://github.com/reubenmiller)**
* **[Puppeteer]** `within` iframe and nested iframe support added by **[reubenmiller](https://github.com/reubenmiller)**
* **[REST]** Added support for JSON objects since payload (as a JSON) was automatically converted into "URL query" type of parameter by **[Kalostrinho](https://github.com/Kalostrinho)**
* **[REST]** Added `resetRequestHeaders` method by **[Kalostrinho](https://github.com/Kalostrinho)**
* **[REST]** Added `followRedirect` option and `amFollowingRequestRedirects`/`amNotFollowingRequestRedirects` methods by **[Kalostrinho](https://github.com/Kalostrinho)**
* **[WebDriverIO]** `uncheckOption` implemented by **[brunobg](https://github.com/brunobg)**
* **[WebDriverIO]** Added `grabBrowserUrl` by **[Kalostrinho](https://github.com/Kalostrinho)**
* Add ability to require helpers from node_modules by **[APshenkin](https://github.com/APshenkin)**
* Added `--profile` option to `run-multiple` command by **[jamie-beck](https://github.com/jamie-beck)**
* Custom output name for multiple browser run by **[tfiwm](https://github.com/tfiwm)**
* Fixed passing data to scenarios by **[KennyRules](https://github.com/KennyRules)**

## 1.1.1

* **[WebDriverIO]** fixed `waitForInvisible` by **[Kporal](https://github.com/Kporal)**

## 1.1.0

Major update to CodeceptJS. **NodeJS v 8.9.1** is now minimal Node version required.
This brings native async-await support to CodeceptJS. It is recommended to start using await for tests instead of generators:

```js
async () => {
  I.amOnPage('/page');
  const url = await I.grabTextFrom('.nextPage');
  I.amOnPage(url);
}
```

Thanks to [@Apshenkin](https://github.com/apshenkin) for implementation. Also, most helpers were refactored to use async-await. This made our code simpler. We hope that this encourages more users to send pull requests!

We also introduced strict ESLint policies for our codebase. Thanks to [@Galkin](https://github.com/galkin) for that.

* **[Puppeteer] Helper introduced**. [Learn how to run tests headlessly with Google Chrome's Puppeteer](http://codecept.io/puppeteer/).
* **[SeleniumWebdriver]** Helper is deprecated, it is recommended to use Protractor with config option `angular: false` instead.
* **[WebDriverIO]** nested iframe support in the within block by **[reubenmiller](https://github.com/reubenmiller)**. Example:

```js
within({frame: ['#wrapperId', '[name=content]']}, () => {
  I.click('Sign in!');
  I.see('Email Address');
});
I.see('Nested Iframe test');
I.dontSee('Email Address');
});
```
* **[WebDriverIO]** Support for `~` locator to find elements by `aria-label`. This behavior is similar as it is in Appium and helps testing cross-platform React apps. Example:

```html
<Text accessibilityLabel="foobar">
    CodeceptJS is awesome
</Text>
```
↑ This element can be located with `~foobar` in WebDriverIO and Appium helpers. Thanks to **[flyskywhy](https://github.com/flyskywhy)**

* Allow providing arbitrary objects in config includes by **[rlewan](https://github.com/rlewan)**
* **[REST]** Prevent from mutating default headers by **[alexashley](https://github.com/alexashley)**. See [#789](https://github.com/Codeception/CodeceptJS/issues/789)
* **[REST]** Fixed sending empty helpers with `haveRequestHeaders` in `sendPostRequest`. By **[petrisorionel](https://github.com/petrisorionel)**
* Fixed displaying undefined args in output by **[APshenkin](https://github.com/APshenkin)**
* Fixed NaN instead of seconds in output by **[APshenkin](https://github.com/APshenkin)**
* Add browser name to report file for `multiple-run` by **[trollr](https://github.com/trollr)**
* Mocha updated to 4.x



## 1.0.3

* [WebDriverIO][Protractor][Nightmare] method `waitUntilExists` implemented by **[sabau](https://github.com/sabau)**
* Absolute path can be set for `output` dir by **[APshenkin](https://github.com/APshenkin)**. Fix [#571](https://github.com/Codeception/CodeceptJS/issues/571)* Data table rows can be ignored by using `xadd`. By **[APhenkin](https://github.com/APhenkin)**
* Added `Data(table).only.Scenario` to give ability to launch only Data tests. By **[APhenkin](https://github.com/APhenkin)**
* Implemented `ElementNotFound` error by **[BorisOsipov](https://github.com/BorisOsipov)**.
* Added TypeScript compiler / configs to check the JavaScript by **[KennyRules](https://github.com/KennyRules)**
* **[Nightmare]** fix executeScript return value by **[jploskonka](https://github.com/jploskonka)**
* **[Nightmare]** fixed: err.indexOf not a function when waitForText times out in nightmare by **[joeypedicini92](https://github.com/joeypedicini92)**
* Fixed: Retries not working when using .only. By **[APhenkin](https://github.com/APhenkin)**


## 1.0.2

* Introduced generators support in scenario hooks for `BeforeSuite`/`Before`/`AfterSuite`/`After`
* **[ApiDataFactory]** Fixed loading helper; `requireg` package included.
* Fix [#485](https://github.com/Codeception/CodeceptJS/issues/485)`run-multiple`: the first browser-resolution combination was be used in all configurations
* Fixed unique test names:
  * Fixed [#447](https://github.com/Codeception/CodeceptJS/issues/447) tests failed silently if they have the same name as other tests.
  * Use uuid in screenshot names when `uniqueScreenshotNames: true`
* **[Protractor]** Fixed testing non-angular application. `amOutsideAngularApp` is executed before each step. Fixes [#458](https://github.com/Codeception/CodeceptJS/issues/458)* Added output for steps in hooks when they fail

## 1.0.1

* Reporters improvements:
  * Allows to execute [multiple reporters](http://codecept.io/advanced/#Multi-Reports)
  * Added [Mochawesome](http://codecept.io/helpers/Mochawesome/) helper
  * `addMochawesomeContext` method to add custom data to mochawesome reports
  * Fixed Mochawesome context for failed screenshots.
* **[WebDriverIO]** improved click on context to match clickable element with a text inside. Fixes [#647](https://github.com/Codeception/CodeceptJS/issues/647)* **[Nightmare]** Added `refresh` function by **[awhanks](https://github.com/awhanks)**
* fixed `Unhandled promise rejection (rejection id: 1): Error: Unknown wait type: pageLoad`
* support for tests with retries in html report
* be sure that change window size and timeouts completes before test
* **[Nightmare]** Fixed `[Wrapped Error] "codeceptjs is not defined"`; Reinjectiing client scripts to a webpage on changes.
* **[Nightmare]** Added more detailed error messages for `Wait*` methods
* **[Nightmare]** Fixed adding screenshots to Mochawesome
* **[Nightmare]** Fix unique screenshots names in Nightmare
* Fixed CodeceptJS work with hooks in helpers to finish codeceptJS correctly if errors appears in helpers hooks
* Create a new session for next test If selenium grid error received
* Create screenshots for failed hooks from a Feature file
* Fixed `retries` option

## 1.0

CodeceptJS hits first stable release. CodeceptJS provides a unified API for [web testing for Webdriverio](http://codecept.io/acceptance/), [Protractor](http://codecept.io/angular/), and [NightmareJS](http://codecept.io/nightmare/). Since 1.0 you can also **test mobile applications** in the similar manner with Appium.

Sample test:

```js
I.seeAppIsInstalled("io.super.app");
I.click('~startUserRegistrationCD');
I.fillField('~email of the customer', 'Nothing special'));
I.see('davert@codecept.io', '~email of the customer'));
I.clearField('~email of the customer'));
I.dontSee('Nothing special', '~email of the customer'));
```

* Read [the Mobile Testing guide](http://codecept.io/mobile).
* Discover [Appium Helper](http://codecept.io/helpers/Appium/)

---

We also introduced two new **helpers for data management**.
Using them you can easily prepare and cleanup data for your tests using public REST API.

Sample test

```js
// create a user using data factories and REST API
I.have('user', { name: 'davert', password: '123456' });
// use it to login
I.amOnPage('/login');
I.fillField('login', 'davert');
I.fillField('password', '123456');
I.click('Login');
I.see('Hello, davert');
// user will be removed after the test
```

* Read [Data Management guide](http://codecept.io/data)
* [REST Helper](http://codecept.io/helpers/REST)
* [ApiDataFactory](http://codecept.io/helpers/ApiDataFactory/)

---

Next notable feature is **[SmartWait](http://codecept.io/acceptance/#smartwait)** for WebDriverIO, Protractor, SeleniumWebdriver. When `smartwait` option is set, script will wait for extra milliseconds to locate an element before failing. This feature uses implicit waits of Selenium but turns them on only in applicable pieces. For instance, implicit waits are enabled for `seeElement` but disabled for `dontSeeElement`

* Read more about [SmartWait](http://codecept.io/acceptance/#smartwait)

##### Changelog

* Minimal NodeJS version is 6.11.1 LTS
* Use `within` command with generators.
* [Data Driven Tests](http://codecept.io/advanced/#data-driven-tests) introduced.
* Print execution time per step in `--debug` mode. [#591](https://github.com/Codeception/CodeceptJS/issues/591) by **[APshenkin](https://github.com/APshenkin)**
* [WebDriverIO][Protractor][Nightmare] Added `disableScreenshots` option to disable screenshots on fail by **[Apshenkin](https://github.com/Apshenkin)**
* [WebDriverIO][Protractor][Nightmare] Added `uniqueScreenshotNames` option to generate unique names for screenshots on failure by **[Apshenkin](https://github.com/Apshenkin)**
* [WebDriverIO][Nightmare] Fixed click on context; `click('text', '#el')` will throw exception if text is not found inside `#el`.
* [WebDriverIO][Protractor][SeleniumWebdriver] [SmartWait introduced](http://codecept.io/acceptance/#smartwait).
* [WebDriverIO][Protractor][Nightmare]Fixed `saveScreenshot` for PhantomJS, `fullPageScreenshots` option introduced by **[HughZurname](https://github.com/HughZurname)** [#549](https://github.com/Codeception/CodeceptJS/issues/549)
* **[Appium]** helper introduced by **[APshenkin](https://github.com/APshenkin)**
* **[REST]** helper introduced by **[atrevino](https://github.com/atrevino)** in [#504](https://github.com/Codeception/CodeceptJS/issues/504)
* [WebDriverIO][SeleniumWebdriver] Fixed "windowSize": "maximize" for Chrome 59+ version [#560](https://github.com/Codeception/CodeceptJS/issues/560) by **[APshenkin](https://github.com/APshenkin)**
* **[Nightmare]** Fixed restarting by **[APshenkin](https://github.com/APshenkin)** [#581](https://github.com/Codeception/CodeceptJS/issues/581)
* **[WebDriverIO]** Methods added by **[APshenkin](https://github.com/APshenkin)**:
    * [grabCssPropertyFrom](http://codecept.io/helpers/WebDriverIO/#grabcsspropertyfrom)
    * [seeTitleEquals](http://codecept.io/helpers/WebDriverIO/#seetitleequals)
    * [seeTextEquals](http://codecept.io/helpers/WebDriverIO/#seetextequals)
    * [seeCssPropertiesOnElements](http://codecept.io/helpers/WebDriverIO/#seecsspropertiesonelements)
    * [seeAttributesOnElements](http://codecept.io/helpers/WebDriverIO/#seeattributesonelements)
    * [grabNumberOfVisibleElements](http://codecept.io/helpers/WebDriverIO/#grabnumberofvisibleelements)
    * [waitInUrl](http://codecept.io/helpers/WebDriverIO/#waitinurl)
    * [waitUrlEquals](http://codecept.io/helpers/WebDriverIO/#waiturlequals)
    * [waitForValue](http://codecept.io/helpers/WebDriverIO/#waitforvalue)
    * [waitNumberOfVisibleElements](http://codecept.io/helpers/WebDriverIO/#waitnumberofvisibleelements)
    * [switchToNextTab](http://codecept.io/helpers/WebDriverIO/#switchtonexttab)
    * [switchToPreviousTab](http://codecept.io/helpers/WebDriverIO/#switchtoprevioustab)
    * [closeCurrentTab](http://codecept.io/helpers/WebDriverIO/#closecurrenttab)
    * [openNewTab](http://codecept.io/helpers/WebDriverIO/#opennewtab)
    * [refreshPage](http://codecept.io/helpers/WebDriverIO/#refreshpage)
    * [scrollPageToBottom](http://codecept.io/helpers/WebDriverIO/#scrollpagetobottom)
    * [scrollPageToTop](http://codecept.io/helpers/WebDriverIO/#scrollpagetotop)
    * [grabBrowserLogs](http://codecept.io/helpers/WebDriverIO/#grabbrowserlogs)
* Use mkdirp to create output directory. [#592](https://github.com/Codeception/CodeceptJS/issues/592) by **[vkramskikh](https://github.com/vkramskikh)**
* **[WebDriverIO]** Fixed `seeNumberOfVisibleElements` by **[BorisOsipov](https://github.com/BorisOsipov)** [#574](https://github.com/Codeception/CodeceptJS/issues/574)
* Lots of fixes for promise chain by **[APshenkin](https://github.com/APshenkin)** [#568](https://github.com/Codeception/CodeceptJS/issues/568)
    * Fix [#543](https://github.com/Codeception/CodeceptJS/issues/543)- After block not properly executed if Scenario fails
    * Expected behavior in promise chains: `_beforeSuite` hooks from helpers -> `BeforeSuite` from test -> `_before` hooks from helpers -> `Before` from test - > Test steps -> `_failed` hooks from helpers (if test failed) -> `After` from test -> `_after` hooks from helpers -> `AfterSuite` from test -> `_afterSuite` hook from helpers.
    * if during test we got errors from any hook (in test or in helper) - stop complete this suite and go to another
    * if during test we got error from Selenium server - stop complete this suite and go to another
    * [WebDriverIO][Protractor] if `restart` option is false - close all tabs expect one in `_after`.
    * Complete `_after`, `_afterSuite` hooks even After/AfterSuite from test was failed
    * Don't close browser between suites, when `restart` option is false. We should start browser only one time and close it only after all tests.
    * Close tabs and clear local storage, if `keepCookies` flag is enabled
* Fix TypeError when using babel-node or ts-node on node.js 7+ [#586](https://github.com/Codeception/CodeceptJS/issues/586) by **[vkramskikh](https://github.com/vkramskikh)**
* **[Nightmare]** fixed usage of `_locate`

Special thanks to **Andrey Pshenkin** for his work on this release and the major improvements.

## 0.6.3

* Errors are printed in non-verbose mode. Shows "Selenium not started" and other important errors.
* Allowed to set custom test options:

```js
Scenario('My scenario', { build_id: 123, type: 'slow' }, function (I)
```
those options can be accessed as `opts` property inside a `test` object. Can be used in custom listeners.

* Added `docs` directory to a package.
* [WebDriverIO][Protractor][SeleniumWebdriver] Bugfix: cleaning session when `restart: false` by **[tfiwm](https://github.com/tfiwm)** [#519](https://github.com/Codeception/CodeceptJS/issues/519)
* [WebDriverIO][Protractor][Nightmare] Added second parameter to `saveScreenshot` to allow a full page screenshot. By **[HughZurname](https://github.com/HughZurname)**
* Added suite object to `suite.before` and `suite.after` events by **[implico](https://github.com/implico)**. [#496](https://github.com/Codeception/CodeceptJS/issues/496)

## 0.6.2

* Added `config` object to [public API](http://codecept.io/hooks/#api)
* Extended `index.js` to include `actor` and `helpers`, so they could be required:

```js
const actor = require('codeceptjs').actor;
```

* Added [example for creating custom runner](http://codecept.io/hooks/#custom-runner) with public API.
* run command to create `output` directory if it doesn't exist
* **[Protractor]** fixed loading globally installed Protractor
* run-multiple command improvements:
     * create output directories for each process
     * print process ids in output

## 0.6.1

* Fixed loading hooks

## 0.6.0

Major release with extension API and parallel execution.

* **Breaking** Removed path argument from `run`. To specify path other than current directory use `--config` or `-c` option:

Instead of: `codeceptjs run tests` use:

```
# load config and run from tests directory
codeceptjs run -c tests/

# or load codecept.json from tests directory
codeceptjs run -c tests/codecept.json

# run users_test.js inside tests directory
codeceptjs run users_test.js -c tests
```

* **Command `multiple-run` added**, to execute tests in several browsers in parallel by **[APshenkin](https://github.com/APshenkin)** and **[davertmik](https://github.com/davertmik)**. [See documentation](http://codecept.io/advanced/#multiple-execution).
* **Hooks API added to extend CodeceptJS** with custom listeners and plugins. [See documentation](http://codecept.io/hooks/#hooks_1).
* [Nightmare][WebDriverIO] `within` can work with iframes by **[imvetri](https://github.com/imvetri)**. [See documentation](http://codecept.io/acceptance/#iframes).
* [WebDriverIO][SeleniumWebdriver][Protractor] Default browser changed to `chrome`
* **[Nightmare]** Fixed globally locating `nightmare-upload`.
* **[WebDriverIO]** added `seeNumberOfVisibleElements` method by **[elarouche](https://github.com/elarouche)**.
* Exit with non-zero code if init throws an error by **[rincedd](https://github.com/rincedd)**
* New guides published:
    * [Installation](http://codecept.io/installation/)
    * [Hooks](http://codecept.io/hooks/)
    * [Advanced Usage](http://codecept.io/advanced/)
* Meta packages published:
    * [codecept-webdriverio](https://www.npmjs.com/package/codecept-webdriverio)
    * [codecept-protractor](https://www.npmjs.com/package/codecept-protractor)
    * [codecept-nightmare](https://www.npmjs.com/package/codecept-nightmare)


## 0.5.1

* [Polish translation](http://codecept.io/translation/#polish) added by **[limes](https://github.com/limes)**.
* Update process exit code so that mocha saves reports before exit by **[romanovma](https://github.com/romanovma)**.
* **[Nightmare]** fixed `getAttributeFrom` for custom attributes by **[robrkerr](https://github.com/robrkerr)**
* **[Nightmare]** Fixed *UnhandledPromiseRejectionWarning error* when selecting the dropdown using `selectOption` by **[robrkerr](https://github.com/robrkerr)**. [Se PR.
* **[Protractor]** fixed `pressKey` method by **[romanovma](https://github.com/romanovma)**

## 0.5.0

* Protractor ^5.0.0 support (while keeping ^4.0.9 compatibility)
* Fix 'fullTitle() is not a function' in exit.js by **[hubidu](https://github.com/hubidu)**. See [#388](https://github.com/Codeception/CodeceptJS/issues/388).
* **[Nightmare]** Fix for `waitTimeout` by **[HughZurname](https://github.com/HughZurname)**. See [#391](https://github.com/Codeception/CodeceptJS/issues/391). Resolves [#236](https://github.com/Codeception/CodeceptJS/issues/236)* Dockerized CodeceptJS setup by **[artiomnist](https://github.com/artiomnist)**. [See reference](https://github.com/Codeception/CodeceptJS/blob/master/docker/README.md)

## 0.4.16

* Fixed steps output synchronization (regression since 0.4.14).
* [WebDriverIO][Protractor][SeleniumWebdriver][Nightmare] added `keepCookies` option to keep cookies between tests with `restart: false`.
* **[Protractor]** added `waitForTimeout` config option to set default waiting time for all wait* functions.
* Fixed `_test` hook for helpers by **[cjhille](https://github.com/cjhille)**.

## 0.4.15

* Fixed regression in recorder sessions: `oldpromise is not defined`.

## 0.4.14

* `_beforeStep` and `_afterStep` hooks in helpers are synchronized. Allows to perform additional actions between steps.

Example: fail if JS error occur in custom helper using WebdriverIO:

```js
_before() {
  this.err = null;
  this.helpers['WebDriverIO'].browser.on('error', (e) => this.err = e);
}

_afterStep() {
 if (this.err) throw new Error('Browser JS error '+this.err);
}
```

Example: fail if JS error occur in custom helper using Nightmare:

```js
_before() {
  this.err = null;
  this.helpers['Nightmare'].browser.on('page', (type, message, stack) => {
    this.err = `${message} ${stack}`;
  });
}

_afterStep() {
 if (this.err) throw new Error('Browser JS error '+this.err);
}
```

* Fixed `codecept list` and `codecept def` commands.
* Added `I.say` method to print arbitrary comments.

```js
I.say('I am going to publish post');
I.say('I enter title and body');
I.say('I expect post is visible on site');
```

* **[Nightmare]** `restart` option added. `restart: false` allows to run all tests in a single window, disabled by default. By **[nairvijays99](https://github.com/nairvijays99)**
* **[Nightmare]** Fixed `resizeWindow` command.
* [Protractor][SeleniumWebdriver] added `windowSize` config option to resize window on start.
* Fixed "Scenario.skip causes 'Cannot read property retries of undefined'" by **[MasterOfPoppets](https://github.com/MasterOfPoppets)**
* Fixed providing absolute paths for tests in config by **[lennym](https://github.com/lennym)**

## 0.4.13

* Added **retries** option `Feature` and `Scenario` to rerun fragile tests:

```js
Feature('Complex JS Stuff', {retries: 3});

Scenario('Not that complex', {retries: 1}, (I) => {
  // test goes here
});
```

* Added **timeout** option `Feature` and `Scenario` to specify timeout.

```js
Feature('Complex JS Stuff', {timeout: 5000});

Scenario('Not that complex', {timeout: 1000}, (I) => {
  // test goes here
});
```

* **[WebDriverIO]** Added `uniqueScreenshotNames` option to set unique screenshot names for failed tests. By **[APshenkin](https://github.com/APshenkin)**. See [#299](https://github.com/Codeception/CodeceptJS/issues/299)
* **[WebDriverIO]** `clearField` method improved to accept name/label locators and throw errors.
* [Nightmare][SeleniumWebdriver][Protractor] `clearField` method added.
* **[Nightmare]** Fixed `waitForElement`, and `waitForVisible` methods.
* **[Nightmare]** Fixed `resizeWindow` by **[norisk-it](https://github.com/norisk-it)**
* Added italian [translation](http://codecept.io/translation/#italian).

## 0.4.12

* Bootstrap / Teardown improved with [Hooks](http://codecept.io/configuration/#hooks). Various options for setup/teardown provided.
* Added `--override` or `-o` option for runner to dynamically override configs. Valid JSON should be passed:

```
codeceptjs run -o '{ "bootstrap": "bootstrap.js"}'
codeceptjs run -o '{ "helpers": {"WebDriverIO": {"browser": "chrome"}}}'
```

* Added [regression tests](https://github.com/Codeception/CodeceptJS/tree/master/test/runner) for codeceptjs tests runner.

## 0.4.11

* Fixed regression in 0.4.10
* Added `bootstrap`/`teardown` config options to accept functions as parameters by **[pscanf](https://github.com/pscanf)**. See updated [config reference](http://codecept.io/configuration/) [#319](https://github.com/Codeception/CodeceptJS/issues/319)

## 0.4.10

* **[Protractor]** Protrctor 4.0.12+ support.
* Enabled async bootstrap file by **[abachar](https://github.com/abachar)**. Use inside `bootstrap.js`:

```js
module.exports = function(done) {
  // async instructions
  // call done() to continue execution
  // otherwise call done('error description')
}
```

* Changed 'pending' to 'skipped' in reports by **[timja-kainos](https://github.com/timja-kainos)**. See [#315](https://github.com/Codeception/CodeceptJS/issues/315)

## 0.4.9

* [SeleniumWebdriver][Protractor][WebDriverIO][Nightmare] fixed `executeScript`, `executeAsyncScript` to work and return values.
* [Protractor][SeleniumWebdriver][WebDriverIO] Added `waitForInvisible` and `waitForStalenessOf` methods by **[Nighthawk14](https://github.com/Nighthawk14)**.
* Added `--config` option to `codeceptjs run` to manually specify config file by **[cnworks](https://github.com/cnworks)**
* **[Protractor]** Simplified behavior of `amOutsideAngularApp` by using `ignoreSynchronization`. Fixes [#278](https://github.com/Codeception/CodeceptJS/issues/278)
* Set exit code to 1 when test fails at `Before`/`After` hooks. Fixes [#279](https://github.com/Codeception/CodeceptJS/issues/279)


## 0.4.8

* [Protractor][SeleniumWebdriver][Nightmare] added `moveCursorTo` method.
* [Protractor][SeleniumWebdriver][WebDriverIO] Added `manualStart` option to start browser manually in the beginning of test. By **[cnworks](https://github.com/cnworks)**. [PR[#250](https://github.com/Codeception/CodeceptJS/issues/250)
* Fixed `codeceptjs init` to work with nested directories and file masks.
* Fixed `codeceptjs gt` to generate test with proper file name suffix. By **[Zougi](https://github.com/Zougi)**.
* **[Nightmare]** Fixed: Error is thrown when clicking on element which can't be locate. By **[davetmik](https://github.com/davetmik)**
* **[WebDriverIO]** Fixed `attachFile` for file upload. By **[giuband](https://github.com/giuband)** and **[davetmik](https://github.com/davetmik)**
* **[WebDriverIO]** Add support for timeouts in config and with `defineTimeouts` method. By **[easternbloc](https://github.com/easternbloc)** [#258](https://github.com/Codeception/CodeceptJS/issues/258) and [#267](https://github.com/Codeception/CodeceptJS/issues/267) by **[davetmik](https://github.com/davetmik)**
* Fixed hanging of CodeceptJS when error is thrown by event dispatcher. Fix by **[Zougi](https://github.com/Zougi)** and **[davetmik](https://github.com/davetmik)**


## 0.4.7

* Improved docs for `BeforeSuite`; fixed its usage with `restart: false` option by **[APshenkin](https://github.com/APshenkin)**.
* Added `Nightmare` to list of available helpers on `init`.
* **[Nightmare]** Removed double `resizeWindow` implementation.

## 0.4.6

* Added `BeforeSuite` and `AfterSuite` hooks to scenario by **[APshenkin](https://github.com/APshenkin)**. See [updated documentation](http://codecept.io/basics/#beforesuite)

## 0.4.5

* Fixed running `codecept def` command by **[jankaspar](https://github.com/jankaspar)**
* [Protractor][SeleniumWebdriver] Added support for special keys in `pressKey` method. Fixes [#216](https://github.com/Codeception/CodeceptJS/issues/216)

## 0.4.4

* Interactive shell fixed. Start it by running `codeceptjs shell`
* Added `--profile` option to `shell` command to use dynamic configuration.
* Added `--verbose` option to `shell` command for most complete output.

## 0.4.3

* **[Protractor]** Regression fixed to ^4.0.0 support
* Translations included into package.
* `teardown` option added to config (opposite to `bootstrap`), expects a JS file to be executed after tests stop.
* [Configuration](http://codecept.io/configuration/) can be set via JavaScript file `codecept.conf.js` instead of `codecept.json`. It should export `config` object:

```js
// inside codecept.conf.js
exports.config = {
  // contents of codecept.json
}
```
* Added `--profile` option to pass its value to `codecept.conf.js` as `process.profile` for [dynamic configuration](http://codecept.io/configuration#dynamic-configuration).
* Documentation for [StepObjects, PageFragments](http://codecept.io/pageobjects#PageFragments) updated.
* Documentation for [Configuration](http://codecept.io/configuration/) added.

## 0.4.2

* Added ability to localize tests with translation [#189](https://github.com/Codeception/CodeceptJS/issues/189). Thanks to **[abner](https://github.com/abner)**
  * **[Translation]** ru-RU translation added.
  * **[Translation]** pt-BR translation added.
* **[Protractor]** Protractor 4.0.4 compatibility.
* [WebDriverIO][SeleniumWebdriver][Protractor] Fixed single browser session  mode for `restart: false`
* Fixed using of 3rd party reporters (xunit, mocha-junit-reporter, mochawesome). Added guide.
* Documentation for [Translation](http://codecept.io/translation/) added.
* Documentation for [Reports](http://codecept.io/reports/) added.

## 0.4.1

* Added custom steps to step definition list. See [#174](https://github.com/Codeception/CodeceptJS/issues/174) by **[jayS-de](https://github.com/jayS-de)**
* **[WebDriverIO]** Fixed using `waitForTimeout` option by **[stephane-ruhlmann](https://github.com/stephane-ruhlmann)**. See [#178](https://github.com/Codeception/CodeceptJS/issues/178)

## 0.4.0

* **[Nightmare](http://codecept.io/nightmare) Helper** added for faster web testing.
* [Protractor][SeleniumWebdriver][WebDriverIO] added `restart: false` option to reuse one browser between tests (improves speed).
* **Protractor 4.0** compatibility. Please upgrade Protractor library.
* Added `--verbose` option for `run` command to log and print global promise and events.
* Fixed errors with shutting down and cleanup.
* Fixed starting interactive shell with `codeceptjs shell`.
* Fixed handling of failures inside within block

## 0.3.5

* Introduced IDE autocompletion support for Visual Studio Code and others. Added command for generating TypeScript definitions for `I` object. Use it as

```
codeceptjs def
```

to generate steps definition file and include it into tests by reference. By **[kaflan](https://github.com/kaflan)**

## 0.3.4

* **[Protractor]** version 3.3.0 comptaibility, NPM 3 compatibility. Please update Protractor!
* allows using absolute path for helpers, output, in config and in command line. By **[denis-sokolov](https://github.com/denis-sokolov)**
* Fixes 'Cannot read property '1' of null in generate.js:44' by **[seethislight](https://github.com/seethislight)**

## 0.3.3

**Fixed global installation**. CodeceptJS can now locate globally located modules.
CodeceptJS is also recommended for local installation.
Depending on installation type additional modules (webdriverio, protractor, ...) will be loaded either from local or from global path.

## 0.3.2

* Added `codeceptjs list` command which shows all available methods of `I` object.
* [Protractor][SeleniumWebdriver] fixed closing browser instances
* [Protractor][SeleniumWebdriver] `doubleClick` method added
* [WebDriverIO][Protractor][SeleniumWebdriver] `doubleClick` method to locate clickable elements by text, `context` option added.
* Fixed using assert in generator without yields [#89](https://github.com/Codeception/CodeceptJS/issues/89)

## 0.3.1

* Fixed `init` command

## 0.3.0

**Breaking Change**: webdriverio package removed from dependencies list. You will need to install it manually after the upgrade.
Starting from 0.3.0 webdriverio is not the only backend for running selenium tests, so you are free to choose between Protractor, SeleniumWebdriver, and webdriverio and install them.

* **[Protractor] helper added**. Now you can test AngularJS applications by using its official library within the unigied CodeceptJS API!
* **[SeleniumWebdriver] helper added**. You can switch to official JS bindings for Selenium.
* **[WebDriverIO]** **updated to webdriverio v 4.0**
* **[WebDriverIO]** `clearField` method added by **[fabioel](https://github.com/fabioel)**
* **[WebDriverIO]** added `dragAndDrop` by **[fabioel](https://github.com/fabioel)**
* **[WebDriverIO]** fixed `scrollTo` method by **[sensone](https://github.com/sensone)**
* **[WebDriverIO]** fixed `windowSize: maximize` option in config
* **[WebDriverIO]** `seeElement` and `dontSeeElement` check element for visibility by **[fabioel](https://github.com/fabioel)** and **[davertmik](https://github.com/davertmik)**
* **[WebDriverIO]** `seeElementInDOM`, `dontSeeElementInDOM` added to check element exists on page.
* **[WebDriverIO]** fixed saving screenshots on failure. Fixes [#70](https://github.com/Codeception/CodeceptJS/issues/70)
* fixed `within` block doesn't end in output not [#79](https://github.com/Codeception/CodeceptJS/issues/79)


## 0.2.8

* **[WebDriverIO]** added `seeNumberOfElements` by **[fabioel](https://github.com/fabioel)**

## 0.2.7

* process ends with exit code 1 on error or failure [#49](https://github.com/Codeception/CodeceptJS/issues/49)
* fixed registereing global Helper [#57](https://github.com/Codeception/CodeceptJS/issues/57)
* fixed handling error in within block [#50](https://github.com/Codeception/CodeceptJS/issues/50)

## 0.2.6

* Fixed `done() was called multiple times`
* **[WebDriverIO]** added `waitToHide` method by **[fabioel](https://github.com/fabioel)**
* Added global `Helper` (alias `codecept_helper)`, object use for writing custom Helpers. Generator updated. Changes to [#48](https://github.com/Codeception/CodeceptJS/issues/48)

## 0.2.5

* Fixed issues with using yield inside a test [#45](https://github.com/Codeception/CodeceptJS/issues/45) [#47](https://github.com/Codeception/CodeceptJS/issues/47) [#43](https://github.com/Codeception/CodeceptJS/issues/43)
* Fixed generating a custom helper. Helper class is now accessible with `codecept_helper` var. Fixes [#48](https://github.com/Codeception/CodeceptJS/issues/48)

## 0.2.4

* Fixed accessing helpers from custom helper by **[pim](https://github.com/pim)**.

## 0.2.3

* **[WebDriverIO]** fixed `seeInField` to work with single value elements like: input[type=text], textareas, and multiple: select, input[type=radio], input[type=checkbox]
* **[WebDriverIO]** fixed `pressKey`, key modifeiers (Control, Command, Alt, Shift) are released after the action

## 0.2.2

Fixed generation of custom steps file and page objects.
Please replace `require('codeceptjs/actor')` to `actor` in your `custom_steps.js`.
Whenever you need to create `I` object (in page objects, custom steps, but not in tests) just call `actor()`;

## 0.2.0

* **within** context hook added
* `--reporter` option supported
* **[WebDriverIO]** added features and methods:
  - elements: `seeElement`, ...
  - popups: `acceptPopup`, `cancelPopup`, `seeInPopup`,...
  - navigation: `moveCursorTo`, `scrollTo`
  - saving screenshots on failure; `saveScreenshot`
  - cookies: `setCookie`, `seeCookie`, ...
  - source: `seeInSource`
  - form: `seeCheckboxIsChecked`, `selectOption` to support multiple selects
  - keyboard: `appendField`, `pressKey`
  - mouse: `rightClick`
* tests added
* **[WebDriverIO]** proxy configuration added by **[petehouston](https://github.com/petehouston)**
* **[WebDriverIO]** fixed `waitForText` method by **[roadhump](https://github.com/roadhump)**. Fixes [#11](https://github.com/Codeception/CodeceptJS/issues/11)
* Fixed creating output dir when it already exists on init by **[alfirin](https://github.com/alfirin)**
* Fixed loading of custom helpers

