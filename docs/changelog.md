---
permalink: /changelog
title: Releases
sidebar: false
layout: Section
---

# Releases

## 3.1.3

🛩️ Features:

* BDD Improvement. Added `DataTableArgument` class to work with table data structures. 

```js
const { DataTableArgument } = require('codeceptjs');
//...
Given('I have an employee card', (table) => {
  const dataTableArgument = new DataTableArgument(table);
  const hashes = dataTableArgument.hashes(); 
  // hashes = [{ name: 'Harry', surname: 'Potter', position: 'Seeker' }];
  const rows = dataTableArgument.rows();
  // rows = [['Harry', 'Potter', Seeker]];
  }
```
See updated [BDD section](https://codecept.io/bdd/) for more API options.

* Support `cjs` file extensions for config file: `codecept.conf.cjs`. See [#3052](https://github.com/codeceptjs/CodeceptJS/issues/3052) by **[kalvenschraut](https://github.com/kalvenschraut)**
* API updates: Added `test.file` and `suite.file` properties to `test` and `suite` objects to use in helpers and plugins. 

🐛 Bugfixes:

* **[Playwright]** Fixed resetting `test.artifacts` for failing tests. See [#3033](https://github.com/codeceptjs/CodeceptJS/issues/3033) by **[jancorvus](https://github.com/jancorvus)**. Fixes [#3032](https://github.com/codeceptjs/CodeceptJS/issues/3032)
* **[Playwright]** Apply `basicAuth` credentials to all opened browser contexts. See [#3036](https://github.com/codeceptjs/CodeceptJS/issues/3036) by **[nikocanvacom](https://github.com/nikocanvacom)**. Fixes [#3035](https://github.com/codeceptjs/CodeceptJS/issues/3035)
* **[WebDriver]** Updated `webdriverio` default version to `^6.12.1`. See [#3043](https://github.com/codeceptjs/CodeceptJS/issues/3043) by **[sridhareaswaran](https://github.com/sridhareaswaran)**
* **[Playwright]** `I.haveRequestHeaders` affects all tabs. See [#3049](https://github.com/codeceptjs/CodeceptJS/issues/3049) by **[jancorvus](https://github.com/jancorvus)**
* BDD: Fixed unhandled empty feature files. Fix [#3046](https://github.com/codeceptjs/CodeceptJS/issues/3046) by **[abhimanyupandian](https://github.com/abhimanyupandian)** 
* Fixed `RangeError: Invalid string length` in `recorder.js` when running huge amount of tests.  

📖 Documentation:

* Added Testrail reporter [Reports Docs](https://codecept.io/reports/#testrail)


## 3.1.2

🛩️ Features:

* Added `coverage` plugin to generate code coverage for Playwright & Puppeteer. By **[anirudh-modi](https://github.com/anirudh-modi)**
* Added `subtitle` plugin to generate subtitles for videos recorded with Playwright. By **[anirudh-modi](https://github.com/anirudh-modi)**
* Configuration: `config.tests` to accept array of file patterns. See [#2994](https://github.com/codeceptjs/CodeceptJS/issues/2994) by **[monsteramba](https://github.com/monsteramba)**

```js
exports.config = {
  tests: ['./*_test.js','./sampleTest.js'],
  // ... 
}
```
* Notification is shown for test files without `Feature()`. See [#3011](https://github.com/codeceptjs/CodeceptJS/issues/3011) by **[PeterNgTr](https://github.com/PeterNgTr)**

🐛 Bugfixes:

* **[Playwright]** Fixed [#2986](https://github.com/codeceptjs/CodeceptJS/issues/2986) error is thrown when deleting a missing video. Fix by **[hatufacci](https://github.com/hatufacci)** 
* Fixed false positive result when invalid function is called in a helper. See [#2997](https://github.com/codeceptjs/CodeceptJS/issues/2997) by **[abhimanyupandian](https://github.com/abhimanyupandian)**
* **[Appium]** Removed full page mode for `saveScreenshot`. See [#3002](https://github.com/codeceptjs/CodeceptJS/issues/3002) by **[nlespiaucq](https://github.com/nlespiaucq)**
* **[Playwright]** Fixed [#3003](https://github.com/codeceptjs/CodeceptJS/issues/3003) saving trace for a test with a long name. Fix by **[hatufacci](https://github.com/hatufacci)** 

🎱 Other:

* Deprecated `puppeteerCoverage` plugin in favor of `coverage` plugin.

## 3.1.1

* **[Appium]** Fixed [#2759](https://github.com/codeceptjs/CodeceptJS/issues/2759)
 `grabNumberOfVisibleElements`, `grabAttributeFrom`, `grabAttributeFromAll` to allow id locators.

## 3.1.0

* **[Plawyright]** Updated to Playwright 1.13
* **[Playwright]** **Possible breaking change**: `BrowserContext` is initialized before each test and closed after. This behavior matches recommendation from Playwright team to use different contexts for tests.
* **[Puppeteer]** Updated to Puppeteer 10.2.
* **[Protractor]** Helper deprecated

🛩️ Features:

* **[Playwright]** Added recording of [video](https://codecept.io/playwright/#video) and [traces](https://codecept.io/playwright/#trace) by **[davertmik](https://github.com/davertmik)**
* **[Playwritght]** [Mocking requests](https://codecept.io/playwright/#mocking-network-requests) implemented via `route` API of Playwright by **[davertmik](https://github.com/davertmik)**
* **[Playwright]** Added **support for [React locators](https://codecept.io/react/#locators)** in [#2912](https://github.com/codeceptjs/CodeceptJS/issues/2912) by **[AAAstorga](https://github.com/AAAstorga)**

🐛 Bugfixes:

* **[Puppeteer]** Fixed [#2244](https://github.com/codeceptjs/CodeceptJS/issues/2244) `els[0]._clickablePoint is not a function` by **[karunandrii](https://github.com/karunandrii)**.
* **[Puppeteer]** Fixed `fillField` to check for invisible elements. See [#2916](https://github.com/codeceptjs/CodeceptJS/issues/2916) by **[anne-open-xchange](https://github.com/anne-open-xchange)** 
* **[Playwright]** Reset of dialog event listener before registration of new one. [#2946](https://github.com/codeceptjs/CodeceptJS/issues/2946) by **[nikocanvacom](https://github.com/nikocanvacom)** 
* Fixed running Gherkin features with `run-multiple` using chunks. See [#2900](https://github.com/codeceptjs/CodeceptJS/issues/2900) by **[andrenoberto](https://github.com/andrenoberto)**
* Fixed [#2937](https://github.com/codeceptjs/CodeceptJS/issues/2937) broken typings for subfolders on Windows by **[jancorvus](https://github.com/jancorvus)**
* Fixed issue where cucumberJsonReporter not working with fakerTransform plugin. See [#2942](https://github.com/codeceptjs/CodeceptJS/issues/2942) by **[ilangv](https://github.com/ilangv)** 
* Fixed [#2952](https://github.com/codeceptjs/CodeceptJS/issues/2952) finished job with status code 0 when playwright cannot connect to remote wss url. By **[davertmik](https://github.com/davertmik)**


## 3.0.7

📖 Documentation fixes:

* Remove broken link from `Nightmare helper`. See [#2860](https://github.com/codeceptjs/CodeceptJS/issues/2860) by **[Arhell](https://github.com/Arhell)**
* Fixed broken links in `playwright.md`. See [#2848](https://github.com/codeceptjs/CodeceptJS/issues/2848) by **[johnhoodjr](https://github.com/johnhoodjr)**
* Fix mocha-multi config example. See [#2881](https://github.com/codeceptjs/CodeceptJS/issues/2881) by **[rimesc](https://github.com/rimesc)**
* Fix small errors in email documentation file. See [#2884](https://github.com/codeceptjs/CodeceptJS/issues/2884) by **[mkrtchian](https://github.com/mkrtchian)**
* Improve documentation for `Sharing Data Between Workers` section. See [#2891](https://github.com/codeceptjs/CodeceptJS/issues/2891) by **[ngraf](https://github.com/ngraf)**

🛩️ Features:

* **[WebDriver]** Shadow DOM Support for `Webdriver`. See [#2741](https://github.com/codeceptjs/CodeceptJS/issues/2741) by **[gkushang](https://github.com/gkushang)**
* [Release management] Introduce the versioning automatically, it follows the semantics versioning. See [#2883](https://github.com/codeceptjs/CodeceptJS/issues/2883) by **[PeterNgTr](https://github.com/PeterNgTr)**
* Adding opts into `Scenario.skip` that it would be useful for building reports. See [#2867](https://github.com/codeceptjs/CodeceptJS/issues/2867) by **[AlexKo4](https://github.com/AlexKo4)**
* Added support for attaching screenshots to [cucumberJsonReporter](https://github.com/ktryniszewski-mdsol/codeceptjs-cucumber-json-reporter) See [#2888](https://github.com/codeceptjs/CodeceptJS/issues/2888) by **[fijijavis](https://github.com/fijijavis)**
* Supported config file for `codeceptjs shell` command. See [#2895](https://github.com/codeceptjs/CodeceptJS/issues/2895) by **[PeterNgTr](https://github.com/PeterNgTr)**:

```
npx codeceptjs shell -c foo.conf.js
```

Bug fixes:
* **[GraphQL]** Use a helper-specific instance of Axios to avoid contaminating global defaults. See [#2868](https://github.com/codeceptjs/CodeceptJS/issues/2868) by **[vanvoljg](https://github.com/vanvoljg)**
* A default system color is used when passing non supported system color when using I.say(). See [#2874](https://github.com/codeceptjs/CodeceptJS/issues/2874) by **[PeterNgTr](https://github.com/PeterNgTr)**
* **[Playwright]** Avoid the timout due to calling the click on invisible elements. See [#2875](https://github.com/codeceptjs/CodeceptJS/issues/2875) by cbayer97


## 3.0.6

* **[Playwright]** Added `electron` as a browser to config. See [#2834](https://github.com/codeceptjs/CodeceptJS/issues/2834) by **[cbayer97](https://github.com/cbayer97)**
* **[Playwright]** Implemented `launchPersistentContext` to be able to launch persistent remote browsers. See [#2817](https://github.com/codeceptjs/CodeceptJS/issues/2817) by **[brunoqueiros](https://github.com/brunoqueiros)**. Fixes [#2376](https://github.com/codeceptjs/CodeceptJS/issues/2376).
* Fixed printing logs and stack traces for `run-workers`. See [#2857](https://github.com/codeceptjs/CodeceptJS/issues/2857) by **[haveac1gar](https://github.com/haveac1gar)**. Fixes [#2621](https://github.com/codeceptjs/CodeceptJS/issues/2621), [#2852](https://github.com/codeceptjs/CodeceptJS/issues/2852)
* Emit custom messages from worker to the main thread. See [#2824](https://github.com/codeceptjs/CodeceptJS/issues/2824) by **[jccguimaraes](https://github.com/jccguimaraes)**
* Improved workers processes output. See [#2804](https://github.com/codeceptjs/CodeceptJS/issues/2804) by **[drfiresign](https://github.com/drfiresign)**
* BDD. Added ability to use an array of feature files inside config in `gherkin.features`. See [#2814](https://github.com/codeceptjs/CodeceptJS/issues/2814) by **[jbergeronjr](https://github.com/jbergeronjr)**

```js
"features": [
  "./features/*.feature",
  "./features/api_features/*.feature"
],
```
* Added `getQueueId` to reporter to rerun a specific promise. See [#2837](https://github.com/codeceptjs/CodeceptJS/issues/2837) by **[jonatask](https://github.com/jonatask)**
* **Added `fakerTransform` plugin** to use faker data in Gherkin scenarios. See [#2854](https://github.com/codeceptjs/CodeceptJS/issues/2854) by **[adrielcodeco](https://github.com/adrielcodeco)**

```feature
Scenario Outline: ...
  Given ...
  When ...
  Then ...

  Examples:
  | productName          | customer              | email              | anythingMore |
  | {{commerce.product}} | Dr. {{name.findName}} | {{internet.email}} | staticData   |
```
* **[REST]** Use class instance of axios, not the global instance, to avoid contaminating global configuration. [#2846](https://github.com/codeceptjs/CodeceptJS/issues/2846) by **[vanvoljg](https://github.com/vanvoljg)**
* **[Appium]** Added `tunnelIdentifier` config option to provide tunnel for SauceLabs. See [#2832](https://github.com/codeceptjs/CodeceptJS/issues/2832) by **[gurjeetbains](https://github.com/gurjeetbains)**

## 3.0.5


Features:

* **[Official Docker image for CodeceptJS v3](https://hub.docker.com/r/codeceptjs/codeceptjs)**. New Docker image is based on official Playwright image and supports Playwright, Puppeteer, WebDriver engines. Thanks **[VikentyShevyrin](https://github.com/VikentyShevyrin)**
* Better support for Typescript `codecept.conf.ts` configuration files. See [#2750](https://github.com/codeceptjs/CodeceptJS/issues/2750) by **[elaichenkov](https://github.com/elaichenkov)**
* Propagate more events for custom parallel script. See [#2796](https://github.com/codeceptjs/CodeceptJS/issues/2796) by **[jccguimaraes](https://github.com/jccguimaraes)**
* [mocha-junit-reporter] Now supports attachments, see documentation for details. See [#2675](https://github.com/codeceptjs/CodeceptJS/issues/2675) by **[Shard](https://github.com/Shard)**
* CustomLocators interface for TypeScript to extend from LocatorOrString. See [#2798](https://github.com/codeceptjs/CodeceptJS/issues/2798) by **[danielrentz](https://github.com/danielrentz)**
* **[REST]** Mask sensitive data from log messages.
```js
I.sendPatchRequest('/api/users.json', secret({ "email": "user@user.com" }));
```
See [#2786](https://github.com/codeceptjs/CodeceptJS/issues/2786) by **[PeterNgTr](https://github.com/PeterNgTr)**

Bug fixes:
* Fixed reporting of nested steps with PageObjects and BDD scenarios. See [#2800](https://github.com/codeceptjs/CodeceptJS/issues/2800) by **[davertmik](https://github.com/davertmik)**. Fixes [#2720](https://github.com/codeceptjs/CodeceptJS/issues/2720) [#2682](https://github.com/codeceptjs/CodeceptJS/issues/2682)
* Fixed issue with `codeceptjs shell` which was broken since 3.0.0. See [#2743](https://github.com/codeceptjs/CodeceptJS/issues/2743) by **[stedman](https://github.com/stedman)**
* **[Gherkin]** Fixed issue suppressed or hidden errors in tests. See [#2745](https://github.com/codeceptjs/CodeceptJS/issues/2745) by **[ktryniszewski-mdsol](https://github.com/ktryniszewski-mdsol)**
* **[Playwright]** fix grabCssPropertyFromAll serialization by using property names. See [#2757](https://github.com/codeceptjs/CodeceptJS/issues/2757) by **[elaichenkov](https://github.com/elaichenkov)**
* **[Allure]** fix report for multi sessions. See [#2771](https://github.com/codeceptjs/CodeceptJS/issues/2771) by **[cbayer97](https://github.com/cbayer97)**
* **[WebDriver]** Fix locator object debug log messages in smart wait. See 2748 by **[elaichenkov](https://github.com/elaichenkov)**

Documentation fixes:
* Fixed some broken examples. See [#2756](https://github.com/codeceptjs/CodeceptJS/issues/2756) by **[danielrentz](https://github.com/danielrentz)**
* Fixed Typescript typings. See [#2747](https://github.com/codeceptjs/CodeceptJS/issues/2747), [#2758](https://github.com/codeceptjs/CodeceptJS/issues/2758) and [#2769](https://github.com/codeceptjs/CodeceptJS/issues/2769) by **[elaichenkov](https://github.com/elaichenkov)**
* Added missing type for xFeature. See [#2754](https://github.com/codeceptjs/CodeceptJS/issues/2754) by **[PeterNgTr](https://github.com/PeterNgTr)**
* Fixed code example in Page Object documentation. See [#2793](https://github.com/codeceptjs/CodeceptJS/issues/2793) by **[mkrtchian](https://github.com/mkrtchian)**

Library updates:
* Updated Axios to 0.21.1. See by **[sseide](https://github.com/sseide)**
* Updated **[pollyjs](https://github.com/pollyjs)**/core **[pollyjs](https://github.com/pollyjs)**/adapter-puppeteer. See [#2760](https://github.com/codeceptjs/CodeceptJS/issues/2760) by **[Anikethana](https://github.com/Anikethana)**

## 3.0.4

* **Hotfix** Fixed `init` script by adding `cross-spawn` package. By **[vipulgupta2048](https://github.com/vipulgupta2048)**
* Fixed handling error during initialization of `run-multiple`. See [#2730](https://github.com/codeceptjs/CodeceptJS/issues/2730) by **[wagoid](https://github.com/wagoid)**

## 3.0.3

* **Playwright 1.7 support**
* **[Playwright]** Fixed handling null context in click. See [#2667](https://github.com/codeceptjs/CodeceptJS/issues/2667) by **[matthewjf](https://github.com/matthewjf)**
* **[Playwright]** Fixed `Cannot read property '$$' of null` when locating elements. See [#2713](https://github.com/codeceptjs/CodeceptJS/issues/2713) by **[matthewjf](https://github.com/matthewjf)**
* Command `npx codeceptjs init` improved
  * auto-installing required packages
  * better error messages
  * fixed generating type definitions
* Data Driven Tests improvements: instead of having one skipped test for data driven scenarios when using xData you get a skipped test for each entry in the data table. See [#2698](https://github.com/codeceptjs/CodeceptJS/issues/2698) by **[Georgegriff](https://github.com/Georgegriff)**
* **[Puppeteer]** Fixed that `waitForFunction` was not working with number values. See [#2703](https://github.com/codeceptjs/CodeceptJS/issues/2703) by **[MumblesNZ](https://github.com/MumblesNZ)**
* Enabled autocompletion for custom helpers. [#2695](https://github.com/codeceptjs/CodeceptJS/issues/2695) by **[PeterNgTr](https://github.com/PeterNgTr)**
* Emit test.after on workers. Fix [#2693](https://github.com/codeceptjs/CodeceptJS/issues/2693) by **[jccguimaraes](https://github.com/jccguimaraes)**
* TypeScript: Allow .ts config files. See [#2708](https://github.com/codeceptjs/CodeceptJS/issues/2708) by **[elukoyanov](https://github.com/elukoyanov)**
* Fixed definitions generation errors by **[elukoyanov](https://github.com/elukoyanov)**. See [#2707](https://github.com/codeceptjs/CodeceptJS/issues/2707) and [#2718](https://github.com/codeceptjs/CodeceptJS/issues/2718)
* Fixed handing error in _after function; for example, browser is closed during test and tests executions is stopped, but error was not logged. See [#2715](https://github.com/codeceptjs/CodeceptJS/issues/2715) by **[elukoyanov](https://github.com/elukoyanov)**
* Emit hook.failed in workers. Fix [#2723](https://github.com/codeceptjs/CodeceptJS/issues/2723) by **[jccguimaraes](https://github.com/jccguimaraes)**
* [wdio plugin] Added `seleniumArgs` and `seleniumInstallArgs` config options for plugin. See [#2687](https://github.com/codeceptjs/CodeceptJS/issues/2687) by **[andrerleao](https://github.com/andrerleao)**
* [allure plugin] Added `addParameter` method in [#2717](https://github.com/codeceptjs/CodeceptJS/issues/2717) by **[jancorvus](https://github.com/jancorvus)**. Fixes [#2716](https://github.com/codeceptjs/CodeceptJS/issues/2716)
* Added mocha-based `--reporter-options` and `--reporter <name>` commands to `run-workers` command by in [#2691](https://github.com/codeceptjs/CodeceptJS/issues/2691) **[Ameterezu](https://github.com/Ameterezu)**
* Fixed infinite loop for junit reports. See [#2691](https://github.com/codeceptjs/CodeceptJS/issues/2691) **[Ameterezu](https://github.com/Ameterezu)**
* Added status, start/end time, and match line for BDD steps. See [#2678](https://github.com/codeceptjs/CodeceptJS/issues/2678) by **[ktryniszewski-mdsol](https://github.com/ktryniszewski-mdsol)**
* [stepByStepReport plugin] Fixed "helper.saveScreenshot is not a function". Fix [#2688](https://github.com/codeceptjs/CodeceptJS/issues/2688) by **[andrerleao](https://github.com/andrerleao)**



## 3.0.2

* **[Playwright]** Fix connection close with remote browser. See [#2629](https://github.com/codeceptjs/CodeceptJS/issues/2629) by **[dipiash](https://github.com/dipiash)**
* **[REST]** set maxUploadFileSize when performing api calls. See [#2611](https://github.com/codeceptjs/CodeceptJS/issues/2611) by **[PeterNgTr](https://github.com/PeterNgTr)**
* Duplicate Scenario names (combined with Feature name) are now detected via a warning message.
Duplicate test names can cause `codeceptjs run-workers` to not function. See [#2656](https://github.com/codeceptjs/CodeceptJS/issues/2656) by **[Georgegriff](https://github.com/Georgegriff)**
* Documentation fixes

Bug Fixes:
  *  --suites flag now should function correctly for `codeceptjs run-workers`. See [#2655](https://github.com/codeceptjs/CodeceptJS/issues/2655) by **[Georgegriff](https://github.com/Georgegriff)**
  * [autoLogin plugin] Login methods should now function as expected with `codeceptjs run-workers`. See [#2658](https://github.com/codeceptjs/CodeceptJS/issues/2658) by **[Georgegriff](https://github.com/Georgegriff)**, resolves [#2620](https://github.com/codeceptjs/CodeceptJS/issues/2620)



## 3.0.1

♨️ Hot fix:
  * Lock the mocha version to avoid the errors. See [#2624](https://github.com/codeceptjs/CodeceptJS/issues/2624) by PeterNgTr

🐛 Bug Fix:
  * Fixed error handling in Scenario.js. See [#2607](https://github.com/codeceptjs/CodeceptJS/issues/2607) by haveac1gar
  * Changing type definition in order to allow the use of functions with any number of any arguments. See [#2616](https://github.com/codeceptjs/CodeceptJS/issues/2616) by akoltun

* Some updates/changes on documentations

## 3.0.0
> [ 👌 **LEARN HOW TO UPGRADE TO CODECEPTJS 3 ➡**](https://bit.ly/codecept3Up)

* Playwright set to be a default engine.
* **NodeJS 12+ required**
* **BREAKING CHANGE:** Syntax for tests has changed.


```js
// Previous
Scenario('title', (I, loginPage) => {});

// Current
Scenario('title', ({ I, loginPage }) => {});
```

* **BREAKING** Replaced bootstrap/teardown scripts to accept only functions or async functions. Async function with callback (with done parameter) should be replaced with async/await. [See our upgrade guide](https://bit.ly/codecept3Up).
* **[TypeScript guide](/typescript)** and [boilerplate project](https://github.com/codeceptjs/typescript-boilerplate)
* [tryTo](/plugins/#tryto) and [pauseOnFail](/plugins/#pauseOnFail) plugins installed by default
* Introduced one-line installer:

```
npx create-codeceptjs .
```

Read changelog to learn more about version 👇

## 3.0.0-rc



* Moved [Helper class into its own package](https://github.com/codeceptjs/helper) to simplify publishing standalone helpers.
* Fixed typings for `I.say` and `I.retry` by **[Vorobeyko](https://github.com/Vorobeyko)**
* Updated documentation:
  * [Quickstart](https://github.com/codeceptjs/CodeceptJS/blob/codeceptjs-v3.0/docs/quickstart.md#quickstart)
  * [Best Practices](https://github.com/codeceptjs/CodeceptJS/blob/codeceptjs-v3.0/docs/best.md)
  * [Custom Helpers](https://github.com/codeceptjs/CodeceptJS/blob/codeceptjs-v3.0/docs/custom-helpers.md)
  * [TypeScript](https://github.com/codeceptjs/CodeceptJS/blob/codeceptjs-v3.0/docs/typescript.md)

## 3.0.0-beta.4

🐛 Bug Fix:
  * PageObject was broken when using "this" inside a simple object.
  * The typings for all WebDriver methods work correctly.
  * The typings for "this.helper" and helper constructor work correctly, too.

🧤 Internal:
 * Our TS Typings will be tested now! We strarted using [dtslint](https://github.com/microsoft/dtslint) to check all typings and all rules for linter.
 Example:
  ```ts
  const psp = wd.grabPageScrollPosition() // $ExpectType Promise<PageScrollPosition>
  psp.then(
    result => {
      result.x // $ExpectType number
      result.y // $ExpectType number
    }
  )
  ```
 * And last: Reducing package size from 3.3Mb to 2.0Mb

## 3.0.0-beta-3

* **BREAKING** Replaced bootstrap/teardown scripts to accept only functions or async functions. Async function with callback (with done parameter) should be replaced with async/await. [See our upgrde guide](https://bit.ly/codecept3Up).
* Test artifacts introduced. Each test object has `artifacts` property, to keep attachment files. For instance, a screenshot of a failed test is attached to a test as artifact.
* Improved output for test execution
  * Changed colors for steps output, simplified
  * Added stack trace for test failures
  * Removed `Event emitted` from log in `--verbose` mode
  * List artifacts of a failed tests

![](https://user-images.githubusercontent.com/220264/82160052-397bf800-989b-11ea-81c0-8e58b3d33525.png)

* Steps & metasteps refactored by **[Vorobeyko](https://github.com/Vorobeyko)**. Logs to arguments passed to page objects:

```js
// TEST:
MyPage.hasFiles('first arg', 'second arg');

// OUTPUT:
MyPage: hasFile "First arg", "Second arg"
  I see file "codecept.json"
  I see file "codecept.po.json"
```
* Introduced official [TypeScript boilerplate](https://github.com/codeceptjs/typescript-boilerplate). Started by **[Vorobeyko](https://github.com/Vorobeyko)**.

## 3.0.0-beta


* **NodeJS 12+ required**
* **BREAKING CHANGE:** Syntax for tests has changed.


```js
// Previous
Scenario('title', (I, loginPage) => {});

// Current
Scenario('title', ({ I, loginPage }) => {});
```

* **BREAKING CHANGE:** [WebDriver][Protractor][Puppeteer][Playwright][Nightmare] `grab*` functions unified:
  * `grab*From` => **returns single value** from element or throws error when no matchng elements found
  * `grab*FromAll` => returns array of values, or empty array when no matching elements
* Public API for workers introduced by **[koushikmohan1996](https://github.com/koushikmohan1996)**. [Customize parallel execution](https://github.com/Codeception/CodeceptJS/blob/codeceptjs-v3.0/docs/parallel.md#custom-parallel-execution) with workers by building custom scripts.

* **[Playwright]** Added `usePlaywrightTo` method to access Playwright API in tests directly:

```js
I.usePlaywrightTo('do something special', async ({ page }) => {
  // use page or browser objects here
});
```

* **[Puppeteer]** Introduced `usePuppeteerTo` method to access Puppeteer API:

```js
I.usePuppeteerTo('do something special', async ({ page, browser }) => {
  // use page or browser objects here
});
```

* **[WebDriver]** Introduced `useWebDriverTo` method to access webdriverio API:

```js
I.useWebDriverTo('do something special', async ({ browser }) => {
  // use browser object here
});
```

* **[Protractor]** Introduced `useProtractorTo` method to access protractor API
* `tryTo` plugin introduced. Allows conditional action execution:

```js
const isSeen = await tryTo(() => {
  I.see('Some text');
});
// we are not sure if cookie bar is displayed, but if so - accept cookies
tryTo(() => I.click('Accept', '.cookies'));
```

* **Possible breaking change** In semantic locators `[` char indicates CSS selector.
## 2.6.11

* **[Playwright]** Playwright 1.4 compatibility
* **[Playwright]** Added `ignoreHTTPSErrors` config option (default: false). See [#2566](https://github.com/codeceptjs/CodeceptJS/issues/2566) by gurjeetbains
* Added French translation by **[vimar](https://github.com/vimar)**
* **[WebDriver]** Updated `dragSlider` to work in WebDriver W3C protocol. Fixes [#2557](https://github.com/codeceptjs/CodeceptJS/issues/2557) by suniljaiswal01

## 2.6.10

* Fixed saving options for suite via `Feature('title', {key: value})` by **[Diokuz](https://github.com/Diokuz)**. See [#2553](https://github.com/codeceptjs/CodeceptJS/issues/2553) and [Docs](https://codecept.io/advanced/#dynamic-configuration)

## 2.6.9

* [Puppeteer][Playwright] SessionStorage is now cleared in after hook. See [#2524](https://github.com/codeceptjs/CodeceptJS/issues/2524)
* When helper load failed the error stack is now logged by **[SkReD](https://github.com/SkReD)**. See [#2541](https://github.com/codeceptjs/CodeceptJS/issues/2541)
* Small documentation fixes.

## 2.6.8

* [WebDriver][Protractor][Playwright][Puppeteer][Nightmare] `saveElementScreenshot` method added to make screenshot of an element. By **[suniljaiswal01](https://github.com/suniljaiswal01)**
* [Playwright][Puppeteer] Added `type` method to type a text using keyboard with an optional delay.
* **[WebDriver]** Added optional `delay` argument to `type` method to slow down typing.
* **[Puppeteer]** Fixed `amOnPage` freeze when `getPageTimeout` is 0"; set 30 sec as default timeout by **[Vorobeyko](https://github.com/Vorobeyko)**.
* Fixed printing step with null argument in custom helper by **[sjana-aj](https://github.com/sjana-aj)**. See [#2494](https://github.com/codeceptjs/CodeceptJS/issues/2494)
* Fix missing screenshot on failure when REST helper is in use [#2513](https://github.com/codeceptjs/CodeceptJS/issues/2513) by **[PeterNgTr](https://github.com/PeterNgTr)**
* Improve error logging in the `screenshotOnFail` plugin [#2512](https://github.com/codeceptjs/CodeceptJS/issues/2512) by **[pablopaul](https://github.com/pablopaul)**

## 2.6.7

* Add REST helper into `standardActingHelpers` array [#2474](https://github.com/codeceptjs/CodeceptJS/issues/2474) by **[PeterNgTr](https://github.com/PeterNgTr)**
* Add missing `--invert` option for `run-workers` command [#2504](https://github.com/codeceptjs/CodeceptJS/issues/2504) by **[pablopaul](https://github.com/pablopaul)**
* **[WebDriver]** Introduce `forceRightClick` method [#2485](https://github.com/codeceptjs/CodeceptJS/issues/2485) bylsuniljaiswal01
* **[Playwright]** Fix `setCookie` method [#2491](https://github.com/codeceptjs/CodeceptJS/issues/2491) by **[bmbarker90](https://github.com/bmbarker90)**
* **[TypeScript]** Update compilerOptions.target to es2017 [#2483](https://github.com/codeceptjs/CodeceptJS/issues/2483) by **[shanplourde](https://github.com/shanplourde)**
* **[Mocha]** Honor reporter configuration [#2465](https://github.com/codeceptjs/CodeceptJS/issues/2465) by **[trinhpham](https://github.com/trinhpham)**

## 2.6.6

* Puppeteer 4.0 support. Important: MockRequest helper won't work with Puppeter > 3.3
* Added `xFeature` and `Feature.skip` to skip all tests in a suite. By **[Georgegriff](https://github.com/Georgegriff)**
* **[Appium]** Fixed [#2428](https://github.com/codeceptjs/CodeceptJS/issues/2428) Android native locator support by **[idxn](https://github.com/idxn)**
* **[WebDriver]** Fixed `waitNumberOfVisibleElements` to actually filter visible elements. By **[ilangv](https://github.com/ilangv)**
* **[Puppeteer]** Fixed handling error which is not an Error object. Fixes `cannot read property indexOf of undefined` error. Fix [#2436](https://github.com/codeceptjs/CodeceptJS/issues/2436) by **[Georgegriff](https://github.com/Georgegriff)**
* **[Puppeteer]** Print error on page crash by **[Georgegriff](https://github.com/Georgegriff)**

## 2.6.5

* Added `test.skipped` event to run-workers, fixing allure reports with skipped tests in workers [#2391](https://github.com/codeceptjs/CodeceptJS/issues/2391). Fix [#2387](https://github.com/codeceptjs/CodeceptJS/issues/2387) by **[koushikmohan1996](https://github.com/koushikmohan1996)**
* **[Playwright]** Fixed calling `waitFor*` methods with custom locators [#2314](https://github.com/codeceptjs/CodeceptJS/issues/2314). Fix [#2389](https://github.com/codeceptjs/CodeceptJS/issues/2389) by **[Georgegriff](https://github.com/Georgegriff)**

## 2.6.4

* **[Playwright]** **Playwright 1.0 support** by **[Georgegriff](https://github.com/Georgegriff)**.

## 2.6.3

* [stepByStepReport plugin] Fixed when using plugin with BeforeSuite. Fixes [#2337](https://github.com/codeceptjs/CodeceptJS/issues/2337) by **[mirao](https://github.com/mirao)**
* [allure plugin] Fixed reporting of tests skipped by failure in before hook. Refer to [#2349](https://github.com/codeceptjs/CodeceptJS/issues/2349) & [#2354](https://github.com/codeceptjs/CodeceptJS/issues/2354). Fix by **[koushikmohan1996](https://github.com/koushikmohan1996)**

## 2.6.2

* [WebDriver][Puppeteer] Added `forceClick` method to emulate click event instead of using native events.
* **[Playwright]** Updated to 0.14
* **[Puppeteer]** Updated to Puppeteer v3.0
* **[wdio]** Fixed undefined output directory for wdio plugns. Fix By **[PeterNgTr](https://github.com/PeterNgTr)**
* **[Playwright]** Introduced `handleDownloads` method to download file. Please note, this method has slightly different API than the same one in Puppeteer.
* **[allure]** Fixed undefined output directory for allure plugin on using custom runner. Fix by **[charliepradeep](https://github.com/charliepradeep)**
* **[WebDriver]** Fixed `waitForEnabled` fix for webdriver 6. Fix by **[dsharapkou](https://github.com/dsharapkou)**
* Workers: Fixed negative failure result if use scenario with the same names. Fix by **[Vorobeyko](https://github.com/Vorobeyko)**
* **[MockRequest]** Updated documentation to match new helper version
* Fixed: skipped tests are not reported if a suite failed in `before`. Refer [#2349](https://github.com/codeceptjs/CodeceptJS/issues/2349) & [#2354](https://github.com/codeceptjs/CodeceptJS/issues/2354). Fix by **[koushikmohan1996](https://github.com/koushikmohan1996)**

## 2.6.1

* [screenshotOnFail plugin] Fixed saving screenshot of active session.
* [screenshotOnFail plugin] Fix issue [#2301](https://github.com/codeceptjs/CodeceptJS/issues/2301) when having the flag `uniqueScreenshotNames`=true results in `undefined` in screenshot file name by **[PeterNgTr](https://github.com/PeterNgTr)**
* **[WebDriver]** Fixed `waitForElement` not applying the optional second argument to override the default timeout in webdriverio 6. Fix by **[Mooksc](https://github.com/Mooksc)**
* **[WebDriver]** Updated `waitUntil` method which is used by all of the wait* functions. This updates the `waitForElement` by the same convention used to update `waitForVisible` and `waitInUrl` to be compatible with both WebDriverIO v5 & v6. See [#2313](https://github.com/codeceptjs/CodeceptJS/issues/2313) by **[Mooksc](https://github.com/Mooksc)**

## 2.6.0

* **[Playwright] Updated to Playwright 0.12** by **[Georgegriff](https://github.com/Georgegriff)**.

Upgrade playwright to ^0.12:

```
npm i playwright@^0.12 --save
```

[Notable changes](https://github.com/microsoft/playwright/releases/tag/v0.12.0):
  * Fixed opening two browsers on start
  * `executeScript` - passed function now accepts only one argument. Pass in objects or arrays if you need multtple arguments:
```js
// Old style, does not work anymore:
I.executeScript((x, y) => x + y, x, y);
// New style, passing an object:
I.executeScript(({x, y}) => x + y, {x, y});
```
  * `click` - automatically waits for element to become clickable (visible, not animated) and waits for navigation.
  * `clickLink` - deprecated
  * `waitForClickable` - deprecated
  * `forceClick` - added
  * Added support for custom locators. See [#2277](https://github.com/codeceptjs/CodeceptJS/issues/2277)
  * Introduced [device emulation](/playwright/#device-emulation):
    * globally via `emulate` config option
    * per session

**[WebDriver] Updated to webdriverio v6** by **[PeterNgTr](https://github.com/PeterNgTr)**.

Read [release notes](https://webdriver.io/blog/2020/03/26/webdriverio-v6-released.html), then
upgrade webdriverio to ^6.0:

```
npm i webdriverio@^6.0 --save
```
*(webdriverio v5 support is deprecated and will be removed in CodeceptJS 3.0)*
 **[WebDriver]** Introduced [Shadow DOM support](/shadow) by **[gkushang](https://github.com/gkushang)**

```js
I.click({ shadow: ['my-app', 'recipe-hello', 'button'] });
```

* **Fixed parallel execution of `run-workers` for Gherkin** scenarios by **[koushikmohan1996](https://github.com/koushikmohan1996)**
* **[MockRequest]** Updated and **moved to [standalone package](https://github.com/codeceptjs/mock-request)**:
  * full support for record/replay mode for Puppeteer
  * added `mockServer` method to use flexible PollyJS API to define mocks
  * fixed stale browser screen in record mode.
* **[Playwright]** Added support on for `screenshotOnFail` plugin by **[amonkc](https://github.com/amonkc)**
* Gherkin improvement: setting different tags per examples. See [#2208](https://github.com/codeceptjs/CodeceptJS/issues/2208) by **[acuper](https://github.com/acuper)**
* **[TestCafe]** Updated `click` to take first visible element. Fixes [#2226](https://github.com/codeceptjs/CodeceptJS/issues/2226) by **[theTainted](https://github.com/theTainted)**
* [Puppeteer][WebDriver] Updated `waitForClickable` method to check for element overlapping. See [#2261](https://github.com/codeceptjs/CodeceptJS/issues/2261) by **[PiQx](https://github.com/PiQx)**
* **[Puppeteer]** Dropped `puppeteer-firefox` support, as Puppeteer supports Firefox natively.
* **[REST]** Rrespect Content-Type header. See [#2262](https://github.com/codeceptjs/CodeceptJS/issues/2262) by **[pmarshall-legacy](https://github.com/pmarshall-legacy)**
* [allure plugin] Fixes BeforeSuite failures in allure reports. See [#2248](https://github.com/codeceptjs/CodeceptJS/issues/2248) by **[Georgegriff](https://github.com/Georgegriff)**
* [WebDriver][Puppeteer][Playwright] A screenshot of for an active session is saved in multi-session mode. See [#2253](https://github.com/codeceptjs/CodeceptJS/issues/2253) by **[ChexWarrior](https://github.com/ChexWarrior)**
* Fixed `--profile` option by **[pablopaul](https://github.com/pablopaul)**. Profile value to be passed into `run-multiple` and `run-workers`:

```
npx codecept run-workers 2 --profile firefox
```

Value is available at `process.env.profile` (previously `process.profile`). See [#2302](https://github.com/codeceptjs/CodeceptJS/issues/2302). Fixes [#1968](https://github.com/codeceptjs/CodeceptJS/issues/1968) [#1315](https://github.com/codeceptjs/CodeceptJS/issues/1315)

* [commentStep Plugin introduced](/plugins#commentstep). Allows to annotate logical parts of a test:

```js
__`Given`;
I.amOnPage('/profile')

__`When`;
I.click('Logout');

__`Then`;
I.see('You are logged out');
```

## 2.5.0

* **Experimental: [Playwright](/playwright) helper introduced**.

> [Playwright](https://github.com/microsoft/playwright/) is an alternative to Puppeteer which works very similarly to it but adds cross-browser support with Firefox and Webkit. Until v1.0 Playwright API is not stable but we introduce it to CodeceptJS so you could try it.

* **[Puppeteer]** Fixed basic auth support when running in multiple sessions. See [#2178](https://github.com/codeceptjs/CodeceptJS/issues/2178) by **[ian-bartholomew](https://github.com/ian-bartholomew)**
* **[Puppeteer]** Fixed `waitForText` when there is no `body` element on page (redirect). See [#2181](https://github.com/codeceptjs/CodeceptJS/issues/2181) by **[Vorobeyko](https://github.com/Vorobeyko)**
* [Selenoid plugin] Fixed overriding current capabilities by adding deepMerge. Fixes [#2183](https://github.com/codeceptjs/CodeceptJS/issues/2183) by **[koushikmohan1996](https://github.com/koushikmohan1996)**
* Added types for `Scenario.todo` by **[Vorobeyko](https://github.com/Vorobeyko)**
* Added types for Mocha by **[Vorobeyko](https://github.com/Vorobeyko)**. Fixed typing conflicts with Jest
* **[FileSystem]** Added methods by **[nitschSB](https://github.com/nitschSB)**
  * `waitForFile`
  * `seeFileContentsEqualReferenceFile`
* Added `--colors` option to `run` and `run-multiple` so you force colored output in dockerized environment. See [#2189](https://github.com/codeceptjs/CodeceptJS/issues/2189) by **[mirao](https://github.com/mirao)**
* **[WebDriver]** Added `type` command to enter value without focusing on a field. See [#2198](https://github.com/codeceptjs/CodeceptJS/issues/2198) by **[xMutaGenx](https://github.com/xMutaGenx)**
* Fixed `codeceptjs gt` command to respect config pattern for tests. See [#2200](https://github.com/codeceptjs/CodeceptJS/issues/2200) and [#2204](https://github.com/codeceptjs/CodeceptJS/issues/2204) by **[matheo](https://github.com/matheo)**


## 2.4.3

* Hotfix for interactive pause

## 2.4.2

* **Interactive pause improvements** by **[koushikmohan1996](https://github.com/koushikmohan1996)**
  * allows using in page objects and variables: `pause({ loginPage, a })`
  * enables custom commands inside pause with `=>` prefix: `=> loginPage.open()`
* [Selenoid plugin](/plugins#selenoid) added by by **[koushikmohan1996](https://github.com/koushikmohan1996)**
  * uses Selenoid to launch browsers inside Docker containers
  * automatically **records videos** and attaches them to allure reports
  * can delete videos for successful tests
  * can automatically pull in and start Selenoid containers
  * works with WebDriver helper
* Avoid failiure report on successful retry in worker by **[koushikmohan1996](https://github.com/koushikmohan1996)**
* Added translation ability to Scenario, Feature and other context methods by **[koushikmohan1996](https://github.com/koushikmohan1996)**
  * 📢 Please help us translate context methods to your language! See [italian translation](https://github.com/codeceptjs/CodeceptJS/blob/master/translations/it-IT.js#L3) as an example and send [patches to vocabularies](https://github.com/codeceptjs/CodeceptJS/tree/master/translations).
* allurePlugin: Added `say` comments to allure reports by **[PeterNgTr](https://github.com/PeterNgTr)**.
* Fixed no custom output folder created when executed with run-worker. Fix by **[PeterNgTr](https://github.com/PeterNgTr)**
* **[Puppeteer]** Fixed error description for context element not found. See [#2065](https://github.com/codeceptjs/CodeceptJS/issues/2065). Fix by **[PeterNgTr](https://github.com/PeterNgTr)**
* **[WebDriver]** Fixed `waitForClickable` to wait for exact number of seconds by **[mirao](https://github.com/mirao)**. Resolves [#2166](https://github.com/codeceptjs/CodeceptJS/issues/2166)
* Fixed setting `compilerOptions` in `jsconfig.json` file on init by **[PeterNgTr](https://github.com/PeterNgTr)**
* **[Filesystem]** Added method by **[nitschSB](https://github.com/nitschSB)**
  * `seeFileContentsEqualReferenceFile`
  * `waitForFile`


## 2.4.1

* **[Hotfix]** - Add missing lib that prevents codeceptjs from initializing.

## 2.4.0

* Improved setup wizard with `npx codecept init`:
  * **enabled [retryFailedStep](/plugins/#retryfailedstep) plugin for new setups**.
  * enabled [@codeceptjs/configure](/configuration/#common-configuration-patterns) to toggle headless/window mode via env variable
  * creates a new test on init
  * removed question on "steps file", create it by default.
* Added [pauseOnFail plugin](/plugins/#pauseonfail). *Sponsored by Paul Vincent Beigang and his book "[Practical End 2 End Testing with CodeceptJS](https://leanpub.com/codeceptjs/)"*.
* Added [`run-rerun` command](/commands/#run-rerun) to run tests multiple times to detect and fix flaky tests. By **[Ilrilan](https://github.com/Ilrilan)** and **[Vorobeyko](https://github.com/Vorobeyko)**.
* Added [`Scenario.todo()` to declare tests as pending](/basics#todotest). See [#2100](https://github.com/codeceptjs/CodeceptJS/issues/2100) by **[Vorobeyko](https://github.com/Vorobeyko)**
* Added support for absolute path for `output` dir. See [#2049](https://github.com/codeceptjs/CodeceptJS/issues/2049) by **[elukoyanov](https://github.com/elukoyanov)**
* Fixed error in `npx codecept init` caused by calling `console.print`. See [#2071](https://github.com/codeceptjs/CodeceptJS/issues/2071) by **[Atinux](https://github.com/Atinux)**.
* **[Filesystem]** Methods added by **[aefluke](https://github.com/aefluke)**:
  * `seeFileNameMatching`
  * `grabFileNames`
* **[Puppeteer]** Fixed grabbing attributes with hyphen by **[Holorium](https://github.com/Holorium)**
* **[TestCafe]** Fixed `grabAttributeFrom` method by **[elukoyanov](https://github.com/elukoyanov)**
* **[MockRequest]** Added support for [Polly config options](https://netflix.github.io/pollyjs/#/configuration?id=configuration) by **[ecrmnn](https://github.com/ecrmnn)**
* **[TestCafe]** Fixes exiting with zero code on failure. Fixed [#2090](https://github.com/codeceptjs/CodeceptJS/issues/2090) with [#2106](https://github.com/codeceptjs/CodeceptJS/issues/2106) by **[koushikmohan1996](https://github.com/koushikmohan1996)**
* [WebDriver][Puppeteer] Added basicAuth support via config. Example: `basicAuth: {username: 'username', password: 'password'}`. See [#1962](https://github.com/codeceptjs/CodeceptJS/issues/1962) by **[PeterNgTr](https://github.com/PeterNgTr)**
* [WebDriver][Appium] Added `scrollIntoView` by **[pablopaul](https://github.com/pablopaul)**
* Fixed [#2118](https://github.com/codeceptjs/CodeceptJS/issues/2118): No error stack trace for syntax error by **[senthillkumar](https://github.com/senthillkumar)**
* Added `parse()` method to data table inside Cucumber tests. Use it to obtain rows and hashes for test data. See [#2082](https://github.com/codeceptjs/CodeceptJS/issues/2082) by **[Sraime](https://github.com/Sraime)**

## 2.3.6

* Create better Typescript definition file through JSDoc. By **[lemnis](https://github.com/lemnis)**
* `run-workers` now can use glob pattern. By **[Ilrilan](https://github.com/Ilrilan)**
```js
// Example:
exports.config = {
  tests: '{./workers/base_test.workers.js,./workers/test_grep.workers.js}',
}
```
* Added new command `npx codeceptjs info` which print information about your environment and CodeceptJS configs. By **[jamesgeorge007](https://github.com/jamesgeorge007)**
* Fixed some typos in documantation. By **[pablopaul](https://github.com/pablopaul)** **[atomicpages](https://github.com/atomicpages)** **[EricTendian](https://github.com/EricTendian)**
* Added PULL_REQUEST template.
* [Puppeteer][WebDriver] Added `waitForClickable` for waiting clickable element on page.
* **[TestCafe]** Added support for remote connection. By **[jvdieten](https://github.com/jvdieten)**
* **[Puppeteer]** Fixed `waitForText` XPath context now works correctly. By **[Heavik](https://github.com/Heavik)**
* **[TestCafe]** Fixed `clearField` clear field now awaits TestCafe's promise. By **[orihomie](https://github.com/orihomie)**
* **[Puppeteer]** Fixed fails when executing localStorage on services pages. See [#2026](https://github.com/codeceptjs/CodeceptJS/issues/2026)
* Fixed empty tags in test name. See [#2038](https://github.com/codeceptjs/CodeceptJS/issues/2038)

## 2.3.5

* Set "parse-function" dependency to "5.2.11" to avoid further installation errors.

## 2.3.4

* Fixed installation error "Cannot find module '@babel/runtime/helpers/interopRequireDefault'". The issue came from `parse-function` package. Fixed by **[pablopaul](https://github.com/pablopaul)**.
* **[Puppeteer]** Fixed switching to iframe without an ID by **[johnyb](https://github.com/johnyb)**. See [#1974](https://github.com/codeceptjs/CodeceptJS/issues/1974)
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
  * 'Shift' + 'key' combination would not reflect actual keyboard behavior.
  * Respect sequence with multiple modifier keys passed to pressKey.
  * Added support to automatic change operation modifier key based on operating system.
* [Puppeteer][WebDriver] Added `pressKeyUp` and `pressKeyDown` to press and release modifier keys like `Control` or `Shift`. By **[martomo](https://github.com/martomo)**.
* [Puppeteer][WebDriver] Added `grabElementBoundingRect` by **[PeterNgTr](https://github.com/PeterNgTr)**.
* **[Puppeteer]** Fixed speed degradation introduced in [#1306](https://github.com/codeceptjs/CodeceptJS/issues/1306) with accessibility locators support. See [#1953](https://github.com/codeceptjs/CodeceptJS/issues/1953).
* Added `Config.addHook` to add a function that will update configuration on load.
* Started [`@codeceptjs/configure`](https://github.com/codeceptjs/configure) package with a collection of common configuration patterns.
* **[TestCafe]** port's management removed (left on TestCafe itself) by **[orihomie](https://github.com/orihomie)**. Fixes [#1934](https://github.com/codeceptjs/CodeceptJS/issues/1934).
* **[REST]** Headers are no more declared as singleton variable. Fixes [#1959](https://github.com/codeceptjs/CodeceptJS/issues/1959)
* Updated Docker image to include run tests in workers with `NUMBER_OF_WORKERS` env variable. By **[PeterNgTr](https://github.com/PeterNgTr)**.

## 2.3.2

* **[Puppeteer]** Fixed Puppeteer 1.20 support by **[davertmik](https://github.com/davertmik)**
* Fixed `run-workers` to run with complex configs. See [#1887](https://github.com/codeceptjs/CodeceptJS/issues/1887) by **[nitschSB](https://github.com/nitschSB)**
* Added `--suites` option to `run-workers` to split suites by workers (tests of the same suite goes to teh same worker). Thanks **[nitschSB](https://github.com/nitschSB)**.
* Added a guide on [Email Testing](https://codecept.io/email).
* **[retryFailedStepPlugin]** Improved to ignore wait* steps and others. Also added option to ignore this plugin per test bases. See [updated documentation](https://codecept.io/plugins#retryfailedstep). By **[davertmik](https://github.com/davertmik)**
* Fixed using PageObjects as classes by **[Vorobeyko](https://github.com/Vorobeyko)**. See [#1896](https://github.com/codeceptjs/CodeceptJS/issues/1896)
* **[WebDriver]** Fixed opening more than one tab. See [#1875](https://github.com/codeceptjs/CodeceptJS/issues/1875) by **[jplegoff](https://github.com/jplegoff)**. Fixes [#1874](https://github.com/codeceptjs/CodeceptJS/issues/1874)
* Fixed [#1891](https://github.com/codeceptjs/CodeceptJS/issues/1891) when `I.retry()` affected retries of next steps. By **[davertmik](https://github.com/davertmik)**

## 2.3.1

* **[MockRequest]** Polly helper was renamed to MockRequest.
* [MockRequest][WebDriver] [Mocking requests](https://codecept.io/webdriver#mocking-requests) is now available in WebDriver. Thanks **[radhey1851](https://github.com/radhey1851)**
* **[Puppeteer]** Ensure configured user agent and/or window size is applied to all pages. See [#1862](https://github.com/codeceptjs/CodeceptJS/issues/1862) by **[martomo](https://github.com/martomo)**
* Improve handling of xpath locators with round brackets by **[nitschSB](https://github.com/nitschSB)**. See [#1870](https://github.com/codeceptjs/CodeceptJS/issues/1870)
* Use WebDriver capabilities config in wdio plugin. [#1869](https://github.com/codeceptjs/CodeceptJS/issues/1869) by **[quekshuy](https://github.com/quekshuy)**

## 2.3.0


* **[Parallel testing by workers](https://codecept.io/parallel#parallel-execution-by-workers) introduced** by **[VikalpP](https://github.com/VikalpP)** and **[davertmik](https://github.com/davertmik)**. Use `run-workers` command as faster and simpler alternative to `run-multiple`. Requires NodeJS v12

```
# run all tests in parallel using 3 workers
npx codeceptjs run-workers 3
```
* [GraphQL][GraphQLDataFactory] **Helpers for data management over GraphQL** APIs added. By **[radhey1851](https://github.com/radhey1851)**.
  * Learn how to [use GraphQL helper](https://codecept.io/data#graphql) to access GarphQL API
  * And how to combine it with [GraphQLDataFactory](https://codecept.io/data#graphql-data-factory) to generate and persist test data.
* **Updated to use Mocha 6**. See [#1802](https://github.com/codeceptjs/CodeceptJS/issues/1802) by **[elukoyanov](https://github.com/elukoyanov)**
* Added `dry-run` command to print steps of test scenarios without running them. Fails to execute scenarios with `grab*` methods or custom code. See [#1825](https://github.com/codeceptjs/CodeceptJS/issues/1825) for more details.

```
npx codeceptjs dry-run
```

* **[Appium]** Optimization when clicking, searching for fields by accessibility id. See [#1777](https://github.com/codeceptjs/CodeceptJS/issues/1777) by **[gagandeepsingh26](https://github.com/gagandeepsingh26)**
* **[TestCafe]** Fixed `switchTo` by **[KadoBOT](https://github.com/KadoBOT)**
* **[WebDriver]** Added geolocation actions by **[PeterNgTr](https://github.com/PeterNgTr)**
    * `grabGeoLocation()`
    * `setGeoLocation()`
* **[Polly]** Check typeof arguments for mock requests by **[VikalpP](https://github.com/VikalpP)**. Fixes [#1815](https://github.com/codeceptjs/CodeceptJS/issues/1815)
* CLI improvements by **[jamesgeorge007](https://github.com/jamesgeorge007)**
  * `codeceptjs` command prints list of all available commands
  * added `codeceptjs -V` flag to print version information
  * warns on unknown command
* Added TypeScript files support to `run-multiple` by **[z4o4z](https://github.com/z4o4z)**
* Fixed element position bug in locator builder. See [#1829](https://github.com/codeceptjs/CodeceptJS/issues/1829) by **[AnotherAnkor](https://github.com/AnotherAnkor)**
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
* **[Polly]** Take configuration values from Puppeteer. Fix [#1766](https://github.com/codeceptjs/CodeceptJS/issues/1766) by **[VikalpP](https://github.com/VikalpP)**
* **[Polly]** Add preconditions to check for puppeteer page availability by **[VikalpP](https://github.com/VikalpP)**. Fixes [#1767](https://github.com/codeceptjs/CodeceptJS/issues/1767)
* **[WebDriver]** Use filename for `uploadFile` by **[VikalpP](https://github.com/VikalpP)**. See [#1797](https://github.com/codeceptjs/CodeceptJS/issues/1797)
* **[Puppeteer]** Configure speed of input with `pressKeyDelay` option. By **[hubidu](https://github.com/hubidu)**
* Fixed recursive loading of support objects by **[davertmik](https://github.com/davertmik)**.
* Fixed support object definitions in steps.d.ts by **[johnyb](https://github.com/johnyb)**. Fixes [#1795](https://github.com/codeceptjs/CodeceptJS/issues/1795)
* Fixed `Data().Scenario().injectDependencies()` is not a function by **[andrerleao](https://github.com/andrerleao)**
* Fixed crash when using xScenario & Scenario.skip with tag by **[VikalpP](https://github.com/VikalpP)**. Fixes [#1751](https://github.com/codeceptjs/CodeceptJS/issues/1751)
* Dynamic configuration of helpers can be performed with async function. See [#1786](https://github.com/codeceptjs/CodeceptJS/issues/1786) by **[cviejo](https://github.com/cviejo)**
* Added TS definitions for internal objects by **[Vorobeyko](https://github.com/Vorobeyko)**
* BDD improvements:
  * Fix for snippets command with a .feature file that has special characters by **[asselin](https://github.com/asselin)**
  * Fix `--path` option on `gherkin:snippets` command by **[asselin](https://github.com/asselin)**. See [#1790](https://github.com/codeceptjs/CodeceptJS/issues/1790)
  * Added `--feature` option to `gherkin:snippets` to enable creating snippets for a subset of .feature files. See [#1803](https://github.com/codeceptjs/CodeceptJS/issues/1803) by **[asselin](https://github.com/asselin)**.
* Fixed: dynamic configs not reset after test. Fixes [#1776](https://github.com/codeceptjs/CodeceptJS/issues/1776) by **[cviejo](https://github.com/cviejo)**.

## 2.2.0

* **EXPERIMENTAL** [**TestCafe** helper](https://codecept.io/helpers/TestCafe) introduced. TestCafe allows to run cross-browser tests it its own very fast engine. Supports all browsers including mobile. Thanks to **[hubidu](https://github.com/hubidu)** for implementation! Please test it and send us feedback.
* **[Puppeteer]** Mocking requests enabled by introducing [Polly.js helper](https://codecept.io/helpers/Polly). Thanks **[VikalpP](https://github.com/VikalpP)**

```js
// use Polly & Puppeteer helpers
I.mockRequest('GET', '/api/users', 200);
I.mockRequest('POST', '/users', { user: { name: 'fake' }});
```

* **EXPERIMENTAL** **[Puppeteer]** [Firefox support](https://codecept.io/helpers/Puppeteer-firefox) introduced by **[ngadiyak](https://github.com/ngadiyak)**, see [#1740](https://github.com/codeceptjs/CodeceptJS/issues/1740)
* **[stepByStepReportPlugin]** use md5 hash to generate reports into unique folder. Fix [#1744](https://github.com/codeceptjs/CodeceptJS/issues/1744) by **[chimurai](https://github.com/chimurai)**
* Interactive pause improvements:
  * print result of `grab` commands
  * print message for successful assertions
* `run-multiple` (parallel execution) improvements:
  * `bootstrapAll` must be called before creating chunks. [#1741](https://github.com/codeceptjs/CodeceptJS/issues/1741) by **[Vorobeyko](https://github.com/Vorobeyko)**
  * Bugfix: If value in config has falsy value then multiple config does not overwrite original value. [#1756](https://github.com/codeceptjs/CodeceptJS/issues/1756) by **[LukoyanovE](https://github.com/LukoyanovE)**
* Fixed hooks broken in 2.1.5 by **[Vorobeyko](https://github.com/Vorobeyko)**
* Fix references to support objects when using Dependency Injection. Fix by **[johnyb](https://github.com/johnyb)**. See [#1701](https://github.com/codeceptjs/CodeceptJS/issues/1701)
* Fix dynamic config applied for multiple helpers by **[VikalpP](https://github.com/VikalpP)** [#1743](https://github.com/codeceptjs/CodeceptJS/issues/1743)


## 2.1.5

* **EXPERIMENTAL** [Wix Detox support](https://github.com/codeceptjs/detox-helper) introduced as standalone helper. Provides a faster alternative to Appium for mobile testing.
* Saving successful commands inside interactive pause into `_output/cli-history` file. By **[hubidu](https://github.com/hubidu)**
* Fixed hanging error handler inside scenario. See [#1721](https://github.com/codeceptjs/CodeceptJS/issues/1721) by **[haily-lgc](https://github.com/haily-lgc)**.
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
* **[WebDriver]** `attachFile` to work with hidden elements. Fixed in [#1460](https://github.com/codeceptjs/CodeceptJS/issues/1460) by **[tsuemura](https://github.com/tsuemura)**



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
* **[Pupeteer]** Add support to use WSEndpoint. Allows to execute tests remotely. [See [#1350](https://github.com/codeceptjs/CodeceptJS/issues/1350)] by **[gabrielcaires](https://github.com/gabrielcaires)** (https://github.com/codeceptjs/CodeceptJS/pull/1350)
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
* **[Puppeteer]** Fixed making screenshot on additional sessions by **[PeterNgTr](https://github.com/PeterNgTr)**. Fixes [#1266](https://github.com/codeceptjs/CodeceptJS/issues/1266)
* Added `--invert` option to `run-multiple` command by **[LukoyanovE](https://github.com/LukoyanovE)**
* Fixed steps in Allure reports by **[PeterNgTr](https://github.com/PeterNgTr)**
* Add option `output` to customize output directory in [stepByStepReport plugin](https://codecept.io/plugins/#stepbystepreport). By **[fpsthirty](https://github.com/fpsthirty)**
* Changed type definition of PageObjects to get auto completion by **[rhicu](https://github.com/rhicu)**
* Fixed steps output for async/arrow functions in CLI by **[LukoyanovE](https://github.com/LukoyanovE)**. See [#1329](https://github.com/codeceptjs/CodeceptJS/issues/1329)

## 1.4.5

* Add **require** param to main config. Allows to require Node modules before executing tests. By **[LukoyanovE](https://github.com/LukoyanovE)**. For example:
    * Use `ts-node/register` to register TypeScript parser
    * Use `should` to register should-style assertions

```js
"require": ["ts-node/register", "should"]
```

* **[WebDriverIO]** Fix timeouts definition to be compatible with W3C drivers. By **[LukoyanovE](https://github.com/LukoyanovE)**
* Fixed: exception in Before block w/ Mocha causes test not to report failure. See [#1292](https://github.com/codeceptjs/CodeceptJS/issues/1292) by **[PeterNgTr](https://github.com/PeterNgTr)**
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
* Fixed setting `multiple.parallel.chunks` as environment variable in config. See [#1238](https://github.com/codeceptjs/CodeceptJS/issues/1238) by **[ngadiyak](https://github.com/ngadiyak)**

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
* [WebDriverIO][Protractor][Nightmare][Puppeteer] Full page screenshots on failure disabled by default. See [issue[#1600](https://github.com/codeceptjs/CodeceptJS/issues/1600). You can enabled them with `fullPageScreenshots: true`, however they may work unstable in Selenium.
* `within` blocks can return values. See [updated documentation](https://codecept.io/basics/#within).
* Removed doublt call to `_init` in helpers. Fixes issue [#1036](https://github.com/codeceptjs/CodeceptJS/issues/1036)
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
* **[REST]** Prevent from mutating default headers by **[alexashley](https://github.com/alexashley)**. See [#789](https://github.com/codeceptjs/CodeceptJS/issues/789)
* **[REST]** Fixed sending empty helpers with `haveRequestHeaders` in `sendPostRequest`. By **[petrisorionel](https://github.com/petrisorionel)**
* Fixed displaying undefined args in output by **[APshenkin](https://github.com/APshenkin)**
* Fixed NaN instead of seconds in output by **[APshenkin](https://github.com/APshenkin)**
* Add browser name to report file for `multiple-run` by **[trollr](https://github.com/trollr)**
* Mocha updated to 4.x



## 1.0.3

* [WebDriverIO][Protractor][Nightmare] method `waitUntilExists` implemented by **[sabau](https://github.com/sabau)**
* Absolute path can be set for `output` dir by **[APshenkin](https://github.com/APshenkin)**. Fix [#571](https://github.com/codeceptjs/CodeceptJS/issues/571)* Data table rows can be ignored by using `xadd`. By **[APhenkin](https://github.com/APhenkin)**
* Added `Data(table).only.Scenario` to give ability to launch only Data tests. By **[APhenkin](https://github.com/APhenkin)**
* Implemented `ElementNotFound` error by **[BorisOsipov](https://github.com/BorisOsipov)**.
* Added TypeScript compiler / configs to check the JavaScript by **[KennyRules](https://github.com/KennyRules)**
* **[Nightmare]** fix executeScript return value by **[jploskonka](https://github.com/jploskonka)**
* **[Nightmare]** fixed: err.indexOf not a function when waitForText times out in nightmare by **[joeypedicini92](https://github.com/joeypedicini92)**
* Fixed: Retries not working when using .only. By **[APhenkin](https://github.com/APhenkin)**


## 1.0.2

* Introduced generators support in scenario hooks for `BeforeSuite`/`Before`/`AfterSuite`/`After`
* **[ApiDataFactory]** Fixed loading helper; `requireg` package included.
* Fix [#485](https://github.com/codeceptjs/CodeceptJS/issues/485)`run-multiple`: the first browser-resolution combination was be used in all configurations
* Fixed unique test names:
  * Fixed [#447](https://github.com/codeceptjs/CodeceptJS/issues/447) tests failed silently if they have the same name as other tests.
  * Use uuid in screenshot names when `uniqueScreenshotNames: true`
* **[Protractor]** Fixed testing non-angular application. `amOutsideAngularApp` is executed before each step. Fixes [#458](https://github.com/codeceptjs/CodeceptJS/issues/458)* Added output for steps in hooks when they fail

## 1.0.1

* Reporters improvements:
  * Allows to execute [multiple reporters](http://codecept.io/advanced/#Multi-Reports)
  * Added [Mochawesome](http://codecept.io/helpers/Mochawesome/) helper
  * `addMochawesomeContext` method to add custom data to mochawesome reports
  * Fixed Mochawesome context for failed screenshots.
* **[WebDriverIO]** improved click on context to match clickable element with a text inside. Fixes [#647](https://github.com/codeceptjs/CodeceptJS/issues/647)* **[Nightmare]** Added `refresh` function by **[awhanks](https://github.com/awhanks)**
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
* Print execution time per step in `--debug` mode. [#591](https://github.com/codeceptjs/CodeceptJS/issues/591) by **[APshenkin](https://github.com/APshenkin)**
* [WebDriverIO][Protractor][Nightmare] Added `disableScreenshots` option to disable screenshots on fail by **[Apshenkin](https://github.com/Apshenkin)**
* [WebDriverIO][Protractor][Nightmare] Added `uniqueScreenshotNames` option to generate unique names for screenshots on failure by **[Apshenkin](https://github.com/Apshenkin)**
* [WebDriverIO][Nightmare] Fixed click on context; `click('text', '#el')` will throw exception if text is not found inside `#el`.
* [WebDriverIO][Protractor][SeleniumWebdriver] [SmartWait introduced](http://codecept.io/acceptance/#smartwait).
* [WebDriverIO][Protractor][Nightmare]Fixed `saveScreenshot` for PhantomJS, `fullPageScreenshots` option introduced by **[HughZurname](https://github.com/HughZurname)** [#549](https://github.com/codeceptjs/CodeceptJS/issues/549)
* **[Appium]** helper introduced by **[APshenkin](https://github.com/APshenkin)**
* **[REST]** helper introduced by **[atrevino](https://github.com/atrevino)** in [#504](https://github.com/codeceptjs/CodeceptJS/issues/504)
* [WebDriverIO][SeleniumWebdriver] Fixed "windowSize": "maximize" for Chrome 59+ version [#560](https://github.com/codeceptjs/CodeceptJS/issues/560) by **[APshenkin](https://github.com/APshenkin)**
* **[Nightmare]** Fixed restarting by **[APshenkin](https://github.com/APshenkin)** [#581](https://github.com/codeceptjs/CodeceptJS/issues/581)
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
* Use mkdirp to create output directory. [#592](https://github.com/codeceptjs/CodeceptJS/issues/592) by **[vkramskikh](https://github.com/vkramskikh)**
* **[WebDriverIO]** Fixed `seeNumberOfVisibleElements` by **[BorisOsipov](https://github.com/BorisOsipov)** [#574](https://github.com/codeceptjs/CodeceptJS/issues/574)
* Lots of fixes for promise chain by **[APshenkin](https://github.com/APshenkin)** [#568](https://github.com/codeceptjs/CodeceptJS/issues/568)
    * Fix [#543](https://github.com/codeceptjs/CodeceptJS/issues/543)- After block not properly executed if Scenario fails
    * Expected behavior in promise chains: `_beforeSuite` hooks from helpers -> `BeforeSuite` from test -> `_before` hooks from helpers -> `Before` from test - > Test steps -> `_failed` hooks from helpers (if test failed) -> `After` from test -> `_after` hooks from helpers -> `AfterSuite` from test -> `_afterSuite` hook from helpers.
    * if during test we got errors from any hook (in test or in helper) - stop complete this suite and go to another
    * if during test we got error from Selenium server - stop complete this suite and go to another
    * [WebDriverIO][Protractor] if `restart` option is false - close all tabs expect one in `_after`.
    * Complete `_after`, `_afterSuite` hooks even After/AfterSuite from test was failed
    * Don't close browser between suites, when `restart` option is false. We should start browser only one time and close it only after all tests.
    * Close tabs and clear local storage, if `keepCookies` flag is enabled
* Fix TypeError when using babel-node or ts-node on node.js 7+ [#586](https://github.com/codeceptjs/CodeceptJS/issues/586) by **[vkramskikh](https://github.com/vkramskikh)**
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
* [WebDriverIO][Protractor][SeleniumWebdriver] Bugfix: cleaning session when `restart: false` by **[tfiwm](https://github.com/tfiwm)** [#519](https://github.com/codeceptjs/CodeceptJS/issues/519)
* [WebDriverIO][Protractor][Nightmare] Added second parameter to `saveScreenshot` to allow a full page screenshot. By **[HughZurname](https://github.com/HughZurname)**
* Added suite object to `suite.before` and `suite.after` events by **[implico](https://github.com/implico)**. [#496](https://github.com/codeceptjs/CodeceptJS/issues/496)

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
* Fix 'fullTitle() is not a function' in exit.js by **[hubidu](https://github.com/hubidu)**. See [#388](https://github.com/codeceptjs/CodeceptJS/issues/388).
* **[Nightmare]** Fix for `waitTimeout` by **[HughZurname](https://github.com/HughZurname)**. See [#391](https://github.com/codeceptjs/CodeceptJS/issues/391). Resolves [#236](https://github.com/codeceptjs/CodeceptJS/issues/236)* Dockerized CodeceptJS setup by **[artiomnist](https://github.com/artiomnist)**. [See reference](https://github.com/codeceptjs/CodeceptJS/blob/master/docker/README.md)

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

* **[WebDriverIO]** Added `uniqueScreenshotNames` option to set unique screenshot names for failed tests. By **[APshenkin](https://github.com/APshenkin)**. See [#299](https://github.com/codeceptjs/CodeceptJS/issues/299)
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

* Added [regression tests](https://github.com/codeceptjs/CodeceptJS/tree/master/test/runner) for codeceptjs tests runner.

## 0.4.11

* Fixed regression in 0.4.10
* Added `bootstrap`/`teardown` config options to accept functions as parameters by **[pscanf](https://github.com/pscanf)**. See updated [config reference](http://codecept.io/configuration/) [#319](https://github.com/codeceptjs/CodeceptJS/issues/319)

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

* Changed 'pending' to 'skipped' in reports by **[timja-kainos](https://github.com/timja-kainos)**. See [#315](https://github.com/codeceptjs/CodeceptJS/issues/315)

## 0.4.9

* [SeleniumWebdriver][Protractor][WebDriverIO][Nightmare] fixed `executeScript`, `executeAsyncScript` to work and return values.
* [Protractor][SeleniumWebdriver][WebDriverIO] Added `waitForInvisible` and `waitForStalenessOf` methods by **[Nighthawk14](https://github.com/Nighthawk14)**.
* Added `--config` option to `codeceptjs run` to manually specify config file by **[cnworks](https://github.com/cnworks)**
* **[Protractor]** Simplified behavior of `amOutsideAngularApp` by using `ignoreSynchronization`. Fixes [#278](https://github.com/codeceptjs/CodeceptJS/issues/278)
* Set exit code to 1 when test fails at `Before`/`After` hooks. Fixes [#279](https://github.com/codeceptjs/CodeceptJS/issues/279)


## 0.4.8

* [Protractor][SeleniumWebdriver][Nightmare] added `moveCursorTo` method.
* [Protractor][SeleniumWebdriver][WebDriverIO] Added `manualStart` option to start browser manually in the beginning of test. By **[cnworks](https://github.com/cnworks)**. [PR[#250](https://github.com/codeceptjs/CodeceptJS/issues/250)
* Fixed `codeceptjs init` to work with nested directories and file masks.
* Fixed `codeceptjs gt` to generate test with proper file name suffix. By **[Zougi](https://github.com/Zougi)**.
* **[Nightmare]** Fixed: Error is thrown when clicking on element which can't be locate. By **[davetmik](https://github.com/davetmik)**
* **[WebDriverIO]** Fixed `attachFile` for file upload. By **[giuband](https://github.com/giuband)** and **[davetmik](https://github.com/davetmik)**
* **[WebDriverIO]** Add support for timeouts in config and with `defineTimeouts` method. By **[easternbloc](https://github.com/easternbloc)** [#258](https://github.com/codeceptjs/CodeceptJS/issues/258) and [#267](https://github.com/codeceptjs/CodeceptJS/issues/267) by **[davetmik](https://github.com/davetmik)**
* Fixed hanging of CodeceptJS when error is thrown by event dispatcher. Fix by **[Zougi](https://github.com/Zougi)** and **[davetmik](https://github.com/davetmik)**


## 0.4.7

* Improved docs for `BeforeSuite`; fixed its usage with `restart: false` option by **[APshenkin](https://github.com/APshenkin)**.
* Added `Nightmare` to list of available helpers on `init`.
* **[Nightmare]** Removed double `resizeWindow` implementation.

## 0.4.6

* Added `BeforeSuite` and `AfterSuite` hooks to scenario by **[APshenkin](https://github.com/APshenkin)**. See [updated documentation](http://codecept.io/basics/#beforesuite)

## 0.4.5

* Fixed running `codecept def` command by **[jankaspar](https://github.com/jankaspar)**
* [Protractor][SeleniumWebdriver] Added support for special keys in `pressKey` method. Fixes [#216](https://github.com/codeceptjs/CodeceptJS/issues/216)

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

* Added ability to localize tests with translation [#189](https://github.com/codeceptjs/CodeceptJS/issues/189). Thanks to **[abner](https://github.com/abner)**
  * **[Translation]** ru-RU translation added.
  * **[Translation]** pt-BR translation added.
* **[Protractor]** Protractor 4.0.4 compatibility.
* [WebDriverIO][SeleniumWebdriver][Protractor] Fixed single browser session  mode for `restart: false`
* Fixed using of 3rd party reporters (xunit, mocha-junit-reporter, mochawesome). Added guide.
* Documentation for [Translation](http://codecept.io/translation/) added.
* Documentation for [Reports](http://codecept.io/reports/) added.

## 0.4.1

* Added custom steps to step definition list. See [#174](https://github.com/codeceptjs/CodeceptJS/issues/174) by **[jayS-de](https://github.com/jayS-de)**
* **[WebDriverIO]** Fixed using `waitForTimeout` option by **[stephane-ruhlmann](https://github.com/stephane-ruhlmann)**. See [#178](https://github.com/codeceptjs/CodeceptJS/issues/178)

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
* Fixed using assert in generator without yields [#89](https://github.com/codeceptjs/CodeceptJS/issues/89)

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
* **[WebDriverIO]** fixed saving screenshots on failure. Fixes [#70](https://github.com/codeceptjs/CodeceptJS/issues/70)
* fixed `within` block doesn't end in output not [#79](https://github.com/codeceptjs/CodeceptJS/issues/79)


## 0.2.8

* **[WebDriverIO]** added `seeNumberOfElements` by **[fabioel](https://github.com/fabioel)**

## 0.2.7

* process ends with exit code 1 on error or failure [#49](https://github.com/codeceptjs/CodeceptJS/issues/49)
* fixed registereing global Helper [#57](https://github.com/codeceptjs/CodeceptJS/issues/57)
* fixed handling error in within block [#50](https://github.com/codeceptjs/CodeceptJS/issues/50)

## 0.2.6

* Fixed `done() was called multiple times`
* **[WebDriverIO]** added `waitToHide` method by **[fabioel](https://github.com/fabioel)**
* Added global `Helper` (alias `codecept_helper)`, object use for writing custom Helpers. Generator updated. Changes to [#48](https://github.com/codeceptjs/CodeceptJS/issues/48)

## 0.2.5

* Fixed issues with using yield inside a test [#45](https://github.com/codeceptjs/CodeceptJS/issues/45) [#47](https://github.com/codeceptjs/CodeceptJS/issues/47) [#43](https://github.com/codeceptjs/CodeceptJS/issues/43)
* Fixed generating a custom helper. Helper class is now accessible with `codecept_helper` var. Fixes [#48](https://github.com/codeceptjs/CodeceptJS/issues/48)

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
* **[WebDriverIO]** fixed `waitForText` method by **[roadhump](https://github.com/roadhump)**. Fixes [#11](https://github.com/codeceptjs/CodeceptJS/issues/11)
* Fixed creating output dir when it already exists on init by **[alfirin](https://github.com/alfirin)**
* Fixed loading of custom helpers

