# Mobile Testing

CodeceptJS allows to test mobile and hybrid apps in a similar manner web applications are tested.
Such tests are executed using [Appium](http://appium.io) on emulated or physical devices.

Here is the sample test for a native mobile application written in CodeceptJS using Appium helper:

```js
I.seeAppIsInstalled("io.super.app")
I.click('~startUserRegistrationCD')
I.fillField('~email of the customer', 'Nothing special'))
I.see('Nothing special', '~email of the customer'))
I.clearField('~email of the customer'))
I.dontSee('Nothing special', '~email of the customer'));
I.seeElement({
  android: 'android.widget.Button',
  ios: '//UIAApplication[1]/UIAWindow[1]/UIAButton[1]'}
);
```

## Setting Up

To start you need to have Appium installed. This can be done via npm

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

## Configuring

CodeceptJS should be installed. Initialize it with `init` command:

```
codeceptjs init
```

Select `Appium` helper when asked.
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

Once `codecept.json` configuration file is created you can edit its settings and
include additional testing options in [desiredCapabilities](https://appium.io/slate/en/master/?javascript#appium-server-capabilities)

## Android Testing



```js
I.click({android: 'android.widget.Button', ios: '//UIAApplication[1]/UIAWindow[1]/UIAButton[1]'});

I.runOnAndroid({ deviceType: 'tablet' }, () => )
I.runOnIOS(() => )
```

### Locating Elements



## iOS Testing


## Hybrid Apps

```js

within() {

}
```

```js
I.seeAppIsInstalled("io.super.app")
I.click('~startUserRegistrationCD')
I.fillField('~email of the customer', 'Nothing special'))
I.see('Nothing special', '~email of the customer'))
I.clearField('~email of the customer'))
I.dontSee('Nothing special', '~email of the customer'));
```

## Cross-Platform Testing

