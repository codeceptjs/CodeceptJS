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