export {}; // mark the file as external module to redeclare variables in the same block

const appium = new CodeceptJS.AppiumTs();

const str = "text";
const num = 1;
const appPackage = "com.example.android.apis";

appium.touchPerform(); // $ExpectError
appium.touchPerform("press"); // $ExpectError
appium.touchPerform([{ action: "press" }]); // $ExpectType Promise<any>
appium.touchPerform([{ action: "press" }, { action: "release" }]); // $ExpectType Promise<any>
appium.touchPerform([{ action: "press" }], [{ action: "release" }]); // $ExpectError

appium.hideDeviceKeyboard(); // $ExpectType Promise<any>
appium.hideDeviceKeyboard("tapOutside"); // $ExpectType Promise<any>
appium.hideDeviceKeyboard("pressKey", "Done"); // $ExpectType Promise<any>
appium.hideDeviceKeyboard("pressKey", "Done", "Done"); // $ExpectError

appium.removeApp(); // $ExpectError
appium.removeApp("appName"); // $ExpectType Promise<any>
appium.removeApp("appName", appPackage); // $ExpectType Promise<any>
appium.removeApp("appName", appPackage, "remove"); // $ExpectError

appium.runOnIOS(str, () => {}); // $ExpectType Promise<any>
appium.runOnAndroid(str, () => {}); // $ExpectType Promise<any>
appium.seeAppIsInstalled(str); // $ExpectType Promise<void>
appium.seeAppIsNotInstalled(str); // $ExpectType Promise<void>
appium.installApp(str); // $ExpectType Promise<void>
appium.removeApp(str); // $ExpectType Promise<any>
appium.seeCurrentActivityIs(str); // $ExpectType Promise<void>
appium.seeDeviceIsLocked(); // $ExpectType Promise<void>
appium.seeDeviceIsUnlocked(); // $ExpectType Promise<void>
appium.seeOrientationIs("LANDSCAPE"); // $ExpectType Promise<void>
appium.setOrientation("LANDSCAPE"); // $ExpectType Promise<any>
appium.grabAllContexts(); // $ExpectType Promise<string[]>
appium.grabContext(); // $ExpectType Promise<string | null>
appium.grabCurrentActivity(); // $ExpectType Promise<string>
appium.grabNetworkConnection(); // $ExpectType Promise<{}>
appium.grabOrientation(); // $ExpectType Promise<string>
appium.grabSettings(); // $ExpectType Promise<string>
appium._switchToContext(str); // $ExpectType Promise<any>
appium.switchToWeb(); // $ExpectType Promise<void>
appium.switchToNative(); // $ExpectType Promise<void>
appium.switchToNative(str); // $ExpectType Promise<void>
appium.startActivity(); // $ExpectError
appium.startActivity(appPackage); // $ExpectError
appium.startActivity(appPackage, '.RegisterUserActivity'); // $ExpectType Promise<void>
appium.setNetworkConnection(num); // $ExpectType Promise<{}>
appium.setNetworkConnection(); // $ExpectError
appium.setSettings(str); // $ExpectType Promise<any>
appium.hideDeviceKeyboard(); // $ExpectType Promise<any>
appium.sendDeviceKeyEvent(num); // $ExpectType Promise<void>
appium.openNotifications(); // $ExpectType Promise<void>
appium.makeTouchAction(); // $ExpectType Promise<void>
appium.tap(str); // $ExpectType Promise<void>
appium.performSwipe(str, str); // $ExpectType Promise<any>
appium.swipeDown(str); // $ExpectType Promise<void>
appium.swipeLeft(str); // $ExpectType Promise<void>
appium.swipeRight(str); // $ExpectType Promise<void>
appium.swipeUp(str); // $ExpectType Promise<void>
appium.swipeTo(str, str, str, num, num, num); // $ExpectType Promise<void>
appium.touchPerform([]); // $ExpectType Promise<any>
appium.pullFile(str, str); // $ExpectType Promise<string>
appium.shakeDevice(); // $ExpectType Promise<void>
appium.rotate(); // $ExpectType Promise<void>
appium.setImmediateValue(); // $ExpectType Promise<void>
appium.simulateTouchId(); // $ExpectType Promise<void>
appium.closeApp(); // $ExpectType Promise<void>
appium.appendField(str, str); // $ExpectType Promise<void>
appium.checkOption(str); // $ExpectType Promise<void>
appium.click(str); // $ExpectType Promise<void>
appium.dontSeeCheckboxIsChecked(str); // $ExpectType Promise<void>
appium.dontSeeElement(str); // $ExpectType Promise<void>
appium.dontSeeInField(str, str); // $ExpectType Promise<void>
appium.dontSee(str); // $ExpectType Promise<void>
appium.fillField(str, str); // $ExpectType Promise<void>
appium.grabTextFromAll(str); // $ExpectType Promise<string[]>
appium.grabTextFrom(str); // $ExpectType Promise<string>
appium.grabNumberOfVisibleElements(str); // $ExpectType Promise<number>
appium.grabAttributeFrom(str, str); // $ExpectType Promise<string>
appium.grabAttributeFromAll(str, str); // $ExpectType Promise<string[]>
appium.grabValueFromAll(str); // $ExpectType Promise<string[]>
appium.grabValueFrom(str); // $ExpectType Promise<string>
appium.saveScreenshot(str); // $ExpectType Promise<void>
appium.scrollIntoView(str, {}); // $ExpectType Promise<void>
appium.seeCheckboxIsChecked(str); // $ExpectType Promise<void>
appium.seeElement(str); // $ExpectType Promise<void>
appium.seeInField(str, str); // $ExpectType Promise<void>
appium.see(str); // $ExpectType Promise<void>
appium.selectOption(str, str); // $ExpectType Promise<void>
appium.waitForElement(str); // $ExpectType Promise<void>
appium.waitForVisible(str); // $ExpectType Promise<void>
appium.waitForInvisible(str); // $ExpectType Promise<void>
appium.waitForText(str); // $ExpectType Promise<void>
