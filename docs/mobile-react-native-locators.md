## Automating React Native apps

### Problem
Let's say we have a React Native app with component defined like this
```html
<Button testID='someButton'>My button</Button>
```

If you will try to execute a simple test like
```js
I.tap('~someButton')
```
it will work correctly on iOS (with XUITest driver), but on Android's UIAutomator2 it will give you an error
```
Touch actions like "tap" need at least some kind of position information like "element", "x" or "y" options, you've none given.
```

This happens because of the way React Native implements `testID` for Android, it puts provided value into the [View tag](https://developer.android.com/reference/android/view/View#tags),
as could be found in the [source code](https://github.com/facebook/react-native/blob/19a88d7f4addcd9f95fd4908d50db37b3604b5b1/ReactAndroid/src/main/java/com/facebook/react/uimanager/BaseViewManager.java#L114).
But UIAutomator doesn't have any means to work with view tags.

### Solutions
As many resources suggest (like [here](https://github.com/appium/appium/issues/6025#issuecomment-406141946) or [here](https://github.com/facebook/react-native/issues/7135)),
you could use `testID` for iOS and `accesibilityLabel` for Android, but `accessibilityLabel` is a user-facing text that's intended for ... accesibility,
not for UI tests, and you will need to switch it off for production builds.

Another way to solve this issue is to use Espresso driver for Android.
At first you need to enable Espresso driver for your Android configuration.
You could do it just by changing `automationName` in the `helpers` section of the config file:
```js
{
  //...
  helpers: {
    Appium: {
      app: '/path/to/apk.apk',
      platform: 'Android',
      desiredCapabilities: {
        automationName: 'Espresso',
        platformVersion: '9',
        deviceName: 'Android Emulator'
      }
    }
  }
  //...
}
```
Then you could locate components using XPath expression:
```js
I.tap({android: /'//*[@view-tag="someButton"]', ios: '~someButton'})
```
This way test would work for both platforms without any changes in code.
To simplify things further you could write a helper function:
```js
function tid(id) {
  return {
    android: /`//*[@view-tag="${id}"]`,
    ios: '~' + id
  }
}
```
Now test will look more concise
```js
I.tap(tid('someButton'));
```
