# Mobile Testing

CodeceptJS allows to test mobile and hybrid apps in a similar manner web applications are tested.
Such tests are executed using [Appium](http://appium.io) on emulated or physical devices.

What makes CodeceptJS better for mobile testing?
Take a look. Here is the sample test for a native mobile application written in CodeceptJS:

```js
I.seeAppIsInstalled("io.super.app");
I.click('~startUserRegistrationCD');
I.fillField('~email of the customer', 'Nothing special'));
I.see('davert@codecept.io', '~email of the customer'));
I.clearField('~email of the customer'));
I.dontSee('Nothing special', '~email of the customer'));
I.seeElement({
  android: 'android.widget.Button',
  ios: '//UIAApplication[1]/UIAWindow[1]/UIAButton[1]'
});
```
This test is easy to read and write. Also it will work both on iOS and Android devices.
Doesn't it sound cool?

## Setting Up

Ensure that you have [CodeceptJS installed](http://codecept.io/installation/).
You will also need to install [Appium](http://appium.io/). This can be done via npm:

```
npm i -g appium
```

Then you need to prepare application for execution.
It should be packed into apk (for Android) or .ipa (for iOS) or zip.

Next, is to launch the emulator or connect physical device.
Once they are prepared launch appium:

```
appium
```

To run mobile test you need either an device emulator (available with Android SDK or iOS), real device connected, or use cloud service (like [SauceLabs](https://saucelabs.com)) for mobile testing. Alternatively, you may execute Appium with device emulator inside Docker container.

## Configuring

CodeceptJS should be installed. Initialize it with `init` command:

```
codeceptjs init
```

Select [Appium helper](http://codecept.io/helpers/Appium/) when asked.
```
? What helpers do you want to use?
 ◯ WebDriverIO
 ◯ Protractor
 ◯ SeleniumWebdriver
 ◯ Nightmare
❯◉ Appium
 ◯ REST
```
You will also be asked for the platform and the application package.

```
? [Appium] Application package. Path to file or url
```

Check the newly created `codecept.json` configuration file.
You may want to set some additional Appium settings via [desiredCapabilities](https://appium.io/slate/en/master/?javascript#appium-server-capabilities)


```js
"helpers": {
  "Appium": {
    "app": "my_app.apk",
    "platform": "Android",
    "desiredCapabilities: {}
  }
}
```

Once you configured Appium, create the first test by running

```
codeceptjs gt
```

## Writing a Test

A test is written in a scenario-driven manner, listing an actions taken by a user.
This is the sample test for a native mobile application:

```js
Scenario('test registration', (I) => {
  I.click('~startUserRegistrationCD');
  I.fillField('~inputUsername', 'davert');
  I.fillField('~inputEmail', 'davert@codecept.io');
  I.fillField('~inputPassword', '123456');
  I.hideDeviceKeyboard();
  I.click('~input_preferedProgrammingLanguage');
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

and [others](http://codecept.io/helpers/Appium/).

## Locating Elements

To start writing a test it is important to understand how to locate elements for native mobile applications.
In both Android and iPhone elements are defined in XML format and can be searched by XPath locators.

```js
I.seeElement('//android.widget.ScrollView/android.widget.LinearLayout')'
```

CSS locators are not supported in native mobile apps, you need to switch to web context to use them.

Elements can also be located by their accessability id, available both at Android and iOS.
Accessibility id is recommended to use for locating element, as it rarely changed.

* iOS uses [UIAccessibilityIdentification](https://developer.apple.com/documentation/uikit/uiaccessibilityidentification)
* Android `accessibility id` matches the content-description

Add `~` prefix to search for element by its accessibility id:

```js
I.seeElement('~startUserRegistrationButton');
```

Elements can also have ids, which can be located with `#` prefix.
On Android it it is important to keep full package name in id locator:

```js
I.seeElement('#io.selendroid.testapp:id/inputUsername');
```

Elements can also be located by their class name. (For iOS they should start with `UIA`)

```js
I.fillField({ios: 'UIATextField', android: 'android.widget.EditText'}, '123456');
```

Buttons can be matched by their visible text:

```js
I.click('Click me!');
```

Native iOS/Android locators can be used with `android=` and `ios=` prefixes. [Learn more](http://webdriver.io/guide/usage/selectors.html#Mobile-Selectors).

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
let contexts = yield I.grabAllContexts();
```

## Cross-Platform Testing

It is often happen that mobile applications behave similarly on different platforms. Can we build on test for them? Yes!
CodeceptJS provides a way to specify different locators for Android and iOS platforms:

```js
I.click({android: 'android.widget.Button', ios: '//UIAApplication[1]/UIAWindow[1]/UIAButton[1]'});
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

### done()