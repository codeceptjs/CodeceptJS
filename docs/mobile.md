---
permalink: /mobile
title: Mobile Testing with Appium
---

# Mobile Testing with Appium

CodeceptJS allows to test mobile and hybrid apps in a similar manner web applications are tested.
Such tests are executed using [Appium](https://appium.io) on emulated or physical devices. Also, Appium allows to test web application on mobile devices.

What makes CodeceptJS better for mobile testing?
Take a look. Here is the sample test for a native mobile application written in CodeceptJS:

```js
I.seeAppIsInstalled("io.super.app");
I.click('~startUserRegistrationCD');
I.fillField('~email of the customer', 'Nothing special');
I.see('davert@codecept.io', '~email of the customer');
I.clearField('~email of the customer');
I.dontSee('Nothing special', '~email of the customer');
I.seeElement({
  android: 'android.widget.Button',
  ios: '//UIAApplication[1]/UIAWindow[1]/UIAButton[1]'
});
```

This test is easy to read and write. Also it will work both on iOS and Android devices.
Doesn't it sound cool?

## Setting Up

Ensure that you have [CodeceptJS installed](https://codecept.io/installation/).
You will also need to install [Appium](https://appium.io/).
We suggest to use [appium-doctor](https://www.npmjs.com/package/appium-doctor) to check if your system is ready for mobile testing.

```sh
npm i -g appium-doctor
```

If everything is OK, continue with installing Appium. If not, consider using cloud based alternatives like [SauceLabs](https://saucelabs.com) or [BrowserStack](https://browserstack.com). Cloud services provide hosted appium with real and emulated mobile devices.

To install Appium use npm:

```sh
npm i -g appium
```

To use Appium 2.x:
```sh
npm i -g appium@next
```
Appium 2x (still beta) reenvisions Appium as a platform where “drivers” and “plugins” can be easily created and shared independently.
Install an Appium driver and its dependencies
To install the Appium driver and its dependencies, we'll be using the uiautomator2 (Android), XCUITest (iOS) drivers.

```
appium driver install xcuitest
appium driver install uiautomator2
```
To make sure that all the drivers are installed successfully, run the following command:

```
appium driver list

tth~$appium driver list            
✔ Listing available drivers
- espresso@2.17.0 [installed (NPM)]
- uiautomator2@2.12.6 [installed (NPM)]
- xcuitest@4.19.1 [installed (NPM)]
- mac2 [not installed]
- safari [not installed]
- gecko [not installed]
- chromium [not installed]
```

Then you need to prepare application for execution.
It should be packed into apk (for Android) or .ipa (for iOS) or zip.

Next, is to launch the emulator or connect a physical device.
Once they are prepared, launch Appium:

```sh
appium
```

To use Appium 2.x:
```sh
tth~$npx appium --base-path=/wd/hub
[Appium] Welcome to Appium v2.0.0-beta.57 (REV 3e675c32ae71dc0b00749d5d29213e2ea5b53c5b)
[Appium] Non-default server args:
[Appium] {
[Appium]   basePath: '/wd/hub'
[Appium] }
[Appium] Attempting to load driver espresso...
[debug] [Appium] Requiring driver at /Users/trung-thanh/Desktop/thanh-nguyen/task2/node_modules/appium-espresso-driver
[Appium] Attempting to load driver uiautomator2...
[debug] [Appium] Requiring driver at /Users/trung-thanh/Desktop/thanh-nguyen/task2/node_modules/appium-uiautomator2-driver
[Appium] Appium REST http interface listener started on 0.0.0.0:4723
[Appium] Available drivers:
[Appium]   - espresso@2.17.0 (automationName 'Espresso')
[Appium]   - uiautomator2@2.12.6 (automationName 'UiAutomator2')
[Appium] No plugins have been installed. Use the "appium plugin" command to install the one(s) you want to use.
```

To run mobile test you need either an device emulator (available with Android SDK or iOS), real device connected for mobile testing. Alternatively, you may execute Appium with device emulator inside Docker container.

CodeceptJS should be installed with webdriverio support:

```bash
npm install codeceptjs webdriverio@8.6.3 --save
```

## Configuring

Initialize CodeceptJS with `init` command:

```sh
npx codeceptjs init
```

Select [Appium helper](https://codecept.io/helpers/Appium/) when asked.

```sh
? What helpers do you want to use?
 ◯ WebDriver
 ◯ Protractor
 ◯ Puppeteer
 ◯ Nightmare
❯◉ Appium
 ◯ REST
```

You will also be asked for the platform and the application package.

```sh
? [Appium] Application package. Path to file or url
```

Check the newly created `codecept.conf.js` configuration file.
You may want to set some additional Appium settings via [desiredCapabilities](https://appium.io/docs/en/writing-running-appium/caps/)

```js
helpers: {
  Appium: {
    app: "my_app.apk",
    platform: "Android",
    desiredCapabilities: {}
  }
}
```

Once you configured Appium, create the first test by running

```sh
npx codeceptjs gt
```

## BrowserStack Configuration

If you wish to use BrowserStack's [Automated Mobile App Testing](https://www.browserstack.com/app-automate) platform. Configure the Appium helper like this:

```js
helpers: {
  Appium: {
    app: "bs://<hashed app-id>",
    host: "hub-cloud.browserstack.com",
    port: 4444,
    platform: "ios",
    user: "BROWSERSTACK_USER",
    key: "BROWSERSTACK_KEY",
    device: "iPhone 7"
  }
}
```
Here is the full list of [capabilities](https://www.browserstack.com/app-automate/capabilities).

You need to upload your Android app (.apk) or iOS app (.ipa) to the BrowserStack servers using the REST API before running your tests. The App URL (`bs://hashed appid`) is returned in the response of this call.

```sh
curl -u "USERNAME:ACCESS_KEY" \
-X POST "https://api-cloud.browserstack.com/app-automate/upload" \
-F "file=@/path/to/app/file/Application-debug.apk"
```

## Writing a Test

A test is written in a scenario-driven manner, listing an actions taken by a user.
This is the sample test for a native mobile application:

```js
Scenario('test registration', ({ I }) => {
  I.click('~startUserRegistrationCD');
  I.fillField('~inputUsername', 'davert');
  I.fillField('~inputEmail', 'davert@codecept.io');
  I.fillField('~inputPassword', '123456');
  I.hideDeviceKeyboard();
  I.click('~input_preferredProgrammingLanguage');
  I.click('Javascript');
  I.checkOption('#io.demo.testapp:id/input_adds');
  I.click('Register User (verify)');
  I.swipeUp("#io.selendroid.testapp:id/LinearLayout1");
  I.see('Javascript'); // see on the screen
  I.see('davert', '~label_username_data'); // see in element
});
```

Mobile test is pretty similar to a web test. And it is much the same, if you test hybrid app with a web view context inside.
However, mobile apps do not have URLs, Cookies, they have other features which may vary on a running platform.

There are mobile-only methods like:

* `swipeUp`, `swipeLeft`, ...
* `hideDeviceKeyboard`,
* `seeAppIsInstalled`, `installApp`, `removeApp`, `seeAppIsNotInstalled` - Android only

and [others](https://codecept.io/helpers/Appium/).

## Locating Elements

To start writing a test it is important to understand how to locate elements for native mobile applications.
In both Android and iPhone elements are defined in XML format and can be searched by XPath locators.

```js
I.seeElement('//android.widget.ScrollView/android.widget.LinearLayout')'
```

> Despite showing XPath in this guide we **do not recommend using XPath for testing iOS native apps. XPath runs very slow on iOS. Consider using ID or Accessibility ID locators instead.

CSS locators are not supported in native mobile apps, you need to switch to web context to use them.

Elements can also be located by their accessability id, available both at Android and iOS.
Accessibility id is recommended to use for locating element, as it rarely changed.

* iOS uses [UIAccessibilityIdentification](https://developer.apple.com/documentation/uikit/uiaccessibilityidentification)
* Android `accessibility id` matches the content-description
* Web view uses `[aria-label]` attribute as accessibility id
* For [React Native for Android see our special guide](mobile-react-native-locators.md).

> If you test React Native application, consider using [Detox helper](/detox) for faster tests.

Add `~` prefix to search for element by its accessibility id:

```js
I.seeElement('~startUserRegistrationButton');
```

Elements can also have ids, which can be located with `#` prefix.
On Android it it is important to keep full package name in id locator:

```js
I.seeElement('#io.selendroid.testapp:id/inputUsername');
```

Buttons can be matched by their visible text:

```js
I.tap('Click me!');
I.click('Click me!');
```

Native iOS/Android locators can be used with `android=` and `ios=` prefixes. [Learn more](https://webdriver.io/guide/usage/selectors.html#Mobile-Selectors).

But how to get all those locators? We recommend to use [Appium Inspector](https://github.com/appium/appium-desktop).

For Android you can use **UI Automator Viewer** bundled with Android SDK:

![](https://user-images.githubusercontent.com/220264/27566310-1f631604-5aed-11e7-8b92-1ffe9e9f14f9.png)

## Hybrid Apps and Contexts

Mobile applications may have different contexts. For instance, there can be native view and web view with a browser instance in it.

To execute commands in context of a webview use `within('webview')` function:

```js
I.click('~startWebView');
within('webview', () => {
  I.see('Preferred car');
  I.click('Send me your name!');
});
```

It will locate first available webview, switch to it, and switch back to native application after.
Inside WebView all browser features are enabled: CSS locators, JavaScript, etc.

To set a specific context use `{ web: 'webview.context' }` instead:

```js
within({webview: 'MyWEBVIEW_com.my.app'}, () => );
```

Alternatively use `switchToWeb` or `switchToNative` methods to switch between contexts.

```js
I.click('~startWebView');
I.switchToWeb();
I.see('Preferred car');
I.click('Send me your name!');
I.switchToNative();
```

To get a list of all contexts use `grabAllContexts` method:

```js
let contexts = await I.grabAllContexts();
```

## Cross-Platform Testing

It is often happen that mobile applications behave similarly on different platforms. Can we build one test for them? Yes!
CodeceptJS provides a way to specify different locators for Android and iOS platforms:

```js
I.click({android: '//android.widget.Button', ios: '//UIAApplication[1]/UIAWindow[1]/UIAButton[1]'});
```

In case some code should be executed on one platform and ignored on others use `runOnAndroid` and `runOnIOS` methods:

```js
I.runOnAndroid(() => {
  I.click('Hello Android');
});
I.runOnIOS(() => {
  I.click('Hello iOS');
});
```

The same code can be shared for web applications as well. To execute some code in web browser only, use `I.runInWeb`:

```js
I.runInWeb(() => {
  I.amOnPage('/login'); // not available for mobile
  I.fillField('name', 'jon');
  I.fillField('password', '123456');
  I.click('Login');
  I.waitForElement('#success'); // no available for mobile
});
```

Just as you can specify android, and ios-specific locators, you can do so for web:

```js
I.click({web: '#login', ios: '//UIAApplication[1]/UIAWindow[1]/UIAButton[1]'});
```
