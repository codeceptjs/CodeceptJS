# Appium

Appium helper is extends from WebriverIO. It's support all browser methods and also includes special methods for mobile apps testing. You can use this helper to test Web on desktop and mobile devices and mobile apps.

#### Appium Installation

Appium is an open source test automation framework for use with native, hybrid and mobile web apps that implements the WebDriver protocol.
It allows you to run Selenium tests on mobile devices and also test native, hybrid and mobile web apps.

1.  Download and install [Appium](http://appium.io/)
2.  Launch the daemon: `appium`
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
    this.helpers['Appium'].browser
    ```

**Parameters**

-   `config`  

## closeApp

Close the given application.
Appium: support only iOS

## constructor

Appium Special Methods for Mobile only

**Parameters**

-   `config`  

## dontSeeDeviceIsLocked

Check whether the device is not locked.
Appium: support only Android

## grabAllContexts

Get list of all available contexts
Appium: support Android and iOS

## grabContext

Retrieve current context
Appium: support Android and iOS

## grabCurrentActivity

Get current device activity.
Appium: support only Android

## grabNetworkConnection

Get informations about the current network connection (Data/WIFI/Airplane).
The actual server value will be a number. However WebdriverIO additional
properties to the response object to allow easier assertions.
Appium: support only Android

## grabOrientation

Get current orientation.
Appium: support Android and iOS

## grabSettings

Get all the currently specified settings
Appium: support Android and iOS

## hideDeviceKeyboard

Hide the keyboard.
Appium: support Android and iOS

**Parameters**

-   `strategy`  
-   `key`  

## installApp

Install an app on device.
Appium: support only Android

**Parameters**

-   `path`  

## makeShake

Perform a shake action on the device.
Appium: support only iOS

## makeTouchAction

The Touch Action API provides the basis of all gestures that can be
automated in Appium. At its core is the ability to chain together ad hoc
individual actions, which will then be applied to an element in the
application on the device.
Full documentation <http://webdriver.io/api/mobile/touchAction.html>
Appium: support Android and iOS

**Parameters**

-   `locator`  
-   `action`  

## openNotifications

Open the notifications panel on the device.
Appium: support only Android

## pullFile

Pulls a file from the device.
Appium: support Android and iOS

**Parameters**

-   `path`  
-   `dest`  

## removeApp

Remove an app from the device.
Appium: support only Android

**Parameters**

-   `bundleId`  

## rotate

Perform a rotation gesture centered on the specified element.
Appium: support only iOS
TODO: not tested

**Parameters**

-   `x`  
-   `y`  
-   `duration`  
-   `radius`  
-   `rotation`  
-   `touchCount`  

## seeAppIsInstalled

Check if an app is installed.
Appium: support only Android

**Parameters**

-   `bundleId`  

## seeAppIsNotInstalled

Check if an app is not installed.
Appium: support only Android

**Parameters**

-   `bundleId`  

## seeCurrentActivityIs

check current activity on an Android device.
Appium: support only Android

**Parameters**

-   `currentActivity`  

## seeDeviceIsLocked

Check whether the device is locked.
Appium: support only Android

## seeOrientationIs

Check the device orientation
Appium: support Android and iOS

**Parameters**

-   `orientation`  

## sendDeviceKeyEvent

send a key event to the device
Appium: support only Android
list of keys: <https://developer.android.com/reference/android/view/KeyEvent.html>

**Parameters**

-   `keyValue`  

## setImmediateValue

Set immediate value in app.
Appium: support only iOS
TODO: not tested

**Parameters**

-   `id`  
-   `value`  

## setNetworkConnection

Set network connection.
Appium: support only Android

**Parameters**

-   `value`  

## setOrientation

Set a device orientation. Will fail, if app will not set orientation
Appium: support Android and iOS

**Parameters**

-   `orientation`  

## setSettings

Update the current setting on the device
Appium: support Android and iOS

**Parameters**

-   `settings`  

## simulateTouchId

Simulate Touch ID with either valid (match == true) or invalid (match == false) fingerprint.
Appium: support only iOS
TODO: not tested

**Parameters**

-   `match`  

## startActivity

Start an arbitrary Android activity during a session.
Appium: support only Android

**Parameters**

-   `appPackage`  
-   `appActivity`  

## swipe

Perform a swipe on the screen or an element.
Appium: support Android and iOS

**Parameters**

-   `locator`  
-   `xoffset`  
-   `yoffset`  
-   `speed`  

## swipeDown

Perform a swipe down on an element.
Appium: support Android and iOS

**Parameters**

-   `locator`  
-   `yOffset`  
-   `speed`  

## swipeLeft

Perform a swipe left on an element.
Appium: support Android and iOS

**Parameters**

-   `locator`  
-   `xoffset`  
-   `speed`  

## swipeRight

Perform a swipe right on an element.
Appium: support Android and iOS

**Parameters**

-   `locator`  
-   `xoffset`  
-   `speed`  

## swipeTo

Perform a swipe in selected direction on an element to seachable element.
Appium: support Android and iOS

**Parameters**

-   `seachableLocator`  
-   `scrollLocator`  
-   `direction`  
-   `timeout`  
-   `offset`  
-   `speed`  

## swipeUp

Perform a swipe up on an element.
Appium: support Android and iOS

**Parameters**

-   `locator`  
-   `yOffset`  
-   `speed`  

## switchToContext

Switch to the specified context
Appium: support only Android

**Parameters**

-   `value`  

## touchPerform

Performs a specific touch action. The action object need to contain the action name, x/y coordinates
Appium: support Android and iOS

**Parameters**

-   `actions`  
