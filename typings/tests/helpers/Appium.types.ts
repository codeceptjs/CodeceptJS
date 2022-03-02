const appium = new CodeceptJS.Appium();

const str_ap = "text";
const num_ap = 1;

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
appium.removeApp("appName", "com.example.android.apis"); // $ExpectType Promise<any>
appium.removeApp("appName", "com.example.android.apis", "remove"); // $ExpectError

appium.runOnIOS(str_ap, () => {}); // $ExpectType Promise<any>
appium.runOnAndroid(str_ap, () => {}); // $ExpectType Promise<any>
appium.seeAppIsInstalled(str_ap); // $ExpectType Promise<void>
appium.seeAppIsNotInstalled(str_ap); // $ExpectType Promise<void>
appium.installApp(str_ap); // $ExpectType Promise<void>
appium.removeApp(str_ap); // $ExpectType Promise<any>
appium.seeCurrentActivityIs(str_ap); // $ExpectType Promise<void>
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
appium._switchToContext(str_ap); // $ExpectType Promise<any>
appium.switchToWeb(); // $ExpectType Promise<void>
appium.switchToNative(); // $ExpectType Promise<void>
appium.switchToNative(str_ap); // $ExpectType Promise<void>
appium.startActivity(); // $ExpectType Promise<void>
appium.setNetworkConnection(); // $ExpectType Promise<{}>
appium.setSettings(str_ap); // $ExpectType Promise<any>
appium.hideDeviceKeyboard(); // $ExpectType Promise<any>
appium.sendDeviceKeyEvent(num_ap); // $ExpectType Promise<void>
appium.openNotifications(); // $ExpectType Promise<void>
appium.makeTouchAction(); // $ExpectType Promise<void>
appium.tap(str_ap); // $ExpectType Promise<void>
appium.performSwipe(str_ap, str_ap); // $ExpectType Promise<any>
appium.swipeDown(str_ap); // $ExpectType Promise<void>
appium.swipeLeft(str_ap); // $ExpectType Promise<void>
appium.swipeRight(str_ap); // $ExpectType Promise<void>
appium.swipeUp(str_ap); // $ExpectType Promise<void>
appium.swipeTo(str_ap, str_ap, str_ap, num_ap, num_ap, num_ap); // $ExpectType Promise<void>
appium.touchPerform([]); // $ExpectType Promise<any>
appium.pullFile(str_ap, str_ap); // $ExpectType Promise<string>
appium.shakeDevice(); // $ExpectType Promise<void>
appium.rotate(); // $ExpectType Promise<void>
appium.setImmediateValue(); // $ExpectType Promise<void>
appium.simulateTouchId(); // $ExpectType Promise<void>
appium.closeApp(); // $ExpectType Promise<void>
appium.appendField(str_ap, str_ap); // $ExpectType Promise<any>
appium.checkOption(str_ap); // $ExpectType Promise<any>
appium.click(str_ap); // $ExpectType Promise<any>
appium.dontSeeCheckboxIsChecked(str_ap); // $ExpectType Promise<any>
appium.dontSeeElement(str_ap); // $ExpectType Promise<any>
appium.dontSeeInField(str_ap, str_ap); // $ExpectType Promise<any>
appium.dontSee(str_ap); // $ExpectType Promise<any>
appium.fillField(str_ap, str_ap); // $ExpectType Promise<any>
appium.grabTextFromAll(str_ap); // $ExpectType Promise<string[]>
appium.grabTextFrom(str_ap); // $ExpectType Promise<string>
appium.grabNumberOfVisibleElements(str_ap); // $ExpectType Promise<number>
appium.grabAttributeFrom(str_ap, str_ap); // $ExpectType Promise<string>
appium.grabAttributeFromAll(str_ap, str_ap); // $ExpectType Promise<string[]>
appium.grabValueFromAll(str_ap); // $ExpectType Promise<string[]>
appium.grabValueFrom(str_ap); // $ExpectType Promise<string>
appium.saveScreenshot(str_ap); // $ExpectType Promise<void>
appium.scrollIntoView(str_ap, {}); // $ExpectType Promise<any>
appium.seeCheckboxIsChecked(str_ap); // $ExpectType Promise<any>
appium.seeElement(str_ap); // $ExpectType Promise<any>
appium.seeInField(str_ap, str_ap); // $ExpectType Promise<any>
appium.see(str_ap); // $ExpectType Promise<any>
appium.selectOption(str_ap, str_ap); // $ExpectType Promise<any>
appium.waitForElement(str_ap); // $ExpectType Promise<any>
appium.waitForVisible(str_ap); // $ExpectType Promise<any>
appium.waitForInvisible(str_ap); // $ExpectType Promise<any>
appium.waitForText(str_ap); // $ExpectType Promise<any>
