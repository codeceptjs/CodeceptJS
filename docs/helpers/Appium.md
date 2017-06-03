# Appium

Appium helper extends [WebriverIO](http://codecept.io/helpers/WebDriverIO/) helper.
It supports all browser methods and also includes special methods for mobile apps testing.
You can use this helper to test Web on desktop and mobile devices and mobile apps.

#### Appium Installation

Appium is an open source test automation framework for use with native, hybrid and mobile web apps that implements the WebDriver protocol.
It allows you to run Selenium tests on mobile devices and also test native, hybrid and mobile web apps.

Download and install [Appium](http://appium.io/)

    npm install -g appium

Launch the daemon: `appium`

### Configuration

This helper should be configured in codecept.conf.js

#### Appium configuration

-   `port`: Appium serverport
-   `restart`: restart browser or app between tests (default: true), if set to false cookies will be cleaned but browser window will be kept and for apps nothing will be changed.
-   `desiredCapabilities`: Appium capabilities
    --   `platformName` - Which mobile OS platform to use
    --   `appPackage` - Java package of the Android app you want to run
    --   `appActivity` - Activity name for the Android activity you want to launch from your package.
    --   `deviceName`: The kind of mobile device or emulator to use
    --   `platformVersion`: Mobile OS version
    --   `app` - The absolute local path or remote http URL to an .ipa or .apk file, or a .zip containing one of these. Appium will attempt to install this app binary on the appropriate device first.
    --   `browserName`: Name of mobile web browser to automate. Should be an empty string if automating an app instead.

Example:

```js
{
helpers: {
WebDriverIO: {
desiredCapabilities: {
platformName: "Android",
appPackage: "com.example.android.myApp",
appActivity: "MainActivity",
deviceName: "OnePlus3",
platformVersion: "6.0.1"
},
port: 4723,
restart: false
}
}
}
```

Additional configuration params can be used from <https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/caps.md>

## Access From Helpers

Receive a Appium client from a custom helper by accessing `browser` property:

```js
let browser = this.helpers['Appium'].browser
```

**Parameters**

-   `config`  

## closeApp

Close the given application.

```js
I.closeApp();
```

Appium: support only iOS

## constructor

Appium Special Methods for Mobile only

**Parameters**

-   `config`  

## grabAllContexts

Get list of all available contexts

    let contexts = yield I.grabAllContexts();

Appium: support Android and iOS

## grabContext

Retrieve current context

```js
let context = yield I.grabContext();
```

Appium: support Android and iOS

## grabCurrentActivity

Get current device activity.

```js
let activity = yield I.grabCurrentActivity();
```

Appium: support only Android

## grabNetworkConnection

Get information about the current network connection (Data/WIFI/Airplane).
The actual server value will be a number. However WebdriverIO additional
properties to the response object to allow easier assertions.

```js
let con = yield I.grabNetworkConnection();
```

Appium: support only Android

## grabOrientation

Get current orientation.

```js
let orientation = yield I.grabOrientation();
```

Appium: support Android and iOS

## grabSettings

Get all the currently specified settings.

```js
let settings = yield I.grabSettings();
```

Appium: support Android and iOS

## hideDeviceKeyboard

Hide the keyboard.

```js
// taps outside to hide keyboard per default
I.hideDeviceKeyboard();
I.hideDeviceKeyboard('tapOutside');

// or by pressing key
I.hideDeviceKeyboard('pressKey', 'Done');
```

**Parameters**

-   `strategy`  desired strategy to close keyboard (‘tapOutside’ or ‘pressKey’)Appium: support Android and iOS
-   `key`  

## installApp

Install an app on device.

```js
I.installApp('/path/to/file.apk');
```

**Parameters**

-   `path`  path to apk fileAppium: support only Android

## makeTouchAction

The Touch Action API provides the basis of all gestures that can be
automated in Appium. At its core is the ability to chain together ad hoc
individual actions, which will then be applied to an element in the
application on the device.
[See complete documentation](http://webdriver.io/api/mobile/touchAction.html)

```js
I.makeTouchAction("~buttonStartWebviewCD", 'tap');
```

Appium: support Android and iOS

**Parameters**

-   `locator`  
-   `action`  

## openNotifications

Open the notifications panel on the device.

```js
I.openNotifications();
```

Appium: support only Android

## pullFile

Pulls a file from the device.

```js
I.pullFile('/storage/emulated/0/DCIM/logo.png', 'my/path');
// save file to output dir
I.pullFile('/storage/emulated/0/DCIM/logo.png', output_dir);
```

Appium: support Android and iOS

**Parameters**

-   `path`  
-   `dest`  

## removeApp

Remove an app from the device.

```js
I.removeApp('com.example.android.apis');
```

**Parameters**

-   `bundleId`  String	ID of bundled appAppium: support only Android

## rotate

Perform a rotation gesture centered on the specified element.

```js
I.rotate(120, 120)
```

See corresponding [webdriverio reference](http://webdriver.io/api/mobile/rotate.html).

Appium: support only iOS

**Parameters**

-   `x`  
-   `y`  
-   `duration`  
-   `radius`  
-   `rotation`  
-   `touchCount`  

## seeAppIsInstalled

Check if an app is installed.

```js
I.seeAppIsInstalled("com.example.android.apis");
```

**Parameters**

-   `bundleId`  String	ID of bundled appAppium: support only Android

## seeAppIsNotInstalled

Check if an app is not installed.

```js
I.seeAppIsNotInstalled("com.example.android.apis");
```

**Parameters**

-   `bundleId`  String	ID of bundled appAppium: support only Android

## seeCurrentActivityIs

Check current activity on an Android device.

```js
I.seeCurrentActivityIs(".HomeScreenActivity")
```

Appium: support only Android

**Parameters**

-   `currentActivity`  

## seeDeviceIsLocked

Check whether the device is locked.

```js
I.seeDeviceIsLocked();
```

Appium: support only Android

## seeDeviceIsUnlocked

Check whether the device is not locked.

```js
I.seeDeviceIsUnlocked();
```

Appium: support only Android

## seeOrientationIs

Check the device orientation

```js
I.seeOrientationIs('PORTRAIT');
I.seeOrientationIs('LANDSCAPE')
```

**Parameters**

-   `orientation`  LANDSCAPE or PORTRAITAppium: support Android and iOS

## sendDeviceKeyEvent

Send a key event to the device.
List of keys: <https://developer.android.com/reference/android/view/KeyEvent.html>

```js
I.sendDeviceKeyEvent(3);
```

**Parameters**

-   `keyValue`  Device specifc key valueAppium: support only Android

## setImmediateValue

Set immediate value in app.

See corresponding [webdriverio reference](http://webdriver.io/api/mobile/setImmediateValue.html).

Appium: support only iOS

**Parameters**

-   `id`  
-   `value`  

## setNetworkConnection

Set network connection mode.

-   airplane mode
-   wifi mode
-   data data

```js
I.setNetworkConnection(0) // airplane mode off, wifi off, data off
I.setNetworkConnection(1) // airplane mode on, wifi off, data off
I.setNetworkConnection(2) // airplane mode off, wifi on, data off
I.setNetworkConnection(4) // airplane mode off, wifi off, data on
I.setNetworkConnection(6) // airplane mode off, wifi on, data on
```

See corresponding [webdriverio reference](http://webdriver.io/api/mobile/setNetworkConnection.html).

Appium: support only Android

**Parameters**

-   `value`  

## setOrientation

Set a device orientation. Will fail, if app will not set orientation

```js
I.setOrientation('PORTRAIT');
I.setOrientation('LANDSCAPE')
```

**Parameters**

-   `orientation`  LANDSCAPE or PORTRAITAppium: support Android and iOS

## setSettings

Update the current setting on the device

```js
I.setSettings({cyberdelia: 'open'});
```

**Parameters**

-   `settings`  objectAppium: support Android and iOS

## shakeDevice

Perform a shake action on the device.

```js
I.shakeDevice();
```

Appium: support only iOS

## simulateTouchId

Simulate Touch ID with either valid (match == true) or invalid (match == false) fingerprint.

```js
I.touchId(); // simulates valid fingerprint
I.touchId(true); // simulates valid fingerprint
I.touchId(false); // simulates invalid fingerprint
```

Appium: support only iOS
TODO: not tested

**Parameters**

-   `match`  

## startActivity

Start an arbitrary Android activity during a session.

```js
I.startActivity('io.selendroid.testapp', '.RegisterUserActivity');
```

Appium: support only Android

**Parameters**

-   `appPackage`  
-   `appActivity`  

## swipe

Perform a swipe on the screen or an element.

```js
let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
I.swipe(locator, 800, 1200, 1000);
```

[See complete reference](http://webdriver.io/api/mobile/swipe.html)

**Parameters**

-   `locator`  
-   `xoffset`  
-   `yoffset`  
-   `speed`  Appium: support Android and iOS

## swipeDown

Perform a swipe down on an element.

```js
let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
I.swipeDown(locator, 1200, 1000);
```

**Parameters**

-   `locator`  
-   `yoffset`  (optional)
-   `yOffset`  
-   `speed`  Appium: support Android and iOS

## swipeLeft

Perform a swipe left on an element.

```js
let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
I.swipeLeft(locator, 800, 1000);
```

**Parameters**

-   `locator`  
-   `xoffset`  (optional)
-   `speed`  Appium: support Android and iOS

## swipeRight

Perform a swipe left on an element.

```js
let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
I.swipeRight(locator, 800, 1000);
```

**Parameters**

-   `locator`  
-   `xoffset`  (optional)
-   `speed`  Appium: support Android and iOS

## swipeTo

Perform a swipe in selected direction on an element to searchable element.

```js
I.swipeTo(
 "android.widget.CheckBox", // searchable element
 "//android.widget.ScrollView/android.widget.LinearLayout", // scroll element
  "up", // direction
   30,
   100,
   500);
```

**Parameters**

-   `searchableLocator`  
-   `scrollLocator`  
-   `direction`  
-   `timeout`  
-   `offset`  
-   `speed`  Appium: support Android and iOS

## swipeUp

Perform a swipe down on an element.

```js
let locator = "//android.widget.LinearLayout[@resource-id = 'io.selendroid.testapp:id/LinearLayout1']";
I.swipeUp(locator, 1200, 1000);
```

**Parameters**

-   `locator`  
-   `yoffset`  (optional)
-   `yOffset`  
-   `speed`  Appium: support Android and iOS

## switchToContext

Switch to the specified context.

```js
I.switchToContext('WEBVIEW_io.selendroid.testapp');
```

**Parameters**

-   `context`  the context to switch toAppium: support only Android

## touchPerform

Performs a specific touch action.
The action object need to contain the action name, x/y coordinates

```js
I.touchPerform([{
    action: 'press',
    options: {
      x: 100,
      y: 200
    }
}, {action: 'release'}])

I.touchPerform([{
   action: 'tap',
   options: {
       element: '1', // json web element was queried before
       x: 10,   // x offset
       y: 20,   // y offset
       count: 1 // number of touches
   }
}]);
```

Appium: support Android and iOS

**Parameters**

-   `actions`  
