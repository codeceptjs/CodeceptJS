---
id: detox
title: Testing React Native with Detox
---

> Warning! Detox support in CodeceptJS is experimental. Please try it and help us to test it and improve it. [See Detox helper repository](https://github.com/Codeception/detox-helper).

Automated mobile testing can be slow, hard, and ineffective. The price of it goes high, if we take into account fragility of applications, slowness of emulators, and the complexity of debug. [Appium](https://codecept.io/mobile) helps writing mobile tests but not all apps can be tested effectively with it. That's why you should consider using an alternative approach.

Meet [Detox](https://github.com/wix/Detox) - grey-box testing solution for mobile testing by Wix.

Unlike, Appium, Detox requires to update mobile application to include test instrumentation, so an application could receive commands from a test, and act accordingly. Let's see pros and cons of such approach:


**Pros**:

* faster tests
* synchronization with application
* plays nicely with React Native

**Cons**:

* application should be built in a special way
* no hybrid applications
* native Android apps not supported (except React Native)
* no cloud testing with SauceLabs or BrowserStack

CodeceptJS allows you to try different options and choose the one which works best for you. Both Appium and Detox helpers share the same syntax for testing mobile applications, interactive pause, automatic retries, and other useful features.

CodeceptJS provides next features over standard Detox:

* **Unified API**. The same test can be executed in Appium or Detox. Unified API helps different teams to use the same syntax and easy port tests from one engine to another.
* [Interactive pause](https://codecept.io/basics#pause). When starting/stopping an application takes a long time, debugging and writing tests can be hard. CodeceptJS solves this by pausing an execution and letting you try different commands and locators. With this feature a test can be writtern during one running session.
* [Auto-retries](https://codecept.io/basics#retries) using `retryFailedStepPlugin` and `I.retry()`
* **Cross-Platform testing** - one test can be executed on different engines. When needed, platform-specific actions and locators can be easily applied.

## A Test

Compare a test written for Detox using its native syntax:

```js
await expect(element(by.text('Welcome'))).toBeVisible();
await expect(element(by.id('createdAndVisibleText'))).toNotExist();
await element(by.id('GoButton')).tap();
await waitFor(element(by.id('createdAndVisibleText'))).toExist().withTimeout(20000);
await expect(element(by.id('createdAndVisibleText'))).toExist();
```

with the same test written using CodeceptJS syntax:

```js
I.see('Welcome');
I.dontSeeElement('#createdAndVisibleText');
I.click('#GoButton');
I.waitForElement('#createdAndVisibleText', 20);
I.seeElement('#createdAndVisibleText');
```

As you see, CodeceptJS test is shorter and easier to follow. By simplifying the code and reducing visual noise we make tests easier to follow. But before writing a test we need to prepare an application to be testable with Detox.

## Setup

It is important to follow [Detox guide](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md) to build an application with Detox test instrouments included.

After you install Detox, create configuration and build an application using `detox build` command, you are ready to integrate Detox with CodeceptJS.

You need to install Detox CodeceptJS helper:

```
npm i @codeceptjs/detox-helper --save-dev
```

Then enable this helper in `codecept.conf.js`:

```js
helpers: {
   Detox: {
     require: '@codeceptjs/detox-helper',
     configuration: '<detox app configuration name>',
     reloadReactNative: true,
   }
}
```

Enable `reloadReactNative: true` if you test React Native application.

## Actions

Create test as usual, by running command:

```
npx codeceptjs gt
```

A test starts when emulator starts and loads an application. So you can begin testing an application.

```js
// inside a created test
Scenario('test React Native app', (I) => {
  I.see('Welcome');
  I.tap('Start');
  I.see('Started!');
});
```

The most common actions are:

* `tap` (or `click`)
* `multiTap` - perform multiple taps on element
* `longPress` - longer press
* `fillField` - fill in value of text field
* `clearField` - clear value in text field
* `appendField` - append value in a field
* `swipeUp`, `swipeDown`, `swipeLeft`, `swipeRigth`

There are also common assertions:

* `see` - to check visibility of text
* `seeElement` - to check visibility of element
* `seeElementExists` - to check that element exists

> For more details on actions refer to the [API reference of Detox helper](https://github.com/Codeception/detox-helper#api).

## Locators

To write a test you need to learn about available locators in Detox.
Unlike, Appium there are no XPath locators. Possible locators limited to `text`, `id`, `accessibility id`, and element `type`. Thus, again, an application should be prepared for testing, to ensure that all active elements are accessible.

Let's see how they can be used:

* For **ID locators** use `#` prefix (same as in CSS). Example:

```js
I.seeElement('#WelcomeScreen')
```
* For **accessibility ID** use `~` prefix (as in Appium helper). Example:

```js
I.seeElement('~welcome')
```

* Locating elements **by text** requires no prefix, but can be applied only for actions accepting semantic locators.

```js
I.tap('Start')
I.fillField('Username', 'davert')
I.clearField('Username')
I.see('Welcome, davert')
```

* Locating elements **by type** also use no prefix but can be used only where for elements.

```js
I.seeElement('Button')
```

Text locators can be combined with others, as methods `tap`, `click` and `see` can receive a second paramater, which defines a context where to perfrom a search.

```js
// tap "Start" inside "#Layout"
I.tap('Start', '#Layout');
// see text "Welcome" inside "~msg"
I.see('Welcome', '~msg');
```

Alternatively, you can use specify locator by using *strict locator*, passing an object as a locator:

```js
I.click({ type: 'Button' });
I.seeElement({ label: 'welcome' });
```

> If you are familiar with Detox API, this is how locators are actually translated: `{label: 'welcome'}` => `by.label('welcome')`.

### Cross Platform Testing

If element differs on on iOS and Android you can use **cross platform locators**.

```js
// locate element by text on Android
// locate element by accessibility id on iOS
I.click({ android: 'Start', ios: '~start' });
```

When application behavior differs on Android and iOS use platform-specific actions:

```js
I.runOnIOS(() => {
  // this will be executed only on IOS
  I.see('Hello iOS');
});
I.runOnAndroid(() => {
  // this will be executed only on Android
  I.see('Hello Android');
});
```

### Sample Test

Finally, you can get a test looking like this

```js
Feature('My Detox App');

Scenario('save in application', (I) => {
  I.setLandscapeOrientation();
  I.fillField('#text', 'a new text');
  I.see('a new text', '#textValue');
  I.dontSeeElement('#createdAndVisibleText');
  I.click({ ios: '#GoButton', android: 'Button' });
  I.waitForElement('#createdAndVisibleText', 20);
  I.seeElement('#createdAndVisibleText');
  I.runOnAndroid(() => {
    I.click('Save');
    I.see('Text Saved', '#message');
  });
  I.runOnIOS(() => {
    I.click('SAVE');
    I.see('SAVED!');
  });
});
```

To execute it use `codeceptjs run` command

```
npx codeceptjs run
```
If you want to use detox configuration other than is set in `codecept.conf.js` use `--configuration` argument:

```
npx codeceptjs run --configuration android.test.ci
```

You can also pass all [other arguments that Detox CLI supports](https://github.com/wix/Detox/blob/master/docs/APIRef.DetoxCLI.md#test).