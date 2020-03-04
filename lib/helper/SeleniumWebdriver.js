const Helper = require('../helper');

/**
 * SeleniumWebdriver helper is based on the official [Selenium Webdriver JS](https://www.npmjs.com/package/selenium-webdriver)
 * library. It implements common web api methods (amOnPage, click, see).
 *
 * ## Backends
 *
 * ### Selenium Installation
 *
 * 1. Download [Selenium Server](http://docs.seleniumhq.org/download/)
 * 2. For Chrome browser install [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/getting-started), for Firefox browser install [GeckoDriver](https://github.com/mozilla/geckodriver).
 * 3. Launch the server: `java -jar selenium-server-standalone-3.xx.xxx.jar`. To locate Chromedriver binary use `-Dwebdriver.chrome.driver=./chromedriver` option. For Geckodriver use `-Dwebdriver.gecko.driver=`.
 *
 *
 * ### PhantomJS Installation
 *
 * PhantomJS is a headless alternative to Selenium Server that implements [the WebDriver protocol](https://code.google.com/p/selenium/wiki/JsonWireProtocol).
 * It allows you to run Selenium tests on a server without a GUI installed.
 *
 * 1. Download [PhantomJS](http://phantomjs.org/download.html)
 * 2. Run PhantomJS in WebDriver mode: `phantomjs --webdriver=4444`
 *
 * ## Configuration
 *
 * This helper should be configured in codecept.json or codecept.conf.js
 *
 * * `url` - base url of website to be tested
 * * `browser` - browser in which perform testing
 * * `driver` - which protractor driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
 * * `restart` - restart browser between tests (default: true).
 * * `smartWait`: (optional) **enables SmartWait**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000
 * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure
 * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites
 * * `keepBrowserState` (optional, default: false)  - keep browser state between tests when `restart` set to false.
 * * `keepCookies` (optional, default: false)  - keep cookies between tests when `restart` set to false.*
 * * `seleniumAddress` - Selenium address to connect (default: http://localhost:4444/wd/hub)
 * * `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default;
 * * `scriptTimeout`: (optional) sets default timeout for scripts in `executeAsync`. 1000 by default.
 * * `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
 * * `manualStart` (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["WebDriverIO"]._startBrowser()`
 * * `capabilities`: {} - list of [Desired Capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities)
 *
 * Example:
 *
 * ```json
 * {
 *    "helpers": {
 *      "SeleniumWebdriver" : {
 *        "url": "http://localhost",
 *        "browser": "chrome",
 *        "smartWait": 5000,
 *        "restart": false
 *      }
 *    }
 * }
 * ```
 *
 * ## Access From Helpers
 *
 * Receive a WebDriverIO client from a custom helper by accessing `browser` property:
 *
 * ```js
 * this.helpers['SeleniumWebdriver'].browser
 * ```
 *
 */
class SeleniumWebdriver extends Helper {
  constructor(config) {
    console.log('SeleniumWebdriver helper is now alias to Protractor');
    console.log('Please replace in your config: SeleniumWebdriver -> Protractor');
    super(config);
  }
}

module.exports = SeleniumWebdriver;
