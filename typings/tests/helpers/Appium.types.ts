const appium = new CodeceptJS.Appium();

appium.touchPerform(); // $ExpectError
appium.touchPerform('press'); // $ExpectError
appium.touchPerform([{ action: 'press' }]); // $ExpectType void
appium.touchPerform([{ action: 'press' }, { action: 'release' }]); // $ExpectType void
appium.touchPerform([{ action: 'press' }], [{ action: 'release' }]); // $ExpectError

appium.hideDeviceKeyboard(); // $ExpectType void
appium.hideDeviceKeyboard('tapOutside'); // $ExpectType void
appium.hideDeviceKeyboard('pressKey', 'Done'); // $ExpectType void
appium.hideDeviceKeyboard('pressKey', 'Done', 'Done'); // $ExpectError

appium.removeApp(); // $ExpectError
appium.removeApp('appName'); // $ExpectType void
appium.removeApp('appName', 'com.example.android.apis'); // $ExpectType void
appium.removeApp('appName', 'com.example.android.apis', 'remove'); // $ExpectError
