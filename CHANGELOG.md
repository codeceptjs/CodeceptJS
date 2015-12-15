# 0.2.0

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