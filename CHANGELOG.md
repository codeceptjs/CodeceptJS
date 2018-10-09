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

* Fixed attaching Allure screenshot on exception. Fix by @DevinWatson
* Improved type definitions for custom steps. By @Akxe
* Fixed setting `multiple.parallel.chunks` as environment variable in config. See [#1238](https://github.com/Codeception/CodeceptJS/pull/1238) by @ngadiyak

## 1.4.2

* Fixed setting config for plugins (inclunding setting `outputDir` for allure) by @jplegoff

## 1.4.1

* Added `plugins` option to `run-multiple`
* Minor output fixes
* Added Type Definition for Helper class by @Akxe
* Fixed extracing devault extension in generators by @Akxe

## 1.4.0

* [**Allure Reporter Integration**](https://codecept.io/reports/#allure). Full inegration with Allure Server. Get nicely looking UI for tests,including steps, nested steps, and screenshots. Thanks **Natarajan Krishnamurthy @krish** for sponsoring this feature.
* [Plugins API introduced](https://codecept.io/hooks/#plugins). Create custom plugins for CodeceptJS by hooking into event dispatcher, and using promise recorder.
* **Official [CodeceptJS plugins](https://codecept.io/plugins) added**:
    * **`stepByStepReport` - creates nicely looking report to see test execution as a slideshow**. Use this plugin to debug tests in headless environment without recording a video.
    * `allure` - Allure reporter added as plugin.
    * `screenshotOnFail` - saves screenshot on fail. Replaces similar functionality from helpers.
    * `retryFailedStep` - to rerun each failed step.
* [Puppeteer] Fix `executeAsyncScript` unexpected token by @jonathanz
* Added `override` option to `run-multiple` command by @svarlet

## 1.3.3

* Added `initGlobals()` function to API of [custom runner](https://codecept.io/hooks/#custom-runner).

## 1.3.2

* Interactve Shell improvements for `pause()`
    * Added `next` command for **step-by-step debug** when using `pause()`.
    * Use `After(pause);` in a to start interactive console after last step.
* [Puppeteer] Updated to Puppeteer 1.6.0
    * Added `waitForRequest` to wait for network request.
    * Added `waitForResponse` to wait for network response.
* Improved TypeScript definitions to support custom steps and page objects. By @xt1
* Fixed XPath detection to accept XPath which starts with `./` by @BenoitZugmeyer

## 1.3.1

* BDD-Gherkin: Fixed running async steps.
* [Puppeteer] Fixed process hanging for 30 seconds. Page loading timeout default via `getPageTimeout` set 0 seconds.
* [Puppeteer] Improved displaying client-side console messages in debug mode.
* [Puppeteer] Fixed closing sessions in `restart:false` mode for multi-session mode.
* [Protractor] Fixed `grabPopupText` to not throw error popup is not opened.
* [Protractor] Added info on using 'direct' Protractor driver to helper documentation by @xt1.
* [WebDriverIO] Added a list of all special keys to WebDriverIO helper by @davertmik and @xt1.
* Improved TypeScript definitions generator by @xt1

## 1.3.0

* **Cucumber-style BDD Introduced [Gherkin support](https://codecept.io/bdd). Thanks to [David Vins](https://github.com/dvins) and [Omedym](https://www.omedym.com) for sponsoring this feature**.

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
* [Puppeteer] [Multiple sessions](https://codecept.io/acceptance/#multiple-sessions) enabled. Requires Puppeteer >= 1.5
* [Puppeteer] Stability improvement. Waits for for `load` event on page load. This strategy can be changed in config:
    * `waitForNavigation` config option introduced. Possible options: `load`, `domcontentloaded`, `networkidle0`, `networkidle2`. See [Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions)
    * `getPageTimeout` config option to set maximum navigation time in milliseconds. Default is 30 seconds.
    * `waitForNavigation` method added. Explicitly waits for navigation to be finished.
* [WebDriverIO][Protractor][Puppeteer][Nightmare] **Possible BC** `grabTextFrom` unified. Return a text for single matched element and an array of texts for multiple elements.
* [Puppeteer]Fixed `resizeWindow` by @sergejkaravajnij
* [WebDriverIO][Protractor][Puppeteer][Nightmare] `waitForFunction` added. Waits for client-side JavaScript function to return true by @GREENpoint.
* [Puppeteer] `waitUntil` deprecated in favor of `waitForFunction`.
* Added `filter` function to DataTable.
* Send non-nested array of files to custom parallel execution chunking by @mikecbrant.
* Fixed invalid output directory path for run-multiple by @mikecbrant.
* [WebDriverIO] `waitUntil` timeout accepts time in seconds (as all other wait* functions). Fix by @truesrc.
* [Nightmare] Fixed `grabNumberOfVisibleElements` to work similarly to `seeElement`. Thx to @stefanschenk and Jinbo Jinboson.
* [Protractor] Fixed alert handling error with message 'no such alert' by @truesrc.


## 1.2.1

* Fixed running `I.retry()` on multiple steps.
* Fixed parallel execution wih chunks.
* [Puppeteer] Fixed `grabNumberOfVisibleElements` to return `0` instead of throwing error if no elements are found.

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

* [Parallel Execution](https://codecept.io/advanced/#parallel-execution) by @sveneisenschmidt. Run tests in parallel specifying number of chunks:

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
* [WebDriverIO][Protractor][Nightmare][Puppeteer] Full page screenshots on failure disabled by default. See [issue #1600](https://github.com/Codeception/CodeceptJS/issues/1060). You can enabled them with `fullPageScreenshots: true`, however they may work unstable in Selenium.
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
* Added Chinese translation ("zh-CN" and "zh-TW") by @TechQuery.
* Fixed running tests from a different folder specified by `-c` option.
* [Puppeteer] Added support for hash handling in URL by @gavoja.
* [Puppeteer] Fixed setting viewport size by @gavoja. See [Puppeteer issue](https://github.com/GoogleChrome/puppeteer/issues/1183)


## 1.1.7

* Docker Image updateed. [See updated reference](https://codecept.io/docker/):
    * codeceptjs package is mounted as `/codecept` insde container
    * tests directory is expected to be mounted as `/tests`
    * `codeceptjs` global runner added (symlink to `/codecept/bin/codecept.js`)
* [Protractor] Functions added by @reubenmiller:
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
* [Nightmare] added:
    * `grabPageScrollPosition` (new)
    * `seeNumberOfVisibleElements`
    * `waitToHide`
* [Puppeteer] added:
    * `grabPageScrollPosition` (new)
* [WebDriverIO] added"
    * `grabPageScrollPosition` (new)
* [Puppeteer] Fixed running wait* functions without setting `sec` parameter.
* [Puppeteer][Protractor] Fixed bug with I.click when using an object selector with the xpath property. By @reubenmiller
* [WebDriverIO][Protractor][Nightmare][Puppeteer] Fixed I.switchTo(0) and I.scrollTo(100, 100) api inconsistencies between helpers.
* [Protractor] Fixing bug when `seeAttributesOnElements` and `seeCssPropertiesOnElement` were incorrectly passing when the attributes/properties did not match by @reubenmiller
* [WebDriverIO] Use inbuilt dragAndDrop function (still doesn't work in Firefox). By @reubenmiller
* Support for Nightmare 3.0
* Enable glob patterns in `config.test` / `Codecept.loadTests` by @sveneisenschmidt
* Enable overriding of `config.tests` for `run-multiple` by @sveneisenschmidt


## 1.1.6

* Added support for `async I =>` functions syntax in Scenario by @APshenkin
* [WebDriverIO][Protractor][Puppeteer][Nightmare] `waitForInvisible` waits for element to hide or to be removed from page. By @reubenmiller
* [Protractor][Puppeteer][Nightmare] Added `grabCurrentUrl` function. By @reubenmiller
* [WebDriverIO] `grabBrowserUrl` deprecated in favor of `grabCurrentUrl` to unify the API.
* [Nightmare] Improved element visibility detection by @reubenmiller
* [Puppeteer] Fixing function calls when clearing the cookies and localstorage. By @reubenmiller
* [Puppeteer] Added `waitForEnabled`, `waitForValue` and `waitNumberOfVisibleElements` methods by @reubenmiller
* [WebDriverIO] Fixed `grabNumberOfVisibleElements` to return 0 when no visible elements are on page. By @michaltrunek
* Helpers API improvements (by @reubenmiller)
    * `_passed` hook runs after a test passed successfully
    * `_failed` hook runs on a failed test
* Hooks API. New events added by @reubenmiller:
    * `event.all.before` - executed before all tests
    * `event.all.after` - executed after all tests
    * `event.multiple.before` - executed before all processes in run-multiple
    * `event.multiple.after` - executed after all processes in run-multiple
* Multiple execution
* Allow `AfterSuite` and `After` test hooks to be defined after the first Scenario. By @reubenmiller
* [Nightmare] Prevent `I.amOnpage` navigation if the browser is already at the given url
* Multiple-Run: Added new `bootstrapAll` and `teardownAll` hooks to be executed before and after all processes
* `codeceptjs def` command accepts `--config` option. By @reubenmiller

## 1.1.5

* [Puppeteer] Rerun steps failed due to "Cannot find context with specified id" Error.
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

* `Scenario().injectDependencies` added to dynamically add objects into DI container by @Apshenkin. See [Dependency Injection section in PageObjects](https://codecept.io/pageobjects/#dependency-injection).
* Fixed using async/await functions inside `within`
* [WebDriverIO][Protractor][Puppeteer][Nightmare] **`waitUntilExists` deprecated** in favor of `waitForElement`
* [WebDriverIO][Protractor] **`waitForStalenessOf` deprecated** in favor of `waitForDetached`
* [WebDriverIO][Protractor][Puppeteer][Nightmare] `waitForDetached` added
* [Nightmare] Added `I.seeNumberOfElements()` by @pmoncadaisla
* [Nightmare] Load blank page when starting nightmare so that the .evaluate function will work if _failed/saveScreenshot is triggered by @reubenmiller
* Fixed using plain arrays for data driven tests by @reubenmiller
* [Puppeteer] Use default tab instead of opening a new tab when starting the browser by @reubenmiller
* [Puppeteer] Added `grabNumberOfTabs` function by @reubenmiller
* [Puppeteer] Add ability to set user-agent by @abidhahmed
* [Puppeteer] Add keepCookies and keepBrowserState @abidhahmed
* [Puppeteer] Clear value attribute instead of innerhtml for TEXTAREA by @reubenmiller
* [REST] fixed sending string payload by @michaltrunek
* Fixed unhandled rejection in async/await tests by @APshenkin


## 1.1.4

* Removed `yarn` call in package.json
* Fixed `console.log` in Puppeteer by @othree
* [Appium] `runOnAndroid` and `runOnIOS` can receive a function to check capabilities dynamically:

```js
I.runOnAndroid(caps => caps.platformVersion >= 7, () => {
  // run code only on Android 7+
});
```

## 1.1.3

* [Puppeteer] +25 Functions added by @reubenmiller
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
* [Protractor] +8 functions added by @reubenmiller
    * `closeCurrentTab`
    * `grabSource`
    * `openNewTab`
    * `seeNumberOfElements`
    * `seeTextEquals`
    * `seeTitleEquals`
    * `switchToNextTab`
    * `switchToPreviousTab`
* [Nightmare] `waitForInvisible` added by @reubenmiller
* [Puppeteer] Printing console.log information in debug mode.
* [Nightmare] Integrated with `nightmare-har-plugin` by mingfang. Added `enableHAR` option. Added HAR functions:
    * `grabHAR`
    * `saveHAR`
    * `resetHAR`
* [WebDriverIO] Fixed execution stability for parallel requests with Chromedriver
* [WebDriverIO] Fixed resizeWindow when resizing to 'maximize' by @reubenmiller
* [WebDriverIO] Fixing resizing window to full screen when taking a screenshot by @reubenmiller

## 1.1.2

* [Puppeteer] Upgraded to Puppeteer 1.0
* Added `grep` option to config to set default matching pattern for tests.
* [Puppeteer] Added `acceptPopup`, `cancelPopup`, `seeInPopup` and `grabPopupText` functions by @reubenmiller
* [Puppeteer] `within` iframe and nested iframe support added by @reubenmiller
* [REST] Added support for JSON objects since payload (as a JSON) was automatically converted into "URL query" type of parameter by @Kalostrinho
* [REST] Added `resetRequestHeaders` method by @Kalostrinho
* [REST] Added `followRedirect` option and `amFollowingRequestRedirects`/`amNotFollowingRequestRedirects` methods by @Kalostrinho
* [WebDriverIO] `uncheckOption` implemented by @brunobg
* [WebDriverIO] Added `grabBrowserUrl` by @Kalostrinho
* Add ability to require helpers from node_modules by @APshenkin
* Added `--profile` option to `run-multiple` command by @jamie-beck
* Custom output name for multiple browser run by @tfiwm
* Fixed passing data to scenarios by @KennyRules

## 1.1.1

* [WebDriverIO] fixed `waitForInvisible` by @Kporal

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
* [SeleniumWebdriver] Helper is deprecated, it is recommended to use Protractor with config option `angular: false` instead.
* [WebDriverIO] nested iframe support in the within block by @reubenmiller. Example:

```js
within({frame: ['#wrapperId', '[name=content]']}, () => {
  I.click('Sign in!');
  I.see('Email Address');
});
I.see('Nested Iframe test');
I.dontSee('Email Address');
});
```
* [WebDriverIO] Support for `~` locator to find elements by `aria-label`. This behavior is similar as it is in Appium and helps testing cross-platform React apps. Example:

```html
<Text accessibilityLabel="foobar">
    CodeceptJS is awesome
</Text>
```
↑ This element can be located with `~foobar` in WebDriverIO and Appium helpers. Thanks to @flyskywhy

* Allow providing arbitrary objects in config includes by @rlewan
* [REST] Prevent from mutating default headers by @alexashley. See [#789](https://github.com/Codeception/CodeceptJS/pull/789)
* [REST] Fixed sending empty helpers with `haveRequestHeaders` in `sendPostRequest`. By @petrisorionel
* Fixed displaying undefined args in output by @APshenkin
* Fixed NaN instead of seconds in output by @APshenkin
* Add browser name to report file for `multiple-run` by @trollr
* Mocha updated to 4.x



## 1.0.3

* [WebDriverIO][Protractor][Nightmare] method `waitUntilExists` implemented by @sabau
* Absolute path can be set for `output` dir by @APshenkin. Fix [#571](https://github.com/Codeception/CodeceptJS/issues/571)
* Data table rows can be ignored by using `xadd`. By @APhenkin
* Added `Data(table).only.Scenario` to give ability to launch only Data tests. By @APhenkin
* Implemented `ElementNotFound` error by @BorisOsipov.
* Added TypeScript compiler / configs to check the JavaScript by @KennyRules
* [Nightmare] fix executeScript return value by @jploskonka
* [Nightmare] fixed: err.indexOf not a function when waitForText times out in nightmare by @joeypedicini92
* Fixed: Retries not working when using .only. By @APhenkin


## 1.0.2

* Introduced generators support in scenario hooks for `BeforeSuite`/`Before`/`AfterSuite`/`After`
* [ApiDataFactory] Fixed loading helper; `requireg` package included.
* Fix [#485](https://github.com/Codeception/CodeceptJS/issues/485) `run-multiple`: the first browser-resolution combination was be used in all configurations
* Fixed unique test names:
  * Fixed [#447](https://github.com/Codeception/CodeceptJS/issues/447): tests failed silently if they have the same name as other tests.
  * Use uuid in screenshot names when `uniqueScreenshotNames: true`
* [Protractor] Fixed testing non-angular application. `amOutsideAngularApp` is executed before each step. Fixes [#458](https://github.com/Codeception/CodeceptJS/issues/458)
* Added output for steps in hooks when they fail

## 1.0.1

* Reporters improvements:
  * Allows to execute [multiple reporters](http://codecept.io/advanced/#Multi-Reports)
  * Added [Mochawesome](http://codecept.io/helpers/Mochawesome/) helper
  * `addMochawesomeContext` method to add custom data to mochawesome reports
  * Fixed Mochawesome context for failed screenshots.
* [WebDriverIO] improved click on context to match clickable element with a text inside. Fixes [#647](https://github.com/Codeception/CodeceptJS/issues/647)
* [Nightmare] Added `refresh` function by @awhanks
* fixed `Unhandled promise rejection (rejection id: 1): Error: Unknown wait type: pageLoad`
* support for tests with retries in html report
* be sure that change window size and timeouts completes before test
* [Nightmare] Fixed `[Wrapped Error] "codeceptjs is not defined"`; Reinjectiing client scripts to a webpage on changes.
* [Nightmare] Added more detailed error messages for `Wait*` methods
* [Nightmare] Fixed adding screenshots to Mochawesome
* [Nightmare] Fix unique screenshots names in Nightmare
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

We also introduced two new helpers for data management.
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
* Print execution time per step in `--debug` mode. [#591](https://github.com/Codeception/CodeceptJS/pull/591) by @APshenkin
* [WebDriverIO][Protractor][Nightmare] Added `disableScreenshots` option to disable screenshots on fail by @Apshenkin
* [WebDriverIO][Protractor][Nightmare] Added `uniqueScreenshotNames` option to generate unique names for screenshots on failure by @Apshenkin
* [WebDriverIO][Nightmare] Fixed click on context; `click('text', '#el')` will throw exception if text is not found inside `#el`.
* [WebDriverIO][Protractor][SeleniumWebdriver] [SmartWait introduced](http://codecept.io/acceptance/#smartwait).
* [WebDriverIO][Protractor][Nightmare]Fixed `saveScreenshot` for PhantomJS, `fullPageScreenshots` option introduced by @HughZurname [#549](https://github.com/Codeception/CodeceptJS/pull/549)
* [Appium] helper introduced by @APshenkin
* [REST] helper introduced by @atrevino in [#504](https://github.com/Codeception/CodeceptJS/pull/504)
* [WebDriverIO][SeleniumWebdriver] Fixed "windowSize": "maximize" for Chrome 59+ version #560 by @APshenkin
* [Nightmare] Fixed restarting by @APshenkin [#581](https://github.com/Codeception/CodeceptJS/pull/581)
* [WebDriverIO] Methods added by @APshenkin:
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
* Use mkdirp to create output directory. [#592](https://github.com/Codeception/CodeceptJS/pull/592) by @vkramskikh
* [WebDriverIO] Fixed `seeNumberOfVisibleElements` by @BorisOsipov [#574](https://github.com/Codeception/CodeceptJS/pull/574)
* Lots of fixes for promise chain by @APshenkin [#568](https://github.com/Codeception/CodeceptJS/pull/568)
    * Fix [#543](https://github.com/Codeception/CodeceptJS/issues/543) - After block not properly executed if Scenario fails
    * Expected behavior in promise chains: `_beforeSuite` hooks from helpers -> `BeforeSuite` from test -> `_before` hooks from helpers -> `Before` from test - > Test steps -> `_failed` hooks from helpers (if test failed) -> `After` from test -> `_after` hooks from helpers -> `AfterSuite` from test -> `_afterSuite` hook from helpers.
    * if during test we got errors from any hook (in test or in helper) - stop complete this suite and go to another
    * if during test we got error from Selenium server - stop complete this suite and go to another
    * [WebDriverIO][Protractor] if `restart` option is false - close all tabs expect one in `_after`.
    * Complete `_after`, `_afterSuite` hooks even After/AfterSuite from test was failed
    * Don't close browser between suites, when `restart` option is false. We should start browser only one time and close it only after all tests.
    * Close tabs and clear local storage, if `keepCookies` flag is enabled
* Fix TypeError when using babel-node or ts-node on node.js 7+ [#586](https://github.com/Codeception/CodeceptJS/pull/586) by @vkramskikh
* [Nightmare] fixed usage of `_locate`

Special thanks to **Andrey Pshenkin** for his work on this release and the major improvements.

 ## 0.6.3

* Errors are printed in non-verbose mode. Shows "Selenium not started" and other important errors.
* Allowed to set custom test options:

```js
Scenario('My scenario', { build_id: 123, type: 'slow' }, function (I)
```
those options can be accessed as `opts` property inside a `test` object. Can be used in custom listeners.

* Added `docs` directory to a package.
* [WebDriverIO][Protractor][SeleniumWebdriver] Bugfix: cleaning session when `restart: false` by @tfiwm [#519](https://github.com/Codeception/CodeceptJS/pull/519)
* [WebDriverIO][Protractor][Nightmare] Added second parameter to `saveScreenshot` to allow a full page screenshot. By @HughZurname
* Added suite object to `suite.before` and `suite.after` events by @implico. [#496](https://github.com/Codeception/CodeceptJS/pull/496)

## 0.6.2

* Added `config` object to [public API](http://codecept.io/hooks/#api)
* Extended `index.js` to include `actor` and `helpers`, so they could be required:

```js
const actor = require('codeceptjs').actor;
```

* Added [example for creating custom runner](http://codecept.io/hooks/#custom-runner) with public API.
* run command to create `output` directory if it doesn't exist
* [Protractor] fixed loading globally installed Protractor
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

* **Command `multiple-run` added**, to execute tests in several browsers in parallel by @APshenkin and @davertmik. [See documentation](http://codecept.io/advanced/#multiple-execution).
* **Hooks API added to extend CodeceptJS** with custom listeners and plugins. [See documentation](http://codecept.io/hooks/#hooks_1).
* [Nightmare][WebDriverIO] `within` can work with iframes by @imvetri. [See documentation](http://codecept.io/acceptance/#iframes).
* [WebDriverIO][SeleniumWebdriver][Protractor] Default browser changed to `chrome`
* [Nightmare] Fixed globally locating `nightmare-upload`.
* [WebDriverIO] added `seeNumberOfVisibleElements` method by @elarouche.
* Exit with non-zero code if init throws an error by @rincedd
* New guides published:
    * [Installation](http://codecept.io/installation/)
    * [Hooks](http://codecept.io/hooks/)
    * [Advanced Usage](http://codecept.io/advanced/)
* Meta packages published:
    * [codecept-webdriverio](https://www.npmjs.com/package/codecept-webdriverio)
    * [codecept-protractor](https://www.npmjs.com/package/codecept-protractor)
    * [codecept-nightmare](https://www.npmjs.com/package/codecept-nightmare)


## 0.5.1

* [Polish translation](http://codecept.io/translation/#polish) added by @limes.
* Update process exit code so that mocha saves reports before exit by @romanovma.
* [Nightmare] fixed `getAttributeFrom` for custom attributes by @robrkerr
* [Nightmare] Fixed *UnhandledPromiseRejectionWarning error* when selecting the dropdown using `selectOption` by @robrkerr. [See PR](https://github.com/Codeception/CodeceptJS/pull/408).
* [Protractor] fixed `pressKey` method by @romanovma

## 0.5.0

* Protractor ^5.0.0 support (while keeping ^4.0.9 compatibility)
* Fix 'fullTitle() is not a function' in exit.js by @hubidu. See [#388](https://github.com/Codeception/CodeceptJS/pull/388).
* [Nightmare] Fix for `waitTimeout` by @HughZurname. See [#391](https://github.com/Codeception/CodeceptJS/pull/391). Resolves [#236](https://github.com/Codeception/CodeceptJS/issues/236)
* Dockerized CodeceptJS setup by @artiomnist. [See reference](https://github.com/Codeception/CodeceptJS/blob/master/docker/README.md)

## 0.4.16

* Fixed steps output synchronization (regression since 0.4.14).
* [WebDriverIO][Protractor][SeleniumWebdriver][Nightmare] added `keepCookies` option to keep cookies between tests with `restart: false`.
* [Protractor] added `waitForTimeout` config option to set default waiting time for all wait* functions.
* Fixed `_test` hook for helpers by @cjhille.

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

* [Nightmare] `restart` option added. `restart: false` allows to run all tests in a single window, disabled by default. By @nairvijays99
* [Nightmare] Fixed `resizeWindow` command.
* [Protractor][SeleniumWebdriver] added `windowSize` config option to resize window on start.
* Fixed "Scenario.skip causes 'Cannot read property retries of undefined'" by @MasterOfPoppets
* Fixed providing absolute paths for tests in config by @lennym

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

* [WebDriverIO] Added `uniqueScreenshotNames` option to set unique screenshot names for failed tests. By @APshenkin. See [#299](https://github.com/Codeception/CodeceptJS/pull/299)
* [WebDriverIO] `clearField` method improved to accept name/label locators and throw errors.
* [Nightmare][SeleniumWebdriver][Protractor] `clearField` method added.
* [Nightmare] Fixed `waitForElement`, and `waitForVisible` methods.
* [Nightmare] Fixed `resizeWindow` by @norisk-it
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
* Added `bootstrap`/`teardown` config options to accept functions as parameters by @pscanf. See updated [config reference](http://codecept.io/configuration/) #319

## 0.4.10

* [Protractor] Protrctor 4.0.12+ support.
* Enabled async bootstrap file by @abachar. Use inside `bootstrap.js`:

```js
module.exports = function(done) {
  // async instructions
  // call done() to continue execution
  // otherwise call done('error description')
}
```

* Changed 'pending' to 'skipped' in reports by @timja-kainos. See #315

## 0.4.9

* [SeleniumWebdriver][Protractor][WebDriverIO][Nightmare] fixed `executeScript`, `executeAsyncScript` to work and return values.
* [Protractor][SeleniumWebdriver][WebDriverIO] Added `waitForInvisible` and `waitForStalenessOf` methods by @Nighthawk14.
* Added `--config` option to `codeceptjs run` to manually specify config file by @cnworks
* [Protractor] Simplified behavior of `amOutsideAngularApp` by using `ignoreSynchronization`. Fixes #278
* Set exit code to 1 when test fails at `Before`/`After` hooks. Fixes #279


## 0.4.8

* [Protractor][SeleniumWebdriver][Nightmare] added `moveCursorTo` method.
* [Protractor][SeleniumWebdriver][WebDriverIO] Added `manualStart` option to start browser manually in the beginning of test. By @cnworks. [PR #250](https://github.com/Codeception/CodeceptJS/pull/255)
* Fixed `codeceptjs init` to work with nested directories and file masks.
* Fixed `codeceptjs gt` to generate test with proper file name suffix. By @Zougi.
* [Nightmare] Fixed: Error is thrown when clicking on element which can't be locate. By @davetmik
* [WebDriverIO] Fixed `attachFile` for file upload. By @giuband and @davetmik
* [WebDriverIO] Add support for timeouts in config and with `defineTimeouts` method. By @easternbloc [#258](https://github.com/Codeception/CodeceptJS/pull/258) and [#267](https://github.com/Codeception/CodeceptJS/pull/267) by @davetmik
* Fixed hanging of CodeceptJS when error is thrown by event dispatcher. Fix by @Zougi and @davetmik


## 0.4.7

* Improved docs for `BeforeSuite`; fixed its usage with `restart: false` option by @APshenkin.
* Added `Nightmare` to list of available helpers on `init`.
* [Nightmare] Removed double `resizeWindow` implementation.

## 0.4.6

* Added `BeforeSuite` and `AfterSuite` hooks to scenario by @APshenkin. See [updated documentation](http://codecept.io/basics/#beforesuite)

## 0.4.5

* Fixed running `codecept def` command by @jankaspar
* [Protractor][SeleniumWebdriver] Added support for special keys in `pressKey` method. Fixes #216

## 0.4.4

* Interactive shell fixed. Start it by running `codeceptjs shell`
* Added `--profile` option to `shell` command to use dynamic configuration.
* Added `--verbose` option to `shell` command for most complete output.

## 0.4.3

* [Protractor] Regression fixed to ^4.0.0 support
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

* Added ability to localize tests with translation [#189](https://github.com/Codeception/CodeceptJS/pull/189). Thanks to @abner
  * [Translation] ru-RU translation added.
  * [Translation] pt-BR translation added.
* [Protractor] Protractor 4.0.4 compatibility.
* [WebDriverIO][SeleniumWebdriver][Protractor] Fixed single browser session  mode for `restart: false`
* Fixed using of 3rd party reporters (xunit, mocha-junit-reporter, mochawesome). Added guide.
* Documentation for [Translation](http://codecept.io/translation/) added.
* Documentation for [Reports](http://codecept.io/reports/) added.

## 0.4.1

* Added custom steps to step definition list. See #174 by @jayS-de
* [WebDriverIO] Fixed using `waitForTimeout` option by @stephane-ruhlmann. See #178

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

to generate steps definition file and include it into tests by reference. By @kaflan

## 0.3.4

* [Protractor] version 3.3.0 comptaibility, NPM 3 compatibility. Please update Protractor!
* allows using absolute path for helpers, output, in config and in command line. By @denis-sokolov
* Fixes 'Cannot read property '1' of null in generate.js:44' by @seethislight

## 0.3.3

**Fixed global installation**. CodeceptJS can now locate globally located modules.
CodeceptJS is also recommended for local installation.
Depending on installation type additional modules (webdriverio, protractor, ...) will be loaded either from local or from global path.

## 0.3.2

* Added `codeceptjs list` command which shows all available methods of `I` object.
* [Protractor][SeleniumWebdriver] fixed closing browser instances
* [Protractor][SeleniumWebdriver] `doubleClick` method added
* [WebDriverIO][Protractor][SeleniumWebdriver] `doubleClick` method to locate clickable elements by text, `context` option added.
* Fixed using assert in generator without yields #89

## 0.3.1

* Fixed `init` command

## 0.3.0

**Breaking Change**: webdriverio package removed from dependencies list. You will need to install it manually after the upgrade.
Starting from 0.3.0 webdriverio is not the only backend for running selenium tests, so you are free to choose between Protractor, SeleniumWebdriver, and webdriverio and install them.

* **[Protractor] helper added**. Now you can test AngularJS applications by using its official library within the unigied CodeceptJS API!
* **[SeleniumWebdriver] helper added**. You can switch to official JS bindings for Selenium.
* [WebDriverIO] **updated to webdriverio v 4.0**
* [WebDriverIO] `clearField` method added by @fabioel
* [WebDriverIO] added `dragAndDrop` by @fabioel
* [WebDriverIO] fixed `scrollTo` method by @sensone
* [WebDriverIO] fixed `windowSize: maximize` option in config
* [WebDriverIO] `seeElement` and `dontSeeElement` check element for visibility by @fabioel and @davertmik
* [WebDriverIO] `seeElementInDOM`, `dontSeeElementInDOM` added to check element exists on page.
* [WebDriverIO] fixed saving screenshots on failure. Fixes #70
* fixed `within` block doesn't end in output not #79


## 0.2.8

* [WebDriverIO] added `seeNumberOfElements` by @fabioel

## 0.2.7

* process ends with exit code 1 on error or failure #49
* fixed registereing global Helper #57
* fixed handling error in within block #50

## 0.2.6

* Fixed `done() was called multiple times`
* [WebDriverIO] added `waitToHide` method by @fabioel
* Added global `Helper` (alias `codecept_helper)`, object use for writing custom Helpers. Generator updated. Changes to #48

## 0.2.5

* Fixed issues with using yield inside a test #45 #47 #43
* Fixed generating a custom helper. Helper class is now accessible with `codecept_helper` var. Fixes #48

## 0.2.4

* Fixed accessing helpers from custom helper by @pim.

## 0.2.3

* [WebDriverIO] fixed `seeInField` to work with single value elements like: input[type=text], textareas, and multiple: select, input[type=radio], input[type=checkbox]
* [WebDriverIO] fixed `pressKey`, key modifeiers (Control, Command, Alt, Shift) are released after the action

## 0.2.2

Fixed generation of custom steps file and page objects.
Please replace `require('codeceptjs/actor')` to `actor` in your `custom_steps.js`.
Whenever you need to create `I` object (in page objects, custom steps, but not in tests) just call `actor()`;

## 0.2.0

* **within** context hook added
* `--reporter` option supported
* [WebDriverIO] added features and methods:
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
* [WebDriverIO] proxy configuration added by @petehouston
* [WebDriverIO] fixed `waitForText` method by @roadhump. Fixes #11
* Fixed creating output dir when it already exists on init by @alfirin
* Fixed loading of custom helpers
