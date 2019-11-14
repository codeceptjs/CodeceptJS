/** @namespace CodeceptJS
 */
declare namespace CodeceptJS {
    class ApiDataFactory {
        /**
         * Generates a new record using factory and saves API request to store it.
         *
         * ```js
         * // create a user
         * I.have('user');
         * // create user with defined email
         * // and receive it when inside async function
         * const user = await I.have('user', { email: 'user@user.com'});
         * ```
         *
         * @param {*} factory factory to use
         * @param {*} params predefined parameters
         */
        have(factory: any, params: any): void;
        /**
         * Generates bunch of records and saves multiple API requests to store them.
         *
         * ```js
         * // create 3 posts
         * I.haveMultiple('post', 3);
         *
         * // create 3 posts by one author
         * I.haveMultiple('post', 3, { author: 'davert' });
         * ```
         *
         * @param {*} factory
         * @param {*} times
         * @param {*} params
         */
        haveMultiple(factory: any, times: any, params: any): void;
        /**
         * Executes request to create a record in API.
         * Can be replaced from a in custom helper.
         *
         * @param {*} factory
         * @param {*} data
         */
        _requestCreate(factory: any, data: any): void;
        /**
         * Executes request to delete a record in API
         * Can be replaced from a custom helper.
         *
         * @param {*} factory
         * @param {*} id
         */
        _requestDelete(factory: any, id: any): void;
    }
    /**
     * Appium Special Methods for Mobile only
     */
    class Appium {
        /**
         * Execute code only on iOS
         *
         * ```js
         * I.runOnIOS(() => {
         *    I.click('//UIAApplication[1]/UIAWindow[1]/UIAButton[1]');
         *    I.see('Hi, IOS', '~welcome');
         * });
         * ```
         *
         * Additional filter can be applied by checking for capabilities.
         * For instance, this code will be executed only on iPhone 5s:
         *
         *
         * ```js
         * I.runOnIOS({deviceName: 'iPhone 5s'},() => {
         *    // ...
         * });
         * ```
         *
         * Also capabilities can be checked by a function.
         *
         * ```js
         * I.runOnAndroid((caps) => {
         *    // caps is current config of desiredCapabiliites
         *    return caps.platformVersion >= 6
         * },() => {
         *    // ...
         * });
         * ```
         *
         * @param {*} caps
         * @param {*} fn
         */
        runOnIOS(caps: any, fn: any): void;
        /**
         * Execute code only on Android
         *
         * ```js
         * I.runOnAndroid(() => {
         *    I.click('io.selendroid.testapp:id/buttonTest');
         * });
         * ```
         *
         * Additional filter can be applied by checking for capabilities.
         * For instance, this code will be executed only on Android 6.0:
         *
         *
         * ```js
         * I.runOnAndroid({platformVersion: '6.0'},() => {
         *    // ...
         * });
         * ```
         *
         * Also capabilities can be checked by a function.
         * In this case, code will be executed only on Android >= 6.
         *
         * ```js
         * I.runOnAndroid((caps) => {
         *    // caps is current config of desiredCapabiliites
         *    return caps.platformVersion >= 6
         * },() => {
         *    // ...
         * });
         * ```
         *
         * @param {*} caps
         * @param {*} fn
         */
        runOnAndroid(caps: any, fn: any): void;
        /**
         * Execute code only in Web mode.
         *
         * ```js
         * I.runInWeb(() => {
         *    I.waitForElement('#data');
         *    I.seeInCurrentUrl('/data');
         * });
         * ```
         *
         * @param {*} fn
         */
        runInWeb(fn: any): void;
        /**
         * Check if an app is installed.
         *
         * ```js
         * I.seeAppIsInstalled("com.example.android.apis");
         * ```
         *
         * @param {string} bundleId String  ID of bundled app
         *
         * Appium: support only Android
         */
        seeAppIsInstalled(bundleId: string): void;
        /**
         * Check if an app is not installed.
         *
         * ```js
         * I.seeAppIsNotInstalled("com.example.android.apis");
         * ```
         *
         * @param {string} bundleId String  ID of bundled app
         *
         * Appium: support only Android
         */
        seeAppIsNotInstalled(bundleId: string): void;
        /**
         * Install an app on device.
         *
         * ```js
         * I.installApp('/path/to/file.apk');
         * ```
         * @param {string} path path to apk file
         *
         * Appium: support only Android
         */
        installApp(path: string): void;
        /**
         * Remove an app from the device.
         *
         * ```js
         * I.removeApp('appName', 'com.example.android.apis');
         * ```
         * @param {string} appId
         * @param {string}  bundleId String  ID of bundle
         *
         * Appium: support only Android
         */
        removeApp(appId: string, bundleId: string): void;
        /**
         * Check current activity on an Android device.
         *
         * ```js
         * I.seeCurrentActivityIs(".HomeScreenActivity")
         * ```
         * @param {string} currentActivity
         *
         * Appium: support only Android
         */
        seeCurrentActivityIs(currentActivity: string): void;
        /**
         * Check whether the device is locked.
         *
         * ```js
         * I.seeDeviceIsLocked();
         * ```
         *
         * Appium: support only Android
         */
        seeDeviceIsLocked(): void;
        /**
         * Check whether the device is not locked.
         *
         * ```js
         * I.seeDeviceIsUnlocked();
         * ```
         *
         * Appium: support only Android
         */
        seeDeviceIsUnlocked(): void;
        /**
         * Check the device orientation
         *
         * ```js
         * I.seeOrientationIs('PORTRAIT');
         * I.seeOrientationIs('LANDSCAPE')
         * ```
         *
         * @param {'LANDSCAPE'|'PORTRAIT'} orientation LANDSCAPE or PORTRAIT
         *
         * Appium: support Android and iOS
         */
        seeOrientationIs(orientation: 'LANDSCAPE' | 'PORTRAIT'): void;
        /**
         * Set a device orientation. Will fail, if app will not set orientation
         *
         * ```js
         * I.setOrientation('PORTRAIT');
         * I.setOrientation('LANDSCAPE')
         * ```
         *
         * @param {'LANDSCAPE'|'PORTRAIT'} orientation LANDSCAPE or PORTRAIT
         *
         * Appium: support Android and iOS
         */
        setOrientation(orientation: 'LANDSCAPE' | 'PORTRAIT'): void;
        /**
         * Get list of all available contexts
         *
         * ```
         * let contexts = await I.grabAllContexts();
         * ```
         *
         * Appium: support Android and iOS
         */
        grabAllContexts(): void;
        /**
         * Retrieve current context
         *
         * ```js
         * let context = await I.grabContext();
         * ```
         *
         * Appium: support Android and iOS
         */
        grabContext(): void;
        /**
         * Get current device activity.
         *
         * ```js
         * let activity = await I.grabCurrentActivity();
         * ```
         *
         * Appium: support only Android
         */
        grabCurrentActivity(): void;
        /**
         * Get information about the current network connection (Data/WIFI/Airplane).
         * The actual server value will be a number. However WebdriverIO additional
         * properties to the response object to allow easier assertions.
         *
         * ```js
         * let con = await I.grabNetworkConnection();
         * ```
         *
         * Appium: support only Android
         */
        grabNetworkConnection(): void;
        /**
         * Get current orientation.
         *
         * ```js
         * let orientation = await I.grabOrientation();
         * ```
         *
         * Appium: support Android and iOS
         */
        grabOrientation(): void;
        /**
         * Get all the currently specified settings.
         *
         * ```js
         * let settings = await I.grabSettings();
         * ```
         *
         * Appium: support Android and iOS
         */
        grabSettings(): void;
        /**
         * Switch to the specified context.
         *
         * @param {*} context the context to switch to
         */
        _switchToContext(context: any): void;
        /**
         * Switches to web context.
         * If no context is provided switches to the first detected web context
         *
         * ```js
         * // switch to first web context
         * I.switchToWeb();
         *
         * // or set the context explicitly
         * I.switchToWeb('WEBVIEW_io.selendroid.testapp');
         * ```
         *
         * @param {string} [context]
         */
        switchToWeb(context?: string): void;
        /**
         * Switches to native context.
         * By default switches to NATIVE_APP context unless other specified.
         *
         * ```js
         * I.switchToNative();
         *
         * // or set context explicitly
         * I.switchToNative('SOME_OTHER_CONTEXT');
         * ```
         * @param {*} context
         */
        switchToNative(context: any): void;
        /**
         * Start an arbitrary Android activity during a session.
         *
         * ```js
         * I.startActivity('io.selendroid.testapp', '.RegisterUserActivity');
         * ```
         *
         * Appium: support only Android
         */
        startActivity(): void;
        /**
         * Set network connection mode.
         *
         * * airplane mode
         * * wifi mode
         * * data data
         *
         * ```js
         * I.setNetworkConnection(0) // airplane mode off, wifi off, data off
         * I.setNetworkConnection(1) // airplane mode on, wifi off, data off
         * I.setNetworkConnection(2) // airplane mode off, wifi on, data off
         * I.setNetworkConnection(4) // airplane mode off, wifi off, data on
         * I.setNetworkConnection(6) // airplane mode off, wifi on, data on
         * ```
         * See corresponding [webdriverio reference](http://webdriver.io/api/mobile/setNetworkConnection.html).
         *
         * Appium: support only Android
         */
        setNetworkConnection(): void;
        /**
         * Update the current setting on the device
         *
         * ```js
         * I.setSettings({cyberdelia: 'open'});
         * ```
         *
         * @param {object} settings object
         *
         * Appium: support Android and iOS
         */
        setSettings(settings: any): void;
        /**
         * Hide the keyboard.
         *
         * ```js
         * // taps outside to hide keyboard per default
         * I.hideDeviceKeyboard();
         * I.hideDeviceKeyboard('tapOutside');
         *
         * // or by pressing key
         * I.hideDeviceKeyboard('pressKey', 'Done');
         * ```
         *
         * @param {'tapOutside' | 'pressKey'} strategy  desired strategy to close keyboard (‘tapOutside’ or ‘pressKey’)
         *
         * Appium: support Android and iOS
         */
        hideDeviceKeyboard(strategy: 'tapOutside' | 'pressKey'): void;
        /**
         * Send a key event to the device.
         * List of keys: https://developer.android.com/reference/android/view/KeyEvent.html
         *
         * ```js
         * I.sendDeviceKeyEvent(3);
         * ```
         *
         * @param {number} keyValue  Device specific key value
         *
         * Appium: support only Android
         */
        sendDeviceKeyEvent(keyValue: number): void;
        /**
         * Open the notifications panel on the device.
         *
         * ```js
         * I.openNotifications();
         * ```
         *
         * Appium: support only Android
         */
        openNotifications(): void;
        /**
         * The Touch Action API provides the basis of all gestures that can be
         * automated in Appium. At its core is the ability to chain together ad hoc
         * individual actions, which will then be applied to an element in the
         * application on the device.
         * [See complete documentation](http://webdriver.io/api/mobile/touchAction.html)
         *
         * ```js
         * I.makeTouchAction("~buttonStartWebviewCD", 'tap');
         * ```
         *
         * Appium: support Android and iOS
         */
        makeTouchAction(): void;
        /**
         * Taps on element.
         *
         * ```js
         * I.tap("~buttonStartWebviewCD");
         * ```
         *
         * Shortcut for `makeTouchAction`
         *
         * @param {*} locator
         */
        tap(locator: any): void;
        /**
         * Perform a swipe on the screen or an element.
         *
         * ```js
         * let locator = "#io.selendroid.testapp:id/LinearLayout1";
         * I.swipe(locator, 800, 1200, 1000);
         * ```
         *
         * [See complete reference](http://webdriver.io/api/mobile/swipe.html)
         *
         * @param {CodeceptJS.LocatorOrString} locator
         * @param {number} xoffset
         * @param {number} yoffset
         * @param {number} [speed=1000] (optional), 1000 by default
         *
         * Appium: support Android and iOS
         */
        swipe(locator: CodeceptJS.LocatorOrString, xoffset: number, yoffset: number, speed?: number): void;
        /**
         * Perform a swipe on the screen.
         *
         * ```js
         * I.performswipe(100,200);
         * ```
         *
         * @param {number} from
         * @param {number} to
         *
         * Appium: support Android and iOS
         */
        performSwipe(from: number, to: number): void;
        /**
         * Perform a swipe down on an element.
         *
         * ```js
         * let locator = "#io.selendroid.testapp:id/LinearLayout1";
         * I.swipeDown(locator); // simple swipe
         * I.swipeDown(locator, 500); // set speed
         * I.swipeDown(locator, 1200, 1000); // set offset and speed
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         * @param {number} [yoffset] (optional)
         * @param {number} [speed=1000] (optional), 1000 by default
         *
         * Appium: support Android and iOS
         */
        swipeDown(locator: CodeceptJS.LocatorOrString, yoffset?: number, speed?: number): void;
        /**
         *
         * Perform a swipe left on an element.
         *
         * ```js
         * let locator = "#io.selendroid.testapp:id/LinearLayout1";
         * I.swipeLeft(locator); // simple swipe
         * I.swipeLeft(locator, 500); // set speed
         * I.swipeLeft(locator, 1200, 1000); // set offset and speed
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         * @param {number} [xoffset] (optional)
         * @param {number} [speed=1000] (optional), 1000 by default
         *
         * Appium: support Android and iOS
         */
        swipeLeft(locator: CodeceptJS.LocatorOrString, xoffset?: number, speed?: number): void;
        /**
         * Perform a swipe right on an element.
         *
         * ```js
         * let locator = "#io.selendroid.testapp:id/LinearLayout1";
         * I.swipeRight(locator); // simple swipe
         * I.swipeRight(locator, 500); // set speed
         * I.swipeRight(locator, 1200, 1000); // set offset and speed
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         * @param {number} [xoffset] (optional)
         * @param {number} [speed=1000] (optional), 1000 by default
         *
         * Appium: support Android and iOS
         */
        swipeRight(locator: CodeceptJS.LocatorOrString, xoffset?: number, speed?: number): void;
        /**
         * Perform a swipe up on an element.
         *
         * ```js
         * let locator = "#io.selendroid.testapp:id/LinearLayout1";
         * I.swipeUp(locator); // simple swipe
         * I.swipeUp(locator, 500); // set speed
         * I.swipeUp(locator, 1200, 1000); // set offset and speed
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         * @param {number} [yoffset] (optional)
         * @param {number} [speed=1000] (optional), 1000 by default
         *
         * Appium: support Android and iOS
         */
        swipeUp(locator: CodeceptJS.LocatorOrString, yoffset?: number, speed?: number): void;
        /**
         * Perform a swipe in selected direction on an element to searchable element.
         *
         * ```js
         * I.swipeTo(
         *  "android.widget.CheckBox", // searchable element
         *  "//android.widget.ScrollView/android.widget.LinearLayout", // scroll element
         *   "up", // direction
         *    30,
         *    100,
         *    500);
         * ```
         *
         * @param {string} searchableLocator
         * @param {string} scrollLocator
         * @param {string} direction
         * @param {number} timeout
         * @param {number} offset
         * @param {number} speed
         *
         * Appium: support Android and iOS
         */
        swipeTo(searchableLocator: string, scrollLocator: string, direction: string, timeout: number, offset: number, speed: number): void;
        /**
         * Performs a specific touch action.
         * The action object need to contain the action name, x/y coordinates
         *
         * ```js
         * I.touchPerform([{
         *     action: 'press',
         *     options: {
         *       x: 100,
         *       y: 200
         *     }
         * }, {action: 'release'}])
         *
         * I.touchPerform([{
         *    action: 'tap',
         *    options: {
         *        element: '1', // json web element was queried before
         *        x: 10,   // x offset
         *        y: 20,   // y offset
         *        count: 1 // number of touches
         *    }
         * }]);
         * ```
         *
         * Appium: support Android and iOS
         */
        touchPerform(): void;
        /**
         * Pulls a file from the device.
         *
         * ```js
         * I.pullFile('/storage/emulated/0/DCIM/logo.png', 'my/path');
         * // save file to output dir
         * I.pullFile('/storage/emulated/0/DCIM/logo.png', output_dir);
         * ```
         *
         * Appium: support Android and iOS
         */
        pullFile(): void;
        /**
         * Perform a shake action on the device.
         *
         * ```js
         * I.shakeDevice();
         * ```
         *
         * Appium: support only iOS
         */
        shakeDevice(): void;
        /**
         * Perform a rotation gesture centered on the specified element.
         *
         * ```js
         * I.rotate(120, 120)
         * ```
         *
         * See corresponding [webdriverio reference](http://webdriver.io/api/mobile/rotate.html).
         *
         * Appium: support only iOS
         */
        rotate(): void;
        /**
         * Set immediate value in app.
         *
         * See corresponding [webdriverio reference](http://webdriver.io/api/mobile/setImmediateValue.html).
         *
         * Appium: support only iOS
         */
        setImmediateValue(): void;
        /**
         * Simulate Touch ID with either valid (match == true) or invalid (match == false) fingerprint.
         *
         * ```js
         * I.touchId(); // simulates valid fingerprint
         * I.touchId(true); // simulates valid fingerprint
         * I.touchId(false); // simulates invalid fingerprint
         * ```
         *
         * Appium: support only iOS
         * TODO: not tested
         */
        simulateTouchId(): void;
        /**
         * Close the given application.
         *
         * ```js
         * I.closeApp();
         * ```
         *
         * Appium: support only iOS
         */
        closeApp(): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator
         * @param {string} value text value to append.
         * {--end--}
         *
         */
        appendField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Selects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.checkOption('#agree');
         * I.checkOption('I Agree to Terms and Conditions');
         * I.checkOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         *
         */
        checkOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Perform a click on a link or a button, given by a locator.
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.click('Logout');
         * // button of form
         * I.click('Submit');
         * // CSS button
         * I.click('#form input[type=submit]');
         * // XPath
         * I.click('//form/*[@type=submit]');
         * // link in context
         * I.click('Logout', '#nav');
         * // using strict locator
         * I.click({css: 'nav a.login'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         *
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is not checked.
         *
         * ```js
         * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
         * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
         * I.dontSeeCheckboxIsChecked('agree'); // located by name
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         *
         */
        dontSeeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that value of input field or textarea doesn't equal to given value
         * Opposite to `seeInField`.
         *
         * ```js
         * I.dontSeeInField('email', 'user@user.com'); // field by name
         * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         *
         */
        dontSeeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Opposite to `see`. Checks that a text is not present on a page.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.dontSee('Login'); // assume we are already logged in.
         * I.dontSee('Login', '.nav'); // no login inside .nav element
         * ```
         *
         * @param {string} text which is not present.
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         * {--end--}
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Fills a text field or textarea, after clearing its value, with the given string.
         * Field is located by name, label, CSS, or XPath.
         *
         * ```js
         * // by label
         * I.fillField('Email', 'hello@world.com');
         * // by name
         * I.fillField('password', secret('123456'));
         * // by CSS
         * I.fillField('form#login input[name=username]', 'John');
         * // or by strict locator
         * I.fillField({css: 'form#login input[name=username]'}, 'John');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value text value to fill.
         * {--end--}
         *
         */
        fillField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns an array of texts.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @returns {Promise<string|string[]>} attribute value
         * {--end--}
         *
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string | string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @returns {Promise<string>} attribute value
         * {--end--}
         *
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Verifies that the specified checkbox is checked.
         *
         * ```js
         * I.seeCheckboxIsChecked('Agree');
         * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
         * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         *
         */
        seeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * {--end--}
         *
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the given input field or textarea equals to given value.
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.seeInField('Username', 'davert');
         * I.seeInField({css: 'form textarea'},'Type your comment here');
         * I.seeInField('form input[type=hidden]','hidden_value');
         * I.seeInField('#searchform input','Search');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         *
         */
        seeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that a page contains a visible text.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.see('Welcome'); // text welcome on a page
         * I.see('Welcome', '.content'); // text inside .content div
         * I.see('Register', {css: 'form.register'}); // use strict locator
         * ```
         * @param {string} text expected on page.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
         * {--end--}
         *
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Selects an option in a drop-down select.
         * Field is searched by label | name | CSS | XPath.
         * Option is selected by visible text or by value.
         *
         * ```js
         * I.selectOption('Choose Plan', 'Monthly'); // select by label
         * I.selectOption('subscription', 'Monthly'); // match option by text
         * I.selectOption('subscription', '0'); // or by value
         * I.selectOption('//form/select[@name=account]','Premium');
         * I.selectOption('form select[name=account]', 'Premium');
         * I.selectOption({css: 'form select[name=account]'}, 'Premium');
         * ```
         *
         * Provide an array for the second argument to select multiple options.
         *
         * ```js
         * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
         * ```
         * @param {CodeceptJS.LocatorOrString} select field located by label|name|CSS|XPath|strict locator.
         * @param {string|Array<*>} option visible text or value of option.
         * {--end--}
         *
         * * Supported on only for web testing!
         */
        selectOption(select: CodeceptJS.LocatorOrString, option: string | any[]): void;
        /**
         * Waits for element to be present on page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForElement('.btn.continue');
         * I.waitForElement('.btn.continue', 5); // wait for 5 secs
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for a text to appear (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * Narrow down search results by providing context.
         *
         * ```js
         * I.waitForText('Thank you, form has been submitted');
         * I.waitForText('Thank you, form has been submitted', 5, '#modal');
         * ```
         *
         * @param {string }text to wait for.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator.
         * {--end--}
         *
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
    }
    class FileSystem {
        /**
         * Enters a directory In local filesystem.
         * Starts from a current directory
         * @param {string} openPath
         */
        amInPath(openPath: string): void;
        /**
         * Writes test to file
         * @param {string} name
         * @param {string} text
         */
        writeToFile(name: string, text: string): void;
        /**
         * Checks that file exists
         * @param {string} name
         */
        seeFile(name: string): void;
        /**
         * Checks that file found by `seeFile` includes a text.
         * @param {string} text
         * @param {string} encoding
         */
        seeInThisFile(text: string, encoding: string): void;
        /**
         * Checks that file found by `seeFile` doesn't include text.
         * @param {string} text
         * @param {string} encoding
         */
        dontSeeInThisFile(text: string, encoding: string): void;
        /**
         * Checks that contents of file found by `seeFile` equal to text.
         * @param {string} text
         * @param {string} encoding
         */
        seeFileContentsEqual(text: string, encoding: string): void;
        /**
         * Checks that contents of file found by `seeFile` doesn't equal to text.
         * @param {string} text
         * @param {string} encoding
         */
        dontSeeFileContentsEqual(text: string, encoding: string): void;
    }
    class GraphQL {
        /**
         * Executes query via axios call
         *
         * @param {object} request
         */
        _executeQuery(request: any): void;
        /**
         * Prepares request for axios call
         *
         * @param {object} operation
         * @param {object} headers
         */
        _prepareGraphQLRequest(operation: any, headers: any): void;
        /**
         * Send query to GraphQL endpoint over http.
         * Returns a response as a promise.
         *
         * ```js
         *
         * const response = await I.sendQuery('{ users { name email }}');
         * // with variables
         * const response = await I.sendQuery(
         *  'query getUser($id: ID) { user(id: $id) { name email }}',
         *  { id: 1 },
         * )
         * const user = response.data.data;
         * ```
         *
         * @param {String} query
         * @param {object} variables that may go along with the query
         * @param {object} options are additional query options
         * @param {object} headers
         */
        sendQuery(query: string, variables: any, options: any, headers: any): void;
        /**
         * Send query to GraphQL endpoint over http
         *
         * ```js
         * I.sendMutation(`
         *       mutation createUser($user: UserInput!) {
         *          createUser(user: $user) {
         *            id
         *            name
         *            email
         *          }
         *        }
         *    `,
         *   { user: {
         *       name: 'John Doe',
         *       email: 'john@xmail.com'
         *     }
         *   },
         * });
         * ```
         *
         * @param {String} mutation
         * @param {object} variables that may go along with the mutation
         * @param {object} options are additional query options
         * @param {object} headers
         */
        sendMutation(mutation: string, variables: any, options: any, headers: any): void;
    }
    class GraphQLDataFactory {
        /**
         * Generates a new record using factory, sends a GraphQL mutation to store it.
         *
         * ```js
         * // create a user
         * I.mutateData('createUser');
         * // create user with defined email
         * // and receive it when inside async function
         * const user = await I.mutateData('createUser', { email: 'user@user.com'});
         * ```
         *
         * @param {string} operation to be performed
         * @param {*} params predefined parameters
         */
        mutateData(operation: string, params: any): void;
        /**
         * Generates bunch of records and sends multiple GraphQL mutation requests to store them.
         *
         * ```js
         * // create 3 users
         * I.mutateMultiple('createUser', 3);
         *
         * // create 3 users of same age
         * I.mutateMultiple('createUser', 3, { age: 25 });
         * ```
         *
         * @param {string} operation
         * @param {number} times
         * @param {*} params
         */
        mutateMultiple(operation: string, times: number, params: any): void;
        /**
         * Executes request to create a record to the GraphQL endpoint.
         * Can be replaced from a custom helper.
         *
         * @param {string} operation
         * @param {*} variables to be sent along with the query
         */
        _requestCreate(operation: string, variables: any): void;
        /**
         * Executes request to delete a record to the GraphQL endpoint.
         * Can be replaced from a custom helper.
         *
         * @param {string} operation
         * @param {*} data of the record to be deleted.
         */
        _requestDelete(operation: string, data: any): void;
    }
    class MockRequest {
        /**
         * Starts mocking of http requests.
         * Used by mockRequest method to automatically start
         * mocking requests.
         *
         * @param {*} title
         */
        startMocking(title?: any): void;
        /**
         * Creates a polly instance by registering puppeteer adapter with the instance
         *
         * @param {*} title
         */
        _connectPuppeteer(title: any): void;
        /**
         * Creates polly object in the browser window context using xhr and fetch adapters,
         * after loading PollyJs and adapter scripts.
         *
         * @param {*} title
         */
        _connectWebDriver(title: any): void;
        /**
         * Mock response status
         *
         * ```js
         * I.mockRequest('GET', '/api/users', 200);
         * I.mockRequest('ANY', '/secretsRoutes/*', 403);
         * I.mockRequest('POST', '/secrets', { secrets: 'fakeSecrets' });
         * I.mockRequest('GET', '/api/users/1', 404, 'User not found');
         * ```
         *
         * Multiple requests
         *
         * ```js
         * I.mockRequest('GET', ['/secrets', '/v2/secrets'], 403);
         * ```
         * @param {string} method request method. Can be `GET`, `POST`, `PUT`, etc or `ANY`.
         * @param {string|string[]} oneOrMoreUrls url(s) to mock. Can be exact URL, a pattern, or an array of URLs.
         * @param {number|string|object} dataOrStatusCode status code when number provided. A response body otherwise
         * @param {string|object} additionalData response body when a status code is set by previous parameter.
         *
         */
        mockRequest(method: string, oneOrMoreUrls: string | string[], dataOrStatusCode: number | string | any, additionalData: string | any): void;
        /**
         * Starts mocking if it's not started yet.
         */
        _checkAndStartMocking(): void;
        /**
         * Stops mocking requests.
         */
        stopMocking(): void;
    }
    class Nightmare {
        /**
         * Get HAR
         *
         * ```js
         * let har = await I.grabHAR();
         * fs.writeFileSync('sample.har', JSON.stringify({log: har}));
         * ```
         */
        grabHAR(): void;
        /**
         * Locate elements by different locator types, including strict locator.
         * Should be used in custom helpers.
         *
         * This method return promise with array of IDs of found elements.
         * Actual elements can be accessed inside `evaluate` by using `codeceptjs.fetchElement()`
         * client-side function:
         *
         * ```js
         * // get an inner text of an element
         *
         * let browser = this.helpers['Nightmare'].browser;
         * let value = this.helpers['Nightmare']._locate({name: 'password'}).then(function(els) {
         *   return browser.evaluate(function(el) {
         *     return codeceptjs.fetchElement(el).value;
         *   }, els[0]);
         * });
         * ```
         */
        _locate(): void;
        /**
         * Add a header override for all HTTP requests. If header is undefined, the header overrides will be reset.
         *
         * ```js
         * I.haveHeader('x-my-custom-header', 'some value');
         * I.haveHeader(); // clear headers
         * ```
         */
        haveHeader(): void;
        /**
         * Opens a web page in a browser. Requires relative or absolute url.
         * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
         *
         * ```js
         * I.amOnPage('/'); // opens main page of website
         * I.amOnPage('https://github.com'); // opens github
         * I.amOnPage('/login'); // opens a login page
         * ```
         *
         * @param {string} url url path or global url.
         * {--end--}
         * @param {?object} headers list of request headers can be passed
         *
         */
        amOnPage(url: string, headers: any): void;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         *
         * @param {string} text text value to check.
         * {--end--}
         */
        seeInTitle(text: string): void;
        /**
         * Checks that title does not contain text.
         *
         * ```js
         * I.dontSeeInTitle('Error');
         * ```
         *
         * @param {string} text value to check.
         * {--end--}
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         *
         * @returns {Promise<string>} title
         * {--end--}
         */
        grabTitle(): Promise<string>;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         *
         * @returns {Promise<string>} current URL
         * {--end--}
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         *
         * @param {string} url a fragment to check
         * {--end--}
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         *
         * @param {string} url value to check.
         * {--end--}
         */
        dontSeeInCurrentUrl(url: string): void;
        /**
         * Checks that current url is equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         * So both examples will work:
         *
         * ```js
         * I.seeCurrentUrlEquals('/register');
         * I.seeCurrentUrlEquals('http://my.site.com/register');
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         */
        seeCurrentUrlEquals(url: string): void;
        /**
         * Checks that current url is not equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         *
         * ```js
         * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
         * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         */
        dontSeeCurrentUrlEquals(url: string): void;
        /**
         * Checks that a page contains a visible text.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.see('Welcome'); // text welcome on a page
         * I.see('Welcome', '.content'); // text inside .content div
         * I.see('Register', {css: 'form.register'}); // use strict locator
         * ```
         * @param {string} text expected on page.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
         * {--end--}
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `see`. Checks that a text is not present on a page.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.dontSee('Login'); // assume we are already logged in.
         * I.dontSee('Login', '.nav'); // no login inside .nav element
         * ```
         *
         * @param {string} text which is not present.
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         * {--end--}
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * {--end--}
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * {--end--}
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param {string} text value to check.
         * {--end--}
         */
        seeInSource(text: string): void;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         *
         * @param {string} value to check.
         * {--end--}
         */
        dontSeeInSource(value: string): void;
        /**
         * Asserts that an element appears a given number of times in the DOM.
         * Element is located by label or name or CSS or XPath.
         *
         *
         * ```js
         * I.seeNumberOfElements('#submitBtn', 1);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         */
        seeNumberOfElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Grab number of visible elements by locator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @returns {Promise<number>} number of visible elements
         * {--end--}
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Perform a click on a link or a button, given by a locator.
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.click('Logout');
         * // button of form
         * I.click('Submit');
         * // CSS button
         * I.click('#form input[type=submit]');
         * // XPath
         * I.click('//form/*[@type=submit]');
         * // link in context
         * I.click('Logout', '#nav');
         * // using strict locator
         * I.click({css: 'nav a.login'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs a double-click on an element matched by link|button|label|CSS or XPath.
         * Context can be specified as second parameter to narrow search.
         *
         * ```js
         * I.doubleClick('Edit');
         * I.doubleClick('Edit', '.actions');
         * I.doubleClick({css: 'button.accept'});
         * I.doubleClick('.btn.edit');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         */
        doubleClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
         *
         * ```js
         * // right click element with id el
         * I.rightClick('#el');
         * // right click link or button with text "Click me"
         * I.rightClick('Click me');
         * // right click button with text "Click me" inside .context
         * I.rightClick('Click me', '.context');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         */
        rightClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Moves cursor to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.moveCursorTo('.tooltip');
         * I.moveCursorTo('#submit', 5,5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         */
        moveCursorTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Executes sync script on a page.
         * Pass arguments to function as additional parameters.
         * Will return execution result to a test.
         * In this case you should use async function and await to receive results.
         *
         * Example with jQuery DatePicker:
         *
         * ```js
         * // change date of jQuery DatePicker
         * I.executeScript(function() {
         *   // now we are inside browser context
         *   $('date').datetimepicker('setDate', new Date());
         * });
         * ```
         * Can return values. Don't forget to use `await` to get them.
         *
         * ```js
         * let date = await I.executeScript(function(el) {
         *   // only basic types can be returned
         *   return $(el).datetimepicker('getDate').toString();
         * }, '#date'); // passing jquery selector
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         *
         * Wrapper for synchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2)
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Executes async script on page.
         * Provided function should execute a passed callback (as first argument) to signal it is finished.
         *
         * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
         *
         * ```js
         * I.executeAsyncScript(function(done) {
         *   Vue.nextTick(done); // waiting for next tick
         * });
         * ```
         *
         * By passing value to `done()` function you can return values.
         * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
         *
         * ```js
         * let val = await I.executeAsyncScript(function(url, done) {
         *   // in browser context
         *   $.ajax(url, { success: (data) => done(data); }
         * }, 'http://ajax.callback.url/');
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         *
         * Wrapper for asynchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2).
         * Unlike NightmareJS implementation calling `done` will return its first argument.
         */
        executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         *
         * @param {number} width width in pixels or `maximize`.
         * @param {number} height height in pixels.
         * {--end--}
         */
        resizeWindow(width: number, height: number): void;
        /**
         * Selects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.checkOption('#agree');
         * I.checkOption('I Agree to Terms and Conditions');
         * I.checkOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         */
        checkOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Unselects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.uncheckOption('#agree');
         * I.uncheckOption('I Agree to Terms and Conditions');
         * I.uncheckOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         */
        uncheckOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Fills a text field or textarea, after clearing its value, with the given string.
         * Field is located by name, label, CSS, or XPath.
         *
         * ```js
         * // by label
         * I.fillField('Email', 'hello@world.com');
         * // by name
         * I.fillField('password', secret('123456'));
         * // by CSS
         * I.fillField('form#login input[name=username]', 'John');
         * // or by strict locator
         * I.fillField({css: 'form#login input[name=username]'}, 'John');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value text value to fill.
         * {--end--}
         */
        fillField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Clears a `<textarea>` or text `<input>` element's value.
         *
         * ```js
         * I.clearField('Email');
         * I.clearField('user[email]');
         * I.clearField('#email');
         * ```
         * @param {string|object} editable field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        clearField(editable: string | any): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator
         * @param {string} value text value to append.
         * {--end--}
         */
        appendField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that the given input field or textarea equals to given value.
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.seeInField('Username', 'davert');
         * I.seeInField({css: 'form textarea'},'Type your comment here');
         * I.seeInField('form input[type=hidden]','hidden_value');
         * I.seeInField('#searchform input','Search');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         */
        seeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that value of input field or textarea doesn't equal to given value
         * Opposite to `seeInField`.
         *
         * ```js
         * I.dontSeeInField('email', 'user@user.com'); // field by name
         * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         */
        dontSeeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Sends [input event](http://electron.atom.io/docs/api/web-contents/#webcontentssendinputeventevent) on a page.
         * Can submit special keys like 'Enter', 'Backspace', etc
         */
        pressKey(): void;
        /**
         * Sends [input event](http://electron.atom.io/docs/api/web-contents/#contentssendinputeventevent) on a page.
         * Should be a mouse event like:
         *  {
                type: 'mouseDown',
                x: args.x,
                y: args.y,
                button: "left"
              }
         */
        triggerMouseEvent(): void;
        /**
         * Verifies that the specified checkbox is checked.
         *
         * ```js
         * I.seeCheckboxIsChecked('Agree');
         * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
         * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        seeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is not checked.
         *
         * ```js
         * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
         * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
         * I.dontSeeCheckboxIsChecked('agree'); // located by name
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        dontSeeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Attaches a file to element located by label, name, CSS or XPath
         * Path to file is relative current codecept directory (where codecept.json or codecept.conf.js is located).
         * File will be uploaded to remote system (if tests are running remotely).
         *
         * ```js
         * I.attachFile('Avatar', 'data/avatar.jpg');
         * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @param {string} pathToFile local file path relative to codecept.json config file.
         * {--end--}
         *
         * Doesn't work if the Chromium DevTools panel is open (as Chromium allows only one attachment to the debugger at a time. [See more](https://github.com/rosshinkley/nightmare-upload#important-note-about-setting-file-upload-inputs))
         */
        attachFile(locator: CodeceptJS.LocatorOrString, pathToFile: string): void;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns an array of texts.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @returns {Promise<string|string[]>} attribute value
         * {--end--}
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string | string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @returns {Promise<string>} attribute value
         * {--end--}
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * An array as a result will be returned if there are more than one matched element.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} attr attribute name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - an array of HTMLs returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} element located by CSS|XPath|strict locator.
         * @returns {Promise<string>} HTML code for an element
         * {--end--}
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Selects an option in a drop-down select.
         * Field is searched by label | name | CSS | XPath.
         * Option is selected by visible text or by value.
         *
         * ```js
         * I.selectOption('Choose Plan', 'Monthly'); // select by label
         * I.selectOption('subscription', 'Monthly'); // match option by text
         * I.selectOption('subscription', '0'); // or by value
         * I.selectOption('//form/select[@name=account]','Premium');
         * I.selectOption('form select[name=account]', 'Premium');
         * I.selectOption({css: 'form select[name=account]'}, 'Premium');
         * ```
         *
         * Provide an array for the second argument to select multiple options.
         *
         * ```js
         * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
         * ```
         * @param {CodeceptJS.LocatorOrString} select field located by label|name|CSS|XPath|strict locator.
         * @param {string|Array<*>} option visible text or value of option.
         * {--end--}
         */
        selectOption(select: CodeceptJS.LocatorOrString, option: string | any[]): void;
        /**
         * Sets a cookie.
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         * ```
         *
         * @param {object} cookie a cookie object.
         * {--end--}
         *
         * Wrapper for `.cookies.set(cookie)`.
         * [See more](https://github.com/segmentio/nightmare/blob/master/Readme.md#cookiessetcookie)
         */
        setCookie(cookie: any): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         *
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         *
         * @param {?string} [name=null] cookie name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         *
         * Cookie in JSON format. If name not passed returns all cookies for this domain.
         *
         * Multiple cookies can be received by passing query object `I.grabCookie({ secure: true});`. If you'd like get all cookies for all urls, use: `.grabCookie({ url: null }).`
         */
        grabCookie(name?: string): Promise<string>;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         *
         * @param {?string} [cookie=null] (optional, `null` by default) cookie name
         * {--end--}
         */
        clearCookie(cookie?: string): void;
        /**
         * Waits for a function to return true (waits for 1 sec by default).
         * Running in browser context.
         *
         * ```js
         * I.waitForFunction(fn[, [args[, timeout]])
         * ```
         *
         * ```js
         * I.waitForFunction(() => window.requests == 0);
         * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
         * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
         * ```
         *
         * @param {string|function} fn to be executed in browser context.
         * @param {any[]|number} [argsOrSec] (optional, `1` by default) arguments for function or seconds.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         *
         * @param {number} sec number of second to wait.
         * {--end--}
         */
        wait(sec: number): void;
        /**
         * Waits for a text to appear (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * Narrow down search results by providing context.
         *
         * ```js
         * I.waitForText('Thank you, form has been submitted');
         * I.waitForText('Thank you, form has been submitted', 5, '#modal');
         * ```
         *
         * @param {string }text to wait for.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator.
         * {--end--}
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for element to be present on page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForElement('.btn.continue');
         * I.waitForElement('.btn.continue', 5); // wait for 5 secs
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForDetached(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         * {--end--}
         */
        refreshPage(): void;
        /**
         * Reload the page
         */
        refresh(): void;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         *
         * @param {string} fileName file name to save.
         * @param {boolean} [fullPage=false] (optional, `false` by default) flag to enable fullscreen screenshot mode.
         * {--end--}
         */
        saveScreenshot(fileName: string, fullPage?: boolean): void;
        /**
         * Scrolls to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.scrollTo('footer');
         * I.scrollTo('#submit', 5, 5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         * {--end--}
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
         * {--end--}
         */
        scrollPageToBottom(): void;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         *
         * @returns {Promise<Object<string, *>>} scroll position
         * {--end--}
         */
        grabPageScrollPosition(): Promise<{
            [key: string]: any;
        }>;
    }
    /**
     * This helper works the same as MockRequest helper. It has been included for backwards compatibility
     * reasons. So use MockRequest helper instead of this.
     *
     * Please refer to MockRequest helper documentation for details.
     *
     * ### Installations
     *
     * Requires [Polly.js](https://netflix.github.io/pollyjs/#/) library by Netflix installed
     *
     * ```
     * npm i @pollyjs/core @pollyjs/adapter-puppeteer --save-dev
     * ```
     *
     * Requires Puppeteer helper or WebDriver helper enabled
     *
     * ### Configuration
     *
     * Just enable helper in config file:
     *
     * ```js
     * helpers: {
     *    Puppeteer: {
     *      // regular Puppeteer config here
     *    },
     *    Polly: {}
     * }
     * ```
     * The same can be done when using WebDriver helper..
     *
     * ### Usage
     *
     * Use `I.mockRequest` to intercept and mock requests.
     *
     */
    class Polly {
    }
    class Protractor {
        /**
         * Switch to non-Angular mode,
         * start using WebDriver instead of Protractor in this session
         */
        amOutsideAngularApp(): void;
        /**
         * Enters Angular mode (switched on by default)
         * Should be used after "amOutsideAngularApp"
         */
        amInsideAngularApp(): void;
        /**
         * Get elements by different locator types, including strict locator
         * Should be used in custom helpers:
         *
         * ```js
         * this.helpers['Protractor']._locate({name: 'password'}).then //...
         * ```
         * To use SmartWait and wait for element to appear on a page, add `true` as second arg:
         *
         * ```js
         * this.helpers['Protractor']._locate({name: 'password'}, true).then //...
         * ```
         *
         */
        _locate(): void;
        /**
         * Find a checkbox by providing human readable text:
         *
         * ```js
         * this.helpers['Protractor']._locateCheckable('I agree with terms and conditions').then // ...
         * ```
         */
        _locateCheckable(): void;
        /**
         * Find a clickable element by providing human readable text:
         *
         * ```js
         * this.helpers['Protractor']._locateClickable('Next page').then // ...
         * ```
         */
        _locateClickable(): void;
        /**
         * Find field elements by providing human readable text:
         *
         * ```js
         * this.helpers['Protractor']._locateFields('Your email').then // ...
         * ```
         */
        _locateFields(): void;
        /**
         * Opens a web page in a browser. Requires relative or absolute url.
         * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
         *
         * ```js
         * I.amOnPage('/'); // opens main page of website
         * I.amOnPage('https://github.com'); // opens github
         * I.amOnPage('/login'); // opens a login page
         * ```
         *
         * @param {string} url url path or global url.
         * {--end--}
         */
        amOnPage(url: string): void;
        /**
         * Perform a click on a link or a button, given by a locator.
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.click('Logout');
         * // button of form
         * I.click('Submit');
         * // CSS button
         * I.click('#form input[type=submit]');
         * // XPath
         * I.click('//form/*[@type=submit]');
         * // link in context
         * I.click('Logout', '#nav');
         * // using strict locator
         * I.click({css: 'nav a.login'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs a double-click on an element matched by link|button|label|CSS or XPath.
         * Context can be specified as second parameter to narrow search.
         *
         * ```js
         * I.doubleClick('Edit');
         * I.doubleClick('Edit', '.actions');
         * I.doubleClick({css: 'button.accept'});
         * I.doubleClick('.btn.edit');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         */
        doubleClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
         *
         * ```js
         * // right click element with id el
         * I.rightClick('#el');
         * // right click link or button with text "Click me"
         * I.rightClick('Click me');
         * // right click button with text "Click me" inside .context
         * I.rightClick('Click me', '.context');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         */
        rightClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Moves cursor to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.moveCursorTo('.tooltip');
         * I.moveCursorTo('#submit', 5,5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         */
        moveCursorTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Checks that a page contains a visible text.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.see('Welcome'); // text welcome on a page
         * I.see('Welcome', '.content'); // text inside .content div
         * I.see('Register', {css: 'form.register'}); // use strict locator
         * ```
         * @param {string} text expected on page.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
         * {--end--}
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that text is equal to provided one.
         *
         * ```js
         * I.seeTextEquals('text', 'h1');
         * ```
         */
        seeTextEquals(): void;
        /**
         * Opposite to `see`. Checks that a text is not present on a page.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.dontSee('Login'); // assume we are already logged in.
         * I.dontSee('Login', '.nav'); // no login inside .nav element
         * ```
         *
         * @param {string} text which is not present.
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         * {--end--}
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Get JS log from browser. Log buffer is reset after each request.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let logs = await I.grabBrowserLogs();
         * console.log(JSON.stringify(logs))
         * ```
         *
         * @returns {Promise<Array<*>>} all browser logs
         * {--end--}
         */
        grabBrowserLogs(): Promise<any[]>;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         *
         * @returns {Promise<string>} current URL
         * {--end--}
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Selects an option in a drop-down select.
         * Field is searched by label | name | CSS | XPath.
         * Option is selected by visible text or by value.
         *
         * ```js
         * I.selectOption('Choose Plan', 'Monthly'); // select by label
         * I.selectOption('subscription', 'Monthly'); // match option by text
         * I.selectOption('subscription', '0'); // or by value
         * I.selectOption('//form/select[@name=account]','Premium');
         * I.selectOption('form select[name=account]', 'Premium');
         * I.selectOption({css: 'form select[name=account]'}, 'Premium');
         * ```
         *
         * Provide an array for the second argument to select multiple options.
         *
         * ```js
         * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
         * ```
         * @param {CodeceptJS.LocatorOrString} select field located by label|name|CSS|XPath|strict locator.
         * @param {string|Array<*>} option visible text or value of option.
         * {--end--}
         */
        selectOption(select: CodeceptJS.LocatorOrString, option: string | any[]): void;
        /**
         * Fills a text field or textarea, after clearing its value, with the given string.
         * Field is located by name, label, CSS, or XPath.
         *
         * ```js
         * // by label
         * I.fillField('Email', 'hello@world.com');
         * // by name
         * I.fillField('password', secret('123456'));
         * // by CSS
         * I.fillField('form#login input[name=username]', 'John');
         * // or by strict locator
         * I.fillField({css: 'form#login input[name=username]'}, 'John');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value text value to fill.
         * {--end--}
         */
        fillField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Presses a key on a focused element.
         * Special keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
         * will be replaced with corresponding unicode.
         * If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.
         *
         * ```js
         * I.pressKey('Enter');
         * I.pressKey(['Control','a']);
         * ```
         *
         * @param {string|string[]} key key or array of keys to press.
         * {--end--}
         * {{ keys }}
         */
        pressKey(key: string | string[]): void;
        /**
         * Attaches a file to element located by label, name, CSS or XPath
         * Path to file is relative current codecept directory (where codecept.json or codecept.conf.js is located).
         * File will be uploaded to remote system (if tests are running remotely).
         *
         * ```js
         * I.attachFile('Avatar', 'data/avatar.jpg');
         * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @param {string} pathToFile local file path relative to codecept.json config file.
         * {--end--}
         */
        attachFile(locator: CodeceptJS.LocatorOrString, pathToFile: string): void;
        /**
         * Checks that the given input field or textarea equals to given value.
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.seeInField('Username', 'davert');
         * I.seeInField({css: 'form textarea'},'Type your comment here');
         * I.seeInField('form input[type=hidden]','hidden_value');
         * I.seeInField('#searchform input','Search');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         */
        seeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that value of input field or textarea doesn't equal to given value
         * Opposite to `seeInField`.
         *
         * ```js
         * I.dontSeeInField('email', 'user@user.com'); // field by name
         * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         */
        dontSeeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator
         * @param {string} value text value to append.
         * {--end--}
         */
        appendField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Clears a `<textarea>` or text `<input>` element's value.
         *
         * ```js
         * I.clearField('Email');
         * I.clearField('user[email]');
         * I.clearField('#email');
         * ```
         * @param {string|object} editable field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        clearField(editable: string | any): void;
        /**
         * Selects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.checkOption('#agree');
         * I.checkOption('I Agree to Terms and Conditions');
         * I.checkOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         */
        checkOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Unselects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.uncheckOption('#agree');
         * I.uncheckOption('I Agree to Terms and Conditions');
         * I.uncheckOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         */
        uncheckOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is checked.
         *
         * ```js
         * I.seeCheckboxIsChecked('Agree');
         * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
         * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        seeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is not checked.
         *
         * ```js
         * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
         * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
         * I.dontSeeCheckboxIsChecked('agree'); // located by name
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        dontSeeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns an array of texts.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @returns {Promise<string|string[]>} attribute value
         * {--end--}
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string | string[]>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - an array of HTMLs returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} element located by CSS|XPath|strict locator.
         * @returns {Promise<string>} HTML code for an element
         * {--end--}
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @returns {Promise<string>} attribute value
         * {--end--}
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Grab CSS property for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} cssProperty CSS property name.
         * @returns {Promise<string>} CSS value
         * {--end--}
         */
        grabCssPropertyFrom(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * An array as a result will be returned if there are more than one matched element.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} attr attribute name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         *
         * @param {string} text text value to check.
         * {--end--}
         */
        seeInTitle(text: string): void;
        /**
         * Checks that title is equal to provided one.
         *
         * ```js
         * I.seeTitleEquals('Test title.');
         * ```
         */
        seeTitleEquals(): void;
        /**
         * Checks that title does not contain text.
         *
         * ```js
         * I.dontSeeInTitle('Error');
         * ```
         *
         * @param {string} text value to check.
         * {--end--}
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         *
         * @returns {Promise<string>} title
         * {--end--}
         */
        grabTitle(): Promise<string>;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * {--end--}
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * {--end--}
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param {string} text value to check.
         * {--end--}
         */
        seeInSource(text: string): void;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         *
         * @returns {Promise<string>} source code
         * {--end--}
         */
        grabSource(): Promise<string>;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         *
         * @param {string} value to check.
         * {--end--}
         */
        dontSeeInSource(value: string): void;
        /**
         * Asserts that an element appears a given number of times in the DOM.
         * Element is located by label or name or CSS or XPath.
         *
         *
         * ```js
         * I.seeNumberOfElements('#submitBtn', 1);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         */
        seeNumberOfElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Grab number of visible elements by locator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @returns {Promise<number>} number of visible elements
         * {--end--}
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Checks that all elements with given locator have given CSS properties.
         *
         * ```js
         * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {object} cssProperties object with CSS properties and their values to check.
         * {--end--}
         */
        seeCssPropertiesOnElements(locator: CodeceptJS.LocatorOrString, cssProperties: any): void;
        /**
         * Checks that all elements with given locator have given attributes.
         *
         * ```js
         * I.seeAttributesOnElements('//form', { method: "post"});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {object} attributes attributes and their values to check.
         * {--end--}
         */
        seeAttributesOnElements(locator: CodeceptJS.LocatorOrString, attributes: any): void;
        /**
         * Executes sync script on a page.
         * Pass arguments to function as additional parameters.
         * Will return execution result to a test.
         * In this case you should use async function and await to receive results.
         *
         * Example with jQuery DatePicker:
         *
         * ```js
         * // change date of jQuery DatePicker
         * I.executeScript(function() {
         *   // now we are inside browser context
         *   $('date').datetimepicker('setDate', new Date());
         * });
         * ```
         * Can return values. Don't forget to use `await` to get them.
         *
         * ```js
         * let date = await I.executeScript(function(el) {
         *   // only basic types can be returned
         *   return $(el).datetimepicker('getDate').toString();
         * }, '#date'); // passing jquery selector
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Executes async script on page.
         * Provided function should execute a passed callback (as first argument) to signal it is finished.
         *
         * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
         *
         * ```js
         * I.executeAsyncScript(function(done) {
         *   Vue.nextTick(done); // waiting for next tick
         * });
         * ```
         *
         * By passing value to `done()` function you can return values.
         * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
         *
         * ```js
         * let val = await I.executeAsyncScript(function(url, done) {
         *   // in browser context
         *   $.ajax(url, { success: (data) => done(data); }
         * }, 'http://ajax.callback.url/');
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         */
        executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         *
         * @param {string} url a fragment to check
         * {--end--}
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         *
         * @param {string} url value to check.
         * {--end--}
         */
        dontSeeInCurrentUrl(url: string): void;
        /**
         * Checks that current url is equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         * So both examples will work:
         *
         * ```js
         * I.seeCurrentUrlEquals('/register');
         * I.seeCurrentUrlEquals('http://my.site.com/register');
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         */
        seeCurrentUrlEquals(url: string): void;
        /**
         * Checks that current url is not equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         *
         * ```js
         * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
         * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         */
        dontSeeCurrentUrlEquals(url: string): void;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         *
         * @param {string} fileName file name to save.
         * @param {boolean} [fullPage=false] (optional, `false` by default) flag to enable fullscreen screenshot mode.
         * {--end--}
         */
        saveScreenshot(fileName: string, fullPage?: boolean): void;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         *
         * @param {?string} [cookie=null] (optional, `null` by default) cookie name
         * {--end--}
         */
        clearCookie(cookie?: string): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         *
         * @param {?string} [name=null] cookie name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         *
         * Returns cookie in JSON [format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
         */
        grabCookie(name?: string): Promise<string>;
        /**
         * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
         * Don't confuse popups with modal windows, as created by [various
         * libraries](http://jster.net/category/windows-modals-popups). Appium: support only web testing
         */
        acceptPopup(): void;
        /**
         * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
         */
        cancelPopup(): void;
        /**
         * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
         * given string.
         */
        seeInPopup(): void;
        /**
         * Grab the text within the popup. If no popup is visible then it will return null
         *
         * ```js
         * await I.grabPopupText();
         * ```
         */
        grabPopupText(): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         *
         * @param {number} width width in pixels or `maximize`.
         * @param {number} height height in pixels.
         * {--end--}
         */
        resizeWindow(width: number, height: number): void;
        /**
         * Drag an item to a destination element.
         *
         * ```js
         * I.dragAndDrop('#dragHandle', '#container');
         * ```
         *
         * @param {string|object} srcElement located by CSS|XPath|strict locator.
         * @param {string|object} destElement located by CSS|XPath|strict locator.
         * {--end--}
         */
        dragAndDrop(srcElement: string | any, destElement: string | any): void;
        /**
         * Close all tabs except for the current one.
         *
         * ```js
         * I.closeOtherTabs();
         * ```
         */
        closeOtherTabs(): void;
        /**
         * Close current tab
         *
         * ```js
         * I.closeCurrentTab();
         * ```
         */
        closeCurrentTab(): void;
        /**
         * Get the window handle relative to the current handle. i.e. the next handle or the previous.
         * @param {Number} offset Offset from current handle index. i.e. offset < 0 will go to the previous handle and positive number will go to the next window handle in sequence.
         */
        _getWindowHandle(offset: number): void;
        /**
         * Open new tab and switch to it
         *
         * ```js
         * I.openNewTab();
         * ```
         */
        openNewTab(): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
         *
         * ```js
         * I.switchToNextTab();
         * I.switchToNextTab(2);
         * ```
         */
        switchToNextTab(): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
         *
         * ```js
         * I.switchToPreviousTab();
         * I.switchToPreviousTab(2);
         * ```
         */
        switchToPreviousTab(): void;
        /**
         * Grab number of open tabs.
         *
         * ```js
         * let tabs = await I.grabNumberOfOpenTabs();
         * ```
         *
         * @returns {Promise<number>} number of open tabs
         * {--end--}
         */
        grabNumberOfOpenTabs(): Promise<number>;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         *
         * @param {?CodeceptJS.LocatorOrString} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         */
        switchTo(locator?: CodeceptJS.LocatorOrString): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         *
         * @param {number} sec number of second to wait.
         * {--end--}
         */
        wait(sec: number): void;
        /**
         * Waits for element to be present on page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForElement('.btn.continue');
         * I.waitForElement('.btn.continue', 5); // wait for 5 secs
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForDetached(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for element to become clickable for number of seconds.
         *
         * ```js
         * I.waitForClickable('#link');
         * ```
         */
        waitForClickable(): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number, sec?: number): void;
        /**
         * Waits for element to become enabled (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional) time in seconds to wait, 1 by default.
         * {--end--}
         */
        waitForEnabled(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for the specified value to be in value attribute.
         *
         * ```js
         * I.waitForValue('//input', "GoodValue");
         * ```
         *
         * @param {string|object} field input field.
         * @param {string }value expected value.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForValue(field: string | any, value: string, sec?: number): void;
        /**
         * Waits for a function to return true (waits for 1 sec by default).
         * Running in browser context.
         *
         * ```js
         * I.waitForFunction(fn[, [args[, timeout]])
         * ```
         *
         * ```js
         * I.waitForFunction(() => window.requests == 0);
         * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
         * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
         * ```
         *
         * @param {string|function} fn to be executed in browser context.
         * @param {any[]|number} [argsOrSec] (optional, `1` by default) arguments for function or seconds.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for a function to return true (waits for 1sec by default).
         *
         * ```js
         * I.waitUntil(() => window.requests == 0);
         * I.waitUntil(() => window.requests == 0, 5);
         * ```
         *
         * @param {function|string} fn function which is executed in browser context.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {string} [timeoutMsg=''] message to show in case of timeout fail.
         * @param {?number} [interval=null]
         * {--end--}
         */
        waitUntil(fn: ((...params: any[]) => any) | string, sec?: number, timeoutMsg?: string, interval?: number): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitUrlEquals(urlPart: string, sec?: number): void;
        /**
         * Waits for a text to appear (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * Narrow down search results by providing context.
         *
         * ```js
         * I.waitForText('Thank you, form has been submitted');
         * I.waitForText('Thank you, form has been submitted', 5, '#modal');
         * ```
         *
         * @param {string }text to wait for.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator.
         * {--end--}
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Moves to url
         */
        moveTo(): void;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         * {--end--}
         */
        refreshPage(): void;
        /**
         * Reloads page
         */
        refresh(): void;
        /**
         * Scrolls to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.scrollTo('footer');
         * I.scrollTo('#submit', 5, 5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         * {--end--}
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
         * {--end--}
         */
        scrollPageToBottom(): void;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         *
         * @returns {Promise<Object<string, *>>} scroll position
         * {--end--}
         */
        grabPageScrollPosition(): Promise<{
            [key: string]: any;
        }>;
        /**
         * Injects Angular module.
         *
         * ```js
         * I.haveModule('modName', function() {
         *   angular.module('modName', []).value('foo', 'bar');
         * });
         * ```
         */
        haveModule(): void;
        /**
         * Removes mocked Angular module. If modName not specified - clears all mock modules.
         *
         * ```js
         * I.resetModule(); // clears all
         * I.resetModule('modName');
         * ```
         */
        resetModule(): void;
        /**
         * Sets a cookie.
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         * ```
         *
         * @param {object} cookie a cookie object.
         * {--end--}
         */
        setCookie(cookie: any): void;
    }
    class Puppeteer {
        /**
         * Set the automatic popup response to Accept.
         * This must be set before a popup is triggered.
         *
         * ```js
         * I.amAcceptingPopups();
         * I.click('#triggerPopup');
         * I.acceptPopup();
         * ```
         */
        amAcceptingPopups(): void;
        /**
         * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
         * Don't confuse popups with modal windows, as created by [various
         * libraries](http://jster.net/category/windows-modals-popups).
         */
        acceptPopup(): void;
        /**
         * Set the automatic popup response to Cancel/Dismiss.
         * This must be set before a popup is triggered.
         *
         * ```js
         * I.amCancellingPopups();
         * I.click('#triggerPopup');
         * I.cancelPopup();
         * ```
         */
        amCancellingPopups(): void;
        /**
         * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
         */
        cancelPopup(): void;
        /**
         * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
         * given string.
         */
        seeInPopup(): void;
        /**
         * Set current page
         * @param {object} page page to set
         */
        _setPage(page: any): void;
        /**
         * Add the 'dialog' event listener to a page
         * @page {Puppeteer.Page}
         *
         * The popup listener handles the dialog with the predefined action when it appears on the page.
         * It also saves a reference to the object which is used in seeInPopup.
         */
        _addPopupListener(): void;
        /**
         * Gets page URL including hash.
         */
        _getPageUrl(): void;
        /**
         * Grab the text within the popup. If no popup is visible then it will return null
         *
         * ```js
         * await I.grabPopupText();
         * ```
         * @return {Promise<string | null>}
         */
        grabPopupText(): Promise<string | null>;
        /**
         * Opens a web page in a browser. Requires relative or absolute url.
         * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
         *
         * ```js
         * I.amOnPage('/'); // opens main page of website
         * I.amOnPage('https://github.com'); // opens github
         * I.amOnPage('/login'); // opens a login page
         * ```
         *
         * @param {string} url url path or global url.
         * {--end--}
         */
        amOnPage(url: string): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         *
         * @param {number} width width in pixels or `maximize`.
         * @param {number} height height in pixels.
         * {--end--}
         *
         * Unlike other drivers Puppeteer changes the size of a viewport, not the window!
         * Puppeteer does not control the window of a browser so it can't adjust its real size.
         * It also can't maximize a window.
         */
        resizeWindow(width: number, height: number): void;
        /**
         * Set headers for all next requests
         *
         * ```js
         * I.haveRequestHeaders({
         *    'X-Sent-By': 'CodeceptJS',
         * });
         * ```
         *
         * @param {object} customHeaders headers to set
         */
        haveRequestHeaders(customHeaders: any): void;
        /**
         * Moves cursor to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.moveCursorTo('.tooltip');
         * I.moveCursorTo('#submit', 5,5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         * {{ react }}
         */
        moveCursorTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Drag an item to a destination element.
         *
         * ```js
         * I.dragAndDrop('#dragHandle', '#container');
         * ```
         *
         * @param {string|object} srcElement located by CSS|XPath|strict locator.
         * @param {string|object} destElement located by CSS|XPath|strict locator.
         * {--end--}
         */
        dragAndDrop(srcElement: string | any, destElement: string | any): void;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         * {--end--}
         */
        refreshPage(): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         * {--end--}
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
         * {--end--}
         */
        scrollPageToBottom(): void;
        /**
         * Scrolls to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.scrollTo('footer');
         * I.scrollTo('#submit', 5, 5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         *
         * @param {string} text text value to check.
         * {--end--}
         */
        seeInTitle(text: string): void;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         *
         * @returns {Promise<Object<string, *>>} scroll position
         * {--end--}
         */
        grabPageScrollPosition(): Promise<{
            [key: string]: any;
        }>;
        /**
         * Checks that title is equal to provided one.
         *
         * ```js
         * I.seeTitleEquals('Test title.');
         * ```
         */
        seeTitleEquals(): void;
        /**
         * Checks that title does not contain text.
         *
         * ```js
         * I.dontSeeInTitle('Error');
         * ```
         *
         * @param {string} text value to check.
         * {--end--}
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         *
         * @returns {Promise<string>} title
         * {--end--}
         */
        grabTitle(): Promise<string>;
        /**
         * Get elements by different locator types, including strict locator
         * Should be used in custom helpers:
         *
         * ```js
         * const elements = await this.helpers['Puppeteer']._locate({name: 'password'});
         * ```
         *
         * {{ react }}
         */
        _locate(): void;
        /**
         * Find a checkbox by providing human readable text:
         * NOTE: Assumes the checkable element exists
         *
         * ```js
         * this.helpers['Puppeteer']._locateCheckable('I agree with terms and conditions').then // ...
         * ```
         */
        _locateCheckable(): void;
        /**
         * Find a clickable element by providing human readable text:
         *
         * ```js
         * this.helpers['Puppeteer']._locateClickable('Next page').then // ...
         * ```
         */
        _locateClickable(): void;
        /**
         * Find field elements by providing human readable text:
         *
         * ```js
         * this.helpers['Puppeteer']._locateFields('Your email').then // ...
         * ```
         */
        _locateFields(): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
         *
         * ```js
         * I.switchToNextTab();
         * I.switchToNextTab(2);
         * ```
         *
         * @param {number} [num=1]
         */
        switchToNextTab(num?: number): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
         *
         * ```js
         * I.switchToPreviousTab();
         * I.switchToPreviousTab(2);
         * ```
         * @param {number} [num=1]
         */
        switchToPreviousTab(num?: number): void;
        /**
         * Close current tab and switches to previous.
         *
         * ```js
         * I.closeCurrentTab();
         * ```
         */
        closeCurrentTab(): void;
        /**
         * Close all tabs except for the current one.
         *
         * ```js
         * I.closeOtherTabs();
         * ```
         */
        closeOtherTabs(): void;
        /**
         * Open new tab and switch to it
         *
         * ```js
         * I.openNewTab();
         * ```
         */
        openNewTab(): void;
        /**
         * Grab number of open tabs.
         *
         * ```js
         * let tabs = await I.grabNumberOfOpenTabs();
         * ```
         *
         * @returns {Promise<number>} number of open tabs
         * {--end--}
         */
        grabNumberOfOpenTabs(): Promise<number>;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * {--end--}
         * {{ react }}
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         * {{ react }}
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * {--end--}
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Perform a click on a link or a button, given by a locator.
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.click('Logout');
         * // button of form
         * I.click('Submit');
         * // CSS button
         * I.click('#form input[type=submit]');
         * // XPath
         * I.click('//form/*[@type=submit]');
         * // link in context
         * I.click('Logout', '#nav');
         * // using strict locator
         * I.click({css: 'nav a.login'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         *
         * {{ react }}
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs a click on a link and waits for navigation before moving on.
         *
         * ```js
         * I.clickLink('Logout', '#nav');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator
         * {--end--}
         *
         * {{ react }}
         */
        clickLink(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Sets a directory to where save files. Allows to test file downloads.
         * Should be used with [FileSystem helper](https://codecept.io/helpers/FileSystem) to check that file were downloaded correctly.
         *
         * By default files are saved to `output/downloads`.
         * This directory is cleaned on every `handleDownloads` call, to ensure no old files are kept.
         *
         * ```js
         * I.handleDownloads();
         * I.click('Download Avatar');
         * I.amInPath('output/downloads');
         * I.seeFile('avatar.jpg');
         *
         * ```
         *
         * @param {string} [downloadPath='downloads'] change this parameter to set another directory for saving
         */
        handleDownloads(downloadPath?: string): void;
        /**
         * This method is **deprecated**.
         *
         * Please use `handleDownloads()` instead.
         */
        downloadFile(): void;
        /**
         * Performs a double-click on an element matched by link|button|label|CSS or XPath.
         * Context can be specified as second parameter to narrow search.
         *
         * ```js
         * I.doubleClick('Edit');
         * I.doubleClick('Edit', '.actions');
         * I.doubleClick({css: 'button.accept'});
         * I.doubleClick('.btn.edit');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         *
         * {{ react }}
         */
        doubleClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
         *
         * ```js
         * // right click element with id el
         * I.rightClick('#el');
         * // right click link or button with text "Click me"
         * I.rightClick('Click me');
         * // right click button with text "Click me" inside .context
         * I.rightClick('Click me', '.context');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         *
         * {{ react }}
         */
        rightClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Selects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.checkOption('#agree');
         * I.checkOption('I Agree to Terms and Conditions');
         * I.checkOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         */
        checkOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Unselects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.uncheckOption('#agree');
         * I.uncheckOption('I Agree to Terms and Conditions');
         * I.uncheckOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         */
        uncheckOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is checked.
         *
         * ```js
         * I.seeCheckboxIsChecked('Agree');
         * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
         * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        seeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is not checked.
         *
         * ```js
         * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
         * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
         * I.dontSeeCheckboxIsChecked('agree'); // located by name
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        dontSeeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Presses a key in the browser and leaves it in a down state.
         *
         * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
         *
         * ```js
         * I.pressKeyDown('Control');
         * I.click('#element');
         * I.pressKeyUp('Control');
         * ```
         *
         * @param {string} key name of key to press down.
         * {--end--}
         */
        pressKeyDown(key: string): void;
        /**
         * Releases a key in the browser which was previously set to a down state.
         *
         * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
         *
         * ```js
         * I.pressKeyDown('Control');
         * I.click('#element');
         * I.pressKeyUp('Control');
         * ```
         *
         * @param {string} key name of key to release.
         * {--end--}
         */
        pressKeyUp(key: string): void;
        /**
         * Presses a key in the browser (on a focused element).
         *
         * _Hint:_ For populating text field or textarea, it is recommended to use [`fillField`](#fillfield).
         *
         * ```js
         * I.pressKey('Backspace');
         * ```
         *
         * To press a key in combination with modifier keys, pass the sequence as an array. All modifier keys (`'Alt'`, `'Control'`, `'Meta'`, `'Shift'`) will be released afterwards.
         *
         * ```js
         * I.pressKey(['Control', 'Z']);
         * ```
         *
         * For specifying operation modifier key based on operating system it is suggested to use `'CommandOrControl'`.
         * This will press `'Command'` (also known as `'Meta'`) on macOS machines and `'Control'` on non-macOS machines.
         *
         * ```js
         * I.pressKey(['CommandOrControl', 'Z']);
         * ```
         *
         * Some of the supported key names are:
         * - `'AltLeft'` or `'Alt'`
         * - `'AltRight'`
         * - `'ArrowDown'`
         * - `'ArrowLeft'`
         * - `'ArrowRight'`
         * - `'ArrowUp'`
         * - `'Backspace'`
         * - `'Clear'`
         * - `'ControlLeft'` or `'Control'`
         * - `'ControlRight'`
         * - `'Command'`
         * - `'CommandOrControl'`
         * - `'Delete'`
         * - `'End'`
         * - `'Enter'`
         * - `'Escape'`
         * - `'F1'` to `'F12'`
         * - `'Home'`
         * - `'Insert'`
         * - `'MetaLeft'` or `'Meta'`
         * - `'MetaRight'`
         * - `'Numpad0'` to `'Numpad9'`
         * - `'NumpadAdd'`
         * - `'NumpadDecimal'`
         * - `'NumpadDivide'`
         * - `'NumpadMultiply'`
         * - `'NumpadSubtract'`
         * - `'PageDown'`
         * - `'PageUp'`
         * - `'Pause'`
         * - `'Return'`
         * - `'ShiftLeft'` or `'Shift'`
         * - `'ShiftRight'`
         * - `'Space'`
         * - `'Tab'`
         *
         * @param {string|string[]} key key or array of keys to press.
         * {--end--}
         *
         * _Note:_ Shortcuts like `'Meta'` + `'A'` do not work on macOS ([GoogleChrome/puppeteer#1313](https://github.com/GoogleChrome/puppeteer/issues/1313)).
         */
        pressKey(key: string | string[]): void;
        /**
         * Fills a text field or textarea, after clearing its value, with the given string.
         * Field is located by name, label, CSS, or XPath.
         *
         * ```js
         * // by label
         * I.fillField('Email', 'hello@world.com');
         * // by name
         * I.fillField('password', secret('123456'));
         * // by CSS
         * I.fillField('form#login input[name=username]', 'John');
         * // or by strict locator
         * I.fillField({css: 'form#login input[name=username]'}, 'John');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value text value to fill.
         * {--end--}
         * {{ react }}
         */
        fillField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Clears a `<textarea>` or text `<input>` element's value.
         *
         * ```js
         * I.clearField('Email');
         * I.clearField('user[email]');
         * I.clearField('#email');
         * ```
         * @param {string|object} editable field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        clearField(editable: string | any): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator
         * @param {string} value text value to append.
         * {--end--}
         *
         * {{ react }}
         */
        appendField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that the given input field or textarea equals to given value.
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.seeInField('Username', 'davert');
         * I.seeInField({css: 'form textarea'},'Type your comment here');
         * I.seeInField('form input[type=hidden]','hidden_value');
         * I.seeInField('#searchform input','Search');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         */
        seeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that value of input field or textarea doesn't equal to given value
         * Opposite to `seeInField`.
         *
         * ```js
         * I.dontSeeInField('email', 'user@user.com'); // field by name
         * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         */
        dontSeeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Attaches a file to element located by label, name, CSS or XPath
         * Path to file is relative current codecept directory (where codecept.json or codecept.conf.js is located).
         * File will be uploaded to remote system (if tests are running remotely).
         *
         * ```js
         * I.attachFile('Avatar', 'data/avatar.jpg');
         * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @param {string} pathToFile local file path relative to codecept.json config file.
         * {--end--}
         */
        attachFile(locator: CodeceptJS.LocatorOrString, pathToFile: string): void;
        /**
         * Selects an option in a drop-down select.
         * Field is searched by label | name | CSS | XPath.
         * Option is selected by visible text or by value.
         *
         * ```js
         * I.selectOption('Choose Plan', 'Monthly'); // select by label
         * I.selectOption('subscription', 'Monthly'); // match option by text
         * I.selectOption('subscription', '0'); // or by value
         * I.selectOption('//form/select[@name=account]','Premium');
         * I.selectOption('form select[name=account]', 'Premium');
         * I.selectOption({css: 'form select[name=account]'}, 'Premium');
         * ```
         *
         * Provide an array for the second argument to select multiple options.
         *
         * ```js
         * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
         * ```
         * @param {CodeceptJS.LocatorOrString} select field located by label|name|CSS|XPath|strict locator.
         * @param {string|Array<*>} option visible text or value of option.
         * {--end--}
         */
        selectOption(select: CodeceptJS.LocatorOrString, option: string | any[]): void;
        /**
         * Grab number of visible elements by locator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @returns {Promise<number>} number of visible elements
         * {--end--}
         * {{ react }}
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         *
         * @param {string} url a fragment to check
         * {--end--}
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         *
         * @param {string} url value to check.
         * {--end--}
         */
        dontSeeInCurrentUrl(url: string): void;
        /**
         * Checks that current url is equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         * So both examples will work:
         *
         * ```js
         * I.seeCurrentUrlEquals('/register');
         * I.seeCurrentUrlEquals('http://my.site.com/register');
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         */
        seeCurrentUrlEquals(url: string): void;
        /**
         * Checks that current url is not equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         *
         * ```js
         * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
         * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         */
        dontSeeCurrentUrlEquals(url: string): void;
        /**
         * Checks that a page contains a visible text.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.see('Welcome'); // text welcome on a page
         * I.see('Welcome', '.content'); // text inside .content div
         * I.see('Register', {css: 'form.register'}); // use strict locator
         * ```
         * @param {string} text expected on page.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
         * {--end--}
         *
         * {{ react }}
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that text is equal to provided one.
         *
         * ```js
         * I.seeTextEquals('text', 'h1');
         * ```
         */
        seeTextEquals(): void;
        /**
         * Opposite to `see`. Checks that a text is not present on a page.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.dontSee('Login'); // assume we are already logged in.
         * I.dontSee('Login', '.nav'); // no login inside .nav element
         * ```
         *
         * @param {string} text which is not present.
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         * {--end--}
         *
         * {{ react }}
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         *
         * @returns {Promise<string>} source code
         * {--end--}
         */
        grabSource(): Promise<string>;
        /**
         * Get JS log from browser.
         *
         * ```js
         * let logs = await I.grabBrowserLogs();
         * console.log(JSON.stringify(logs))
         * ```
         * @return {Promise<any[]>}
         */
        grabBrowserLogs(): Promise<any[]>;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         *
         * @returns {Promise<string>} current URL
         * {--end--}
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param {string} text value to check.
         * {--end--}
         */
        seeInSource(text: string): void;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         *
         * @param {string} value to check.
         * {--end--}
         */
        dontSeeInSource(value: string): void;
        /**
         * Asserts that an element appears a given number of times in the DOM.
         * Element is located by label or name or CSS or XPath.
         *
         *
         * ```js
         * I.seeNumberOfElements('#submitBtn', 1);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         *
         * {{ react }}
         */
        seeNumberOfElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         *
         * {{ react }}
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Sets a cookie.
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         * ```
         *
         * @param {object} cookie a cookie object.
         * {--end--}
         */
        setCookie(cookie: any): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         *
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         *
         * @param {?string} [name=null] cookie name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         *
         * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
         */
        grabCookie(name?: string): Promise<string>;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         *
         * @param {?string} [cookie=null] (optional, `null` by default) cookie name
         * {--end--}
         */
        clearCookie(cookie?: string): void;
        /**
         * Executes sync script on a page.
         * Pass arguments to function as additional parameters.
         * Will return execution result to a test.
         * In this case you should use async function and await to receive results.
         *
         * Example with jQuery DatePicker:
         *
         * ```js
         * // change date of jQuery DatePicker
         * I.executeScript(function() {
         *   // now we are inside browser context
         *   $('date').datetimepicker('setDate', new Date());
         * });
         * ```
         * Can return values. Don't forget to use `await` to get them.
         *
         * ```js
         * let date = await I.executeScript(function(el) {
         *   // only basic types can be returned
         *   return $(el).datetimepicker('getDate').toString();
         * }, '#date'); // passing jquery selector
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         *
         * If a function returns a Promise It will wait for it resolution.
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Executes async script on page.
         * Provided function should execute a passed callback (as first argument) to signal it is finished.
         *
         * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
         *
         * ```js
         * I.executeAsyncScript(function(done) {
         *   Vue.nextTick(done); // waiting for next tick
         * });
         * ```
         *
         * By passing value to `done()` function you can return values.
         * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
         *
         * ```js
         * let val = await I.executeAsyncScript(function(url, done) {
         *   // in browser context
         *   $.ajax(url, { success: (data) => done(data); }
         * }, 'http://ajax.callback.url/');
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         *
         * Asynchronous scripts can also be executed with `executeScript` if a function returns a Promise.
         */
        executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns an array of texts.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @returns {Promise<string|string[]>} attribute value
         * {--end--}
         * {{ react }}
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string | string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @returns {Promise<string>} attribute value
         * {--end--}
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - an array of HTMLs returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} element located by CSS|XPath|strict locator.
         * @returns {Promise<string>} HTML code for an element
         * {--end--}
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Grab CSS property for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} cssProperty CSS property name.
         * @returns {Promise<string>} CSS value
         * {--end--}
         * {{ react }}
         */
        grabCssPropertyFrom(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string>;
        /**
         * Checks that all elements with given locator have given CSS properties.
         *
         * ```js
         * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {object} cssProperties object with CSS properties and their values to check.
         * {--end--}
         * {{ react }}
         */
        seeCssPropertiesOnElements(locator: CodeceptJS.LocatorOrString, cssProperties: any): void;
        /**
         * Checks that all elements with given locator have given attributes.
         *
         * ```js
         * I.seeAttributesOnElements('//form', { method: "post"});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {object} attributes attributes and their values to check.
         * {--end--}
         * {{ react }}
         */
        seeAttributesOnElements(locator: CodeceptJS.LocatorOrString, attributes: any): void;
        /**
         * Drag the scrubber of a slider to a given position
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.dragSlider('#slider', 30);
         * I.dragSlider('#slider', -70);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by label|name|CSS|XPath|strict locator.
         * @param {number} offsetX position to drag.
         * {--end--}
         * {{ react }}
         */
        dragSlider(locator: CodeceptJS.LocatorOrString, offsetX: number): void;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * An array as a result will be returned if there are more than one matched element.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} attr attribute name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         * {{ react }}
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         *
         * @param {string} fileName file name to save.
         * @param {boolean} [fullPage=false] (optional, `false` by default) flag to enable fullscreen screenshot mode.
         * {--end--}
         */
        saveScreenshot(fileName: string, fullPage?: boolean): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         *
         * @param {number} sec number of second to wait.
         * {--end--}
         */
        wait(sec: number): void;
        /**
         * Waits for element to become enabled (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional) time in seconds to wait, 1 by default.
         * {--end--}
         */
        waitForEnabled(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for the specified value to be in value attribute.
         *
         * ```js
         * I.waitForValue('//input', "GoodValue");
         * ```
         *
         * @param {string|object} field input field.
         * @param {string }value expected value.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForValue(field: string | any, value: string, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         * {{ react }}
         */
        waitNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number, sec?: number): void;
        /**
         * Waits for element to be clickable (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForClickable('.btn.continue');
         * I.waitForClickable('.btn.continue', 5); // wait for 5 secs
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForClickable(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for element to be present on page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForElement('.btn.continue');
         * I.waitForElement('.btn.continue', 5); // wait for 5 secs
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         * {{ react }}
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         * This method accepts [React selectors](https://codecept.io/react).
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitUrlEquals(urlPart: string, sec?: number): void;
        /**
         * Waits for a text to appear (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * Narrow down search results by providing context.
         *
         * ```js
         * I.waitForText('Thank you, form has been submitted');
         * I.waitForText('Thank you, form has been submitted', 5, '#modal');
         * ```
         *
         * @param {string }text to wait for.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator.
         * {--end--}
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Waits for a network request.
         *
         * ```js
         * I.waitForRequest('http://example.com/resource');
         * I.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
         * ```
         *
         * @param {string|function} urlOrPredicate
         * @param {?number} [sec=null] seconds to wait
         */
        waitForRequest(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
        /**
         * Waits for a network request.
         *
         * ```js
         * I.waitForResponse('http://example.com/resource');
         * I.waitForResponse(request => request.url() === 'http://example.com' && request.method() === 'GET');
         * ```
         *
         * @param {string|function} urlOrPredicate
         * @param {?number} [sec=null] number of seconds to wait
         */
        waitForResponse(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         *
         * @param {?CodeceptJS.LocatorOrString} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         */
        switchTo(locator?: CodeceptJS.LocatorOrString): void;
        /**
         * Waits for a function to return true (waits for 1 sec by default).
         * Running in browser context.
         *
         * ```js
         * I.waitForFunction(fn[, [args[, timeout]])
         * ```
         *
         * ```js
         * I.waitForFunction(() => window.requests == 0);
         * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
         * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
         * ```
         *
         * @param {string|function} fn to be executed in browser context.
         * @param {any[]|number} [argsOrSec] (optional, `1` by default) arguments for function or seconds.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for navigation to finish. By default takes configured `waitForNavigation` option.
         *
         * See [Pupeteer's reference](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions)
         *
         * @param {*} opts
         */
        waitForNavigation(opts: any): void;
        /**
         * Waits for a function to return true (waits for 1sec by default).
         *
         * ```js
         * I.waitUntil(() => window.requests == 0);
         * I.waitUntil(() => window.requests == 0, 5);
         * ```
         *
         * @param {function|string} fn function which is executed in browser context.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {string} [timeoutMsg=''] message to show in case of timeout fail.
         * @param {?number} [interval=null]
         * {--end--}
         */
        waitUntil(fn: ((...params: any[]) => any) | string, sec?: number, timeoutMsg?: string, interval?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForDetached(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Grab the data from performance timing using Navigation Timing API.
         * The returned data will contain following things in ms:
         * - responseEnd,
         * - domInteractive,
         * - domContentLoadedEventEnd,
         * - loadEventEnd
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * await I.amOnPage('https://example.com');
         * let data = await I.grabDataFromPerformanceTiming();
         * //Returned data
         * { // all results are in [ms]
         *   responseEnd: 23,
         *   domInteractive: 44,
         *   domContentLoadedEventEnd: 196,
         *   loadEventEnd: 241
         * }
         * ```
         * {--end--}
         */
        grabDataFromPerformanceTiming(): void;
        /**
         * Grab the width, height, location of given locator.
         * Provide `width` or `height`as second param to get your desired prop.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * Returns an object with `x`, `y`, `width`, `height` keys.
         *
         * ```js
         * const value = await I.grabElementBoundingRect('h3');
         * // value is like { x: 226.5, y: 89, width: 527, height: 220 }
         * ```
         *
         * To get only one metric use second parameter:
         *
         * ```js
         * const width = await I.grabElementBoundingRect('h3', 'width');
         * // width == 527
         * ```
         * @param {string|object} locator element located by CSS|XPath|strict locator.
         * @param {string} elementSize x, y, width or height of the given element.
         * @returns {object} Element bounding rectangle
         * {--end--}
         */
        grabElementBoundingRect(locator: string | any, elementSize: string): any;
    }
    class REST {
        /**
         * Executes axios request
         *
         * @param {*} request
         */
        _executeRequest(request: any): void;
        /**
         * Generates url based on format sent (takes endpoint + url if latter lacks 'http')
         *
         * @param {*} url
         */
        _url(url: any): void;
        /**
         * Set timeout for the request
         *
         * ```js
         * I.setRequestTimeout(10000); // In milliseconds
         * ```
         *
         */
        setRequestTimeout(): void;
        /**
         * Send GET request to REST API
         *
         * ```js
         * I.sendGetRequest('/api/users.json');
         * ```
         *
         * @param {*} url
         * @param {object} headers
         */
        sendGetRequest(url: any, headers: any): void;
        /**
         * Sends POST request to API.
         *
         * ```js
         * I.sendPostRequest('/api/users.json', { "email": "user@user.com" });
         * ```
         *
         * @param {*} url
         * @param {*} payload
         * @param {object} headers
         */
        sendPostRequest(url: any, payload: any, headers: any): void;
        /**
         * Sends PATCH request to API.
         *
         * ```js
         * I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
         * ```
         *
         * @param {string} url
         * @param {object} payload
         * @param {object} headers
         */
        sendPatchRequest(url: string, payload: any, headers: any): void;
        /**
         * Sends PUT request to API.
         *
         * ```js
         * I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
         * ```
         *
         * @param {string} url
         * @param {object} payload
         * @param {object} headers
         */
        sendPutRequest(url: string, payload: any, headers: any): void;
        /**
         * Sends DELETE request to API.
         *
         * ```js
         * I.sendDeleteRequest('/api/users/1');
         * ```
         *
         * @param {*} url
         * @param {object} headers
         */
        sendDeleteRequest(url: any, headers: any): void;
    }
    class SeleniumWebdriver {
    }
    /**
     * Client Functions
     */
    function getPageUrl(): void;
    class TestCafe {
        /**
         * Get elements by different locator types, including strict locator
         * Should be used in custom helpers:
         *
         * ```js
         * const elements = await this.helpers['TestCafe']._locate('.item');
         * ```
         *
         */
        _locate(): void;
        /**
         * Opens a web page in a browser. Requires relative or absolute url.
         * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
         *
         * ```js
         * I.amOnPage('/'); // opens main page of website
         * I.amOnPage('https://github.com'); // opens github
         * I.amOnPage('/login'); // opens a login page
         * ```
         *
         * @param {string} url url path or global url.
         * {--end--}
         */
        amOnPage(url: string): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         *
         * @param {number} width width in pixels or `maximize`.
         * @param {number} height height in pixels.
         * {--end--}
         */
        resizeWindow(width: number, height: number): void;
        /**
         * Perform a click on a link or a button, given by a locator.
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.click('Logout');
         * // button of form
         * I.click('Submit');
         * // CSS button
         * I.click('#form input[type=submit]');
         * // XPath
         * I.click('//form/*[@type=submit]');
         * // link in context
         * I.click('Logout', '#nav');
         * // using strict locator
         * I.click({css: 'nav a.login'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         *
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         * {--end--}
         */
        refreshPage(): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Fills a text field or textarea, after clearing its value, with the given string.
         * Field is located by name, label, CSS, or XPath.
         *
         * ```js
         * // by label
         * I.fillField('Email', 'hello@world.com');
         * // by name
         * I.fillField('password', secret('123456'));
         * // by CSS
         * I.fillField('form#login input[name=username]', 'John');
         * // or by strict locator
         * I.fillField({css: 'form#login input[name=username]'}, 'John');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value text value to fill.
         * {--end--}
         */
        fillField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Clears a `<textarea>` or text `<input>` element's value.
         *
         * ```js
         * I.clearField('Email');
         * I.clearField('user[email]');
         * I.clearField('#email');
         * ```
         * @param {string|object} editable field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        clearField(editable: string | any): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator
         * @param {string} value text value to append.
         * {--end--}
         *
         */
        appendField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Attaches a file to element located by label, name, CSS or XPath
         * Path to file is relative current codecept directory (where codecept.json or codecept.conf.js is located).
         * File will be uploaded to remote system (if tests are running remotely).
         *
         * ```js
         * I.attachFile('Avatar', 'data/avatar.jpg');
         * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @param {string} pathToFile local file path relative to codecept.json config file.
         * {--end--}
         *
         */
        attachFile(locator: CodeceptJS.LocatorOrString, pathToFile: string): void;
        /**
         * Presses a key on a focused element.
         * Special keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
         * will be replaced with corresponding unicode.
         * If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.
         *
         * ```js
         * I.pressKey('Enter');
         * I.pressKey(['Control','a']);
         * ```
         *
         * @param {string|string[]} key key or array of keys to press.
         * {--end--}
         *
         * {{ keys }}
         */
        pressKey(key: string | string[]): void;
        /**
         * Moves cursor to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.moveCursorTo('.tooltip');
         * I.moveCursorTo('#submit', 5,5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         *
         */
        moveCursorTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Performs a double-click on an element matched by link|button|label|CSS or XPath.
         * Context can be specified as second parameter to narrow search.
         *
         * ```js
         * I.doubleClick('Edit');
         * I.doubleClick('Edit', '.actions');
         * I.doubleClick({css: 'button.accept'});
         * I.doubleClick('.btn.edit');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         *
         */
        doubleClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
         *
         * ```js
         * // right click element with id el
         * I.rightClick('#el');
         * // right click link or button with text "Click me"
         * I.rightClick('Click me');
         * // right click button with text "Click me" inside .context
         * I.rightClick('Click me', '.context');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         *
         */
        rightClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Selects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.checkOption('#agree');
         * I.checkOption('I Agree to Terms and Conditions');
         * I.checkOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         */
        checkOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Unselects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.uncheckOption('#agree');
         * I.uncheckOption('I Agree to Terms and Conditions');
         * I.uncheckOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         */
        uncheckOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is checked.
         *
         * ```js
         * I.seeCheckboxIsChecked('Agree');
         * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
         * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        seeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is not checked.
         *
         * ```js
         * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
         * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
         * I.dontSeeCheckboxIsChecked('agree'); // located by name
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         */
        dontSeeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Selects an option in a drop-down select.
         * Field is searched by label | name | CSS | XPath.
         * Option is selected by visible text or by value.
         *
         * ```js
         * I.selectOption('Choose Plan', 'Monthly'); // select by label
         * I.selectOption('subscription', 'Monthly'); // match option by text
         * I.selectOption('subscription', '0'); // or by value
         * I.selectOption('//form/select[@name=account]','Premium');
         * I.selectOption('form select[name=account]', 'Premium');
         * I.selectOption({css: 'form select[name=account]'}, 'Premium');
         * ```
         *
         * Provide an array for the second argument to select multiple options.
         *
         * ```js
         * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
         * ```
         * @param {CodeceptJS.LocatorOrString} select field located by label|name|CSS|XPath|strict locator.
         * @param {string|Array<*>} option visible text or value of option.
         * {--end--}
         */
        selectOption(select: CodeceptJS.LocatorOrString, option: string | any[]): void;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         *
         * @param {string} url a fragment to check
         * {--end--}
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         *
         * @param {string} url value to check.
         * {--end--}
         */
        dontSeeInCurrentUrl(url: string): void;
        /**
         * Checks that current url is equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         * So both examples will work:
         *
         * ```js
         * I.seeCurrentUrlEquals('/register');
         * I.seeCurrentUrlEquals('http://my.site.com/register');
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         */
        seeCurrentUrlEquals(url: string): void;
        /**
         * Checks that current url is not equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         *
         * ```js
         * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
         * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         */
        dontSeeCurrentUrlEquals(url: string): void;
        /**
         * Checks that a page contains a visible text.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.see('Welcome'); // text welcome on a page
         * I.see('Welcome', '.content'); // text inside .content div
         * I.see('Register', {css: 'form.register'}); // use strict locator
         * ```
         * @param {string} text expected on page.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
         * {--end--}
         *
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `see`. Checks that a text is not present on a page.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.dontSee('Login'); // assume we are already logged in.
         * I.dontSee('Login', '.nav'); // no login inside .nav element
         * ```
         *
         * @param {string} text which is not present.
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         * {--end--}
         *
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * {--end--}
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * {--end--}
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         *
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Grab number of visible elements by locator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @returns {Promise<number>} number of visible elements
         * {--end--}
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Checks that the given input field or textarea equals to given value.
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.seeInField('Username', 'davert');
         * I.seeInField({css: 'form textarea'},'Type your comment here');
         * I.seeInField('form input[type=hidden]','hidden_value');
         * I.seeInField('#searchform input','Search');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         */
        seeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that value of input field or textarea doesn't equal to given value
         * Opposite to `seeInField`.
         *
         * ```js
         * I.dontSeeInField('email', 'user@user.com'); // field by name
         * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         */
        dontSeeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that text is equal to provided one.
         *
         * ```js
         * I.seeTextEquals('text', 'h1');
         * ```
         */
        seeTextEquals(): void;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param {string} text value to check.
         * {--end--}
         */
        seeInSource(text: string): void;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         *
         * @param {string} value to check.
         * {--end--}
         */
        dontSeeInSource(value: string): void;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         *
         * @param {string} fileName file name to save.
         * @param {boolean} [fullPage=false] (optional, `false` by default) flag to enable fullscreen screenshot mode.
         * {--end--}
         */
        saveScreenshot(fileName: string, fullPage?: boolean): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         *
         * @param {number} sec number of second to wait.
         * {--end--}
         */
        wait(sec: number): void;
        /**
         * Executes sync script on a page.
         * Pass arguments to function as additional parameters.
         * Will return execution result to a test.
         * In this case you should use async function and await to receive results.
         *
         * Example with jQuery DatePicker:
         *
         * ```js
         * // change date of jQuery DatePicker
         * I.executeScript(function() {
         *   // now we are inside browser context
         *   $('date').datetimepicker('setDate', new Date());
         * });
         * ```
         * Can return values. Don't forget to use `await` to get them.
         *
         * ```js
         * let date = await I.executeScript(function(el) {
         *   // only basic types can be returned
         *   return $(el).datetimepicker('getDate').toString();
         * }, '#date'); // passing jquery selector
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         *
         * If a function returns a Promise It will wait for it resolution.
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns an array of texts.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @returns {Promise<string|string[]>} attribute value
         * {--end--}
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string | string[]>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * An array as a result will be returned if there are more than one matched element.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} attr attribute name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @returns {Promise<string>} attribute value
         * {--end--}
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         *
         * @returns {Promise<string>} source code
         * {--end--}
         */
        grabSource(): Promise<string>;
        /**
         * Get JS log from browser.
         *
         * ```js
         * let logs = await I.grabBrowserLogs();
         * console.log(JSON.stringify(logs))
         * ```
         */
        grabBrowserLogs(): void;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         *
         * @returns {Promise<string>} current URL
         * {--end--}
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         *
         * @returns {Promise<Object<string, *>>} scroll position
         * {--end--}
         */
        grabPageScrollPosition(): Promise<{
            [key: string]: any;
        }>;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         * {--end--}
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
         * {--end--}
         */
        scrollPageToBottom(): void;
        /**
         * Scrolls to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.scrollTo('footer');
         * I.scrollTo('#submit', 5, 5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         *
         * @param {?CodeceptJS.LocatorOrString} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         */
        switchTo(locator?: CodeceptJS.LocatorOrString): void;
        /**
         * Sets a cookie.
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         * ```
         *
         * @param {object} cookie a cookie object.
         * {--end--}
         */
        setCookie(cookie: any): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         *
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         *
         * @param {?string} [name=null] cookie name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         *
         * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
         */
        grabCookie(name?: string): Promise<string>;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         *
         * @param {?string} [cookie=null] (optional, `null` by default) cookie name
         * {--end--}
         */
        clearCookie(cookie?: string): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitUrlEquals(urlPart: string, sec?: number): void;
        /**
         * Waits for a function to return true (waits for 1 sec by default).
         * Running in browser context.
         *
         * ```js
         * I.waitForFunction(fn[, [args[, timeout]])
         * ```
         *
         * ```js
         * I.waitForFunction(() => window.requests == 0);
         * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
         * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
         * ```
         *
         * @param {string|function} fn to be executed in browser context.
         * @param {any[]|number} [argsOrSec] (optional, `1` by default) arguments for function or seconds.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number, sec?: number): void;
        /**
         * Waits for element to be present on page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForElement('.btn.continue');
         * I.waitForElement('.btn.continue', 5); // wait for 5 secs
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for a text to appear (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * Narrow down search results by providing context.
         *
         * ```js
         * I.waitForText('Thank you, form has been submitted');
         * I.waitForText('Thank you, form has been submitted', 5, '#modal');
         * ```
         *
         * @param {string }text to wait for.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator.
         * {--end--}
         *
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
    }
    class WebDriver {
        /**
         * Get elements by different locator types, including strict locator.
         * Should be used in custom helpers:
         *
         * ```js
         * this.helpers['WebDriver']._locate({name: 'password'}).then //...
         * ```
         *
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         */
        _locate(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Find a checkbox by providing human readable text:
         *
         * ```js
         * this.helpers['WebDriver']._locateCheckable('I agree with terms and conditions').then // ...
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         */
        _locateCheckable(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Find a clickable element by providing human readable text:
         *
         * ```js
         * this.helpers['WebDriver']._locateClickable('Next page').then // ...
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         */
        _locateClickable(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Find field elements by providing human readable text:
         *
         * ```js
         * this.helpers['WebDriver']._locateFields('Your email').then // ...
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         */
        _locateFields(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Set [WebDriver timeouts](https://webdriver.io/docs/timeouts.html) in realtime.
         *
         * Timeouts are expected to be passed as object:
         *
         * ```js
         * I.defineTimeout({ script: 5000 });
         * I.defineTimeout({ implicit: 10000, pageLoad: 10000, script: 5000 });
         * ```
         *
         * @param {WebdriverIO.Timeouts} timeouts WebDriver timeouts object.
         */
        defineTimeout(timeouts: WebdriverIO.Timeouts): void;
        /**
         * Opens a web page in a browser. Requires relative or absolute url.
         * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
         *
         * ```js
         * I.amOnPage('/'); // opens main page of website
         * I.amOnPage('https://github.com'); // opens github
         * I.amOnPage('/login'); // opens a login page
         * ```
         *
         * @param {string} url url path or global url.
         * {--end--}
         *
         */
        amOnPage(url: string): void;
        /**
         * Perform a click on a link or a button, given by a locator.
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.click('Logout');
         * // button of form
         * I.click('Submit');
         * // CSS button
         * I.click('#form input[type=submit]');
         * // XPath
         * I.click('//form/*[@type=submit]');
         * // link in context
         * I.click('Logout', '#nav');
         * // using strict locator
         * I.click({css: 'nav a.login'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         *
         * {{ react }}
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs a double-click on an element matched by link|button|label|CSS or XPath.
         * Context can be specified as second parameter to narrow search.
         *
         * ```js
         * I.doubleClick('Edit');
         * I.doubleClick('Edit', '.actions');
         * I.doubleClick({css: 'button.accept'});
         * I.doubleClick('.btn.edit');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         *
         * {{ react }}
         */
        doubleClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
         *
         * ```js
         * // right click element with id el
         * I.rightClick('#el');
         * // right click link or button with text "Click me"
         * I.rightClick('Click me');
         * // right click button with text "Click me" inside .context
         * I.rightClick('Click me', '.context');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         *
         * {{ react }}
         */
        rightClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Fills a text field or textarea, after clearing its value, with the given string.
         * Field is located by name, label, CSS, or XPath.
         *
         * ```js
         * // by label
         * I.fillField('Email', 'hello@world.com');
         * // by name
         * I.fillField('password', secret('123456'));
         * // by CSS
         * I.fillField('form#login input[name=username]', 'John');
         * // or by strict locator
         * I.fillField({css: 'form#login input[name=username]'}, 'John');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value text value to fill.
         * {--end--}
         * {{ react }}
         *
         */
        fillField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator
         * @param {string} value text value to append.
         * {--end--}
         * {{ react }}
         */
        appendField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Clears a `<textarea>` or text `<input>` element's value.
         *
         * ```js
         * I.clearField('Email');
         * I.clearField('user[email]');
         * I.clearField('#email');
         * ```
         * @param {string|object} editable field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         *
         */
        clearField(editable: string | any): void;
        /**
         * Selects an option in a drop-down select.
         * Field is searched by label | name | CSS | XPath.
         * Option is selected by visible text or by value.
         *
         * ```js
         * I.selectOption('Choose Plan', 'Monthly'); // select by label
         * I.selectOption('subscription', 'Monthly'); // match option by text
         * I.selectOption('subscription', '0'); // or by value
         * I.selectOption('//form/select[@name=account]','Premium');
         * I.selectOption('form select[name=account]', 'Premium');
         * I.selectOption({css: 'form select[name=account]'}, 'Premium');
         * ```
         *
         * Provide an array for the second argument to select multiple options.
         *
         * ```js
         * I.selectOption('Which OS do you use?', ['Android', 'iOS']);
         * ```
         * @param {CodeceptJS.LocatorOrString} select field located by label|name|CSS|XPath|strict locator.
         * @param {string|Array<*>} option visible text or value of option.
         * {--end--}
         */
        selectOption(select: CodeceptJS.LocatorOrString, option: string | any[]): void;
        /**
         * Attaches a file to element located by label, name, CSS or XPath
         * Path to file is relative current codecept directory (where codecept.json or codecept.conf.js is located).
         * File will be uploaded to remote system (if tests are running remotely).
         *
         * ```js
         * I.attachFile('Avatar', 'data/avatar.jpg');
         * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @param {string} pathToFile local file path relative to codecept.json config file.
         * {--end--}
         * Appium: not tested
         */
        attachFile(locator: CodeceptJS.LocatorOrString, pathToFile: string): void;
        /**
         * Selects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.checkOption('#agree');
         * I.checkOption('I Agree to Terms and Conditions');
         * I.checkOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         * Appium: not tested
         */
        checkOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Unselects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.uncheckOption('#agree');
         * I.uncheckOption('I Agree to Terms and Conditions');
         * I.uncheckOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         * Appium: not tested
         */
        uncheckOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns an array of texts.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @returns {Promise<string|string[]>} attribute value
         * {--end--}
         *
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string | string[]>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - an array of HTMLs returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} element located by CSS|XPath|strict locator.
         * @returns {Promise<string>} HTML code for an element
         * {--end--}
         *
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @returns {Promise<string>} attribute value
         * {--end--}
         *
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Grab CSS property for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} cssProperty CSS property name.
         * @returns {Promise<string>} CSS value
         * {--end--}
         */
        grabCssPropertyFrom(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * An array as a result will be returned if there are more than one matched element.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} attr attribute name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         *
         * @param {string} text text value to check.
         * {--end--}
         *
         */
        seeInTitle(text: string): void;
        /**
         * Checks that title is equal to provided one.
         *
         * ```js
         * I.seeTitleEquals('Test title.');
         * ```
         *
         * @param {string} text value to check.
         */
        seeTitleEquals(text: string): void;
        /**
         * Checks that title does not contain text.
         *
         * ```js
         * I.dontSeeInTitle('Error');
         * ```
         *
         * @param {string} text value to check.
         * {--end--}
         *
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         *
         * @returns {Promise<string>} title
         * {--end--}
         *
         */
        grabTitle(): Promise<string>;
        /**
         * Checks that a page contains a visible text.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.see('Welcome'); // text welcome on a page
         * I.see('Welcome', '.content'); // text inside .content div
         * I.see('Register', {css: 'form.register'}); // use strict locator
         * ```
         * @param {string} text expected on page.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
         * {--end--}
         *
         * {{ react }}
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that text is equal to provided one.
         *
         * ```js
         * I.seeTextEquals('text', 'h1');
         * ```
         *
         * @param {string} text element value to check.
         * @param {CodeceptJS.LocatorOrString?} [context] (optional) element located by CSS|XPath|strict locator.
         */
        seeTextEquals(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `see`. Checks that a text is not present on a page.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.dontSee('Login'); // assume we are already logged in.
         * I.dontSee('Login', '.nav'); // no login inside .nav element
         * ```
         *
         * @param {string} text which is not present.
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         * {--end--}
         *
         * {{ react }}
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the given input field or textarea equals to given value.
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.seeInField('Username', 'davert');
         * I.seeInField({css: 'form textarea'},'Type your comment here');
         * I.seeInField('form input[type=hidden]','hidden_value');
         * I.seeInField('#searchform input','Search');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         *
         */
        seeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that value of input field or textarea doesn't equal to given value
         * Opposite to `seeInField`.
         *
         * ```js
         * I.dontSeeInField('email', 'user@user.com'); // field by name
         * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         *
         */
        dontSeeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Verifies that the specified checkbox is checked.
         *
         * ```js
         * I.seeCheckboxIsChecked('Agree');
         * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
         * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         * Appium: not tested
         */
        seeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is not checked.
         *
         * ```js
         * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
         * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
         * I.dontSeeCheckboxIsChecked('agree'); // located by name
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         * Appium: not tested
         */
        dontSeeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * {--end--}
         * {{ react }}
         *
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         * {{ react }}
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * {--end--}
         *
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         *
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param {string} text value to check.
         * {--end--}
         *
         */
        seeInSource(text: string): void;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         *
         * @returns {Promise<string>} source code
         * {--end--}
         *
         */
        grabSource(): Promise<string>;
        /**
         * Get JS log from browser. Log buffer is reset after each request.
         *
         * ```js
         * let logs = await I.grabBrowserLogs();
         * console.log(JSON.stringify(logs))
         * ```
         * @returns {Promise<string|undefined>}
         */
        grabBrowserLogs(): Promise<string | undefined>;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         *
         * @returns {Promise<string>} current URL
         * {--end--}
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         *
         * @param {string} value to check.
         * {--end--}
         */
        dontSeeInSource(value: string): void;
        /**
         * Asserts that an element appears a given number of times in the DOM.
         * Element is located by label or name or CSS or XPath.
         *
         *
         * ```js
         * I.seeNumberOfElements('#submitBtn', 1);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         * {{ react }}
         */
        seeNumberOfElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         * {{ react }}
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Checks that all elements with given locator have given CSS properties.
         *
         * ```js
         * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {object} cssProperties object with CSS properties and their values to check.
         * {--end--}
         */
        seeCssPropertiesOnElements(locator: CodeceptJS.LocatorOrString, cssProperties: any): void;
        /**
         * Checks that all elements with given locator have given attributes.
         *
         * ```js
         * I.seeAttributesOnElements('//form', { method: "post"});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {object} attributes attributes and their values to check.
         * {--end--}
         */
        seeAttributesOnElements(locator: CodeceptJS.LocatorOrString, attributes: any): void;
        /**
         * Grab number of visible elements by locator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @returns {Promise<number>} number of visible elements
         * {--end--}
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         *
         * @param {string} url a fragment to check
         * {--end--}
         *
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         *
         * @param {string} url value to check.
         * {--end--}
         *
         */
        dontSeeInCurrentUrl(url: string): void;
        /**
         * Checks that current url is equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         * So both examples will work:
         *
         * ```js
         * I.seeCurrentUrlEquals('/register');
         * I.seeCurrentUrlEquals('http://my.site.com/register');
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         *
         */
        seeCurrentUrlEquals(url: string): void;
        /**
         * Checks that current url is not equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         *
         * ```js
         * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
         * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         *
         */
        dontSeeCurrentUrlEquals(url: string): void;
        /**
         * Executes sync script on a page.
         * Pass arguments to function as additional parameters.
         * Will return execution result to a test.
         * In this case you should use async function and await to receive results.
         *
         * Example with jQuery DatePicker:
         *
         * ```js
         * // change date of jQuery DatePicker
         * I.executeScript(function() {
         *   // now we are inside browser context
         *   $('date').datetimepicker('setDate', new Date());
         * });
         * ```
         * Can return values. Don't forget to use `await` to get them.
         *
         * ```js
         * let date = await I.executeScript(function(el) {
         *   // only basic types can be returned
         *   return $(el).datetimepicker('getDate').toString();
         * }, '#date'); // passing jquery selector
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         *
         *
         * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Executes async script on page.
         * Provided function should execute a passed callback (as first argument) to signal it is finished.
         *
         * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
         *
         * ```js
         * I.executeAsyncScript(function(done) {
         *   Vue.nextTick(done); // waiting for next tick
         * });
         * ```
         *
         * By passing value to `done()` function you can return values.
         * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
         *
         * ```js
         * let val = await I.executeAsyncScript(function(url, done) {
         *   // in browser context
         *   $.ajax(url, { success: (data) => done(data); }
         * }, 'http://ajax.callback.url/');
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         *
         */
        executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Scrolls to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.scrollTo('footer');
         * I.scrollTo('#submit', 5, 5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         *
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Moves cursor to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.moveCursorTo('.tooltip');
         * I.moveCursorTo('#submit', 5,5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         *
         */
        moveCursorTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         *
         * @param {string} fileName file name to save.
         * @param {boolean} [fullPage=false] (optional, `false` by default) flag to enable fullscreen screenshot mode.
         * {--end--}
         *
         */
        saveScreenshot(fileName: string, fullPage?: boolean): void;
        /**
         * Sets a cookie.
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         * ```
         *
         * @param {object} cookie a cookie object.
         * {--end--}
         *
         *
         * Uses Selenium's JSON [cookie
         * format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
         */
        setCookie(cookie: any): void;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         *
         * @param {?string} [cookie=null] (optional, `null` by default) cookie name
         * {--end--}
         *
         */
        clearCookie(cookie?: string): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         *
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         *
         * @param {string} name cookie name.
         * {--end--}
         *
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         *
         * @param {?string} [name=null] cookie name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         *
         */
        grabCookie(name?: string): Promise<string>;
        /**
         * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
         * Don't confuse popups with modal windows, as created by [various
         * libraries](http://jster.net/category/windows-modals-popups).
         */
        acceptPopup(): void;
        /**
         * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
         *
         */
        cancelPopup(): void;
        /**
         * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
         * given string.
         *
         * @param {string} text value to check.
         */
        seeInPopup(text: string): void;
        /**
         * Grab the text within the popup. If no popup is visible then it will return null.
         *
         * ```js
         * await I.grabPopupText();
         * ```
         */
        grabPopupText(): void;
        /**
         * Presses a key in the browser and leaves it in a down state.
         *
         * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
         *
         * ```js
         * I.pressKeyDown('Control');
         * I.click('#element');
         * I.pressKeyUp('Control');
         * ```
         *
         * @param {string} key name of key to press down.
         * {--end--}
         */
        pressKeyDown(key: string): void;
        /**
         * Releases a key in the browser which was previously set to a down state.
         *
         * To make combinations with modifier key and user operation (e.g. `'Control'` + [`click`](#click)).
         *
         * ```js
         * I.pressKeyDown('Control');
         * I.click('#element');
         * I.pressKeyUp('Control');
         * ```
         *
         * @param {string} key name of key to release.
         * {--end--}
         */
        pressKeyUp(key: string): void;
        /**
         * Presses a key in the browser (on a focused element).
         *
         * _Hint:_ For populating text field or textarea, it is recommended to use [`fillField`](#fillfield).
         *
         * ```js
         * I.pressKey('Backspace');
         * ```
         *
         * To press a key in combination with modifier keys, pass the sequence as an array. All modifier keys (`'Alt'`, `'Control'`, `'Meta'`, `'Shift'`) will be released afterwards.
         *
         * ```js
         * I.pressKey(['Control', 'Z']);
         * ```
         *
         * For specifying operation modifier key based on operating system it is suggested to use `'CommandOrControl'`.
         * This will press `'Command'` (also known as `'Meta'`) on macOS machines and `'Control'` on non-macOS machines.
         *
         * ```js
         * I.pressKey(['CommandOrControl', 'Z']);
         * ```
         *
         * Some of the supported key names are:
         * - `'AltLeft'` or `'Alt'`
         * - `'AltRight'`
         * - `'ArrowDown'`
         * - `'ArrowLeft'`
         * - `'ArrowRight'`
         * - `'ArrowUp'`
         * - `'Backspace'`
         * - `'Clear'`
         * - `'ControlLeft'` or `'Control'`
         * - `'ControlRight'`
         * - `'Command'`
         * - `'CommandOrControl'`
         * - `'Delete'`
         * - `'End'`
         * - `'Enter'`
         * - `'Escape'`
         * - `'F1'` to `'F12'`
         * - `'Home'`
         * - `'Insert'`
         * - `'MetaLeft'` or `'Meta'`
         * - `'MetaRight'`
         * - `'Numpad0'` to `'Numpad9'`
         * - `'NumpadAdd'`
         * - `'NumpadDecimal'`
         * - `'NumpadDivide'`
         * - `'NumpadMultiply'`
         * - `'NumpadSubtract'`
         * - `'PageDown'`
         * - `'PageUp'`
         * - `'Pause'`
         * - `'Return'`
         * - `'ShiftLeft'` or `'Shift'`
         * - `'ShiftRight'`
         * - `'Space'`
         * - `'Tab'`
         *
         * @param {string|string[]} key key or array of keys to press.
         * {--end--}
         *
         * _Note:_ In case a text field or textarea is focused be aware that some browsers do not respect active modifier when combining modifier keys with other keys.
         */
        pressKey(key: string | string[]): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         *
         * @param {number} width width in pixels or `maximize`.
         * @param {number} height height in pixels.
         * {--end--}
         * Appium: not tested in web, in apps doesn't work
         */
        resizeWindow(width: number, height: number): void;
        /**
         * Drag an item to a destination element.
         *
         * ```js
         * I.dragAndDrop('#dragHandle', '#container');
         * ```
         *
         * @param {string|object} srcElement located by CSS|XPath|strict locator.
         * @param {string|object} destElement located by CSS|XPath|strict locator.
         * {--end--}
         * Appium: not tested
         */
        dragAndDrop(srcElement: string | any, destElement: string | any): void;
        /**
         * Drag the scrubber of a slider to a given position
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.dragSlider('#slider', 30);
         * I.dragSlider('#slider', -70);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by label|name|CSS|XPath|strict locator.
         * @param {number} offsetX position to drag.
         * {--end--}
         */
        dragSlider(locator: CodeceptJS.LocatorOrString, offsetX: number): void;
        /**
         * Get all Window Handles.
         * Useful for referencing a specific handle when calling `I.switchToWindow(handle)`
         *
         * ```js
         * const windows = await I.grabAllWindowHandles();
         * ```
         */
        grabAllWindowHandles(): void;
        /**
         * Get the current Window Handle.
         * Useful for referencing it when calling `I.switchToWindow(handle)`
         *
         * ```js
         * const window = await I.grabCurrentWindowHandle();
         * ```
         */
        grabCurrentWindowHandle(): void;
        /**
         * Switch to the window with a specified handle.
         *
         * ```js
         * const windows = await I.grabAllWindowHandles();
         * // ... do something
         * await I.switchToWindow( windows[0] );
         *
         * const window = await I.grabCurrentWindowHandle();
         * // ... do something
         * await I.switchToWindow( window );
         * ```
         */
        switchToWindow(): void;
        /**
         * Close all tabs except for the current one.
         *
         *
         * ```js
         * I.closeOtherTabs();
         * ```
         */
        closeOtherTabs(): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         *
         * @param {number} sec number of second to wait.
         * {--end--}
         *
         */
        wait(sec: number): void;
        /**
         * Waits for element to become enabled (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional) time in seconds to wait, 1 by default.
         * {--end--}
         *
         */
        waitForEnabled(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for element to be present on page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForElement('.btn.continue');
         * I.waitForElement('.btn.continue', 5); // wait for 5 secs
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for element to be clickable (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForClickable('.btn.continue');
         * I.waitForClickable('.btn.continue', 5); // wait for 5 secs
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForClickable(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitUrlEquals(urlPart: string, sec?: number): void;
        /**
         * Waits for a text to appear (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * Narrow down search results by providing context.
         *
         * ```js
         * I.waitForText('Thank you, form has been submitted');
         * I.waitForText('Thank you, form has been submitted', 5, '#modal');
         * ```
         *
         * @param {string }text to wait for.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator.
         * {--end--}
         *
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Waits for the specified value to be in value attribute.
         *
         * ```js
         * I.waitForValue('//input', "GoodValue");
         * ```
         *
         * @param {string|object} field input field.
         * @param {string }value expected value.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForValue(field: string | any, value: string, sec?: number): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         */
        waitForDetached(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for a function to return true (waits for 1 sec by default).
         * Running in browser context.
         *
         * ```js
         * I.waitForFunction(fn[, [args[, timeout]])
         * ```
         *
         * ```js
         * I.waitForFunction(() => window.requests == 0);
         * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
         * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
         * ```
         *
         * @param {string|function} fn to be executed in browser context.
         * @param {any[]|number} [argsOrSec] (optional, `1` by default) arguments for function or seconds.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         *
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for a function to return true (waits for 1sec by default).
         *
         * ```js
         * I.waitUntil(() => window.requests == 0);
         * I.waitUntil(() => window.requests == 0, 5);
         * ```
         *
         * @param {function|string} fn function which is executed in browser context.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {string} [timeoutMsg=''] message to show in case of timeout fail.
         * @param {?number} [interval=null]
         * {--end--}
         *
         */
        waitUntil(fn: ((...params: any[]) => any) | string, sec?: number, timeoutMsg?: string, interval?: number): void;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         *
         * @param {?CodeceptJS.LocatorOrString} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         *
         */
        switchTo(locator?: CodeceptJS.LocatorOrString): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
         *
         * ```js
         * I.switchToNextTab();
         * I.switchToNextTab(2);
         * ```
         *
         * @param {number} [num] (optional) number of tabs to switch forward, default: 1.
         * @param {number} [sec] (optional) time in seconds to wait.
         */
        switchToNextTab(num?: number, sec?: number): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
         *
         * ```js
         * I.switchToPreviousTab();
         * I.switchToPreviousTab(2);
         * ```
         *
         * @param {number} [num] (optional) number of tabs to switch backward, default: 1.
         * @param {number?} [sec] (optional) time in seconds to wait.
         */
        switchToPreviousTab(num?: number, sec?: number): void;
        /**
         * Close current tab.
         *
         * ```js
         * I.closeCurrentTab();
         * ```
         */
        closeCurrentTab(): void;
        /**
         * Open new tab and switch to it.
         *
         * ```js
         * I.openNewTab();
         * ```
         */
        openNewTab(): void;
        /**
         * Grab number of open tabs.
         *
         * ```js
         * let tabs = await I.grabNumberOfOpenTabs();
         * ```
         *
         * @returns {Promise<number>} number of open tabs
         * {--end--}
         */
        grabNumberOfOpenTabs(): Promise<number>;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         * {--end--}
         */
        refreshPage(): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         * {--end--}
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
         * {--end--}
         */
        scrollPageToBottom(): void;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         *
         * @returns {Promise<Object<string, *>>} scroll position
         * {--end--}
         */
        grabPageScrollPosition(): Promise<{
            [key: string]: any;
        }>;
        /**
         * Set the current geo location
         *
         *
         * ```js
         * I.setGeoLocation(121.21, 11.56);
         * I.setGeoLocation(121.21, 11.56, 10);
         * ```
         *
         * @param {number} latitude to set.
         * @param {number} longitude to set
         * @param {number} altitude (optional, null by default) to set
         * {--end--}
         *
         */
        setGeoLocation(latitude: number, longitude: number, altitude: number): void;
        /**
         * Return the current geo location
         *
         *
         * ```js
         * let geoLocation = await I.grabGeoLocation();
         * ```
         * {--end--}
         *
         */
        grabGeoLocation(): void;
        /**
         * Grab the width, height, location of given locator.
         * Provide `width` or `height`as second param to get your desired prop.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * Returns an object with `x`, `y`, `width`, `height` keys.
         *
         * ```js
         * const value = await I.grabElementBoundingRect('h3');
         * // value is like { x: 226.5, y: 89, width: 527, height: 220 }
         * ```
         *
         * To get only one metric use second parameter:
         *
         * ```js
         * const width = await I.grabElementBoundingRect('h3', 'width');
         * // width == 527
         * ```
         * @param {string|object} locator element located by CSS|XPath|strict locator.
         * @param {string} elementSize x, y, width or height of the given element.
         * @returns {object} Element bounding rectangle
         * {--end--}
         */
        grabElementBoundingRect(locator: string | any, elementSize: string): any;
        /**
         * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
         */
        runOnIOS(): void;
        /**
         * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
         */
        runOnAndroid(): void;
        /**
         * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
         */
        runInWeb(): void;
    }
    class WebDriverIO {
        /**
         * Get elements by different locator types, including strict locator.
         * Should be used in custom helpers:
         *
         * ```js
         * this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         */
        _locate(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Find a checkbox by providing human readable text:
         *
         * ```js
         * this.helpers['WebDriverIO']._locateCheckable('I agree with terms and conditions').then // ...
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         */
        _locateCheckable(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Find a clickable element by providing human readable text:
         *
         * ```js
         * this.helpers['WebDriverIO']._locateClickable('Next page').then // ...
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         */
        _locateClickable(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Find field elements by providing human readable text:
         *
         * ```js
         * this.helpers['WebDriverIO']._locateFields('Your email').then // ...
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         */
        _locateFields(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Set [WebDriverIO timeouts](http://webdriver.io/guide/testrunner/timeouts.html) in realtime.
         * Appium: support only web testing.
         * Timeouts are expected to be passed as object:
         *
         * ```js
         * I.defineTimeout({ script: 5000 });
         * I.defineTimeout({ implicit: 10000, pageLoad: 10000, script: 5000 });
         * ```
         *
         * @param {WebdriverIO.Timeouts}  timeouts WebDriver timeouts object.
         */
        defineTimeout(timeouts: WebdriverIO.Timeouts): void;
        /**
         * Opens a web page in a browser. Requires relative or absolute url.
         * If url starts with `/`, opens a web page of a site defined in `url` config parameter.
         *
         * ```js
         * I.amOnPage('/'); // opens main page of website
         * I.amOnPage('https://github.com'); // opens github
         * I.amOnPage('/login'); // opens a login page
         * ```
         *
         * @param {string} url url path or global url.
         * {--end--}
         * Appium: support only web testing
         */
        amOnPage(url: string): void;
        /**
         * Perform a click on a link or a button, given by a locator.
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.click('Logout');
         * // button of form
         * I.click('Submit');
         * // CSS button
         * I.click('#form input[type=submit]');
         * // XPath
         * I.click('//form/*[@type=submit]');
         * // link in context
         * I.click('Logout', '#nav');
         * // using strict locator
         * I.click({css: 'nav a.login'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         * Appium: support
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs a double-click on an element matched by link|button|label|CSS or XPath.
         * Context can be specified as second parameter to narrow search.
         *
         * ```js
         * I.doubleClick('Edit');
         * I.doubleClick('Edit', '.actions');
         * I.doubleClick({css: 'button.accept'});
         * I.doubleClick('.btn.edit');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         * {--end--}
         * Appium: support only web testing
         */
        doubleClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs right click on a clickable element matched by semantic locator, CSS or XPath.
         *
         * ```js
         * // right click element with id el
         * I.rightClick('#el');
         * // right click link or button with text "Click me"
         * I.rightClick('Click me');
         * // right click button with text "Click me" inside .context
         * I.rightClick('Click me', '.context');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator clickable element located by CSS|XPath|strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         * Appium: support, but in apps works as usual click
         */
        rightClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Fills a text field or textarea, after clearing its value, with the given string.
         * Field is located by name, label, CSS, or XPath.
         *
         * ```js
         * // by label
         * I.fillField('Email', 'hello@world.com');
         * // by name
         * I.fillField('password', secret('123456'));
         * // by CSS
         * I.fillField('form#login input[name=username]', 'John');
         * // or by strict locator
         * I.fillField({css: 'form#login input[name=username]'}, 'John');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value text value to fill.
         * {--end--}
         * Appium: support
         */
        fillField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator
         * @param {string} value text value to append.
         * {--end--}
         * Appium: support, but it's clear a field before insert in apps
         */
        appendField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * {{> clearField}}
         * Appium: support
         */
        clearField(): void;
        /**
         * {{> selectOption}}
         */
        selectOption(): void;
        /**
         * Attaches a file to element located by label, name, CSS or XPath
         * Path to file is relative current codecept directory (where codecept.json or codecept.conf.js is located).
         * File will be uploaded to remote system (if tests are running remotely).
         *
         * ```js
         * I.attachFile('Avatar', 'data/avatar.jpg');
         * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @param {string} pathToFile local file path relative to codecept.json config file.
         * {--end--}
         * Appium: not tested
         */
        attachFile(locator: CodeceptJS.LocatorOrString, pathToFile: string): void;
        /**
         * Selects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.checkOption('#agree');
         * I.checkOption('I Agree to Terms and Conditions');
         * I.checkOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         * Appium: not tested
         */
        checkOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Unselects a checkbox or radio button.
         * Element is located by label or name or CSS or XPath.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * I.uncheckOption('#agree');
         * I.uncheckOption('I Agree to Terms and Conditions');
         * I.uncheckOption('agree', '//form');
         * ```
         * @param {CodeceptJS.LocatorOrString} field checkbox located by label | name | CSS | XPath | strict locator.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
         * {--end--}
         * Appium: not tested
         */
        uncheckOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns an array of texts.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @returns {Promise<string|string[]>} attribute value
         * {--end--}
         * Appium: support
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string | string[]>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - an array of HTMLs returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} element located by CSS|XPath|strict locator.
         * @returns {Promise<string>} HTML code for an element
         * {--end--}
         * Appium: support only web testing
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator field located by label|name|CSS|XPath|strict locator.
         * @returns {Promise<string>} attribute value
         * {--end--}
         * Appium: support only web testing
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Grab CSS property for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} cssProperty CSS property name.
         * @returns {Promise<string>} CSS value
         * {--end--}
         */
        grabCssPropertyFrom(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * An array as a result will be returned if there are more than one matched element.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {string} attr attribute name.
         * @returns {Promise<string>} attribute value
         * {--end--}
         * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         *
         * @param {string} text text value to check.
         * {--end--}
         * Appium: support only web testing
         */
        seeInTitle(text: string): void;
        /**
         * Checks that title is equal to provided one.
         *
         * ```js
         * I.seeTitleEquals('Test title.');
         * ```
         *
         * @param {string} text value to check.
         */
        seeTitleEquals(text: string): void;
        /**
         * Checks that title does not contain text.
         *
         * ```js
         * I.dontSeeInTitle('Error');
         * ```
         *
         * @param {string} text value to check.
         * {--end--}
         * Appium: support only web testing
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         *
         * @returns {Promise<string>} title
         * {--end--}
         * Appium: support only web testing
         */
        grabTitle(): Promise<string>;
        /**
         * Checks that a page contains a visible text.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.see('Welcome'); // text welcome on a page
         * I.see('Welcome', '.content'); // text inside .content div
         * I.see('Register', {css: 'form.register'}); // use strict locator
         * ```
         * @param {string} text expected on page.
         * @param {?CodeceptJS.LocatorOrString} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
         * {--end--}
         * Appium: support with context in apps
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that text is equal to provided one.
         *
         * ```js
         * I.seeTextEquals('text', 'h1');
         * ```
         *
         * @param {string} text element value to check.
         * @param {CodeceptJS.LocatorOrString?} [context] (optional) element located by CSS|XPath|strict locator.
         */
        seeTextEquals(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `see`. Checks that a text is not present on a page.
         * Use context parameter to narrow down the search.
         *
         * ```js
         * I.dontSee('Login'); // assume we are already logged in.
         * I.dontSee('Login', '.nav'); // no login inside .nav element
         * ```
         *
         * @param {string} text which is not present.
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         * {--end--}
         * Appium: support with context in apps
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the given input field or textarea equals to given value.
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.seeInField('Username', 'davert');
         * I.seeInField({css: 'form textarea'},'Type your comment here');
         * I.seeInField('form input[type=hidden]','hidden_value');
         * I.seeInField('#searchform input','Search');
         * ```
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         * Appium: support only web testing
         */
        seeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Checks that value of input field or textarea doesn't equal to given value
         * Opposite to `seeInField`.
         *
         * ```js
         * I.dontSeeInField('email', 'user@user.com'); // field by name
         * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * @param {string} value value to check.
         * {--end--}
         * Appium: support only web testing
         */
        dontSeeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Verifies that the specified checkbox is checked.
         *
         * ```js
         * I.seeCheckboxIsChecked('Agree');
         * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
         * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         * Appium: not tested
         */
        seeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Verifies that the specified checkbox is not checked.
         *
         * ```js
         * I.dontSeeCheckboxIsChecked('#agree'); // located by ID
         * I.dontSeeCheckboxIsChecked('I agree to terms'); // located by label
         * I.dontSeeCheckboxIsChecked('agree'); // located by name
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field located by label|name|CSS|XPath|strict locator.
         * {--end--}
         * Appium: not tested
         */
        dontSeeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * {--end--}
         * Appium: support
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * {{> dontSeeElement}}
         * Appium: support
         */
        dontSeeElement(): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * {--end--}
         * Appium: support
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|Strict locator.
         * {--end--}
         * Appium: support
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param {string} text value to check.
         * {--end--}
         * Appium: support
         */
        seeInSource(text: string): void;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         *
         * @returns {Promise<string>} source code
         * {--end--}
         * Appium: support
         */
        grabSource(): Promise<string>;
        /**
         * Get JS log from browser. Log buffer is reset after each request.
         *
         * ```js
         * let logs = await I.grabBrowserLogs();
         * console.log(JSON.stringify(logs))
         * ```
         */
        grabBrowserLogs(): void;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         *
         * @returns {Promise<string>} current URL
         * {--end--}
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         *
         * @param {string} value to check.
         * {--end--}
         * Appium: support
         */
        dontSeeInSource(value: string): void;
        /**
         * Asserts that an element appears a given number of times in the DOM.
         * Element is located by label or name or CSS or XPath.
         * Appium: support
         *
         * ```js
         * I.seeNumberOfElements('#submitBtn', 1);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [num] number of elements.
         */
        seeNumberOfElements(locator: CodeceptJS.LocatorOrString, num?: number): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * {--end--}
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Checks that all elements with given locator have given CSS properties.
         *
         * ```js
         * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {object} cssProperties object with CSS properties and their values to check.
         * {--end--}
         */
        seeCssPropertiesOnElements(locator: CodeceptJS.LocatorOrString, cssProperties: any): void;
        /**
         * Checks that all elements with given locator have given attributes.
         *
         * ```js
         * I.seeAttributesOnElements('//form', { method: "post"});
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {object} attributes attributes and their values to check.
         * {--end--}
         */
        seeAttributesOnElements(locator: CodeceptJS.LocatorOrString, attributes: any): void;
        /**
         * Grab number of visible elements by locator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @returns {Promise<number>} number of visible elements
         * {--end--}
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         *
         * @param {string} url a fragment to check
         * {--end--}
         * Appium: support only web testing
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         *
         * @param {string} url value to check.
         * {--end--}
         * Appium: support only web testing
         */
        dontSeeInCurrentUrl(url: string): void;
        /**
         * Checks that current url is equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         * So both examples will work:
         *
         * ```js
         * I.seeCurrentUrlEquals('/register');
         * I.seeCurrentUrlEquals('http://my.site.com/register');
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         * Appium: support only web testing
         */
        seeCurrentUrlEquals(url: string): void;
        /**
         * Checks that current url is not equal to provided one.
         * If a relative url provided, a configured url will be prepended to it.
         *
         * ```js
         * I.dontSeeCurrentUrlEquals('/login'); // relative url are ok
         * I.dontSeeCurrentUrlEquals('http://mysite.com/login'); // absolute urls are also ok
         * ```
         *
         * @param {string} url value to check.
         * {--end--}
         * Appium: support only web testing
         */
        dontSeeCurrentUrlEquals(url: string): void;
        /**
         * Executes sync script on a page.
         * Pass arguments to function as additional parameters.
         * Will return execution result to a test.
         * In this case you should use async function and await to receive results.
         *
         * Example with jQuery DatePicker:
         *
         * ```js
         * // change date of jQuery DatePicker
         * I.executeScript(function() {
         *   // now we are inside browser context
         *   $('date').datetimepicker('setDate', new Date());
         * });
         * ```
         * Can return values. Don't forget to use `await` to get them.
         *
         * ```js
         * let date = await I.executeScript(function(el) {
         *   // only basic types can be returned
         *   return $(el).datetimepicker('getDate').toString();
         * }, '#date'); // passing jquery selector
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         * Appium: support only web testing
         *
         * Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Executes async script on page.
         * Provided function should execute a passed callback (as first argument) to signal it is finished.
         *
         * Example: In Vue.js to make components completely rendered we are waiting for [nextTick](https://vuejs.org/v2/api/#Vue-nextTick).
         *
         * ```js
         * I.executeAsyncScript(function(done) {
         *   Vue.nextTick(done); // waiting for next tick
         * });
         * ```
         *
         * By passing value to `done()` function you can return values.
         * Additional arguments can be passed as well, while `done` function is always last parameter in arguments list.
         *
         * ```js
         * let val = await I.executeAsyncScript(function(url, done) {
         *   // in browser context
         *   $.ajax(url, { success: (data) => done(data); }
         * }, 'http://ajax.callback.url/');
         * ```
         *
         * @param {string|function} fn function to be executed in browser context.
         * @param {...any} args to be passed to function.
         * {--end--}
         * Appium: support only web testing
         */
        executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): void;
        /**
         * Scrolls to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.scrollTo('footer');
         * I.scrollTo('#submit', 5, 5);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator located by CSS|XPath|strict locator.
         * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
         * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
         * {--end--}
         * Appium: support only web testing
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * {{> moveCursorTo}}
         * Appium: support only web testing
         */
        moveCursorTo(): void;
        /**
         * {{> saveScreenshot}}
         * Appium: support
         */
        saveScreenshot(): void;
        /**
         * {{> setCookie}}
         * Appium: support only web testing
         *
         * Uses Selenium's JSON [cookie
         * format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
         */
        setCookie(): void;
        /**
         * {{> clearCookie}}
         * Appium: support only web testing
         */
        clearCookie(): void;
        /**
         * {{> seeCookie}}
         * Appium: support only web testing
         */
        seeCookie(): void;
        /**
         * {{> dontSeeCookie}}
         * Appium: support only web testing
         */
        dontSeeCookie(): void;
        /**
         * {{> grabCookie}}
         * Appium: support only web testing
         */
        grabCookie(): void;
        /**
         * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
         * Don't confuse popups with modal windows, as created by [various
         * libraries](http://jster.net/category/windows-modals-popups). Appium: support only web testing
         */
        acceptPopup(): void;
        /**
         * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
         * Appium: support only web testing
         */
        cancelPopup(): void;
        /**
         * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
         * given string. Appium: support only web testing
         *
         * @param {string} text value to check.
         */
        seeInPopup(text: string): void;
        /**
         * Grab the text within the popup. If no popup is visible then it will return null.
         *
         * ```js
         * await I.grabPopupText();
         * ```
         */
        grabPopupText(): void;
        /**
         * Presses a key on a focused element.
         * Special keys like 'Enter', 'Control', [etc](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value)
         * will be replaced with corresponding unicode.
         * If modifier key is used (Control, Command, Alt, Shift) in array, it will be released afterwards.
         *
         * ```js
         * I.pressKey('Enter');
         * I.pressKey(['Control','a']);
         * ```
         *
         * @param {string|string[]} key key or array of keys to press.
         * {--end--}
         * {{> _keys }}
         *
         * To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.
         * Appium: support, but clear field before pressing in apps:
         *
         * ```js
         * I.pressKey('Control');
         * I.click('#someelement');
         * I.pressKey('Control');
         * ```
         */
        pressKey(key: string | string[]): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         *
         * @param {number} width width in pixels or `maximize`.
         * @param {number} height height in pixels.
         * {--end--}
         * Appium: not tested in web, in apps doesn't work
         */
        resizeWindow(width: number, height: number): void;
        /**
         * Drag an item to a destination element.
         *
         * ```js
         * I.dragAndDrop('#dragHandle', '#container');
         * ```
         *
         * @param {string|object} srcElement located by CSS|XPath|strict locator.
         * @param {string|object} destElement located by CSS|XPath|strict locator.
         * {--end--}
         * Appium: not tested
         */
        dragAndDrop(srcElement: string | any, destElement: string | any): void;
        /**
         * Close all tabs except for the current one.
         * Appium: support web test
         *
         * ```js
         * I.closeOtherTabs();
         * ```
         */
        closeOtherTabs(): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         *
         * @param {number} sec number of second to wait.
         * {--end--}
         * Appium: support
         */
        wait(sec: number): void;
        /**
         * Waits for element to become enabled (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional) time in seconds to wait, 1 by default.
         * {--end--}
         * Appium: support
         */
        waitForEnabled(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for element to be present on page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForElement('.btn.continue');
         * I.waitForElement('.btn.continue', 5); // wait for 5 secs
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         * Appium: support
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         *
         * @param {string} urlPart value to check.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitUrlEquals(urlPart: string, sec?: number): void;
        /**
         * Waits for a text to appear (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * Narrow down search results by providing context.
         *
         * ```js
         * I.waitForText('Thank you, form has been submitted');
         * I.waitForText('Thank you, form has been submitted', 5, '#modal');
         * ```
         *
         * @param {string }text to wait for.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {CodeceptJS.LocatorOrString} [context] (optional) element located by CSS|XPath|strict locator.
         * {--end--}
         * Appium: support
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Waits for the specified value to be in value attribute.
         *
         * ```js
         * I.waitForValue('//input', "GoodValue");
         * ```
         *
         * @param {string|object} field input field.
         * @param {string }value expected value.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitForValue(field: string | any, value: string, sec?: number): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         * Appium: support
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} num number of elements.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         */
        waitNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         * Appium: support
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         * Appium: support
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element located by CSS|XPath|strict locator.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * {--end--}
         * Appium: support
         */
        waitForDetached(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for a function to return true (waits for 1 sec by default).
         * Running in browser context.
         *
         * ```js
         * I.waitForFunction(fn[, [args[, timeout]])
         * ```
         *
         * ```js
         * I.waitForFunction(() => window.requests == 0);
         * I.waitForFunction(() => window.requests == 0, 5); // waits for 5 sec
         * I.waitForFunction((count) => window.requests == count, [3], 5) // pass args and wait for 5 sec
         * ```
         *
         * @param {string|function} fn to be executed in browser context.
         * @param {any[]|number} [argsOrSec] (optional, `1` by default) arguments for function or seconds.
         * @param {number} [sec] (optional, `1` by default) time in seconds to wait
         * {--end--}
         * Appium: support
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for a function to return true (waits for 1sec by default).
         *
         * ```js
         * I.waitUntil(() => window.requests == 0);
         * I.waitUntil(() => window.requests == 0, 5);
         * ```
         *
         * @param {function|string} fn function which is executed in browser context.
         * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
         * @param {string} [timeoutMsg=''] message to show in case of timeout fail.
         * @param {?number} [interval=null]
         * {--end--}
         * * *Appium*: supported
         */
        waitUntil(fn: ((...params: any[]) => any) | string, sec?: number, timeoutMsg?: string, interval?: number): void;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         *
         * @param {?CodeceptJS.LocatorOrString} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
         * {--end--}
         * Appium: support only web testing
         */
        switchTo(locator?: CodeceptJS.LocatorOrString): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
         *
         * ```js
         * I.switchToNextTab();
         * I.switchToNextTab(2);
         * ```
         *
         * @param {number} [num=1] (optional) number of tabs to switch forward, default: 1.
         * @param {?number} [sec=null] (optional) time in seconds to wait.
         */
        switchToNextTab(num?: number, sec?: number): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
         *
         * ```js
         * I.switchToPreviousTab();
         * I.switchToPreviousTab(2);
         * ```
         *
         * @param {number} [num=1] (optional) number of tabs to switch backward, default: 1.
         * @param {?number} [sec] (optional) time in seconds to wait.
         */
        switchToPreviousTab(num?: number, sec?: number): void;
        /**
         * Close current tab.
         *
         * ```js
         * I.closeCurrentTab();
         * ```
         */
        closeCurrentTab(): void;
        /**
         * Open new tab and switch to it.
         *
         * ```js
         * I.openNewTab();
         * ```
         */
        openNewTab(): void;
        /**
         * Grab number of open tabs.
         *
         * ```js
         * let tabs = await I.grabNumberOfOpenTabs();
         * ```
         *
         * @returns {Promise<number>} number of open tabs
         * {--end--}
         */
        grabNumberOfOpenTabs(): Promise<number>;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         * {--end--}
         */
        refreshPage(): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         * {--end--}
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
         * {--end--}
         */
        scrollPageToBottom(): void;
        /**
         * {{> grabPageScrollPosition}}
         */
        grabPageScrollPosition(): void;
        /**
         * Placeholder for ~ locator only test case write once run on both Appium and WebDriverIO.
         */
        runOnIOS(): void;
        /**
         * Placeholder for ~ locator only test case write once run on both Appium and WebDriverIO.
         */
        runOnAndroid(): void;
        /**
         * Placeholder for ~ locator only test case write once run on both Appium and WebDriverIO.
         */
        runInWeb(): void;
    }
    /**
     * @interface
     * @alias ActorStatic
     */
    interface ActorStatic {
        /**
         * add print comment method`
         * @param {string} msg
         * @param {string} color
         * @return {Promise<any> | undefined}
         */
        say(msg: string, color: string): Promise<any> | undefined;
        /**
         * @function
         * @param {*} opts
         * @return {this}
         * @inner
         */
        retry(opts: any): this;
    }
    /**
     * Create CodeceptJS runner.
     * Config and options should be passed
     *
     * @param {*} config
     * @param {*} opts
     */
    class Codecept {
        constructor(config: any, opts: any);
        /**
         * Require modules before codeceptjs running
         *
         * @param {string[]} requiringModules
         */
        requireModules(requiringModules: string[]): void;
        /**
         * Initialize CodeceptJS at specific directory.
         * If async initialization is required, pass callback as second parameter.
         *
         * @param {string} dir
         */
        init(dir: string): void;
        /**
         * Creates global variables
         *
         * @param {string} dir
         */
        initGlobals(dir: string): void;
        /**
         * Executes hooks.
         */
        runHooks(): void;
        /**
         * Executes bootstrap.
         * If bootstrap is async, second parameter is required.
         *
         * @param {Function} [done]
         */
        runBootstrap(done?: (...params: any[]) => any): void;
        /**
         * Executes teardown.
         * If teardown is async a parameter is provided.
         *
         * @param {*} done
         */
        teardown(done: any): void;
        /**
         * Loads tests by pattern or by config.tests
         *
         * @param {string} [pattern]
         */
        loadTests(pattern?: string): void;
        /**
         * Run a specific test or all loaded tests.
         *
         * @param {string} [test]
         */
        run(test?: string): void;
    }
    /**
     * Current configuration
     */
    class Config {
        /**
         * Create a config with default options
         *
         * @param {*} newConfig
         * @return {Object<string, *>}
         */
        static create(newConfig: any): {
            [key: string]: any;
        };
        /**
         * Load config from a file.
         * If js file provided: require it and get .config key
         * If json file provided: load and parse JSON
         * If directory provided:
         * * try to load `codecept.conf.js` from it
         * * try to load `codecept.json` from it
         * If none of above: fail.
         *
         * @param {string} configFile
         * @return {*}
         */
        static load(configFile: string): any;
        /**
         * Get current config.
         * @param {string} key
         * @param {*} val
         * @return {*}
         */
        static get(key: string, val: any): any;
        /**
         * Appends values to current config
         *
         * @param {Object<string, *>} additionalConfig
         * @return {Object<string, *>}
         */
        static append(additionalConfig: {
            [key: string]: any;
        }): {
            [key: string]: any;
        };
        /**
         * Resets config to default
         * @return {Object<string, *>}
         */
        static reset(): {
            [key: string]: any;
        };
    }
    /**
     * Dependency Injection Container
     */
    class Container {
        /**
         * Create container with all required helpers and support objects
         *
         * @api
         * @param {*} config
         * @param {*} opts
         */
        static create(config: any, opts: any): void;
        /**
         * Get all plugins
         *
         * @api
         * @param {string} [name]
         */
        static plugins(name?: string): void;
        /**
         * Get all support objects or get support object by name
         *
         * @api
         * @param {string} [name]
         * @returns { * }
         */
        static support(name?: string): any;
        /**
         * Get all helpers or get a helper by name
         *
         * @api
         * @param {string} [name]
         */
        static helpers(name?: string): void;
        /**
         * Get translation
         *
         * @api
         */
        static translation(): void;
        /**
         * Get Mocha instance
         *
         * @api
         * @returns {Mocha | {}}
         */
        static mocha(): Mocha | any;
        /**
         * Append new services to container
         *
         * @api
         * @param {Object<string, *>} newContainer
         */
        static append(newContainer: {
            [key: string]: any;
        }): void;
        /**
         * Clear container
         *
         * @param {Object<string, *>} newHelpers
         * @param {Object<string, *>} newSupport
         * @param {Object<string, *>} newPlugins
         */
        static clear(newHelpers: {
            [key: string]: any;
        }, newSupport: {
            [key: string]: any;
        }, newPlugins: {
            [key: string]: any;
        }): void;
    }
    /**
     * Method collect own property and prototype
     */
    function getObjectMethods(): void;
    /** @param {Array<*>} array
     */
    class DataTable {
        constructor(array: any[]);
        /** @param {Array<*>} array
         */
        add(array: any[]): void;
        /** @param {Array<*>} array
         */
        xadd(array: any[]): void;
        /** @param {Function} func
         */
        filter(func: (...params: any[]) => any): void;
    }
    /**
     * @interface
     * @alias event
     */
    interface event {
        /**
         * @type {NodeJS.EventEmitter}
         * @inner
         */
        dispatcher: NodeJS.EventEmitter;
        /**
         * @type {object}
         * @inner
         * @property {'test.start'} started
         * @property {'test.before'} before
         * @property {'test.after'} after
         * @property {'test.passed'} passed
         * @property {'test.failed'} failed
         * @property {'test.finish'} finished
         */
        test: {
            started: 'test.start';
            before: 'test.before';
            after: 'test.after';
            passed: 'test.passed';
            failed: 'test.failed';
            finished: 'test.finish';
        };
        /**
         * @type {object}
         * @inner
         * @property {'suite.before'} before
         * @property {'suite.after'} after
         */
        suite: {
            before: 'suite.before';
            after: 'suite.after';
        };
        /**
         * @type {object}
         * @inner
         * @property {'hook.start'} started
         * @property {'hook.passed'} passed
         */
        hook: {
            started: 'hook.start';
            passed: 'hook.passed';
        };
        /**
         * @type {object}
         * @inner
         * @property {'step.start'} started
         * @property {'step.before'} before
         * @property {'step.after'} after
         * @property {'step.passed'} passed
         * @property {'step.failed'} failed
         * @property {'step.finish'} finished
         */
        step: {
            started: 'step.start';
            before: 'step.before';
            after: 'step.after';
            passed: 'step.passed';
            failed: 'step.failed';
            finished: 'step.finish';
        };
        /**
         * @type {object}
         * @inner
         * @property {'global.before'} before
         * @property {'global.after'} after
         * @property {'global.result'} result
         */
        all: {
            before: 'global.before';
            after: 'global.after';
            result: 'global.result';
        };
        /**
         * @type {object}
         * @inner
         * @property {'multiple.before'} before
         * @property {'multiple.after'} after
         */
        multiple: {
            before: 'multiple.before';
            after: 'multiple.after';
        };
        /**
         * @param {string} event
         * @param {*} param
         */
        emit(event: string, param: any): void;
        /** for testing only!
         */
        cleanDispatcher(): void;
    }
    class Helper {
        /**
         * Abstract method to provide required config options
         * @return {*}
         * @protected
         */
        protected static _config(): any;
        /**
         * Abstract method to validate config
         * @param {*} config
         * @returns {*}
         * @protected
         */
        protected _validateConfig(config: any): any;
        /**
         * Sets config for current test
         * @param {*} opts
         * @protected
         */
        protected _setConfig(opts: any): void;
        /**
         * Hook executed before all tests
         * @protected
         */
        protected _init(): void;
        /**
         * Hook executed before each test.
         * @protected
         */
        protected _before(): void;
        /**
         * Hook executed after each test
         * @protected
         */
        protected _after(): void;
        /**
         * Hook provides a test details
         * Executed in the very beginning of a test
         *
         * @param {Mocha.Test} test
         * @protected
         */
        protected _test(test: Mocha.Test): void;
        /**
         * Hook executed after each passed test
         *
         * @param {Mocha.Test} test
         * @protected
         */
        protected _passed(test: Mocha.Test): void;
        /**
         * Hook executed after each failed test
         *
         * @param {Mocha.Test} test
         * @protected
         */
        protected _failed(test: Mocha.Test): void;
        /**
         * Hook executed before each step
         *
         * @param {CodeceptJS.Step} step
         * @protected
         */
        protected _beforeStep(step: CodeceptJS.Step): void;
        /**
         * Hook executed after each step
         *
         * @param {CodeceptJS.Step} step
         * @protected
         */
        protected _afterStep(step: CodeceptJS.Step): void;
        /**
         * Hook executed before each suite
         *
         * @param {Mocha.Suite} suite
         * @protected
         */
        protected _beforeSuite(suite: Mocha.Suite): void;
        /**
         * Hook executed after each suite
         *
         * @param {Mocha.Suite} suite
         * @protected
         */
        protected _afterSuite(suite: Mocha.Suite): void;
        /**
         * Hook executed after all tests are executed
         *
         * @param {Mocha.Suite} suite
         * @protected
         */
        protected _finishTest(suite: Mocha.Suite): void;
        /**
         * Access another configured helper: `this.helpers['AnotherHelper']`
         *
         * @readonly
         * @type {*}
         */
        readonly helpers: any;
        /**
         * Print debug message to console (outputs only in debug mode)
         *
         * @param {string} msg
         */
        debug(msg: string): void;
        /**
         * @param {string}  section
         * @param {string}  msg
         */
        debugSection(section: string, msg: string): void;
    }
    /**
     * @alias CodeceptJS.browserCodecept
     * @interface
     */
    interface browserCodecept {
        /**
         * all found elements are stored here for reuse
         * @inner
         * @type {Node[]}
         */
        elements: Node[];
        /**
         * global context changer
         * @inner
         * @type {?Node}
         */
        within: Node;
        /**
         * finders
         * @param {number} id
         * @return {Node}
         */
        fetchElement(id: number): Node;
        /**
         * @param   {string}  by
         * @param   {CodeceptJS.ILocator}  locator
         * @param   {*}  [contextEl]
         * @return  {number[]}
         */
        findAndStoreElements(by: string, locator: CodeceptJS.ILocator, contextEl?: any): number[];
        /**
         * @param   {string}  by
         * @param   {CodeceptJS.ILocator}  locator
         * @param   {*}  [contextEl]
         * @return  {number | undefined}
         */
        findAndStoreElement(by: string, locator: CodeceptJS.ILocator, contextEl?: any): number | undefined;
        /**
         * @param {string} by
         * @param {CodeceptJS.ILocator} locator
         */
        setWithin(by: string, locator: CodeceptJS.ILocator): void;
        /**
         * @param   {string}  by
         * @param   {CodeceptJS.ILocator}  locator
         * @param   {*}  [contextEl]
         * @return  {Node[]}
         */
        findElements(by: string, locator: CodeceptJS.ILocator, contextEl?: any): Node[];
        /**
         * @param   {string}  by
         * @param   {CodeceptJS.ILocator}  locator
         * @param   {*}  [context]
         * @return  {?Node}
         */
        findElement(by: string, locator: CodeceptJS.ILocator, context?: any): Node;
        /**
         * @param {number} el
         * @return {boolean}
         */
        clickEl(el: number): boolean;
        /** @param {number} el
         */
        doubleClickEl(el: number): void;
        /**
         * @param {number} el
         * @param {number | undefined} x
         * @param {number | undefined} y
         */
        hoverEl(el: number, x: number | undefined, y: number | undefined): void;
        /** @param {number} el
         */
        rightClickEl(el: number): void;
        /**
         * @param {number} el
         * @return {boolean  |  undefined}
         */
        checkEl(el: number): boolean | undefined;
        /**
         * @param {number} el
         * @return {boolean}
         */
        unCheckEl(el: number): boolean;
    }
    /**
     * Index file for loading CodeceptJS programmatically.
     *
     * Includes Public API objects
     * @alias index
     * @interface
     */
    interface index {
        /**
         * @type {Class<CodeceptJS.Codecept>}
         * @inner
         */
        codecept: typeof CodeceptJS.Codecept;
        /**
         * @type {CodeceptJS.output}
         * @inner
         */
        output: CodeceptJS.output;
        /**
         * @type {Class<CodeceptJS.Container>}
         * @inner
         */
        container: typeof CodeceptJS.Container;
        /**
         * @type {CodeceptJS.event}
         * @inner
         */
        event: CodeceptJS.event;
        /**
         * @type {CodeceptJS.recorder}
         * @inner
         */
        recorder: CodeceptJS.recorder;
        /**
         * @type {Class<CodeceptJS.Config>}
         * @inner
         */
        config: typeof CodeceptJS.Config;
        /**
         * @type {Class<CodeceptJS.Helper>}
         * @inner
         */
        helper: typeof CodeceptJS.Helper;
        /**
         * @type {Class<CodeceptJS.DataTable>}
         * @inner
         */
        dataTable: typeof CodeceptJS.DataTable;
        /**
         * @type {CodeceptJS.store}
         * @inner
         */
        store: CodeceptJS.store;
        /**
         * @type {Class<CodeceptJS.Locator>}
         * @inner
         */
        locator: typeof CodeceptJS.Locator;
    }
    /**
     * @param {*} step
     * @param {*} fn
     */
    function addStep(step: any, fn: any): void;
    class FeatureConfig {
        /**
         * Retry this suite for x times
         *
         * @param {number} retries
         * @returns {this}
         */
        retry(retries: number): this;
        /**
         * Set timeout for this suite
         * @param {number} timeout
         * @returns {this}
         */
        timeout(timeout: number): this;
        /**
         * Configures a helper.
         * Helper name can be omitted and values will be applied to first helper.
         * @param {string | Object<string, *>} helper
         * @param {Object<string, *>} [obj]
         * @returns {this}
         */
        config(helper: string | {
            [key: string]: any;
        }, obj?: {
            [key: string]: any;
        }): this;
        /**
         * Append a tag name to scenario title
         * @param {string} tagName
         * @returns {this}
         */
        tag(tagName: string): this;
    }
    class ScenarioConfig {
        /**
         * Declares that test throws error.
         * Can pass an Error object or regex matching expected message.
         *
         * @param {*} err
         * @returns {this}
         */
        throws(err: any): this;
        /**
         * Declares that test should fail.
         * If test passes - throws an error.
         * Can pass an Error object or regex matching expected message.
         *
         * @returns {this}
         */
        fails(): this;
        /**
         * Retry this test for x times
         *
         * @param {number} retries
         * @returns {this}
         */
        retry(retries: number): this;
        /**
         * Set timeout for this test
         * @param {number} timeout
         * @returns {this}
         */
        timeout(timeout: number): this;
        /**
         * Pass in additional objects to inject into test
         * @param {Object<string, any>} obj
         * @returns {this}
         */
        inject(obj: {
            [key: string]: any;
        }): this;
        /**
         * Configures a helper.
         * Helper name can be omitted and values will be applied to first helper.
         * @param {string | Object<string, any>} helper
         * @param {Object<string, any>} [obj]
         * @returns {this}
         */
        config(helper: string | {
            [key: string]: any;
        }, obj?: {
            [key: string]: any;
        }): this;
        /**
         * Append a tag name to scenario title
         * @param {string} tagName
         * @returns {this}
         */
        tag(tagName: string): this;
        /**
         * Dynamically injects dependencies, see https://codecept.io/pageobjects/#dynamic-injection
         * @param {Object<string, *>} dependencies
         * @returns {this}
         */
        injectDependencies(dependencies: {
            [key: string]: any;
        }): this;
    }
    /**
     * @param {CodeceptJS.LocatorOrString}  locator
     * @param {string}  [defaultType]
     */
    class Locator {
        constructor(locator: CodeceptJS.LocatorOrString, defaultType?: string);
        /**
         * @return  {string}
         */
        toString(): string;
        /**
         * @return  {string}
         */
        toXPath(): string;
        /**
         * @param {CodeceptJS.LocatorOrString} locator
         * @return  {Locator}
         */
        or(locator: CodeceptJS.LocatorOrString): Locator;
        /**
         * @param {CodeceptJS.LocatorOrString} locator
         * @return  {Locator}
         */
        find(locator: CodeceptJS.LocatorOrString): Locator;
        /**
         * @param {CodeceptJS.LocatorOrString} locator
         * @return  {Locator}
         */
        withChild(locator: CodeceptJS.LocatorOrString): Locator;
        /**
         * @param {CodeceptJS.LocatorOrString} locator
         * @return  {Locator}
         */
        withDescendant(locator: CodeceptJS.LocatorOrString): Locator;
        /**
         * @param {number}  position
         * @return {Locator}
         */
        at(position: number): Locator;
        /**
         * @return  {Locator}
         */
        first(): Locator;
        /**
         * @return  {Locator}
         */
        last(): Locator;
        /**
         * @param {string} text
         * @return  {Locator}
         */
        withText(text: string): Locator;
        /**
         * @param {Object.<string, string>} attrs
         * @return  {Locator}
         */
        withAttr(attrs: {
            [key: string]: string;
        }): Locator;
        /**
         * @param {string} output
         * @return  {Locator}
         */
        as(output: string): Locator;
        /**
         * @param {CodeceptJS.LocatorOrString} locator
         * @return  {Locator}
         */
        inside(locator: CodeceptJS.LocatorOrString): Locator;
        /**
         * @param {CodeceptJS.LocatorOrString} locator
         * @return  {Locator}
         */
        after(locator: CodeceptJS.LocatorOrString): Locator;
        /**
         * @param {CodeceptJS.LocatorOrString} locator
         * @return  {Locator}
         */
        before(locator: CodeceptJS.LocatorOrString): Locator;
        /**
         * @param {CodeceptJS.LocatorOrString} locator
         * @returns {Locator}
         */
        static build(locator: CodeceptJS.LocatorOrString): Locator;
    }
    /**
     * @alias output
     * @interface
     */
    interface output {
        /**
         * @type {number}
         * @inner
         */
        stepShift: number;
        /**
         * Set or return current verbosity level
         * @param {number} level
         * @return {number}
         */
        level(level: number): number;
        /**
         * Print information for a process
         * Used in multiple-run
         * @param {string} process
         * @return {string}
         */
        process(process: string): string;
        /**
         * Print information in --debug mode
         * @param {string} msg
         */
        debug(msg: string): void;
        /**
         * Print information in --verbose mode
         * @param {string} msg
         */
        log(msg: string): void;
        /**
         * Print error
         * @param {string} msg
         */
        error(msg: string): void;
        /**
         * Print a successful message
         * @param {string} msg
         */
        success(msg: string): void;
        /**
         * @param {string} name
         * @param {string} msg
         */
        plugin(name: string, msg: string): void;
        /**
         * Print a step
         * @param {CodeceptJS.Step} step
         */
        step(step: CodeceptJS.Step): void;
        /**
         * @name CodeceptJS.output~suite
         * @type {CodeceptJS.OutputSuite}
         * @inner
         */
        suite: CodeceptJS.OutputSuite;
        /**
         * @name CodeceptJS.output~test
         * @type {CodeceptJS.OutputTest}
         * @inner
         */
        test: CodeceptJS.OutputTest;
        /**
         * @name CodeceptJS.output~scenario
         * @type {CodeceptJS.OutputScenario}
         * @inner
         */
        scenario: CodeceptJS.OutputScenario;
        /**
         *
         * Print a text in console log
         * @param {string} message
         * @param {string} color
         */
        say(message: string, color: string): void;
        /**
         * @param {number} passed
         * @param {number} failed
         * @param {number} skipped
         * @param {number} duration
         */
        result(passed: number, failed: number, skipped: number, duration: number): void;
    }
    /**
     * @alias OutputSuite
     * @interface
     */
    interface OutputSuite {
        /**
         * @param {Mocha.Suite} suite
         */
        started(suite: Mocha.Suite): void;
    }
    /**
     * @alias OutputTest
     * @interface
     */
    interface OutputTest {
        /**
         * @param {Mocha.Test} test
         */
        started(test: Mocha.Test): void;
        /**
         * @param {Mocha.Test} test
         */
        passed(test: Mocha.Test): void;
        /**
         * @param {Mocha.Test} test
         */
        failed(test: Mocha.Test): void;
        /**
         * @param {Mocha.Test} test
         */
        skipped(test: Mocha.Test): void;
    }
    /**
     * @alias OutputScenario
     * @interface
     */
    interface OutputScenario {
        /**
         * @param {Mocha.Test} test
         */
        started(test: Mocha.Test): void;
        /**
         * @param {Mocha.Test} test
         */
        passed(test: Mocha.Test): void;
        /**
         * @param {Mocha.Test} test
         */
        failed(test: Mocha.Test): void;
    }
    /**
     * Pauses test execution and starts interactive shell
     */
    function pause(): void;
    /**
     * Singleton object to record all test steps as promises and run them in chain.
     * @alias recorder
     * @interface
     */
    interface recorder {
        /**
         * @type {Array<Object<string, *>>}
         * @inner
         */
        retries: {
            [key: string]: any;
        }[];
        /**
         * Start recording promises
         *
         * @api
         */
        start(): void;
        /** @return {boolean}
         */
        isRunning(): boolean;
        /** @return {void}
         */
        startUnlessRunning(): void;
        /**
         * Add error handler to catch rejected promises
         *
         * @api
         * @param {function} fn
         */
        errHandler(fn: (...params: any[]) => any): void;
        /**
         * Stops current promise chain, calls `catch`.
         * Resets recorder to initial state.
         *
         * @api
         */
        reset(): void;
        /**
         * @name CodeceptJS.recorder~session
         * @type {CodeceptJS.RecorderSession}
         * @inner
         */
        session: CodeceptJS.RecorderSession;
        /**
         * Adds a promise to a chain.
         * Promise description should be passed as first parameter.
         *
         * @param {string} taskName
         * @param {function} [fn]
         * @param {boolean} [force=false]
         * @param {boolean} [retry=true] -
         *     true: it will retries if `retryOpts` set.
         *     false: ignore `retryOpts` and won't retry.
         * @return {Promise<*> | undefined}
         */
        add(taskName: string, fn?: (...params: any[]) => any, force?: boolean, retry?: boolean): Promise<any> | undefined;
        /**
         * @param {*} opts
         * @return {*}
         */
        retry(opts: any): any;
        /**
         * @param {function} [customErrFn]
         * @return {Promise<*>}
         */
        catch(customErrFn?: (...params: any[]) => any): Promise<any>;
        /**
         * @param {function} customErrFn
         * @return {Promise<*>}
         */
        catchWithoutStop(customErrFn: (...params: any[]) => any): Promise<any>;
        /**
         * Adds a promise which throws an error into a chain
         *
         * @api
         * @param {*} err
         */
        throw(err: any): void;
        /** @param {*} err
         */
        saveFirstAsyncError(err: any): void;
        /** @return {*}
         */
        getAsyncErr(): any;
        /** @return {void}
         */
        cleanAsyncErr(): void;
        /**
         * Stops recording promises
         * @api
         */
        stop(): void;
        /**
         * Get latest promise in chain.
         *
         * @api
         * @return {Promise<*>}
         */
        promise(): Promise<any>;
        /**
         * Get a list of all chained tasks
         * @return {string}
         */
        scheduled(): string;
        /**
         * Get a state of current queue and tasks
         * @return {string}
         */
        toString(): string;
    }
    /**
     * @alias RecorderSession
     * @interface
     */
    interface RecorderSession {
        /**
         * @type {boolean}
         * @inner
         */
        running: boolean;
        /** @param {string} name
         */
        start(name: string): void;
        /** @param {string} name
         */
        restore(name: string): void;
        /** @param {function} fn
         */
        catch(fn: (...params: any[]) => any): void;
    }
    class Secret {
        constructor(secret: string);
        /** @returns {string}
         */
        toString(): string;
        /**
         * @param {*} secret
         * @returns {Secret}
         */
        static secret(secret: any): Secret;
    }
    /**
     * @param {CodeceptJS.LocatorOrString}  sessionName
     * @param {Function | Object<string, *>}  config
     * @param {Function}  [fn]
     * @return {Promise<*> | undefined}
     */
    function session(sessionName: CodeceptJS.LocatorOrString, config: ((...params: any[]) => any) | {
        [key: string]: any;
    }, fn?: (...params: any[]) => any): Promise<any> | undefined;
    class Step {
        constructor(helper: CodeceptJS.Helper, name: string);
        /** @member {string}
         */
        actor: string;
        /** @member {CodeceptJS.Helper}
         */
        helper: CodeceptJS.Helper;
        /** @member {string}
         */
        name: string;
        /** @member {string}
         */
        helperMethod: string;
        /** @member {string}
         */
        status: string;
        /**
         * @member {string} suffix
         * @memberof CodeceptJS.Step#
         */
        suffix: string;
        /** @member {string}
         */
        prefix: string;
        /** @member {string}
         */
        comment: string;
        /** @member {Array<*>}
         */
        args: any[];
        /** @member {string}
         */
        stack: string;
        /** @function
         */
        setTrace(): void;
        /** @member {MetaStep}
         */
        metaStep: MetaStep;
        /** @param {Array<*>} args
         */
        setArguments(args: any[]): void;
        /**
         * @param {...any} args
         * @return {*}
         */
        run(...args: any[]): any;
        /** @param {string} status
         */
        setStatus(status: string): void;
        /** @return {string}
         */
        humanize(): string;
        /** @return {string}
         */
        humanizeArgs(): string;
        /** @return {string}
         */
        line(): string;
        /** @return {string}
         */
        toString(): string;
        /** @return {string}
         */
        toCode(): string;
        /** @return {boolean}
         */
        hasBDDAncestor(): boolean;
        /** @type {Class<MetaStep>}
         */
        static MetaStep: typeof MetaStep;
    }
    class MetaStep extends Step {
        /** @return {void}
         */
        run(): void;
    }
    /**
     * global values for current session
     * @interface
     */
    interface store {
        /**
         * @type {boolean}
         * @inner
         */
        debugMode: boolean;
    }
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     * @global
     * @param {string} title
     * @param {Object<string, *>} [opts]
     * @returns {FeatureConfig}
     */
    function Feature(title: string, opts?: {
        [key: string]: any;
    }): FeatureConfig;
    /**
     * Pending test case.
     * @global
     * @kind constant
     * @type {CodeceptJS.IScenario}
     */
    var xScenario: CodeceptJS.IScenario;
    /**
     * @param {CodeceptJS.LocatorOrString}  context
     * @param {Function}  fn
     * @return {Promise<*> | undefined}
     */
    function within(context: CodeceptJS.LocatorOrString, fn: (...params: any[]) => any): Promise<any> | undefined;
    class Detox {
        /**
         * Saves a screenshot to the output dir
         *
         * ```js
         * I.saveScreenshot('main-window.png');
         * ```
         *
         * @param string name
         */
        saveScreenshot(string: any): void;
        /**
         * Relaunches an application.
         *
         * ```js
         * I.relaunchApp();
         * ```
         */
        relaunchApp(): void;
        /**
         * Launches an application. If application instance already exists, use [relaunchApp](#relaunchApp).
         *
         * ```js
         * I.launchApp();
         * ```
         */
        launchApp(): void;
        /**
         * Installs a configured application.
         * Application is installed by default.
         *
         * ```js
         * I.installApp();
         * ```
         */
        installApp(): void;
        /**
         * Shakes the device.
         *
         * ```js
         * I.shakeDevice();
         * ```
         */
        shakeDevice(): void;
        /**
         * Goes back on Android
         *
         * ```js
         * I.goBack(); // on Android only
         * ```
         */
        goBack(): void;
        /**
         * Switches device to landscape orientation
         *
         * ```js
         * I.setLandscapeOrientation();
         * ```
         */
        setLandscapeOrientation(): void;
        /**
         * Switches device to portrait orientation
         *
         * ```js
         * I.setPortraitOrientation();
         * ```
         */
        setPortraitOrientation(): void;
        /**
         * Execute code only on iOS
         *
         * ```js
         * I.runOnIOS(() => {
         *    I.click('Button');
         *    I.see('Hi, IOS');
         * });
         * ```
         * @param fn a function which will be executed on iOS
         */
        runOnIOS(fn: any): void;
        /**
         * Execute code only on Android
         *
         * ```js
         * I.runOnAndroid(() => {
         *    I.click('Button');
         *    I.see('Hi, Android');
         * });
         * ```
         * @param fn a function which will be executed on android
         */
        runOnAndroid(fn: any): void;
        /**
         * Taps on an element.
         * Element can be located by its text or id or accessibility id.
         *
         * The second parameter is a context element to narrow the search.
         *
         * Same as [click](#click)
         *
         * ```js
         * I.tap('Login'); // locate by text
         * I.tap('~nav-1'); // locate by accessibility label
         * I.tap('#user'); // locate by id
         * I.tap('Login', '#nav'); // locate by text inside #nav
         * I.tap({ ios: 'Save', android: 'SAVE' }, '#main'); // different texts on iOS and Android
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         * @param {?CodeceptJS.LocatorOrString} [context=null]
         */
        tap(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Multi taps on an element.
         * Element can be located by its text or id or accessibility id.
         *
         * Set the number of taps in second argument.
         * Optionally define the context element by third argument.
         *
         * ```js
         * I.multiTap('Login', 2); // locate by text
         * I.multiTap('~nav', 2); // locate by accessibility label
         * I.multiTap('#user', 2); // locate by id
         * I.multiTap('Update', 2, '#menu'); // locate by id
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element to locate
         * @param {number} num number of taps
         * @param {?CodeceptJS.LocatorOrString} [context=null] context element
         */
        multiTap(locator: CodeceptJS.LocatorOrString, num: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Taps an element and holds for a requested time.
         *
         * ```js
         * I.longPress('Login', 2); // locate by text, hold for 2 seconds
         * I.longPress('~nav', 1); // locate by accessibility label, hold for second
         * I.longPress('Update', 2, '#menu'); // locate by text inside #menu, hold for 2 seconds
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element to locate
         * @param {number} sec number of seconds to hold tap
         * @param {CodeceptJS.LocatorOrString} context context element
         */
        longPress(locator: CodeceptJS.LocatorOrString, sec: number, context: CodeceptJS.LocatorOrString): void;
        /**
         * Clicks on an element.
         * Element can be located by its text or id or accessibility id
         *
         * The second parameter is a context (id | type | accessibility id) to narrow the search.
         *
         * Same as [tap](#tap)
         *
         * ```js
         * I.click('Login'); // locate by text
         * I.click('~nav-1'); // locate by accessibility label
         * I.click('#user'); // locate by id
         * I.click('Login', '#nav'); // locate by text inside #nav
         * I.click({ ios: 'Save', android: 'SAVE' }, '#main'); // different texts on iOS and Android
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         * @param {?CodeceptJS.LocatorOrString} [context=null]
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs click on element with horizontal and vertical offset.
         * An element is located by text, id, accessibility id.
         *
         * ```js
         * I.clickAtPoint('Save', 10, 10);
         * I.clickAtPoint('~save', 10, 10); // locate by accessibility id
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         * @param {number} [x=0] horizontal offset
         * @param {number} [y=0] vertical offset
         *
         */
        clickAtPoint(locator: CodeceptJS.LocatorOrString, x?: number, y?: number): void;
        /**
         * Checks text to be visible.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.see('Record created');
         * I.see('Record updated', '#message');
         * I.see('Record deleted', '~message');
         * ```
         *
         * @param {string} text to check visibility
         * @param {?CodeceptJS.LocatorOrString} [context=null] element inside which to search for text
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks text not to be visible.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.dontSee('Record created');
         * I.dontSee('Record updated', '#message');
         * I.dontSee('Record deleted', '~message');
         * ```
         * @param {string} text to check invisibility
         * @param {CodeceptJS.LocatorOrString} context element in which to search for text
         */
        dontSee(text: string, context: CodeceptJS.LocatorOrString): void;
        /**
         * Checks for visibility of an element.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.seeElement('~edit'); // located by accessibility id
         * I.seeElement('~edit', '#menu'); // element inside #menu
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element to locate
         * @param {?CodeceptJS.LocatorOrString} [context=null] context element
         */
        seeElement(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that element is not visible.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.dontSeeElement('~edit'); // located by accessibility id
         * I.dontSeeElement('~edit', '#menu'); // element inside #menu
         * ```
         * @param {CodeceptJS.LocatorOrString} locator element to locate
         * @param {?CodeceptJS.LocatorOrString} [context=null] context element
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks for existence of an element. An element can be visible or not.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.seeElementExists('~edit'); // located by accessibility id
         * I.seeElementExists('~edit', '#menu'); // element inside #menu
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element to locate
         * @param {CodeceptJS.LocatorOrString} context  context element
         */
        seeElementExists(locator: CodeceptJS.LocatorOrString, context: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that element not exists.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.dontSeeElementExist('~edit'); // located by accessibility id
         * I.dontSeeElementExist('~edit', '#menu'); // element inside #menu
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator element to locate
         * @param {CodeceptJS.LocatorOrString} context context element
         */
        dontSeeElementExists(locator: CodeceptJS.LocatorOrString, context: CodeceptJS.LocatorOrString): void;
        /**
         * Fills in text field in an app.
         * A field can be located by text, accessibility id, id.
         *
         * ```js
         * I.fillField('Username', 'davert');
         * I.fillField('~name', 'davert');
         * I.fillField({ android: 'NAME', ios: 'name' }, 'davert');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field an input element to fill in
         * @param {string} value value to fill
         */
        fillField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Clears a text field.
         * A field can be located by text, accessibility id, id.
         *
         * ```js
         * I.clearField('~name');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field an input element to clear
         */
        clearField(field: CodeceptJS.LocatorOrString): void;
        /**
         * Appends text into the field.
         * A field can be located by text, accessibility id, id.
         *
         * ```js
         * I.appendField('name', 'davert');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} field
         * @param {string} value
         */
        appendField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Scrolls to the top of an element.
         *
         * ```js
         * I.scrollUp('#container');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         */
        scrollUp(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Scrolls to the bottom of an element.
         *
         * ```js
         * I.scrollDown('#container');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         */
        scrollDown(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Scrolls to the left of an element.
         *
         * ```js
         * I.scrollLeft('#container');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         */
        scrollLeft(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Scrolls to the right of an element.
         *
         * ```js
         * I.scrollRight('#container');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator
         */
        scrollRight(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Performs a swipe up inside an element.
         * Can be `slow` or `fast` swipe.
         *
         * ```js
         * I.swipeUp('#container');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator an element on which to perform swipe
         * @param {string} [speed='slow'] a speed to perform: `slow` or `fast`.
         */
        swipeUp(locator: CodeceptJS.LocatorOrString, speed?: string): void;
        /**
         * Performs a swipe up inside an element.
         * Can be `slow` or `fast` swipe.
         *
         * ```js
         * I.swipeUp('#container');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator an element on which to perform swipe
         * @param {string} [speed='slow'] a speed to perform: `slow` or `fast`.
         */
        swipeDown(locator: CodeceptJS.LocatorOrString, speed?: string): void;
        /**
         * Performs a swipe up inside an element.
         * Can be `slow` or `fast` swipe.
         *
         * ```js
         * I.swipeUp('#container');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator an element on which to perform swipe
         * @param {string} [speed='slow'] a speed to perform: `slow` or `fast`.
         */
        swipeLeft(locator: CodeceptJS.LocatorOrString, speed?: string): void;
        /**
         * Performs a swipe up inside an element.
         * Can be `slow` or `fast` swipe.
         *
         * ```js
         * I.swipeUp('#container');
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator an element on which to perform swipe
         * @param {string} [speed='slow'] a speed to perform: `slow` or `fast`.
         */
        swipeRight(locator: CodeceptJS.LocatorOrString, speed?: string): void;
        /**
         * Waits for number of seconds
         *
         * ```js
         * I.wait(2); // waits for 2 seconds
         * ```
         *
         * @param {number} sec number of seconds to wait
         */
        wait(sec: number): void;
        /**
         * Waits for an element to exist on page.
         *
         * ```js
         * I.waitForElement('#message', 1); // wait for 1 second
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator an element to wait for
         * @param {number} [sec=5] number of seconds to wait, 5 by default
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be visible on page.
         *
         * ```js
         * I.waitForElementVisible('#message', 1); // wait for 1 second
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator an element to wait for
         * @param {number} [sec=5] number of seconds to wait
         */
        waitForElementVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits an elment to become not visible.
         *
         * ```js
         * I.waitToHide('#message', 2); // wait for 2 seconds
         * ```
         *
         * @param {CodeceptJS.LocatorOrString} locator  an element to wait for
         * @param {number} [sec=5] number of seconds to wait
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
    }
}

