declare namespace CodeceptJS {
    /**
     * Helper for managing remote data using REST API.
     * Uses data generators like [rosie](https://github.com/rosiejs/rosie) or factory girl to create new record.
     *
     * By defining a factory you set the rules of how data is generated.
     * This data will be saved on server via REST API and deleted in the end of a test.
     *
     * ## Use Case
     *
     * Acceptance tests interact with a websites using UI and real browser.
     * There is no way to create data for a specific test other than from user interface.
     * That makes tests slow and fragile. Instead of testing a single feature you need to follow all creation/removal process.
     *
     * This helper solves this problem.
     * Most of web application have API, and it can be used to create and delete test records.
     * By combining REST API with Factories you can easily create records for tests:
     *
     * ```js
     * I.have('user', { login: 'davert', email: 'davert@mail.com' });
     * let id = await I.have('post', { title: 'My first post'});
     * I.haveMultiple('comment', 3, {post_id: id});
     * ```
     *
     * To make this work you need
     *
     * 1. REST API endpoint which allows to perform create / delete requests and
     * 2. define data generation rules
     *
     * ### Setup
     *
     * Install [Rosie](https://github.com/rosiejs/rosie) and [Faker](https://www.npmjs.com/package/faker) libraries.
     *
     * ```sh
     * npm i rosie faker --save-dev
     * ```
     *
     * Create a factory file for a resource.
     *
     * See the example for Posts factories:
     *
     * ```js
     * // tests/factories/posts.js
     *
     * var Factory = require('rosie').Factory;
     * var faker = require('faker');
     *
     * module.exports = new Factory()
     *    // no need to set id, it will be set by REST API
     *    .attr('author', () => faker.name.findName())
     *    .attr('title', () => faker.lorem.sentence())
     *    .attr('body', () => faker.lorem.paragraph());
     * ```
     * For more options see [rosie documentation](https://github.com/rosiejs/rosie).
     *
     * Then configure ApiDataHelper to match factories and REST API:
     * ### Configuration
     *
     * ApiDataFactory has following config options:
     *
     * * `endpoint`: base URL for the API to send requests to.
     * * `cleanup` (default: true): should inserted records be deleted up after tests
     * * `factories`: list of defined factories
     * * `returnId` (default: false): return id instead of a complete response when creating items.
     * * `headers`: list of headers
     * * `REST`: configuration for REST requests
     *
     * See the example:
     *
     * ```js
     *  ApiDataFactory: {
     *    endpoint: "http://user.com/api",
     *    cleanup: true,
     *    headers: {
     *      'Content-Type': 'application/json',
     *      'Accept': 'application/json',
     *    },
     *    factories: {
     *      post: {
     *        uri: "/posts",
     *        factory: "./factories/post",
     *      },
     *      comment: {
     *        factory: "./factories/comment",
     *        create: { post: "/comments/create" },
     *        delete: { post: "/comments/delete/{id}" },
     *        fetchId: (data) => data.result.id
     *      }
     *    }
     * }
     * ```
     * It is required to set REST API `endpoint` which is the baseURL for all API requests.
     * Factory file is expected to be passed via `factory` option.
     *
     * This Helper uses [REST](http://codecept.io/helpers/REST/) helper and accepts its configuration in "REST" section.
     * For instance, to set timeout you should add:
     *
     * ```js
     * "ApiDataFactory": {
     *    "REST": {
     *      "timeout": "100000",
     *   }
     * }
     * ```
     *
     * ### Requests
     *
     * By default to create a record ApiDataFactory will use endpoint and plural factory name:
     *
     * * create: `POST {endpoint}/{resource} data`
     * * delete: `DELETE {endpoint}/{resource}/id`
     *
     * Example (`endpoint`: `http://app.com/api`):
     *
     * * create: POST request to `http://app.com/api/users`
     * * delete: DELETE request to `http://app.com/api/users/1`
     *
     * This behavior can be configured with following options:
     *
     * * `uri`: set different resource uri. Example: `uri: account` => `http://app.com/api/account`.
     * * `create`: override create options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/create" }`
     * * `delete`: override delete options. Expected format: `{ method: uri }`. Example: `{ "post": "/users/delete/{id}" }`
     *
     * Requests can also be overridden with a function which returns [axois request config](https://github.com/axios/axios#request-config).
     *
     * ```js
     * create: (data) => ({ method: 'post', url: '/posts', data }),
     * delete: (id) => ({ method: 'delete', url: '/posts', data: { id } })
     *
     * ```
     *
     * Requests can be updated on the fly by using `onRequest` function. For instance, you can pass in current session from a cookie.
     *
     * ```js
     *  onRequest: async (request) => {
     *     // using global codeceptjs instance
     *     let cookie = await codeceptjs.container.helpers('WebDriver').grabCookie('session');
     *     request.headers = { Cookie: `session=${cookie.value}` };
     *   }
     * ```
     *
     * ### Responses
     *
     * By default `I.have()` returns a promise with a created data:
     *
     * ```js
     * let client = await I.have('client');
     * ```
     *
     * Ids of created records are collected and used in the end of a test for the cleanup.
     * If you need to receive `id` instead of full response enable `returnId` in a helper config:
     *
     * ```js
     * // returnId: false
     * let clientId = await I.have('client');
     * // clientId == 1
     *
     * // returnId: true
     * let clientId = await I.have('client');
     * // client == { name: 'John', email: 'john@snow.com' }
     * ```
     *
     * By default `id` property of response is taken. This behavior can be changed by setting `fetchId` function in a factory config.
     *
     *
     * ```js
     *    factories: {
     *      post: {
     *        uri: "/posts",
     *        factory: "./factories/post",
     *        fetchId: (data) => data.result.posts[0].id
     *      }
     *    }
     * ```
     *
     *
     * ## Methods
     */
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
         * @param factory - factory to use
         * @param params - predefined parameters
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
         */
        haveMultiple(factory: any, times: any, params: any): void;
        /**
         * Executes request to create a record in API.
         * Can be replaced from a in custom helper.
         */
        _requestCreate(factory: any, data: any): void;
        /**
         * Executes request to delete a record in API
         * Can be replaced from a custom helper.
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
         */
        runOnAndroid(caps: any, fn: any): void;
        /**
         * Check if an app is installed.
         *
         * ```js
         * I.seeAppIsInstalled("com.example.android.apis");
         * ```
         * @param bundleId - String  ID of bundled app
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
         * @param bundleId - String  ID of bundled app
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
         * @param path - path to apk file
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
         * @param bundleId - String  ID of bundle
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
         * @param currentActivity - Appium: support only Android
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
         * @param orientation - LANDSCAPE or PORTRAIT
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
         * @param orientation - LANDSCAPE or PORTRAIT
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
         * @param context - the context to switch to
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
         * @param settings - object
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
         * @param strategy - desired strategy to close keyboard (‘tapOutside’ or ‘pressKey’)
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
         * @param keyValue - Device specific key value
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
         */
        tap(locator: any): void;
        /**
         * Perform a swipe on the screen.
         *
         * ```js
         * I.performswipe(100,200);
         * ```
         * @param to - Appium: support Android and iOS
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
         * @param [yoffset = 1000] - (optional)
         * @param [speed = 1000] - (optional), 1000 by default
         *
         * Appium: support Android and iOS
         */
        swipeDown(locator: CodeceptJS.LocatorOrString, yoffset?: number, speed?: number): void;
        /**
         * Perform a swipe left on an element.
         *
         * ```js
         * let locator = "#io.selendroid.testapp:id/LinearLayout1";
         * I.swipeLeft(locator); // simple swipe
         * I.swipeLeft(locator, 500); // set speed
         * I.swipeLeft(locator, 1200, 1000); // set offset and speed
         * ```
         * @param [xoffset = 1000] - (optional)
         * @param [speed = 1000] - (optional), 1000 by default
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
         * @param [xoffset = 1000] - (optional)
         * @param [speed = 1000] - (optional), 1000 by default
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
         * @param [yoffset = 1000] - (optional)
         * @param [speed = 1000] - (optional), 1000 by default
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
         * @param speed - Appium: support Android and iOS
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
         * @param field - located by label|name|CSS|XPath|strict locator
         * @param value - text value to append.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         */
        dontSeeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param text - which is not present.
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - text value to fill.
         */
        fillField(field: CodeceptJS.LocatorOrString, value: CodeceptJS.StringOrSecret): void;
        /**
         * Retrieves all texts from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pins = await I.grabTextFromAll('#pin li');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns first element.
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let inputs = await I.grabValueFromAll('//form/input');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Scroll element into viewport.
         *
         * ```js
         * I.scrollIntoView('#submit');
         * I.scrollIntoView('#submit', true);
         * I.scrollIntoView('#submit', { behavior: "smooth", block: "center", inline: "center" });
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param scrollIntoViewOptions - see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView.
         *
         *
         * Supported only for web testing
         */
        scrollIntoView(locator: LocatorOrString, scrollIntoViewOptions: ScrollIntoViewOptions): void;
        /**
         * Verifies that the specified checkbox is checked.
         *
         * ```js
         * I.seeCheckboxIsChecked('Agree');
         * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
         * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
         * ```
         * @param field - located by label|name|CSS|XPath|strict locator.
         */
        seeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param text - expected on page.
         * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
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
         * @param select - field located by label|name|CSS|XPath|strict locator.
         * @param option - visible text or value of option.
         *
         *
         * Supported only for web testing
         */
        selectOption(select: LocatorOrString, option: string | any[]): void;
        /**
         * Waits for element to be present on page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForElement('.btn.continue');
         * I.waitForElement('.btn.continue', 5); // wait for 5 secs
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = null] - (optional, `1` by default) time in seconds to wait
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param text - to wait for.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
    }
    /**
     * Helper for testing filesystem.
     * Can be easily used to check file structures:
     *
     * ```js
     * I.amInPath('test');
     * I.seeFile('codecept.json');
     * I.seeInThisFile('FileSystem');
     * I.dontSeeInThisFile("WebDriverIO");
     * ```
     *
     * ## Methods
     */
    class FileSystem {
        /**
         * Enters a directory In local filesystem.
         * Starts from a current directory
         */
        amInPath(openPath: string): void;
        /**
         * Writes test to file
         */
        writeToFile(name: string, text: string): void;
        /**
         * Checks that file exists
         */
        seeFile(name: string): void;
        /**
         * Waits for file to be present in current directory.
         *
         * ```js
         * I.handleDownloads();
         * I.click('Download large File');
         * I.amInPath('output/downloads');
         * I.waitForFile('largeFilesName.txt', 10); // wait 10 seconds for file
         * ```
         * @param [sec = 1] - seconds to wait
         */
        waitForFile(name: string, sec?: number): void;
        /**
         * Checks that file with a name including given text exists in the current directory.
         *
         * ```js
         * I.handleDownloads();
         * I.click('Download as PDF');
         * I.amInPath('output/downloads');
         * I.seeFileNameMatching('.pdf');
         * ```
         */
        seeFileNameMatching(): void;
        /**
         * Checks that file found by `seeFile` includes a text.
         */
        seeInThisFile(text: string, encoding?: string): void;
        /**
         * Checks that file found by `seeFile` doesn't include text.
         */
        dontSeeInThisFile(text: string, encoding?: string): void;
        /**
         * Checks that contents of file found by `seeFile` equal to text.
         */
        seeFileContentsEqual(text: string, encoding?: string): void;
        /**
         * Checks that contents of the file found by `seeFile` equal to contents of the file at `pathToReferenceFile`.
         */
        seeFileContentsEqualReferenceFile(pathToReferenceFile: string, encoding?: string, encodingReference?: string): void;
        /**
         * Checks that contents of file found by `seeFile` doesn't equal to text.
         */
        dontSeeFileContentsEqual(text: string, encoding?: string): void;
        /**
         * Returns file names in current directory.
         *
         * ```js
         * I.handleDownloads();
         * I.click('Download Files');
         * I.amInPath('output/downloads');
         * const downloadedFileNames = I.grabFileNames();
         * ```
         */
        grabFileNames(): void;
    }
    /**
     * GraphQL helper allows to send additional requests to a GraphQl endpoint during acceptance tests.
     * [Axios](https://github.com/axios/axios) library is used to perform requests.
     *
     * ## Configuration
     *
     * * endpoint: GraphQL base URL
     * * timeout: timeout for requests in milliseconds. 10000ms by default
     * * defaultHeaders: a list of default headers
     * * onRequest: a async function which can update request object.
     *
     * ## Example
     *
     * ```js
     * GraphQL: {
     *    endpoint: 'http://site.com/graphql/',
     *    onRequest: (request) => {
     *      request.headers.auth = '123';
     *    }
     * }
     * ```
     *
     * ## Access From Helpers
     *
     * Send GraphQL requests by accessing `_executeQuery` method:
     *
     * ```js
     * this.helpers['GraphQL']._executeQuery({
     *    url,
     *    data,
     * });
     * ```
     *
     * ## Methods
     */
    class GraphQL {
        /**
         * Executes query via axios call
         */
        _executeQuery(request: any): void;
        /**
         * Prepares request for axios call
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
         * @param variables - that may go along with the query
         * @param options - are additional query options
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
         * @param variables - that may go along with the mutation
         * @param options - are additional query options
         */
        sendMutation(mutation: string, variables: any, options: any, headers: any): void;
    }
    /**
     * Helper for managing remote data using GraphQL queries.
     * Uses data generators like [rosie](https://github.com/rosiejs/rosie) or factory girl to create new record.
     *
     * By defining a factory you set the rules of how data is generated.
     * This data will be saved on server via GraphQL queries and deleted in the end of a test.
     *
     * ## Use Case
     *
     * Acceptance tests interact with a websites using UI and real browser.
     * There is no way to create data for a specific test other than from user interface.
     * That makes tests slow and fragile. Instead of testing a single feature you need to follow all creation/removal process.
     *
     * This helper solves this problem.
     * If a web application has GraphQL support, it can be used to create and delete test records.
     * By combining GraphQL with Factories you can easily create records for tests:
     *
     * ```js
     * I.mutateData('createUser', { name: 'davert', email: 'davert@mail.com' });
     * let user = await I.mutateData('createUser', { name: 'davert'});
     * I.mutateMultiple('createPost', 3, {post_id: user.id});
     * ```
     *
     * To make this work you need
     *
     * 1. GraphQL endpoint which allows to perform create / delete requests and
     * 2. define data generation rules
     *
     * ### Setup
     *
     * Install [Rosie](https://github.com/rosiejs/rosie) and [Faker](https://www.npmjs.com/package/faker) libraries.
     *
     * ```sh
     * npm i rosie faker --save-dev
     * ```
     *
     * Create a factory file for a resource.
     *
     * See the example for Users factories:
     *
     * ```js
     * // tests/factories/users.js
     *
     * var Factory = require('rosie').Factory;
     * var faker = require('faker');
     *
     * // Used with a constructor function passed to Factory, so that the final build
     * // object matches the necessary pattern to be sent as the variables object.
     * module.exports = new Factory((buildObj) => ({
     *    input: { ...buildObj },
     * }))
     *    // 'attr'-id can be left out depending on the GraphQl resolvers
     *    .attr('name', () => faker.name.findName())
     *    .attr('email', () => faker.interact.email())
     * ```
     * For more options see [rosie documentation](https://github.com/rosiejs/rosie).
     *
     * Then configure GraphQLDataHelper to match factories and GraphQL schema:
     * ### Configuration
     *
     * GraphQLDataFactory has following config options:
     *
     * * `endpoint`: URL for the GraphQL server.
     * * `cleanup` (default: true): should inserted records be deleted up after tests
     * * `factories`: list of defined factories
     * * `headers`: list of headers
     * * `GraphQL`: configuration for GraphQL requests.
     *
     *
     * See the example:
     *
     * ```js
     *  GraphQLDataFactory: {
     *    endpoint: "http://user.com/graphql",
     *    cleanup: true,
     *    headers: {
     *      'Content-Type': 'application/json',
     *      'Accept': 'application/json',
     *    },
     *    factories: {
     *      createUser: {
     *        query: 'mutation createUser($input: UserInput!) { createUser(input: $input) { id name }}',
     *        factory: './factories/users',
     *        revert: (data) => ({
     *          query: 'mutation deleteUser($id: ID!) { deleteUser(id: $id) }',
     *          variables: { id : data.id},
     *        }),
     *      },
     *    }
     * }
     * ```
     * It is required to set GraphQL `endpoint` which is the URL to which all the queries go to.
     * Factory file is expected to be passed via `factory` option.
     *
     * This Helper uses [GraphQL](http://codecept.io/helpers/GraphQL/) helper and accepts its configuration in "GraphQL" section.
     * For instance, to set timeout you should add:
     *
     * ```js
     * "GraphQLDataFactory": {
     *    "GraphQL": {
     *      "timeout": "100000",
     *   }
     * }
     * ```
     *
     * ### Factory
     *
     * Factory contains operations -
     *
     * * `operation`: The operation/mutation that needs to be performed for creating a record in the backend.
     *
     * Each operation must have the following:
     *
     * * `query`: The mutation(query) string. It is expected to use variables to send data with the query.
     * * `factory`: The path to factory file. The object built by the factory in this file will be passed
     *    as the 'variables' object to go along with the mutation.
     * * `revert`: A function called with the data returned when an item is created. The object returned by
     *    this function is will be used to later delete the items created. So, make sure RELEVANT DATA IS RETURNED
     *    when a record is created by a mutation.
     *
     * ### Requests
     *
     * Requests can be updated on the fly by using `onRequest` function. For instance, you can pass in current session from a cookie.
     *
     * ```js
     *  onRequest: async (request) => {
     *     // using global codeceptjs instance
     *     let cookie = await codeceptjs.container.helpers('WebDriver').grabCookie('session');
     *     request.headers = { Cookie: `session=${cookie.value}` };
     *   }
     * ```
     *
     * ### Responses
     *
     * By default `I.mutateData()` returns a promise with created data as specified in operation query string:
     *
     * ```js
     * let client = await I.mutateData('createClient');
     * ```
     *
     * Data of created records are collected and used in the end of a test for the cleanup.
     *
     * ## Methods
     */
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
         * @param operation - to be performed
         * @param params - predefined parameters
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
         */
        mutateMultiple(operation: string, times: number, params: any): void;
        /**
         * Executes request to create a record to the GraphQL endpoint.
         * Can be replaced from a custom helper.
         * @param variables - to be sent along with the query
         */
        _requestCreate(operation: string, variables: any): void;
        /**
         * Executes request to delete a record to the GraphQL endpoint.
         * Can be replaced from a custom helper.
         * @param data - of the record to be deleted.
         */
        _requestDelete(operation: string, data: any): void;
    }
    /**
     * Nightmare helper wraps [Nightmare](https://github.com/segmentio/nightmare) library to provide
     * fastest headless testing using Electron engine. Unlike Selenium-based drivers this uses
     * Chromium-based browser with Electron with lots of client side scripts, thus should be less stable and
     * less trusted.
     *
     * Requires `nightmare` package to be installed.
     *
     * ## Configuration
     *
     * This helper should be configured in codecept.json or codecept.conf.js
     *
     * * `url` - base url of website to be tested
     * * `restart` (optional, default: true) - restart browser between tests.
     * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure.
     * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites.
     * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
     * * `keepBrowserState` (optional, default: false)  - keep browser state between tests when `restart` set to false.
     * * `keepCookies` (optional, default: false)  - keep cookies between tests when `restart` set to false.
     * * `waitForAction`: (optional) how long to wait after click, doubleClick or PressKey actions in ms. Default: 500.
     * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 1000.
     * * `windowSize`: (optional) default window size. Set a dimension like `640x480`.
     *
     * + options from [Nightmare configuration](https://github.com/segmentio/nightmare#api)
     *
     * ## Methods
     */
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
         * @param url - url path or global url.
         * @param headers - list of request headers can be passed
         */
        amOnPage(url: string, headers: any): void;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         * @param text - text value to check.
         */
        seeInTitle(text: string): void;
        /**
         * Checks that title does not contain text.
         *
         * ```js
         * I.dontSeeInTitle('Error');
         * ```
         * @param text - value to check.
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         * @returns title
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
         * @returns current URL
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         * @param url - a fragment to check
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param text - expected on page.
         * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
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
         * @param text - which is not present.
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param text - value to check.
         */
        seeInSource(text: string): void;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         * @param value - to check.
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         */
        seeNumberOfElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Grab number of visible elements by locator.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @returns number of visible elements
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
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
         * @param locator - clickable element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
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
         * @param fn - function to be executed in browser context.
         * @param args - to be passed to function.
         * @returns Wrapper for synchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2)
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
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
         * @param fn - function to be executed in browser context.
         * @param args - to be passed to function.
         * @returns Wrapper for asynchronous [evaluate](https://github.com/segmentio/nightmare#evaluatefn-arg1-arg2).
         * Unlike NightmareJS implementation calling `done` will return its first argument.
         */
        executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         * @param width - width in pixels or `maximize`.
         * @param height - height in pixels.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - text value to fill.
         */
        fillField(field: CodeceptJS.LocatorOrString, value: CodeceptJS.StringOrSecret): void;
        /**
         * Clears a `<textarea>` or text `<input>` element's value.
         *
         * ```js
         * I.clearField('Email');
         * I.clearField('user[email]');
         * I.clearField('#email');
         * ```
         * @param editable - field located by label|name|CSS|XPath|strict locator.
         */
        clearField(editable: LocatorOrString): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param field - located by label|name|CSS|XPath|strict locator
         * @param value - text value to append.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         *         type: 'mouseDown',
         *         x: args.x,
         *         y: args.y,
         *         button: "left"
         *       }
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
         * @param field - located by label|name|CSS|XPath|strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
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
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @param pathToFile - local file path relative to codecept.json config file.
         *
         * Doesn't work if the Chromium DevTools panel is open (as Chromium allows only one attachment to the debugger at a time. [See more](https://github.com/rosshinkley/nightmare-upload#important-note-about-setting-file-upload-inputs))
         */
        attachFile(locator: CodeceptJS.LocatorOrString, pathToFile: string): void;
        /**
         * Retrieves all texts from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pins = await I.grabTextFromAll('#pin li');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns first element.
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let inputs = await I.grabValueFromAll('//form/input');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         */
        grabAttributeFromAll(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string[]>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         * If more than one element is found - attribute of first element is returned.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let postHTMLs = await I.grabHTMLFromAll('.post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFromAll(element: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - HTML of first element is returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Grab CSS property for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param cssProperty - CSS property name.
         * @returns CSS value
         */
        grabCssPropertyFrom(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string>;
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
         * @param select - field located by label|name|CSS|XPath|strict locator.
         * @param option - visible text or value of option.
         */
        selectOption(select: LocatorOrString, option: string | any[]): void;
        /**
         * Sets cookie(s).
         *
         * Can be a single cookie object or an array of cookies:
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         *
         * // as array
         * I.setCookie([
         *   {name: 'auth', value: true},
         *   {name: 'agree', value: true}
         * ]);
         * ```
         * @param cookie - a cookie object or array of cookie objects.
         *
         *
         * Wrapper for `.cookies.set(cookie)`.
         * [See more](https://github.com/segmentio/nightmare/blob/master/Readme.md#cookiessetcookie)
         */
        setCookie(cookie: Cookie | Cookie[]): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         * @param name - cookie name.
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         * @param name - cookie name.
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         * @param [name = null] - cookie name.
         * @returns attribute value
         *
         *
         * Cookie in JSON format. If name not passed returns all cookies for this domain.
         *
         * Multiple cookies can be received by passing query object `I.grabCookie({ secure: true});`. If you'd like get all cookies for all urls, use: `.grabCookie({ url: null }).`
         */
        grabCookie(name?: string): Promise<string> | Promise<string[]>;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         * @param [cookie = null] - (optional, `null` by default) cookie name
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
         * @param fn - to be executed in browser context.
         * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
         * @param [sec = null] - (optional, `1` by default) time in seconds to wait
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         * @param sec - number of second to wait.
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
         * @param text - to wait for.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec] - (optional, `1` by default) time in seconds to wait
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForDetached(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         */
        refreshPage(): void;
        /**
         * Reload the page
         */
        refresh(): void;
        /**
         * Saves screenshot of the specified locator to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         *
         * ```js
         * I.saveElementScreenshot(`#submit`,'debug.png');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param fileName - file name to save.
         */
        saveElementScreenshot(locator: CodeceptJS.LocatorOrString, fileName: string): void;
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [elementSize] - x, y, width or height of the given element.
         * @returns Element bounding rectangle
         */
        grabElementBoundingRect(locator: LocatorOrString, elementSize?: string): Promise<DOMRect> | Promise<number>;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         * @param fileName - file name to save.
         * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
         */
        scrollPageToBottom(): void;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         * @returns scroll position
         */
        grabPageScrollPosition(): Promise<PageScrollPosition>;
    }
    /**
     * Uses [Playwright](https://github.com/microsoft/playwright) library to run tests inside:
     *
     * * Chromium
     * * Firefox
     * * Webkit (Safari)
     *
     * This helper works with a browser out of the box with no additional tools required to install.
     *
     * Requires `playwright` package version ^1 to be installed:
     *
     * ```
     * npm i playwright@^1 --save
     * ```
     *
     * ## Configuration
     *
     * This helper should be configured in codecept.json or codecept.conf.js
     *
     * * `url`: base url of website to be tested
     * * `browser`: a browser to test on, either: `chromium`, `firefox`, `webkit`, `electron`. Default: chromium.
     * * `show`: (optional, default: false) - show browser window.
     * * `restart`: (optional, default: true) - restart browser between tests.
     * * `disableScreenshots`: (optional, default: false)  - don't save screenshot on failure.
     * * `emulate`: (optional, default: {}) launch browser in device emulation mode.
     * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
     * * `uniqueScreenshotNames`: (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites.
     * * `keepBrowserState`: (optional, default: false) - keep browser state between tests when `restart` is set to false.
     * * `keepCookies`: (optional, default: false) - keep cookies between tests when `restart` is set to false.
     * * `waitForAction`: (optional) how long to wait after click, doubleClick or PressKey actions in ms. Default: 100.
     * * `waitForNavigation`: (optional, default: 'load'). When to consider navigation succeeded. Possible options: `load`, `domcontentloaded`, `networkidle`. Choose one of those options is possible. See [Playwright API](https://github.com/microsoft/playwright/blob/master/docs/api.md#pagewaitfornavigationoptions).
     * * `pressKeyDelay`: (optional, default: '10'). Delay between key presses in ms. Used when calling Playwrights page.type(...) in fillField/appendField
     * * `getPageTimeout` (optional, default: '0') config option to set maximum navigation time in milliseconds.
     * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 1000.
     * * `basicAuth`: (optional) the basic authentication to pass to base url. Example: {username: 'username', password: 'password'}
     * * `windowSize`: (optional) default window size. Set a dimension like `640x480`.
     * * `userAgent`: (optional) user-agent string.
     * * `manualStart`: (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["Playwright"]._startBrowser()`.
     * * `chromium`: (optional) pass additional chromium options
     * * `electron`: (optional) pass additional electron options
     *
     * #### Example #1: Wait for 0 network connections.
     *
     * ```js
     * {
     *    helpers: {
     *      Playwright : {
     *        url: "http://localhost",
     *        restart: false,
     *        waitForNavigation: "networkidle0",
     *        waitForAction: 500
     *      }
     *    }
     * }
     * ```
     *
     * #### Example #2: Wait for DOMContentLoaded event
     *
     * ```js
     * {
     *    helpers: {
     *      Playwright : {
     *        url: "http://localhost",
     *        restart: false,
     *        waitForNavigation: "domcontentloaded",
     *        waitForAction: 500
     *      }
     *    }
     * }
     * ```
     *
     * #### Example #3: Debug in window mode
     *
     * ```js
     * {
     *    helpers: {
     *      Playwright : {
     *        url: "http://localhost",
     *        show: true
     *      }
     *    }
     * }
     * ```
     *
     * #### Example #4: Connect to remote browser by specifying [websocket endpoint](https://playwright.dev/docs/api/class-browsertype#browsertypeconnectparams)
     *
     * ```js
     * {
     *    helpers: {
     *      Playwright: {
     *        url: "http://localhost",
     *        chromium: {
     *          browserWSEndpoint: { wsEndpoint: 'ws://localhost:9222/devtools/browser/c5aa6160-b5bc-4d53-bb49-6ecb36cd2e0a' }
     *        }
     *      }
     *    }
     * }
     * ```
     *
     * #### Example #5: Testing with Chromium extensions
     *
     * [official docs](https://github.com/microsoft/playwright/blob/v0.11.0/docs/api.md#working-with-chrome-extensions)
     *
     * ```js
     * {
     *  helpers: {
     *    Playwright: {
     *      url: "http://localhost",
     *      show: true // headless mode not supported for extensions
     *      chromium: {
     *        userDataDir: '/tmp/playwright-tmp', // necessary to launch the browser in normal mode instead of incognito,
     *        args: [
     *           `--disable-extensions-except=${pathToExtension}`,
     *           `--load-extension=${pathToExtension}`
     *        ]
     *      }
     *    }
     *  }
     * }
     * ```
     *
     * #### Example #6: Launch tests emulating iPhone 6
     *
     *
     *
     * ```js
     * const { devices } = require('playwright');
     *
     * {
     *  helpers: {
     *    Playwright: {
     *      url: "http://localhost",
     *      emulate: devices['iPhone 6'],
     *    }
     *  }
     * }
     * ```
     *
     * Note: When connecting to remote browser `show` and specific `chrome` options (e.g. `headless` or `devtools`) are ignored.
     *
     * ## Access From Helpers
     *
     * Receive Playwright client from a custom helper by accessing `browser` for the Browser object or `page` for the current Page object:
     *
     * ```js
     * const { browser } = this.helpers.Playwright;
     * await browser.pages(); // List of pages in the browser
     *
     * // get current page
     * const { page } = this.helpers.Playwright;
     * await page.url(); // Get the url of the current page
     *
     * const { browserContext } = this.helpers.Playwright;
     * await browserContext.cookies(); // get current browser context
     * ```
     *
     * ## Methods
     */
    class Playwright {
        /**
         * Use Playwright API inside a test.
         *
         * First argument is a description of an action.
         * Second argument is async function that gets this helper as parameter.
         *
         * { [`page`](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-page), [`context`](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-context) [`browser`](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-browser) } objects from Playwright API are available.
         *
         * ```js
         * I.usePlaywrightTo('emulate offline mode', async ({ context }) {
         *   await context.setOffline(true);
         * });
         * ```
         * @param description - used to show in logs.
         * @param fn - async functuion that executed with Playwright helper as argument
         */
        usePlaywrightTo(description: string, fn: (...params: any[]) => any): void;
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
         *
         * ```js
         * I.seeInPopup('Popup text');
         * ```
         * @param text - value to check.
         */
        seeInPopup(text: string): void;
        /**
         * Set current page
         * @param page - page to set
         */
        _setPage(page: any): void;
        /**
         * Add the 'dialog' event listener to a page
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
         * @param url - url path or global url.
         */
        amOnPage(url: string): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         * @param width - width in pixels or `maximize`.
         * @param height - height in pixels.
         *
         * Unlike other drivers Playwright changes the size of a viewport, not the window!
         * Playwright does not control the window of a browser so it can't adjust its real size.
         * It also can't maximize a window.
         *
         * Update configuration to change real window size on start:
         *
         * ```js
         * // inside codecept.conf.js
         * // @codeceptjs/configure package must be installed
         * { setWindowSize } = require('@codeceptjs/configure');
         * ````
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
         * @param customHeaders - headers to set
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
         */
        moveCursorTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Drag an item to a destination element.
         *
         * ```js
         * I.dragAndDrop('#dragHandle', '#container');
         * ```
         * @param srcElement - located by CSS|XPath|strict locator.
         * @param destElement - located by CSS|XPath|strict locator.
         */
        dragAndDrop(srcElement: LocatorOrString, destElement: LocatorOrString): void;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         */
        refreshPage(): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         * @param text - text value to check.
         */
        seeInTitle(text: string): void;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         * @returns scroll position
         */
        grabPageScrollPosition(): Promise<PageScrollPosition>;
        /**
         * Checks that title is equal to provided one.
         *
         *  ```js
         *  I.seeTitleEquals('Test title.');
         *  ```
         * @param text - value to check.
         */
        seeTitleEquals(text: string): void;
        /**
         * Checks that title does not contain text.
         *
         * ```js
         * I.dontSeeInTitle('Error');
         * ```
         * @param text - value to check.
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         * @returns title
         */
        grabTitle(): Promise<string>;
        /**
         * Get elements by different locator types, including strict locator
         * Should be used in custom helpers:
         *
         * ```js
         * const elements = await this.helpers['Playwright']._locate({name: 'password'});
         * ```
         */
        _locate(): void;
        /**
         * Find a checkbox by providing human readable text:
         * NOTE: Assumes the checkable element exists
         *
         * ```js
         * this.helpers['Playwright']._locateCheckable('I agree with terms and conditions').then // ...
         * ```
         */
        _locateCheckable(): void;
        /**
         * Find a clickable element by providing human readable text:
         *
         * ```js
         * this.helpers['Playwright']._locateClickable('Next page').then // ...
         * ```
         */
        _locateClickable(): void;
        /**
         * Find field elements by providing human readable text:
         *
         * ```js
         * this.helpers['Playwright']._locateFields('Your email').then // ...
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
         */
        switchToNextTab(num?: number): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
         *
         * ```js
         * I.switchToPreviousTab();
         * I.switchToPreviousTab(2);
         * ```
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
         * Open new tab and automatically switched to new tab
         *
         * ```js
         * I.openNewTab();
         * ```
         *
         * You can pass in [page options](https://github.com/microsoft/playwright/blob/master/docs/api.md#browsernewpageoptions) to emulate device on this page
         *
         * ```js
         * // enable mobile
         * I.openNewTab({ isMobile: true });
         * ```
         */
        openNewTab(): void;
        /**
         * Grab number of open tabs.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let tabs = await I.grabNumberOfOpenTabs();
         * ```
         * @returns number of open tabs
         */
        grabNumberOfOpenTabs(): Promise<number>;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Handles a file download.Aa file name is required to save the file on disk.
         * Files are saved to "output" directory.
         *
         * Should be used with [FileSystem helper](https://codecept.io/helpers/FileSystem) to check that file were downloaded correctly.
         *
         * ```js
         * I.handleDownloads('downloads/avatar.jpg');
         * I.click('Download Avatar');
         * I.amInPath('output/downloads');
         * I.waitForFile('downloads/avatar.jpg', 5);
         *
         * ```
         * @param [fileName = downloads] - set filename for downloaded file
         */
        handleDownloads(fileName?: string): void;
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Clicks link and waits for navigation (deprecated)
         */
        clickLink(): void;
        /**
         * Perform an emulated click on a link or a button, given by a locator.
         * Unlike normal click instead of sending native event, emulates a click with JavaScript.
         * This works on hidden, animated or inactive elements as well.
         *
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.forceClick('Logout');
         * // button of form
         * I.forceClick('Submit');
         * // CSS button
         * I.forceClick('#form input[type=submit]');
         * // XPath
         * I.forceClick('//form/*[@type=submit]');
         * // link in context
         * I.forceClick('Logout', '#nav');
         * // using strict locator
         * I.forceClick({css: 'nav a.login'});
         * ```
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         */
        forceClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
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
         * @param locator - clickable element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
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
         * @param key - name of key to press down.
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
         * @param key - name of key to release.
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
         * @param key - key or array of keys to press.
         *
         *
         * _Note:_ Shortcuts like `'Meta'` + `'A'` do not work on macOS ([GoogleChrome/Puppeteer#1313](https://github.com/GoogleChrome/puppeteer/issues/1313)).
         */
        pressKey(key: string | string[]): void;
        /**
         * Types out the given text into an active field.
         * To slow down typing use a second parameter, to set interval between key presses.
         * _Note:_ Should be used when [`fillField`](#fillfield) is not an option.
         *
         * ```js
         * // passing in a string
         * I.type('Type this out.');
         *
         * // typing values with a 100ms interval
         * I.type('4141555311111111', 100);
         *
         * // passing in an array
         * I.type(['T', 'E', 'X', 'T']);
         * ```
         * @param key - or array of keys to type.
         * @param [delay = null] - (optional) delay in ms between key presses
         */
        type(key: string | string[], delay?: number): void;
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - text value to fill.
         */
        fillField(field: CodeceptJS.LocatorOrString, value: CodeceptJS.StringOrSecret): void;
        /**
         * Clears a `<textarea>` or text `<input>` element's value.
         *
         * ```js
         * I.clearField('Email');
         * I.clearField('user[email]');
         * I.clearField('#email');
         * ```
         * @param editable - field located by label|name|CSS|XPath|strict locator.
         */
        clearField(editable: LocatorOrString): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param field - located by label|name|CSS|XPath|strict locator
         * @param value - text value to append.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @param pathToFile - local file path relative to codecept.json config file.
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
         * @param select - field located by label|name|CSS|XPath|strict locator.
         * @param option - visible text or value of option.
         */
        selectOption(select: LocatorOrString, option: string | any[]): void;
        /**
         * Grab number of visible elements by locator.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @returns number of visible elements
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         * @param url - a fragment to check
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param text - expected on page.
         * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that text is equal to provided one.
         *
         * ```js
         * I.seeTextEquals('text', 'h1');
         * ```
         * @param text - element value to check.
         * @param [context = null] - element located by CSS|XPath|strict locator.
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
         * @param text - which is not present.
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         * @returns source code
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
        grabBrowserLogs(): Promise<any[]>;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         * @returns current URL
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param text - value to check.
         */
        seeInSource(text: string): void;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         * @param value - to check.
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         */
        seeNumberOfElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Sets cookie(s).
         *
         * Can be a single cookie object or an array of cookies:
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         *
         * // as array
         * I.setCookie([
         *   {name: 'auth', value: true},
         *   {name: 'agree', value: true}
         * ]);
         * ```
         * @param cookie - a cookie object or array of cookie objects.
         */
        setCookie(cookie: Cookie | Cookie[]): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         * @param name - cookie name.
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         * @param name - cookie name.
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         * @param [name = null] - cookie name.
         * @returns attribute value
         *
         *
         * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
         */
        grabCookie(name?: string): Promise<string> | Promise<string[]>;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         * @param [cookie = null] - (optional, `null` by default) cookie name
         */
        clearCookie(cookie?: string): void;
        /**
         * Executes a script on the page:
         *
         * ```js
         * I.executeScript(() => window.alert('Hello world'));
         * ```
         *
         * Additional parameters of the function can be passed as an object argument:
         *
         * ```js
         * I.executeScript(({x, y}) => x + y, {x, y});
         * ```
         * You can pass only one parameter into a function
         * but you can pass in array or object.
         *
         * ```js
         * I.executeScript(([x, y]) => x + y, [x, y]);
         * ```
         * If a function returns a Promise it will wait for its resolution.
         * @param fn - function to be executed in browser context.
         * @param [arg] - optional argument to pass to the function
         */
        executeScript(fn: string | ((...params: any[]) => any), arg?: any): Promise<any>;
        /**
         * Grab Locator if called within Context
         */
        _contextLocator(locator: any): void;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns first element.
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves all texts from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pins = await I.grabTextFromAll('#pin li');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let inputs = await I.grabValueFromAll('//form/input');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - HTML of first element is returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let postHTMLs = await I.grabHTMLFromAll('.post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFromAll(element: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Grab CSS property for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param cssProperty - CSS property name.
         * @returns CSS value
         */
        grabCssPropertyFrom(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string>;
        /**
         * Grab array of CSS properties for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param cssProperty - CSS property name.
         * @returns CSS value
         */
        grabCssPropertyFromAll(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string[]>;
        /**
         * Checks that all elements with given locator have given CSS properties.
         *
         * ```js
         * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param cssProperties - object with CSS properties and their values to check.
         */
        seeCssPropertiesOnElements(locator: CodeceptJS.LocatorOrString, cssProperties: any): void;
        /**
         * Checks that all elements with given locator have given attributes.
         *
         * ```js
         * I.seeAttributesOnElements('//form', { method: "post"});
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param attributes - attributes and their values to check.
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
         * @param locator - located by label|name|CSS|XPath|strict locator.
         * @param offsetX - position to drag.
         */
        dragSlider(locator: CodeceptJS.LocatorOrString, offsetX: number): void;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         * If more than one element is found - attribute of first element is returned.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         */
        grabAttributeFromAll(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string[]>;
        /**
         * Saves screenshot of the specified locator to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         *
         * ```js
         * I.saveElementScreenshot(`#submit`,'debug.png');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param fileName - file name to save.
         */
        saveElementScreenshot(locator: CodeceptJS.LocatorOrString, fileName: string): void;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         * @param fileName - file name to save.
         * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
         */
        saveScreenshot(fileName: string, fullPage?: boolean): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         * @param sec - number of second to wait.
         */
        wait(sec: number): void;
        /**
         * Waits for element to become enabled (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional) time in seconds to wait, 1 by default.
         */
        waitForEnabled(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for the specified value to be in value attribute.
         *
         * ```js
         * I.waitForValue('//input', "GoodValue");
         * ```
         * @param field - input field.
         * @param value - expected value.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForValue(field: LocatorOrString, value: string, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec] - (optional, `1` by default) time in seconds to wait
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         *
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param text - to wait for.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Waits for a network request.
         *
         * ```js
         * I.waitForRequest('http://example.com/resource');
         * I.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
         * ```
         * @param [sec = null] - seconds to wait
         */
        waitForRequest(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
        /**
         * Waits for a network request.
         *
         * ```js
         * I.waitForResponse('http://example.com/resource');
         * I.waitForResponse(request => request.url() === 'http://example.com' && request.method() === 'GET');
         * ```
         * @param [sec = null] - number of seconds to wait
         */
        waitForResponse(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
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
         * @param fn - to be executed in browser context.
         * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
         * @param [sec = null] - (optional, `1` by default) time in seconds to wait
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for navigation to finish. By default takes configured `waitForNavigation` option.
         *
         * See [Playwright's reference](https://playwright.dev/docs/api/class-page?_highlight=waitfornavi#pagewaitfornavigationoptions)
         */
        waitForNavigation(opts: any): void;
        /**
         * Waits for a function to return true (waits for 1sec by default).
         *
         * ```js
         * I.waitUntil(() => window.requests == 0);
         * I.waitUntil(() => window.requests == 0, 5);
         * ```
         * @param fn - function which is executed in browser context.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [timeoutMsg = ''] - message to show in case of timeout fail.
         */
        waitUntil(fn: ((...params: any[]) => any) | string, sec?: number, timeoutMsg?: string, interval?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [elementSize] - x, y, width or height of the given element.
         * @returns Element bounding rectangle
         */
        grabElementBoundingRect(locator: LocatorOrString, elementSize?: string): Promise<DOMRect> | Promise<number>;
    }
    /**
     * Protractor helper is based on [Protractor library](http://www.protractortest.org) and used for testing web applications.
     *
     * Protractor requires [Selenium Server and ChromeDriver/GeckoDriver to be installed](http://codecept.io/quickstart/#prepare-selenium-server).
     * To test non-Angular applications please make sure you have `angular: false` in configuration file.
     *
     * ### Configuration
     *
     * This helper should be configured in codecept.json or codecept.conf.js
     *
     * * `url` - base url of website to be tested
     * * `browser` - browser in which perform testing
     * * `angular` (optional, default: true): disable this option to run tests for non-Angular applications.
     * * `driver` - which protractor driver to use (local, direct, session, hosted, sauce, browserstack). By default set to 'hosted' which requires selenium server to be started.
     * * `restart` (optional, default: true) - restart browser between tests.
     * * `smartWait`: (optional) **enables [SmartWait](http://codecept.io/acceptance/#smartwait)**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000
     * * `disableScreenshots` (optional, default: false)  - don't save screenshot on failure
     * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
     * * `uniqueScreenshotNames` (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites
     * * `keepBrowserState` (optional, default: false)  - keep browser state between tests when `restart` set to false.
     * * `seleniumAddress` - Selenium address to connect (default: http://localhost:4444/wd/hub)
     * * `rootElement` - Root element of AngularJS application (default: body)
     * * `getPageTimeout` (optional) sets default timeout for a page to be loaded. 10000 by default.
     * * `waitForTimeout`: (optional) sets default wait time in _ms_ for all `wait*` functions. 1000 by default.
     * * `scriptsTimeout`: (optional) timeout in milliseconds for each script run on the browser, 10000 by default.
     * * `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
     * * `manualStart` (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers.WebDriver._startBrowser()`
     * * `capabilities`: {} - list of [Desired Capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities)
     * * `proxy`: set proxy settings
     *
     * other options are the same as in [Protractor config](https://github.com/angular/protractor/blob/master/docs/referenceConf.js).
     *
     * #### Sample Config
     *
     * ```json
     * {
     *    "helpers": {
     *      "Protractor" : {
     *        "url": "http://localhost",
     *        "browser": "chrome",
     *        "smartWait": 5000,
     *        "restart": false
     *      }
     *    }
     * }
     * ```
     *
     * #### Config for Non-Angular application:
     *
     * ```json
     * {
     *    "helpers": {
     *      "Protractor" : {
     *        "url": "http://localhost",
     *        "browser": "chrome",
     *        "angular": false
     *      }
     *    }
     * }
     * ```
     *
     * #### Config for Headless Chrome
     *
     * ```json
     * {
     *    "helpers": {
     *      "Protractor" : {
     *        "url": "http://localhost",
     *        "browser": "chrome",
     *        "capabilities": {
     *          "chromeOptions": {
     *            "args": [ "--headless", "--disable-gpu", "--no-sandbox" ]
     *          }
     *        }
     *      }
     *    }
     * }
     * ```
     *
     * ## Access From Helpers
     *
     * Receive a WebDriverIO client from a custom helper by accessing `browser` property:
     *
     * ```js
     * this.helpers['Protractor'].browser
     * ```
     *
     * ## Methods
     */
    class Protractor {
        /**
         * Use [Protractor](https://www.protractortest.org/#/api) API inside a test.
         *
         * First argument is a description of an action.
         * Second argument is async function that gets this helper as parameter.
         *
         * { [`browser`](https://www.protractortest.org/#/api?view=ProtractorBrowser)) } object from Protractor API is available.
         *
         * ```js
         * I.useProtractorTo('change url via in-page navigation', async ({ browser }) {
         *    await browser.setLocation('api');
         * });
         * ```
         * @param description - used to show in logs.
         * @param fn - async functuion that executed with Protractor helper as argument
         */
        useProtractorTo(description: string, fn: (...params: any[]) => any): void;
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
         * @param url - url path or global url.
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
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
         * @param locator - clickable element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
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
         * @param text - expected on page.
         * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
         */
        see(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that text is equal to provided one.
         *
         * ```js
         * I.seeTextEquals('text', 'h1');
         * ```
         * @param text - element value to check.
         * @param [context = null] - element located by CSS|XPath|strict locator.
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
         * @param text - which is not present.
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
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
         * @returns all browser logs
         */
        grabBrowserLogs(): Promise<object[]> | undefined;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         * @returns current URL
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
         * @param select - field located by label|name|CSS|XPath|strict locator.
         * @param option - visible text or value of option.
         */
        selectOption(select: LocatorOrString, option: string | any[]): void;
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - text value to fill.
         */
        fillField(field: CodeceptJS.LocatorOrString, value: CodeceptJS.StringOrSecret): void;
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
         * @param key - key or array of keys to press.
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
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @param pathToFile - local file path relative to codecept.json config file.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
         */
        dontSeeInField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param field - located by label|name|CSS|XPath|strict locator
         * @param value - text value to append.
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
         * @param editable - field located by label|name|CSS|XPath|strict locator.
         */
        clearField(editable: LocatorOrString): void;
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         */
        dontSeeCheckboxIsChecked(field: CodeceptJS.LocatorOrString): void;
        /**
         * Retrieves all texts from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pins = await I.grabTextFromAll('#pin li');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns first element.
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let postHTMLs = await I.grabHTMLFromAll('.post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFromAll(element: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - HTML of first element is returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let inputs = await I.grabValueFromAll('//form/input');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Grab array of CSS properties for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param cssProperty - CSS property name.
         * @returns CSS value
         */
        grabCssPropertyFromAll(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string[]>;
        /**
         * Grab CSS property for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param cssProperty - CSS property name.
         * @returns CSS value
         */
        grabCssPropertyFrom(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string>;
        /**
         * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         */
        grabAttributeFromAll(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string[]>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         * If more than one element is found - attribute of first element is returned.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         * @param text - text value to check.
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
         * @param text - value to check.
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         * @returns title
         */
        grabTitle(): Promise<string>;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param text - value to check.
         */
        seeInSource(text: string): void;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         * @returns source code
         */
        grabSource(): Promise<string>;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         * @param value - to check.
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         */
        seeNumberOfElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Grab number of visible elements by locator.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @returns number of visible elements
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Checks that all elements with given locator have given CSS properties.
         *
         * ```js
         * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param cssProperties - object with CSS properties and their values to check.
         */
        seeCssPropertiesOnElements(locator: CodeceptJS.LocatorOrString, cssProperties: any): void;
        /**
         * Checks that all elements with given locator have given attributes.
         *
         * ```js
         * I.seeAttributesOnElements('//form', { method: "post"});
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param attributes - attributes and their values to check.
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
         * @param fn - function to be executed in browser context.
         * @param args - to be passed to function.
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
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
         * @param fn - function to be executed in browser context.
         * @param args - to be passed to function.
         */
        executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         * @param url - a fragment to check
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param url - value to check.
         */
        dontSeeCurrentUrlEquals(url: string): void;
        /**
         * Saves screenshot of the specified locator to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         *
         * ```js
         * I.saveElementScreenshot(`#submit`,'debug.png');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param fileName - file name to save.
         */
        saveElementScreenshot(locator: CodeceptJS.LocatorOrString, fileName: string): void;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         * @param fileName - file name to save.
         * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
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
         * @param [cookie = null] - (optional, `null` by default) cookie name
         */
        clearCookie(cookie?: string): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         * @param name - cookie name.
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         * @param name - cookie name.
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         * @param [name = null] - cookie name.
         * @returns attribute value
         *
         *
         * Returns cookie in JSON [format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
         */
        grabCookie(name?: string): Promise<string> | Promise<string[]>;
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
         *
         * ```js
         * I.seeInPopup('Popup text');
         * ```
         * @param text - value to check.
         */
        seeInPopup(text: string): void;
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
         * @param width - width in pixels or `maximize`.
         * @param height - height in pixels.
         */
        resizeWindow(width: number, height: number): void;
        /**
         * Drag an item to a destination element.
         *
         * ```js
         * I.dragAndDrop('#dragHandle', '#container');
         * ```
         * @param srcElement - located by CSS|XPath|strict locator.
         * @param destElement - located by CSS|XPath|strict locator.
         */
        dragAndDrop(srcElement: LocatorOrString, destElement: LocatorOrString): void;
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
         * @param offset - Offset from current handle index. i.e. offset < 0 will go to the previous handle and positive number will go to the next window handle in sequence.
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
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let tabs = await I.grabNumberOfOpenTabs();
         * ```
         * @returns number of open tabs
         */
        grabNumberOfOpenTabs(): Promise<number>;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
         */
        switchTo(locator?: CodeceptJS.LocatorOrString): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         * @param sec - number of second to wait.
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = null] - (optional, `1` by default) time in seconds to wait
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number, sec?: number): void;
        /**
         * Waits for element to become enabled (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional) time in seconds to wait, 1 by default.
         */
        waitForEnabled(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for the specified value to be in value attribute.
         *
         * ```js
         * I.waitForValue('//input', "GoodValue");
         * ```
         * @param field - input field.
         * @param value - expected value.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForValue(field: LocatorOrString, value: string, sec?: number): void;
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
         * @param fn - to be executed in browser context.
         * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
         * @param [sec = null] - (optional, `1` by default) time in seconds to wait
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for a function to return true (waits for 1sec by default).
         *
         * ```js
         * I.waitUntil(() => window.requests == 0);
         * I.waitUntil(() => window.requests == 0, 5);
         * ```
         * @param fn - function which is executed in browser context.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [timeoutMsg = ''] - message to show in case of timeout fail.
         */
        waitUntil(fn: ((...params: any[]) => any) | string, sec?: number, timeoutMsg?: string, interval?: number): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param text - to wait for.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
         */
        scrollPageToBottom(): void;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         * @returns scroll position
         */
        grabPageScrollPosition(): Promise<PageScrollPosition>;
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
         * Sets cookie(s).
         *
         * Can be a single cookie object or an array of cookies:
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         *
         * // as array
         * I.setCookie([
         *   {name: 'auth', value: true},
         *   {name: 'agree', value: true}
         * ]);
         * ```
         * @param cookie - a cookie object or array of cookie objects.
         */
        setCookie(cookie: Cookie | Cookie[]): void;
    }
    /**
     * Uses [Google Chrome's Puppeteer](https://github.com/GoogleChrome/puppeteer) library to run tests inside headless Chrome.
     * Browser control is executed via DevTools Protocol (instead of Selenium).
     * This helper works with a browser out of the box with no additional tools required to install.
     *
     * Requires `puppeteer` package to be installed.
     *
     * > Experimental Firefox support [can be activated](https://codecept.io/helpers/Puppeteer-firefox).
     *
     * ## Configuration
     *
     * This helper should be configured in codecept.json or codecept.conf.js
     *
     * * `url`: base url of website to be tested
     * * `basicAuth`: (optional) the basic authentication to pass to base url. Example: {username: 'username', password: 'password'}
     * * `show`: (optional, default: false) - show Google Chrome window for debug.
     * * `restart`: (optional, default: true) - restart browser between tests.
     * * `disableScreenshots`: (optional, default: false)  - don't save screenshot on failure.
     * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
     * * `uniqueScreenshotNames`: (optional, default: false)  - option to prevent screenshot override if you have scenarios with the same name in different suites.
     * * `keepBrowserState`: (optional, default: false) - keep browser state between tests when `restart` is set to false.
     * * `keepCookies`: (optional, default: false) - keep cookies between tests when `restart` is set to false.
     * * `waitForAction`: (optional) how long to wait after click, doubleClick or PressKey actions in ms. Default: 100.
     * * `waitForNavigation`: (optional, default: 'load'). When to consider navigation succeeded. Possible options: `load`, `domcontentloaded`, `networkidle0`, `networkidle2`. See [Puppeteer API](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions). Array values are accepted as well.
     * * `pressKeyDelay`: (optional, default: '10'). Delay between key presses in ms. Used when calling Puppeteers page.type(...) in fillField/appendField
     * * `getPageTimeout` (optional, default: '30000') config option to set maximum navigation time in milliseconds. If the timeout is set to 0, then timeout will be disabled.
     * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 1000.
     * * `windowSize`: (optional) default window size. Set a dimension like `640x480`.
     * * `userAgent`: (optional) user-agent string.
     * * `manualStart`: (optional, default: false) - do not start browser before a test, start it manually inside a helper with `this.helpers["Puppeteer"]._startBrowser()`.
     * * `browser`: (optional, default: chrome) - can be changed to `firefox` when using [puppeteer-firefox](https://codecept.io/helpers/Puppeteer-firefox).
     * * `chrome`: (optional) pass additional [Puppeteer run options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions).
     *
     *
     * #### Example #1: Wait for 0 network connections.
     *
     * ```js
     * {
     *    helpers: {
     *      Puppeteer : {
     *        url: "http://localhost",
     *        restart: false,
     *        waitForNavigation: "networkidle0",
     *        waitForAction: 500
     *      }
     *    }
     * }
     * ```
     *
     * #### Example #2: Wait for DOMContentLoaded event and 0 network connections
     *
     * ```js
     * {
     *    helpers: {
     *      Puppeteer : {
     *        url: "http://localhost",
     *        restart: false,
     *        waitForNavigation: [ "domcontentloaded", "networkidle0" ],
     *        waitForAction: 500
     *      }
     *    }
     * }
     * ```
     *
     * #### Example #3: Debug in window mode
     *
     * ```js
     * {
     *    helpers: {
     *      Puppeteer : {
     *        url: "http://localhost",
     *        show: true
     *      }
     *    }
     * }
     * ```
     *
     * #### Example #4: Connect to remote browser by specifying [websocket endpoint](https://chromedevtools.github.io/devtools-protocol/#how-do-i-access-the-browser-target)
     *
     * ```js
     * {
     *    helpers: {
     *      Puppeteer: {
     *        url: "http://localhost",
     *        chrome: {
     *          browserWSEndpoint: "ws://localhost:9222/devtools/browser/c5aa6160-b5bc-4d53-bb49-6ecb36cd2e0a"
     *        }
     *      }
     *    }
     * }
     * ```
     *
     * #### Example #5: Target URL with provided basic authentication
     *
     * ```js
     * {
     *    helpers: {
     *      Puppeteer : {
     *        url: 'http://localhost',
     *        basicAuth: {username: 'username', password: 'password'},
     *        show: true
     *      }
     *    }
     * }
     * ```
     *
     *
     *
     * Note: When connecting to remote browser `show` and specific `chrome` options (e.g. `headless` or `devtools`) are ignored.
     *
     * ## Access From Helpers
     *
     * Receive Puppeteer client from a custom helper by accessing `browser` for the Browser object or `page` for the current Page object:
     *
     * ```js
     * const { browser } = this.helpers.Puppeteer;
     * await browser.pages(); // List of pages in the browser
     *
     * const { page } = this.helpers.Puppeteer;
     * await page.url(); // Get the url of the current page
     * ```
     *
     * ## Methods
     */
    class Puppeteer {
        /**
         * Use Puppeteer API inside a test.
         *
         * First argument is a description of an action.
         * Second argument is async function that gets this helper as parameter.
         *
         * { [`page`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-page), [`browser`](https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-browser) } from Puppeteer API are available.
         *
         * ```js
         * I.usePuppeteerTo('emulate offline mode', async ({ page }) {
         *   await page.setOfflineMode(true);
         * });
         * ```
         * @param description - used to show in logs.
         * @param fn - async function that is executed with Puppeteer as argument
         */
        usePuppeteerTo(description: string, fn: (...params: any[]) => any): void;
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
         *
         * ```js
         * I.seeInPopup('Popup text');
         * ```
         * @param text - value to check.
         */
        seeInPopup(text: string): void;
        /**
         * Set current page
         * @param page - page to set
         */
        _setPage(page: any): void;
        /**
         * Add the 'dialog' event listener to a page
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
         * @param url - url path or global url.
         */
        amOnPage(url: string): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         * @param width - width in pixels or `maximize`.
         * @param height - height in pixels.
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
         * @param customHeaders - headers to set
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
         *
         * {{ react }}
         */
        moveCursorTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Drag an item to a destination element.
         *
         * ```js
         * I.dragAndDrop('#dragHandle', '#container');
         * ```
         * @param srcElement - located by CSS|XPath|strict locator.
         * @param destElement - located by CSS|XPath|strict locator.
         */
        dragAndDrop(srcElement: LocatorOrString, destElement: LocatorOrString): void;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         */
        refreshPage(): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         * @param text - text value to check.
         */
        seeInTitle(text: string): void;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         * @returns scroll position
         */
        grabPageScrollPosition(): Promise<PageScrollPosition>;
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
         * @param text - value to check.
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         * @returns title
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
         */
        switchToNextTab(num?: number): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab
         *
         * ```js
         * I.switchToPreviousTab();
         * I.switchToPreviousTab(2);
         * ```
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
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let tabs = await I.grabNumberOfOpenTabs();
         * ```
         * @returns number of open tabs
         */
        grabNumberOfOpenTabs(): Promise<number>;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * {{ react }}
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
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
         * @param locator - element located by CSS|XPath|strict locator.
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         *
         *
         * {{ react }}
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Perform an emulated click on a link or a button, given by a locator.
         * Unlike normal click instead of sending native event, emulates a click with JavaScript.
         * This works on hidden, animated or inactive elements as well.
         *
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.forceClick('Logout');
         * // button of form
         * I.forceClick('Submit');
         * // CSS button
         * I.forceClick('#form input[type=submit]');
         * // XPath
         * I.forceClick('//form/*[@type=submit]');
         * // link in context
         * I.forceClick('Logout', '#nav');
         * // using strict locator
         * I.forceClick({css: 'nav a.login'});
         * ```
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         *
         *
         * {{ react }}
         */
        forceClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Performs a click on a link and waits for navigation before moving on.
         *
         * ```js
         * I.clickLink('Logout', '#nav');
         * ```
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator
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
         * @param [downloadPath = 'downloads'] - change this parameter to set another directory for saving
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         *
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
         * @param locator - clickable element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
         *
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
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
         * @param key - name of key to press down.
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
         * @param key - name of key to release.
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
         * @param key - key or array of keys to press.
         *
         *
         * _Note:_ Shortcuts like `'Meta'` + `'A'` do not work on macOS ([GoogleChrome/puppeteer#1313](https://github.com/GoogleChrome/puppeteer/issues/1313)).
         */
        pressKey(key: string | string[]): void;
        /**
         * Types out the given text into an active field.
         * To slow down typing use a second parameter, to set interval between key presses.
         * _Note:_ Should be used when [`fillField`](#fillfield) is not an option.
         *
         * ```js
         * // passing in a string
         * I.type('Type this out.');
         *
         * // typing values with a 100ms interval
         * I.type('4141555311111111', 100);
         *
         * // passing in an array
         * I.type(['T', 'E', 'X', 'T']);
         * ```
         * @param key - or array of keys to type.
         * @param [delay = null] - (optional) delay in ms between key presses
         */
        type(key: string | string[], delay?: number): void;
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - text value to fill.
         *
         * {{ react }}
         */
        fillField(field: CodeceptJS.LocatorOrString, value: CodeceptJS.StringOrSecret): void;
        /**
         * Clears a `<textarea>` or text `<input>` element's value.
         *
         * ```js
         * I.clearField('Email');
         * I.clearField('user[email]');
         * I.clearField('#email');
         * ```
         * @param editable - field located by label|name|CSS|XPath|strict locator.
         */
        clearField(editable: LocatorOrString): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param field - located by label|name|CSS|XPath|strict locator
         * @param value - text value to append.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @param pathToFile - local file path relative to codecept.json config file.
         *
         * > ⚠ There is an [issue with file upload in Puppeteer 2.1.0 & 2.1.1](https://github.com/puppeteer/puppeteer/issues/5420), downgrade to 2.0.0 if you face it.
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
         * @param select - field located by label|name|CSS|XPath|strict locator.
         * @param option - visible text or value of option.
         */
        selectOption(select: LocatorOrString, option: string | any[]): void;
        /**
         * Grab number of visible elements by locator.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @returns number of visible elements
         * {{ react }}
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         * @param url - a fragment to check
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param text - expected on page.
         * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
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
         * @param text - element value to check.
         * @param [context = null] - element located by CSS|XPath|strict locator.
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
         * @param text - which is not present.
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         *
         *
         * {{ react }}
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         * @returns source code
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
        grabBrowserLogs(): Promise<any[]>;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         * @returns current URL
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param text - value to check.
         */
        seeInSource(text: string): void;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         * @param value - to check.
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         *
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         *
         *
         * {{ react }}
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Sets cookie(s).
         *
         * Can be a single cookie object or an array of cookies:
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         *
         * // as array
         * I.setCookie([
         *   {name: 'auth', value: true},
         *   {name: 'agree', value: true}
         * ]);
         * ```
         * @param cookie - a cookie object or array of cookie objects.
         */
        setCookie(cookie: Cookie | Cookie[]): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         * @param name - cookie name.
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         * @param name - cookie name.
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         * @param [name = null] - cookie name.
         * @returns attribute value
         *
         *
         * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
         */
        grabCookie(name?: string): Promise<string> | Promise<string[]>;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         * @param [cookie = null] - (optional, `null` by default) cookie name
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
         * @param fn - function to be executed in browser context.
         * @param args - to be passed to function.
         * @returns If a function returns a Promise It will wait for it resolution.
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
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
         * @param fn - function to be executed in browser context.
         * @param args - to be passed to function.
         * @returns Asynchronous scripts can also be executed with `executeScript` if a function returns a Promise.
         */
        executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
        /**
         * Retrieves all texts from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pins = await I.grabTextFromAll('#pin li');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         *
         * {{ react }}
         */
        grabTextFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns first element.
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         *
         * {{ react }}
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let inputs = await I.grabValueFromAll('//form/input');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let postHTMLs = await I.grabHTMLFromAll('.post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFromAll(element: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - HTML of first element is returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Grab array of CSS properties for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param cssProperty - CSS property name.
         * @returns CSS value
         *
         * {{ react }}
         */
        grabCssPropertyFromAll(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string[]>;
        /**
         * Grab CSS property for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param cssProperty - CSS property name.
         * @returns CSS value
         *
         * {{ react }}
         */
        grabCssPropertyFrom(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string>;
        /**
         * Checks that all elements with given locator have given CSS properties.
         *
         * ```js
         * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param cssProperties - object with CSS properties and their values to check.
         * {{ react }}
         */
        seeCssPropertiesOnElements(locator: CodeceptJS.LocatorOrString, cssProperties: any): void;
        /**
         * Checks that all elements with given locator have given attributes.
         *
         * ```js
         * I.seeAttributesOnElements('//form', { method: "post"});
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param attributes - attributes and their values to check.
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
         * @param locator - located by label|name|CSS|XPath|strict locator.
         * @param offsetX - position to drag.
         * {{ react }}
         */
        dragSlider(locator: CodeceptJS.LocatorOrString, offsetX: number): void;
        /**
         * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         *
         * {{ react }}
         */
        grabAttributeFromAll(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string[]>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         * If more than one element is found - attribute of first element is returned.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         *
         * {{ react }}
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Saves screenshot of the specified locator to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         *
         * ```js
         * I.saveElementScreenshot(`#submit`,'debug.png');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param fileName - file name to save.
         */
        saveElementScreenshot(locator: CodeceptJS.LocatorOrString, fileName: string): void;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         * @param fileName - file name to save.
         * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
         */
        saveScreenshot(fileName: string, fullPage?: boolean): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         * @param sec - number of second to wait.
         */
        wait(sec: number): void;
        /**
         * Waits for element to become enabled (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional) time in seconds to wait, 1 by default.
         */
        waitForEnabled(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for the specified value to be in value attribute.
         *
         * ```js
         * I.waitForValue('//input', "GoodValue");
         * ```
         * @param field - input field.
         * @param value - expected value.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForValue(field: LocatorOrString, value: string, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         *
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param text - to wait for.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Waits for a network request.
         *
         * ```js
         * I.waitForRequest('http://example.com/resource');
         * I.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
         * ```
         * @param [sec = null] - seconds to wait
         */
        waitForRequest(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
        /**
         * Waits for a network response.
         *
         * ```js
         * I.waitForResponse('http://example.com/resource');
         * I.waitForResponse(response => response.url() === 'http://example.com' && response.request().method() === 'GET');
         * ```
         * @param [sec = null] - number of seconds to wait
         */
        waitForResponse(urlOrPredicate: string | ((...params: any[]) => any), sec?: number): void;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
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
         * @param fn - to be executed in browser context.
         * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
         * @param [sec = null] - (optional, `1` by default) time in seconds to wait
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for navigation to finish. By default takes configured `waitForNavigation` option.
         *
         * See [Pupeteer's reference](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagewaitfornavigationoptions)
         */
        waitForNavigation(opts: any): void;
        /**
         * Waits for a function to return true (waits for 1sec by default).
         *
         * ```js
         * I.waitUntil(() => window.requests == 0);
         * I.waitUntil(() => window.requests == 0, 5);
         * ```
         * @param fn - function which is executed in browser context.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [timeoutMsg = ''] - message to show in case of timeout fail.
         */
        waitUntil(fn: ((...params: any[]) => any) | string, sec?: number, timeoutMsg?: string, interval?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [elementSize] - x, y, width or height of the given element.
         * @returns Element bounding rectangle
         */
        grabElementBoundingRect(locator: LocatorOrString, elementSize?: string): Promise<DOMRect> | Promise<number>;
    }
    /**
     * REST helper allows to send additional requests to the REST API during acceptance tests.
     * [Axios](https://github.com/axios/axios) library is used to perform requests.
     *
     * ## Configuration
     *
     * * endpoint: API base URL
     * * timeout: timeout for requests in milliseconds. 10000ms by default
     * * defaultHeaders: a list of default headers
     * * onRequest: a async function which can update request object.
     * * maxUploadFileSize: set the max content file size in MB when performing api calls.
     *
     * ## Example
     *
     * ```js
     * {
     *   helpers: {
     *     REST: {
     *       endpoint: 'http://site.com/api',
     *       onRequest: (request) => {
     *       request.headers.auth = '123';
     *     }
     *   }
     * }
     * ```
     *
     * ## Access From Helpers
     *
     * Send REST requests by accessing `_executeRequest` method:
     *
     * ```js
     * this.helpers['REST']._executeRequest({
     *    url,
     *    data,
     * });
     * ```
     *
     * ## Methods
     */
    class REST {
        /**
         * Executes axios request
         */
        _executeRequest(request: any): void;
        /**
         * Generates url based on format sent (takes endpoint + url if latter lacks 'http')
         */
        _url(url: any): void;
        /**
         * Set timeout for the request
         *
         * ```js
         * I.setRequestTimeout(10000); // In milliseconds
         * ```
         */
        setRequestTimeout(): void;
        /**
         * Send GET request to REST API
         *
         * ```js
         * I.sendGetRequest('/api/users.json');
         * ```
         * @param [headers = {}] - the headers object to be sent. By default it is sent as an empty object
         */
        sendGetRequest(url: any, headers?: any): void;
        /**
         * Sends POST request to API.
         *
         * ```js
         * I.sendPostRequest('/api/users.json', { "email": "user@user.com" });
         *
         * // To mask the payload in logs
         * I.sendPostRequest('/api/users.json', secret({ "email": "user@user.com" }));
         *
         * ```
         * @param [payload = {}] - the payload to be sent. By default it is sent as an empty object
         * @param [headers = {}] - the headers object to be sent. By default it is sent as an empty object
         */
        sendPostRequest(url: any, payload?: any, headers?: any): void;
        /**
         * Sends PATCH request to API.
         *
         * ```js
         * I.sendPatchRequest('/api/users.json', { "email": "user@user.com" });
         *
         * // To mask the payload in logs
         * I.sendPatchRequest('/api/users.json', secret({ "email": "user@user.com" }));
         *
         * ```
         * @param [payload = {}] - the payload to be sent. By default it is sent as an empty object
         * @param [headers = {}] - the headers object to be sent. By default it is sent as an empty object
         */
        sendPatchRequest(url: string, payload?: any, headers?: any): void;
        /**
         * Sends PUT request to API.
         *
         * ```js
         * I.sendPutRequest('/api/users.json', { "email": "user@user.com" });
         *
         * // To mask the payload in logs
         * I.sendPutRequest('/api/users.json', secret({ "email": "user@user.com" }));
         *
         * ```
         * @param [payload = {}] - the payload to be sent. By default it is sent as an empty object
         * @param [headers = {}] - the headers object to be sent. By default it is sent as an empty object
         */
        sendPutRequest(url: string, payload?: any, headers?: any): void;
        /**
         * Sends DELETE request to API.
         *
         * ```js
         * I.sendDeleteRequest('/api/users/1');
         * ```
         * @param [headers = {}] - the headers object to be sent. By default it is sent as an empty object
         */
        sendDeleteRequest(url: any, headers?: any): void;
    }
    /**
     * Client Functions
     */
    function getPageUrl(): void;
    /**
     * Uses [TestCafe](https://github.com/DevExpress/testcafe) library to run cross-browser tests.
     * The browser version you want to use in tests must be installed on your system.
     *
     * Requires `testcafe` package to be installed.
     *
     * ```
     * npm i testcafe --save-dev
     * ```
     *
     * ## Configuration
     *
     * This helper should be configured in codecept.json or codecept.conf.js
     *
     * * `url`: base url of website to be tested
     * * `show`: (optional, default: false) - show browser window.
     * * `windowSize`: (optional) - set browser window width and height
     * * `getPageTimeout` (optional, default: '30000') config option to set maximum navigation time in milliseconds.
     * * `waitForTimeout`: (optional) default wait* timeout in ms. Default: 5000.
     * * `browser`: (optional, default: chrome)  - See https://devexpress.github.io/testcafe/documentation/using-testcafe/common-concepts/browsers/browser-support.html
     *
     *
     * #### Example #1: Show chrome browser window
     *
     * ```js
     * {
     *    helpers: {
     *      TestCafe : {
     *        url: "http://localhost",
     *        waitForTimeout: 15000,
     *        show: true,
     *        browser: "chrome"
     *      }
     *    }
     * }
     * ```
     *
     *  To use remote device you can provide 'remote' as browser parameter this will display a link with QR Code
     *  See https://devexpress.github.io/testcafe/documentation/recipes/test-on-remote-computers-and-mobile-devices.html
     *  #### Example #2: Remote browser connection
     *
     * ```js
     * {
     *    helpers: {
     *      TestCafe : {
     *        url: "http://localhost",
     *        waitForTimeout: 15000,
     *        browser: "remote"
     *      }
     *    }
     * }
     * ```
     *
     * ## Access From Helpers
     *
     * Call Testcafe methods directly using the testcafe controller.
     *
     * ```js
     * const testcafeTestController = this.helpers['TestCafe'].t;
     * const comboBox = Selector('.combo-box');
     * await testcafeTestController
     *   .hover(comboBox) // hover over combo box
     *   .click('#i-prefer-both') // click some other element
     * ```
     *
     * ## Methods
     */
    class TestCafe {
        /**
         * Use [TestCafe](https://devexpress.github.io/testcafe/documentation/test-api/) API inside a test.
         *
         * First argument is a description of an action.
         * Second argument is async function that gets this helper as parameter.
         *
         * { [`t`](https://devexpress.github.io/testcafe/documentation/test-api/test-code-structure.html#test-controller)) } object from TestCafe API is available.
         *
         * ```js
         * I.useTestCafeTo('handle browser dialog', async ({ t }) {
         *   await t.setNativeDialogHandler(() => true);
         * });
         * ```
         * @param description - used to show in logs.
         * @param fn - async functuion that executed with TestCafe helper as argument
         */
        useTestCafeTo(description: string, fn: (...params: any[]) => any): void;
        /**
         * Get elements by different locator types, including strict locator
         * Should be used in custom helpers:
         *
         * ```js
         * const elements = await this.helpers['TestCafe']._locate('.item');
         * ```
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
         * @param url - url path or global url.
         */
        amOnPage(url: string): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         * @param width - width in pixels or `maximize`.
         * @param height - height in pixels.
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         */
        refreshPage(): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - text value to fill.
         */
        fillField(field: CodeceptJS.LocatorOrString, value: CodeceptJS.StringOrSecret): void;
        /**
         * Clears a `<textarea>` or text `<input>` element's value.
         *
         * ```js
         * I.clearField('Email');
         * I.clearField('user[email]');
         * I.clearField('#email');
         * ```
         * @param editable - field located by label|name|CSS|XPath|strict locator.
         */
        clearField(editable: LocatorOrString): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param field - located by label|name|CSS|XPath|strict locator
         * @param value - text value to append.
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
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @param pathToFile - local file path relative to codecept.json config file.
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
         * @param key - key or array of keys to press.
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
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
         * @param locator - clickable element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
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
         * @param select - field located by label|name|CSS|XPath|strict locator.
         * @param option - visible text or value of option.
         */
        selectOption(select: LocatorOrString, option: string | any[]): void;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         * @param url - a fragment to check
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param text - expected on page.
         * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
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
         * @param text - which is not present.
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is visible
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElement('#modal');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that a given Element is present in the DOM
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeElementInDOM('#modal');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Asserts that an element is visible a given number of times.
         * Element is located by CSS or XPath.
         *
         * ```js
         * I.seeNumberOfVisibleElements('.buttons', 3);
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Grab number of visible elements by locator.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @returns number of visible elements
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param text - value to check.
         */
        seeInSource(text: string): void;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         * @param value - to check.
         */
        dontSeeInSource(value: string): void;
        /**
         * Saves screenshot of the specified locator to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         *
         * ```js
         * I.saveElementScreenshot(`#submit`,'debug.png');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param fileName - file name to save.
         */
        saveElementScreenshot(locator: CodeceptJS.LocatorOrString, fileName: string): void;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         * @param fileName - file name to save.
         * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
         */
        saveScreenshot(fileName: string, fullPage?: boolean): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         * @param sec - number of second to wait.
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
         * @param fn - function to be executed in browser context.
         * @param args - to be passed to function.
         * @returns If a function returns a Promise It will wait for it resolution.
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
        /**
         * Retrieves all texts from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pins = await I.grabTextFromAll('#pin li');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns first element.
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         * If more than one element is found - attribute of first element is returned.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         */
        grabAttributeFromAll(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         * If more than one element is found - attribute of first element is returned.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let inputs = await I.grabValueFromAll('//form/input');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         * @returns source code
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
         * @returns current URL
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         * @returns scroll position
         */
        grabPageScrollPosition(): Promise<PageScrollPosition>;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
         */
        scrollTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
         */
        switchTo(locator?: CodeceptJS.LocatorOrString): void;
        /**
         * Sets cookie(s).
         *
         * Can be a single cookie object or an array of cookies:
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         *
         * // as array
         * I.setCookie([
         *   {name: 'auth', value: true},
         *   {name: 'agree', value: true}
         * ]);
         * ```
         * @param cookie - a cookie object or array of cookie objects.
         */
        setCookie(cookie: Cookie | Cookie[]): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         * @param name - cookie name.
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         * @param name - cookie name.
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         * @param [name = null] - cookie name.
         * @returns attribute value
         *
         *
         * Returns cookie in JSON format. If name not passed returns all cookies for this domain.
         */
        grabCookie(name?: string): Promise<string> | Promise<string[]>;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         * @param [cookie = null] - (optional, `null` by default) cookie name
         */
        clearCookie(cookie?: string): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param fn - to be executed in browser context.
         * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
         * @param [sec = null] - (optional, `1` by default) time in seconds to wait
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec] - (optional, `1` by default) time in seconds to wait
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param text - to wait for.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
    }
    /**
     * WebDriver helper which wraps [webdriverio](http://webdriver.io/) library to
     * manipulate browser using Selenium WebDriver or PhantomJS.
     *
     * WebDriver requires Selenium Server and ChromeDriver/GeckoDriver to be installed. Those tools can be easily installed via NPM. Please check [Testing with WebDriver](https://codecept.io/webdriver/#testing-with-webdriver) for more details.
     *
     * ### Configuration
     *
     * This helper should be configured in codecept.json or codecept.conf.js
     *
     * * `url`: base url of website to be tested.
     * * `basicAuth`: (optional) the basic authentication to pass to base url. Example: {username: 'username', password: 'password'}
     * * `browser`: browser in which to perform testing.
     * * `host`: (optional, default: localhost) - WebDriver host to connect.
     * * `port`: (optional, default: 4444) - WebDriver port to connect.
     * * `protocol`: (optional, default: http) - protocol for WebDriver server.
     * * `path`: (optional, default: /wd/hub) - path to WebDriver server,
     * * `restart`: (optional, default: true) - restart browser between tests.
     * * `smartWait`: (optional) **enables [SmartWait](http://codecept.io/acceptance/#smartwait)**; wait for additional milliseconds for element to appear. Enable for 5 secs: "smartWait": 5000.
     * * `disableScreenshots`: (optional, default: false) - don't save screenshots on failure.
     * * `fullPageScreenshots` (optional, default: false) - make full page screenshots on failure.
     * * `uniqueScreenshotNames`: (optional, default: false) - option to prevent screenshot override if you have scenarios with the same name in different suites.
     * * `keepBrowserState`: (optional, default: false) - keep browser state between tests when `restart` is set to false.
     * * `keepCookies`: (optional, default: false) - keep cookies between tests when `restart` set to false.
     * * `windowSize`: (optional) default window size. Set to `maximize` or a dimension in the format `640x480`.
     * * `waitForTimeout`: (optional, default: 1000) sets default wait time in *ms* for all `wait*` functions.
     * * `desiredCapabilities`: Selenium's [desired
     * capabilities](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities).
     * * `manualStart`: (optional, default: false) - do not start browser before a test, start it manually inside a helper
     * with `this.helpers["WebDriver"]._startBrowser()`.
     * * `timeouts`: [WebDriver timeouts](http://webdriver.io/docs/timeouts.html) defined as hash.
     *
     * Example:
     *
     * ```js
     * {
     *    helpers: {
     *      WebDriver : {
     *        smartWait: 5000,
     *        browser: "chrome",
     *        restart: false,
     *        windowSize: "maximize",
     *        timeouts: {
     *          "script": 60000,
     *          "page load": 10000
     *        }
     *      }
     *    }
     * }
     * ```
     *
     * Example with basic authentication
     * ```js
     * {
     *    helpers: {
     *      WebDriver : {
     *        smartWait: 5000,
     *        browser: "chrome",
     *        basicAuth: {username: 'username', password: 'password'},
     *        restart: false,
     *        windowSize: "maximize",
     *        timeouts: {
     *          "script": 60000,
     *          "page load": 10000
     *        }
     *      }
     *    }
     * }
     * ```
     *
     * Additional configuration params can be used from [webdriverio
     * website](http://webdriver.io/guide/getstarted/configuration.html).
     *
     * ### Headless Chrome
     *
     * ```js
     * {
     *    helpers: {
     *      WebDriver : {
     *        url: "http://localhost",
     *        browser: "chrome",
     *        desiredCapabilities: {
     *          chromeOptions: {
     *            args: [ "--headless", "--disable-gpu", "--no-sandbox" ]
     *          }
     *        }
     *      }
     *    }
     * }
     * ```
     *
     * ### Internet Explorer
     *
     * Additional configuration params can be used from [IE options](https://seleniumhq.github.io/selenium/docs/api/rb/Selenium/WebDriver/IE/Options.html)
     *
     * ```js
     * {
     *    helpers: {
     *      WebDriver : {
     *        url: "http://localhost",
     *        browser: "internet explorer",
     *        desiredCapabilities: {
     *          ieOptions: {
     *            "ie.browserCommandLineSwitches": "-private",
     *            "ie.usePerProcessProxy": true,
     *            "ie.ensureCleanSession": true,
     *          }
     *        }
     *      }
     *    }
     * }
     * ```
     *
     * ### Selenoid Options
     *
     * [Selenoid](https://aerokube.com/selenoid/latest/) is a modern way to run Selenium inside Docker containers.
     * Selenoid is easy to set up and provides more features than original Selenium Server. Use `selenoidOptions` to set Selenoid capabilities
     *
     * ```js
     * {
     *    helpers: {
     *      WebDriver : {
     *        url: "http://localhost",
     *        browser: "chrome",
     *        desiredCapabilities: {
     *          selenoidOptions: {
     *            enableVNC: true,
     *          }
     *        }
     *      }
     *    }
     * }
     * ```
     *
     * ### Connect Through proxy
     *
     * CodeceptJS also provides flexible options when you want to execute tests to Selenium servers through proxy. You will
     * need to update the `helpers.WebDriver.capabilities.proxy` key.
     *
     * ```js
     * {
     *     helpers: {
     *         WebDriver: {
     *             capabilities: {
     *                 proxy: {
     *                     "proxyType": "manual|pac",
     *                     "proxyAutoconfigUrl": "URL TO PAC FILE",
     *                     "httpProxy": "PROXY SERVER",
     *                     "sslProxy": "PROXY SERVER",
     *                     "ftpProxy": "PROXY SERVER",
     *                     "socksProxy": "PROXY SERVER",
     *                     "socksUsername": "USERNAME",
     *                     "socksPassword": "PASSWORD",
     *                     "noProxy": "BYPASS ADDRESSES"
     *                 }
     *             }
     *         }
     *     }
     * }
     * ```
     * For example,
     *
     * ```js
     * {
     *     helpers: {
     *         WebDriver: {
     *             capabilities: {
     *                 proxy: {
     *                     "proxyType": "manual",
     *                     "httpProxy": "http://corporate.proxy:8080",
     *                     "socksUsername": "codeceptjs",
     *                     "socksPassword": "secret",
     *                     "noProxy": "127.0.0.1,localhost"
     *                 }
     *             }
     *         }
     *     }
     * }
     * ```
     *
     * Please refer to [Selenium - Proxy Object](https://github.com/SeleniumHQ/selenium/wiki/DesiredCapabilities) for more
     * information.
     *
     * ### Cloud Providers
     *
     * WebDriver makes it possible to execute tests against services like `Sauce Labs` `BrowserStack` `TestingBot`
     * Check out their documentation on [available parameters](http://webdriver.io/guide/usage/cloudservices.html)
     *
     * Connecting to `BrowserStack` and `Sauce Labs` is simple. All you need to do
     * is set the `user` and `key` parameters. WebDriver automatically know which
     * service provider to connect to.
     *
     * ```js
     * {
     *     helpers:{
     *         WebDriver: {
     *             url: "YOUR_DESIRED_HOST",
     *             user: "YOUR_BROWSERSTACK_USER",
     *             key: "YOUR_BROWSERSTACK_KEY",
     *             capabilities: {
     *                 "browserName": "chrome",
     *
     *                 // only set this if you're using BrowserStackLocal to test a local domain
     *                 // "browserstack.local": true,
     *
     *                 // set this option to tell browserstack to provide addition debugging info
     *                 // "browserstack.debug": true,
     *             }
     *         }
     *     }
     * }
     * ```
     *
     * #### SauceLabs
     *
     * SauceLabs can be configured via wdio service, which should be installed additionally:
     *
     * ```
     * npm i @wdio/sauce-service --save
     * ```
     *
     * It is important to make sure it is compatible with current webdriverio version.
     *
     * Enable `wdio` plugin in plugins list and add `sauce` service:
     *
     * ```js
     * plugins: {
     *    wdio: {
     *       enabled: true,
     *        services: ['sauce'],
     *        user: ... ,// saucelabs username
     *        key: ... // saucelabs api key
     *        // additional config, from sauce service
     *    }
     * }
     * ```
     *
     * See [complete reference on webdriver.io](https://webdriver.io/docs/sauce-service.html).
     *
     * > Alternatively, use [codeceptjs-saucehelper](https://github.com/puneet0191/codeceptjs-saucehelper/) for better reporting.
     *
     * #### BrowserStack
     *
     * BrowserStack can be configured via wdio service, which should be installed additionally:
     *
     * ```
     * npm i @wdio/browserstack-service --save
     * ```
     *
     * It is important to make sure it is compatible with current webdriverio version.
     *
     * Enable `wdio` plugin in plugins list and add `browserstack` service:
     *
     * ```js
     * plugins: {
     *    wdio: {
     *       enabled: true,
     *        services: ['browserstack'],
     *        user: ... ,// browserstack username
     *        key: ... // browserstack api key
     *        // additional config, from browserstack service
     *    }
     * }
     * ```
     *
     * See [complete reference on webdriver.io](https://webdriver.io/docs/browserstack-service.html).
     *
     * > Alternatively, use [codeceptjs-bshelper](https://github.com/PeterNgTr/codeceptjs-bshelper) for better reporting.
     *
     * #### TestingBot
     *
     * > **Recommended**: use official [TestingBot Helper](https://github.com/testingbot/codeceptjs-tbhelper).
     *
     * Alternatively, TestingBot can be configured via wdio service, which should be installed additionally:
     *
     * ```
     * npm i @wdio/testingbot-service --save
     * ```
     *
     * It is important to make sure it is compatible with current webdriverio version.
     *
     * Enable `wdio` plugin in plugins list and add `testingbot` service:
     *
     * ```js
     * plugins: {
     *   wdio: {
     *       enabled: true,
     *       services: ['testingbot'],
     *       user: ... ,// testingbot key
     *       key: ... // testingbot secret
     *       // additional config, from testingbot service
     *   }
     * }
     * ```
     *
     * See [complete reference on webdriver.io](https://webdriver.io/docs/testingbot-service.html).
     *
     * #### Applitools
     *
     * Visual testing via Applitools service
     *
     * > Use [CodeceptJS Applitools Helper](https://github.com/PeterNgTr/codeceptjs-applitoolshelper) with Applitools wdio service.
     *
     *
     * ### Multiremote Capabilities
     *
     * This is a work in progress but you can control two browsers at a time right out of the box.
     * Individual control is something that is planned for a later version.
     *
     * Here is the [webdriverio docs](http://webdriver.io/guide/usage/multiremote.html) on the subject
     *
     * ```js
     * {
     *     helpers: {
     *         WebDriver: {
     *             "multiremote": {
     *                 "MyChrome": {
     *                     "desiredCapabilities": {
     *                         "browserName": "chrome"
     *                      }
     *                 },
     *                 "MyFirefox": {
     *                    "desiredCapabilities": {
     *                        "browserName": "firefox"
     *                    }
     *                 }
     *             }
     *         }
     *     }
     * }
     * ```
     *
     * ## Access From Helpers
     *
     * Receive a WebDriver client from a custom helper by accessing `browser` property:
     *
     * ```js
     * const { WebDriver } = this.helpers;
     * const browser = WebDriver.browser
     * ```
     *
     * ## Methods
     */
    class WebDriver {
        /**
         * Use [webdriverio](https://webdriver.io/docs/api.html) API inside a test.
         *
         * First argument is a description of an action.
         * Second argument is async function that gets this helper as parameter.
         *
         * { [`browser`](https://webdriver.io/docs/api.html)) } object from WebDriver API is available.
         *
         * ```js
         * I.useWebDriverTo('open multiple windows', async ({ browser }) {
         *    // create new window
         *    await browser.newWindow('https://webdriver.io');
         * });
         * ```
         * @param description - used to show in logs.
         * @param fn - async functuion that executed with WebDriver helper as argument
         */
        useWebDriverTo(description: string, fn: (...params: any[]) => any): void;
        /**
         * Check if locator is type of "Shadow"
         */
        _isShadowLocator(locator: any): void;
        /**
         * Locate Element within the Shadow Dom
         */
        _locateShadow(locator: any): void;
        /**
         * Smart Wait to locate an element
         */
        _smartWait(locator: any): void;
        /**
         * Get elements by different locator types, including strict locator.
         * Should be used in custom helpers:
         *
         * ```js
         * this.helpers['WebDriver']._locate({name: 'password'}).then //...
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         */
        _locate(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Find a checkbox by providing human readable text:
         *
         * ```js
         * this.helpers['WebDriver']._locateCheckable('I agree with terms and conditions').then // ...
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         */
        _locateCheckable(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Find a clickable element by providing human readable text:
         *
         * ```js
         * const els = await this.helpers.WebDriver._locateClickable('Next page');
         * const els = await this.helpers.WebDriver._locateClickable('Next page', '.pages');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         */
        _locateClickable(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Find field elements by providing human readable text:
         *
         * ```js
         * this.helpers['WebDriver']._locateFields('Your email').then // ...
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
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
         * @param timeouts - WebDriver timeouts object.
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
         * @param url - url path or global url.
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         *
         *
         * {{ react }}
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Perform an emulated click on a link or a button, given by a locator.
         * Unlike normal click instead of sending native event, emulates a click with JavaScript.
         * This works on hidden, animated or inactive elements as well.
         *
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.forceClick('Logout');
         * // button of form
         * I.forceClick('Submit');
         * // CSS button
         * I.forceClick('#form input[type=submit]');
         * // XPath
         * I.forceClick('//form/*[@type=submit]');
         * // link in context
         * I.forceClick('Logout', '#nav');
         * // using strict locator
         * I.forceClick({css: 'nav a.login'});
         * ```
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         *
         *
         * {{ react }}
         */
        forceClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
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
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         *
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
         * @param locator - clickable element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
         *
         *
         * {{ react }}
         */
        rightClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Emulates right click on an element.
         * Unlike normal click instead of sending native event, emulates a click with JavaScript.
         * This works on hidden, animated or inactive elements as well.
         *
         * If a fuzzy locator is given, the page will be searched for a button, link, or image matching the locator string.
         * For buttons, the "value" attribute, "name" attribute, and inner text are searched. For links, the link text is searched.
         * For images, the "alt" attribute and inner text of any parent links are searched.
         *
         * The second parameter is a context (CSS or XPath locator) to narrow the search.
         *
         * ```js
         * // simple link
         * I.forceRightClick('Menu');
         * ```
         * @param locator - clickable link or button located by text, or any element located by CSS|XPath|strict locator.
         * @param [context = null] - (optional, `null` by default) element to search in CSS|XPath|Strict locator.
         *
         *
         * {{ react }}
         */
        forceRightClick(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - text value to fill.
         *
         * {{ react }}
         * {{ custom }}
         */
        fillField(field: CodeceptJS.LocatorOrString, value: CodeceptJS.StringOrSecret): void;
        /**
         * Appends text to a input field or textarea.
         * Field is located by name, label, CSS or XPath
         *
         * ```js
         * I.appendField('#myTextField', 'appended');
         * ```
         * @param field - located by label|name|CSS|XPath|strict locator
         * @param value - text value to append.
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
         * @param editable - field located by label|name|CSS|XPath|strict locator.
         */
        clearField(editable: LocatorOrString): void;
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
         * @param select - field located by label|name|CSS|XPath|strict locator.
         * @param option - visible text or value of option.
         */
        selectOption(select: LocatorOrString, option: string | any[]): void;
        /**
         * Attaches a file to element located by label, name, CSS or XPath
         * Path to file is relative current codecept directory (where codecept.json or codecept.conf.js is located).
         * File will be uploaded to remote system (if tests are running remotely).
         *
         * ```js
         * I.attachFile('Avatar', 'data/avatar.jpg');
         * I.attachFile('form input[name=avatar]', 'data/avatar.jpg');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @param pathToFile - local file path relative to codecept.json config file.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
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
         * @param field - checkbox located by label | name | CSS | XPath | strict locator.
         * @param [context = null] - (optional, `null` by default) element located by CSS | XPath | strict locator.
         * Appium: not tested
         */
        uncheckOption(field: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Retrieves all texts from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pins = await I.grabTextFromAll('#pin li');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a text from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let pin = await I.grabTextFrom('#pin');
         * ```
         * If multiple elements found returns first element.
         * @param locator - element located by CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabTextFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves all the innerHTML from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let postHTMLs = await I.grabHTMLFromAll('.post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFromAll(element: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - HTML of first element is returned.
         *
         * ```js
         * let postHTML = await I.grabHTMLFrom('#post');
         * ```
         * @param element - located by CSS|XPath|strict locator.
         * @returns HTML code for an element
         */
        grabHTMLFrom(element: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Retrieves an array of value from a form located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let inputs = await I.grabValueFromAll('//form/input');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFromAll(locator: CodeceptJS.LocatorOrString): Promise<string[]>;
        /**
         * Retrieves a value from a form element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * let email = await I.grabValueFrom('input[name=email]');
         * ```
         * @param locator - field located by label|name|CSS|XPath|strict locator.
         * @returns attribute value
         */
        grabValueFrom(locator: CodeceptJS.LocatorOrString): Promise<string>;
        /**
         * Grab array of CSS properties for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * const values = await I.grabCssPropertyFromAll('h3', 'font-weight');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param cssProperty - CSS property name.
         * @returns CSS value
         */
        grabCssPropertyFromAll(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string[]>;
        /**
         * Grab CSS property for given locator
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         * If more than one element is found - value of first element is returned.
         *
         * ```js
         * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param cssProperty - CSS property name.
         * @returns CSS value
         */
        grabCssPropertyFrom(locator: CodeceptJS.LocatorOrString, cssProperty: string): Promise<string>;
        /**
         * Retrieves an array of attributes from elements located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let hints = await I.grabAttributeFromAll('.tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         *
         * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
         */
        grabAttributeFromAll(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string[]>;
        /**
         * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         * If more than one element is found - attribute of first element is returned.
         *
         * ```js
         * let hint = await I.grabAttributeFrom('#tooltip', 'title');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param attr - attribute name.
         * @returns attribute value
         *
         * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
         */
        grabAttributeFrom(locator: CodeceptJS.LocatorOrString, attr: string): Promise<string>;
        /**
         * Checks that title contains text.
         *
         * ```js
         * I.seeInTitle('Home Page');
         * ```
         * @param text - text value to check.
         */
        seeInTitle(text: string): void;
        /**
         * Checks that title is equal to provided one.
         *
         *  ```js
         *  I.seeTitleEquals('Test title.');
         *  ```
         * @param text - value to check.
         */
        seeTitleEquals(text: string): void;
        /**
         * Checks that title does not contain text.
         *
         * ```js
         * I.dontSeeInTitle('Error');
         * ```
         * @param text - value to check.
         */
        dontSeeInTitle(text: string): void;
        /**
         * Retrieves a page title and returns it to test.
         * Resumes test execution, so **should be used inside async with `await`** operator.
         *
         * ```js
         * let title = await I.grabTitle();
         * ```
         * @returns title
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
         * @param text - expected on page.
         * @param [context = null] - (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
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
         * @param text - element value to check.
         * @param [context = null] - element located by CSS|XPath|strict locator.
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
         * @param text - which is not present.
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator in which to perfrom search.
         *
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         * @param value - value to check.
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         *
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
         * @param field - located by label|name|CSS|XPath|strict locator.
         *
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
         * @param locator - located by CSS|XPath|strict locator.
         * {{ react }}
         */
        seeElement(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
         *
         * ```js
         * I.dontSeeElement('.modal'); // modal is not shown
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
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
         * @param locator - element located by CSS|XPath|strict locator.
         */
        seeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Opposite to `seeElementInDOM`. Checks that element is not on page.
         *
         * ```js
         * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
         * ```
         * @param locator - located by CSS|XPath|Strict locator.
         */
        dontSeeElementInDOM(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that the current page contains the given string in its raw source code.
         *
         * ```js
         * I.seeInSource('<h1>Green eggs &amp; ham</h1>');
         * ```
         * @param text - value to check.
         */
        seeInSource(text: string): void;
        /**
         * Retrieves page source and returns it to test.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let pageSource = await I.grabSource();
         * ```
         * @returns source code
         */
        grabSource(): Promise<string>;
        /**
         * Get JS log from browser. Log buffer is reset after each request.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let logs = await I.grabBrowserLogs();
         * console.log(JSON.stringify(logs))
         * ```
         * @returns all browser logs
         */
        grabBrowserLogs(): Promise<object[]> | undefined;
        /**
         * Get current URL from browser.
         * Resumes test execution, so should be used inside an async function.
         *
         * ```js
         * let url = await I.grabCurrentUrl();
         * console.log(`Current URL is [${url}]`);
         * ```
         * @returns current URL
         */
        grabCurrentUrl(): Promise<string>;
        /**
         * Checks that the current page does not contains the given string in its raw source code.
         *
         * ```js
         * I.dontSeeInSource('<!--'); // no comments in source
         * ```
         * @param value - to check.
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         *
         * {{ react }}
         */
        seeNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number): void;
        /**
         * Checks that all elements with given locator have given CSS properties.
         *
         * ```js
         * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param cssProperties - object with CSS properties and their values to check.
         */
        seeCssPropertiesOnElements(locator: CodeceptJS.LocatorOrString, cssProperties: any): void;
        /**
         * Checks that all elements with given locator have given attributes.
         *
         * ```js
         * I.seeAttributesOnElements('//form', { method: "post"});
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param attributes - attributes and their values to check.
         */
        seeAttributesOnElements(locator: CodeceptJS.LocatorOrString, attributes: any): void;
        /**
         * Grab number of visible elements by locator.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let numOfElements = await I.grabNumberOfVisibleElements('p');
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @returns number of visible elements
         */
        grabNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString): Promise<number>;
        /**
         * Checks that current url contains a provided fragment.
         *
         * ```js
         * I.seeInCurrentUrl('/register'); // we are on registration page
         * ```
         * @param url - a fragment to check
         */
        seeInCurrentUrl(url: string): void;
        /**
         * Checks that current url does not contain a provided fragment.
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param url - value to check.
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
         * @param fn - function to be executed in browser context.
         * @param args - to be passed to function.
         * @returns Wraps [execute](http://webdriver.io/api/protocol/execute.html) command.
         */
        executeScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
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
         * @param fn - function to be executed in browser context.
         * @param args - to be passed to function.
         */
        executeAsyncScript(fn: string | ((...params: any[]) => any), ...args: any[]): Promise<any>;
        /**
         * Scroll element into viewport.
         *
         * ```js
         * I.scrollIntoView('#submit');
         * I.scrollIntoView('#submit', true);
         * I.scrollIntoView('#submit', { behavior: "smooth", block: "center", inline: "center" });
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param scrollIntoViewOptions - see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView.
         */
        scrollIntoView(locator: LocatorOrString, scrollIntoViewOptions: ScrollIntoViewOptions): void;
        /**
         * Scrolls to element matched by locator.
         * Extra shift can be set with offsetX and offsetY options.
         *
         * ```js
         * I.scrollTo('footer');
         * I.scrollTo('#submit', 5, 5);
         * ```
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
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
         * @param locator - located by CSS|XPath|strict locator.
         * @param [offsetX = 0] - (optional, `0` by default) X-axis offset.
         * @param [offsetY = 0] - (optional, `0` by default) Y-axis offset.
         */
        moveCursorTo(locator: CodeceptJS.LocatorOrString, offsetX?: number, offsetY?: number): void;
        /**
         * Saves screenshot of the specified locator to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         *
         * ```js
         * I.saveElementScreenshot(`#submit`,'debug.png');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param fileName - file name to save.
         */
        saveElementScreenshot(locator: CodeceptJS.LocatorOrString, fileName: string): void;
        /**
         * Saves a screenshot to ouput folder (set in codecept.json or codecept.conf.js).
         * Filename is relative to output folder.
         * Optionally resize the window to the full available page `scrollHeight` and `scrollWidth` to capture the entire page by passing `true` in as the second argument.
         *
         * ```js
         * I.saveScreenshot('debug.png');
         * I.saveScreenshot('debug.png', true) //resizes to available scrollHeight and scrollWidth before taking screenshot
         * ```
         * @param fileName - file name to save.
         * @param [fullPage = false] - (optional, `false` by default) flag to enable fullscreen screenshot mode.
         */
        saveScreenshot(fileName: string, fullPage?: boolean): void;
        /**
         * Sets cookie(s).
         *
         * Can be a single cookie object or an array of cookies:
         *
         * ```js
         * I.setCookie({name: 'auth', value: true});
         *
         * // as array
         * I.setCookie([
         *   {name: 'auth', value: true},
         *   {name: 'agree', value: true}
         * ]);
         * ```
         * @param cookie - a cookie object or array of cookie objects.
         *
         *
         *
         * Uses Selenium's JSON [cookie
         * format](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object).
         */
        setCookie(cookie: Cookie | Cookie[]): void;
        /**
         * Clears a cookie by name,
         * if none provided clears all cookies.
         *
         * ```js
         * I.clearCookie();
         * I.clearCookie('test');
         * ```
         * @param [cookie = null] - (optional, `null` by default) cookie name
         */
        clearCookie(cookie?: string): void;
        /**
         * Checks that cookie with given name exists.
         *
         * ```js
         * I.seeCookie('Auth');
         * ```
         * @param name - cookie name.
         */
        seeCookie(name: string): void;
        /**
         * Checks that cookie with given name does not exist.
         *
         * ```js
         * I.dontSeeCookie('auth'); // no auth cookie
         * ```
         * @param name - cookie name.
         */
        dontSeeCookie(name: string): void;
        /**
         * Gets a cookie object by name.
         * If none provided gets all cookies.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let cookie = await I.grabCookie('auth');
         * assert(cookie.value, '123456');
         * ```
         * @param [name = null] - cookie name.
         * @returns attribute value
         */
        grabCookie(name?: string): Promise<string> | Promise<string[]>;
        /**
         * Accepts the active JavaScript native popup window, as created by window.alert|window.confirm|window.prompt.
         * Don't confuse popups with modal windows, as created by [various
         * libraries](http://jster.net/category/windows-modals-popups).
         */
        acceptPopup(): void;
        /**
         * Dismisses the active JavaScript popup, as created by window.alert|window.confirm|window.prompt.
         */
        cancelPopup(): void;
        /**
         * Checks that the active JavaScript popup, as created by `window.alert|window.confirm|window.prompt`, contains the
         * given string.
         * @param text - value to check.
         */
        seeInPopup(text: string): void;
        /**
         * Grab the text within the popup. If no popup is visible then it will return null.
         * ```js
         * await I.grabPopupText();
         * ```
         */
        grabPopupText(): Promise<string>;
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
         * @param key - name of key to press down.
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
         * @param key - name of key to release.
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
         * @param key - key or array of keys to press.
         *
         *
         * _Note:_ In case a text field or textarea is focused be aware that some browsers do not respect active modifier when combining modifier keys with other keys.
         */
        pressKey(key: string | string[]): void;
        /**
         * Types out the given text into an active field.
         * To slow down typing use a second parameter, to set interval between key presses.
         * _Note:_ Should be used when [`fillField`](#fillfield) is not an option.
         *
         * ```js
         * // passing in a string
         * I.type('Type this out.');
         *
         * // typing values with a 100ms interval
         * I.type('4141555311111111', 100);
         *
         * // passing in an array
         * I.type(['T', 'E', 'X', 'T']);
         * ```
         * @param key - or array of keys to type.
         * @param [delay = null] - (optional) delay in ms between key presses
         */
        type(key: string | string[], delay?: number): void;
        /**
         * Resize the current window to provided width and height.
         * First parameter can be set to `maximize`.
         * @param width - width in pixels or `maximize`.
         * @param height - height in pixels.
         * Appium: not tested in web, in apps doesn't work
         */
        resizeWindow(width: number, height: number): void;
        /**
         * Drag an item to a destination element.
         *
         * ```js
         * I.dragAndDrop('#dragHandle', '#container');
         * ```
         * @param srcElement - located by CSS|XPath|strict locator.
         * @param destElement - located by CSS|XPath|strict locator.
         *
         * Appium: not tested
         */
        dragAndDrop(srcElement: LocatorOrString, destElement: LocatorOrString): void;
        /**
         * Drag the scrubber of a slider to a given position
         * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
         *
         * ```js
         * I.dragSlider('#slider', 30);
         * I.dragSlider('#slider', -70);
         * ```
         * @param locator - located by label|name|CSS|XPath|strict locator.
         * @param offsetX - position to drag.
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
        grabAllWindowHandles(): Promise<string[]>;
        /**
         * Get the current Window Handle.
         * Useful for referencing it when calling `I.switchToWindow(handle)`
         * ```js
         * const window = await I.grabCurrentWindowHandle();
         * ```
         */
        grabCurrentWindowHandle(): Promise<string>;
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
         * @param window - name of window handle.
         */
        switchToWindow(window: string): void;
        /**
         * Close all tabs except for the current one.
         *
         *
         *  ```js
         *  I.closeOtherTabs();
         *  ```
         */
        closeOtherTabs(): void;
        /**
         * Pauses execution for a number of seconds.
         *
         * ```js
         * I.wait(2); // wait 2 secs
         * ```
         * @param sec - number of second to wait.
         */
        wait(sec: number): void;
        /**
         * Waits for element to become enabled (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional) time in seconds to wait, 1 by default.
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = null] - (optional, `1` by default) time in seconds to wait
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec] - (optional, `1` by default) time in seconds to wait
         */
        waitForClickable(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waiting for the part of the URL to match the expected. Useful for SPA to understand that page was changed.
         *
         * ```js
         * I.waitInUrl('/info', 2);
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitInUrl(urlPart: string, sec?: number): void;
        /**
         * Waits for the entire URL to match the expected
         *
         * ```js
         * I.waitUrlEquals('/info', 2);
         * I.waitUrlEquals('http://127.0.0.1:8000/info');
         * ```
         * @param urlPart - value to check.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param text - to wait for.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [context = null] - (optional) element located by CSS|XPath|strict locator.
         */
        waitForText(text: string, sec?: number, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Waits for the specified value to be in value attribute.
         *
         * ```js
         * I.waitForValue('//input', "GoodValue");
         * ```
         * @param field - input field.
         * @param value - expected value.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForValue(field: LocatorOrString, value: string, sec?: number): void;
        /**
         * Waits for an element to become visible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForVisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for a specified number of elements on the page.
         *
         * ```js
         * I.waitNumberOfVisibleElements('a', 3);
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param num - number of elements.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitNumberOfVisibleElements(locator: CodeceptJS.LocatorOrString, num: number, sec?: number): void;
        /**
         * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForInvisible('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitForInvisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to hide (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitToHide('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
         * Element can be located by CSS or XPath.
         *
         * ```js
         * I.waitForDetached('#popup');
         * ```
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
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
         * @param fn - to be executed in browser context.
         * @param [argsOrSec = null] - (optional, `1` by default) arguments for function or seconds.
         * @param [sec = null] - (optional, `1` by default) time in seconds to wait
         */
        waitForFunction(fn: string | ((...params: any[]) => any), argsOrSec?: any[] | number, sec?: number): void;
        /**
         * Waits for a function to return true (waits for 1sec by default).
         *
         * ```js
         * I.waitUntil(() => window.requests == 0);
         * I.waitUntil(() => window.requests == 0, 5);
         * ```
         * @param fn - function which is executed in browser context.
         * @param [sec = 1] - (optional, `1` by default) time in seconds to wait
         * @param [timeoutMsg = ''] - message to show in case of timeout fail.
         */
        waitUntil(fn: ((...params: any[]) => any) | string, sec?: number, timeoutMsg?: string, interval?: number): void;
        /**
         * Switches frame or in case of null locator reverts to parent.
         *
         * ```js
         * I.switchTo('iframe'); // switch to first iframe
         * I.switchTo(); // switch back to main page
         * ```
         * @param [locator = null] - (optional, `null` by default) element located by CSS|XPath|strict locator.
         */
        switchTo(locator?: CodeceptJS.LocatorOrString): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
         *
         *  ```js
         *  I.switchToNextTab();
         *  I.switchToNextTab(2);
         *  ```
         * @param [num = 1] - (optional) number of tabs to switch forward, default: 1.
         * @param [sec = null] - (optional) time in seconds to wait.
         */
        switchToNextTab(num?: number, sec?: number | null): void;
        /**
         * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
         *
         *  ```js
         *  I.switchToPreviousTab();
         *  I.switchToPreviousTab(2);
         *  ```
         * @param [num = 1] - (optional) number of tabs to switch backward, default: 1.
         * @param [sec = null] - (optional) time in seconds to wait.
         */
        switchToPreviousTab(num?: number, sec?: number): void;
        /**
         * Close current tab.
         *
         *  ```js
         *  I.closeCurrentTab();
         *  ```
         */
        closeCurrentTab(): void;
        /**
         * Open new tab and switch to it.
         *
         *  ```js
         *  I.openNewTab();
         *  ```
         */
        openNewTab(): void;
        /**
         * Grab number of open tabs.
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let tabs = await I.grabNumberOfOpenTabs();
         * ```
         * @returns number of open tabs
         */
        grabNumberOfOpenTabs(): Promise<number>;
        /**
         * Reload the current page.
         *
         * ```js
         * I.refreshPage();
         * ```
         */
        refreshPage(): void;
        /**
         * Scroll page to the top.
         *
         * ```js
         * I.scrollPageToTop();
         * ```
         */
        scrollPageToTop(): void;
        /**
         * Scroll page to the bottom.
         *
         * ```js
         * I.scrollPageToBottom();
         * ```
         */
        scrollPageToBottom(): void;
        /**
         * Retrieves a page scroll position and returns it to test.
         * Resumes test execution, so **should be used inside an async function with `await`** operator.
         *
         * ```js
         * let { x, y } = await I.grabPageScrollPosition();
         * ```
         * @returns scroll position
         */
        grabPageScrollPosition(): Promise<PageScrollPosition>;
        /**
         * Set the current geo location
         *
         *
         * ```js
         * I.setGeoLocation(121.21, 11.56);
         * I.setGeoLocation(121.21, 11.56, 10);
         * ```
         * @param latitude - to set.
         * @param longitude - to set
         * @param [altitude = null] - (optional, null by default) to set
         */
        setGeoLocation(latitude: number, longitude: number, altitude?: number): void;
        /**
         * Return the current geo location
         * Resumes test execution, so **should be used inside async function with `await`** operator.
         *
         * ```js
         * let geoLocation = await I.grabGeoLocation();
         * ```
         */
        grabGeoLocation(): Promise<{ latitude: number; longitude: number; altitude: number; }>;
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
         * @param locator - element located by CSS|XPath|strict locator.
         * @param [elementSize] - x, y, width or height of the given element.
         * @returns Element bounding rectangle
         */
        grabElementBoundingRect(locator: LocatorOrString, elementSize?: string): Promise<DOMRect> | Promise<number>;
        /**
         * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
         */
        runOnAndroid(): void;
        /**
         * Placeholder for ~ locator only test case write once run on both Appium and WebDriver.
         */
        runInWeb(): void;
    }
    interface ActorStatic {
        /**
         * add print comment method`
         */
        say(msg: string, color?: string): Promise<any> | undefined;
        retry(opts: any): this;
    }
    /**
     * Create CodeceptJS runner.
     * Config and options should be passed
     */
    class Codecept {
        constructor(config: any, opts: any);
        /**
         * Require modules before codeceptjs running
         */
        requireModules(requiringModules: string[]): void;
        /**
         * Initialize CodeceptJS at specific directory.
         * If async initialization is required, pass callback as second parameter.
         */
        init(dir: string): void;
        /**
         * Creates global variables
         */
        initGlobals(dir: string): void;
        /**
         * Executes hooks.
         */
        runHooks(): void;
        /**
         * Executes bootstrap.
         */
        bootstrap(): void;
        /**
         * Executes teardown.
         */
        teardown(): void;
        /**
         * Loads tests by pattern or by config.tests
         */
        loadTests(pattern?: string): void;
        /**
         * Run a specific test or all loaded tests.
         */
        run(test?: string): void;
    }
    /**
     * Current configuration
     */
    class Config {
        /**
         * Create a config with default options
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
         */
        static load(configFile: string): any;
        /**
         * Get current config.
         */
        static get(key?: string, val?: any): any;
        /**
         * Appends values to current config
         */
        static append(additionalConfig: {
            [key: string]: any;
        }): {
            [key: string]: any;
        };
        /**
         * Resets config to default
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
         */
        static create(config: any, opts: any): void;
        /**
         * Get all plugins
         */
        static plugins(name?: string): any;
        /**
         * Get all support objects or get support object by name
         */
        static support(name?: string): any;
        /**
         * Get all helpers or get a helper by name
         */
        static helpers(name?: string): any;
        /**
         * Get translation
         */
        static translation(): void;
        /**
         * Get Mocha instance
         */
        static mocha(): any;
        /**
         * Append new services to container
         */
        static append(newContainer: {
            [key: string]: any;
        }): void;
        /**
         * Clear container
         */
        static clear(newHelpers: {
            [key: string]: any;
        }, newSupport: {
            [key: string]: any;
        }, newPlugins: {
            [key: string]: any;
        }): void;
        /**
         * Share data across worker threads
         * @param options - set {local: true} to not share among workers
         */
        static share(data: any, options: any): void;
    }
    /**
     * Method collect own property and prototype
     */
    function getObjectMethods(): void;
    /**
     * Datatable class to provide data driven testing
     */
    class DataTable {
        constructor(array: any[]);
        add(array: any[]): void;
        xadd(array: any[]): void;
        filter(func: (...params: any[]) => any): void;
    }
    namespace event {
        const dispatcher: NodeJS.EventEmitter;
        const test: {
            started: 'test.start';
            before: 'test.before';
            after: 'test.after';
            passed: 'test.passed';
            failed: 'test.failed';
            finished: 'test.finish';
            skipped: 'test.skipped';
        };
        const suite: {
            before: 'suite.before';
            after: 'suite.after';
        };
        const hook: {
            started: 'hook.start';
            passed: 'hook.passed';
        };
        const step: {
            started: 'step.start';
            before: 'step.before';
            after: 'step.after';
            passed: 'step.passed';
            failed: 'step.failed';
            finished: 'step.finish';
            comment: 'step.comment';
        };
        const bddStep: {
            before: 'suite.before';
            after: 'suite.after';
        };
        const all: {
            before: 'global.before';
            after: 'global.after';
            result: 'global.result';
            failures: 'global.failures';
        };
        const multiple: {
            before: 'multiple.before';
            after: 'multiple.after';
        };
        const workers: {
            before: 'workers.before';
            after: 'workers.after';
        };
        function emit(event: string, param?: any): void;
        /**
         * for testing only!
         */
        function cleanDispatcher(): void;
    }
    namespace browserCodecept {
        /**
         * all found elements are stored here for reuse
         */
        var elements: Node[];
        /**
         * global context changer
         */
        var within: Node;
        /**
         * finders
         */
        function fetchElement(id: number): Node;
        function findAndStoreElements(by: string, locator: CodeceptJS.ILocator, contextEl?: any): number[];
        function findAndStoreElement(by: string, locator: CodeceptJS.ILocator, contextEl?: any): number | undefined;
        function setWithin(by: string, locator: CodeceptJS.ILocator): void;
        function findElements(by: string, locator: CodeceptJS.ILocator, contextEl?: any): Node[];
        function findElement(by: string, locator: CodeceptJS.ILocator, context?: any): Node;
        function clickEl(el: number): boolean;
        function doubleClickEl(el: number): void;
        function hoverEl(el: number, x: number | undefined, y: number | undefined): void;
        function rightClickEl(el: number): void;
        function checkEl(el: number): boolean | undefined;
        function unCheckEl(el: number): boolean;
    }
    /**
     * Index file for loading CodeceptJS programmatically.
     *
     * Includes Public API objects
     */
    namespace index {
        var codecept: typeof CodeceptJS.Codecept;
        var Codecept: typeof CodeceptJS.Codecept;
        var output: typeof CodeceptJS.output;
        var container: typeof CodeceptJS.Container;
        var event: typeof CodeceptJS.event;
        var recorder: CodeceptJS.recorder;
        var config: typeof CodeceptJS.Config;
        var actor: CodeceptJS.actor;
        var helper: typeof CodeceptJS.Helper;
        var Helper: typeof CodeceptJS.Helper;
        var pause: typeof CodeceptJS.pause;
        var within: typeof CodeceptJS.within;
        var dataTable: typeof CodeceptJS.DataTable;
        var store: typeof CodeceptJS.store;
        var locator: typeof CodeceptJS.Locator;
    }
    function addStep(step: any, fn: any): void;
    class FeatureConfig {
        /**
         * Retry this suite for x times
         */
        retry(retries: number): this;
        /**
         * Set timeout for this suite
         */
        timeout(timeout: number): this;
        /**
         * Configures a helper.
         * Helper name can be omitted and values will be applied to first helper.
         */
        config(helper: string | {
            [key: string]: any;
        }, obj?: {
            [key: string]: any;
        }): this;
        /**
         * Append a tag name to scenario title
         */
        tag(tagName: string): this;
    }
    class ScenarioConfig {
        /**
         * Declares that test throws error.
         * Can pass an Error object or regex matching expected message.
         */
        throws(err: any): this;
        /**
         * Declares that test should fail.
         * If test passes - throws an error.
         * Can pass an Error object or regex matching expected message.
         */
        fails(): this;
        /**
         * Retry this test for x times
         */
        retry(retries: number): this;
        /**
         * Set timeout for this test
         */
        timeout(timeout: number): this;
        /**
         * Pass in additional objects to inject into test
         */
        inject(obj: {
            [key: string]: any;
        }): this;
        /**
         * Configures a helper.
         * Helper name can be omitted and values will be applied to first helper.
         */
        config(helper: string | {
            [key: string]: any;
        }, obj?: {
            [key: string]: any;
        }): this;
        /**
         * Append a tag name to scenario title
         */
        tag(tagName: string): this;
        /**
         * Dynamically injects dependencies, see https://codecept.io/pageobjects/#dynamic-injection
         */
        injectDependencies(dependencies: {
            [key: string]: any;
        }): this;
    }
    class Locator {
        constructor(locator: CodeceptJS.LocatorOrString, defaultType?: string);
        toString(): string;
        isFuzzy(): boolean;
        isShadow(): boolean;
        isFrame(): boolean;
        isCSS(): boolean;
        isNull(): boolean;
        isXPath(): boolean;
        isCustom(): boolean;
        isStrict(): boolean;
        isAccessibilityId(): boolean;
        toXPath(): string;
        or(locator: CodeceptJS.LocatorOrString): Locator;
        find(locator: CodeceptJS.LocatorOrString): Locator;
        withChild(locator: CodeceptJS.LocatorOrString): Locator;
        withDescendant(locator: CodeceptJS.LocatorOrString): Locator;
        at(position: number): Locator;
        first(): Locator;
        last(): Locator;
        withText(text: string): Locator;
        withAttr(attributes: {
            [key: string]: string;
        }): Locator;
        as(output: string): Locator;
        inside(locator: CodeceptJS.LocatorOrString): Locator;
        after(locator: CodeceptJS.LocatorOrString): Locator;
        before(locator: CodeceptJS.LocatorOrString): Locator;
        static build(locator: CodeceptJS.LocatorOrString): Locator;
        /**
         * Filters to modify locators
         */
        static filters: any;
        /**
         * Appends new `Locator` filter to an `Locator.filters` array, and returns the new length of the array.
         */
        static addFilter(): void;
    }
    namespace output {
        var stepShift: number;
        /**
         * Set or return current verbosity level
         */
        function level(level?: number): number;
        /**
         * Print information for a process
         * Used in multiple-run
         */
        function process(process: string | null): string;
        /**
         * Print information in --debug mode
         */
        function debug(msg: string): void;
        /**
         * Print information in --verbose mode
         */
        function log(msg: string): void;
        /**
         * Print error
         */
        function error(msg: string): void;
        /**
         * Print a successful message
         */
        function success(msg: string): void;
        /**
         * Prints plugin message
         */
        function plugin(pluginName: string, msg: string): void;
        /**
         * Print a step
         */
        function step(step: CodeceptJS.Step): void;
        namespace suite {
            function started(suite: Mocha.Suite): void;
        }
        namespace test {
            function started(test: Mocha.Test): void;
            function passed(test: Mocha.Test): void;
            function failed(test: Mocha.Test): void;
            function skipped(test: Mocha.Test): void;
        }
        namespace scenario {
            function passed(test: Mocha.Test): void;
            function failed(test: Mocha.Test): void;
        }
        /**
         * Print a text in console log
         */
        function say(message: string, color?: string): void;
        function result(passed: number, failed: number, skipped: number, duration: number | string): void;
    }
    /**
     * Pauses test execution and starts interactive shell
     */
    function pause(): void;
    /**
     * Singleton object to record all test steps as promises and run them in chain.
     */
    interface recorder {
        retries: {
            [key: string]: any;
        }[];
        /**
         * Start recording promises
         */
        start(): void;
        isRunning(): boolean;
        startUnlessRunning(): void;
        /**
         * Add error handler to catch rejected promises
         */
        errHandler(fn: (...params: any[]) => any): void;
        /**
         * Stops current promise chain, calls `catch`.
         * Resets recorder to initial state.
         */
        reset(): void;
        session: CodeceptJS.RecorderSession;
        /**
         * Adds a promise to a chain.
         * Promise description should be passed as first parameter.
         * @param [retry] - undefined: `add(fn)` -> `false` and `add('step',fn)` -> `true`
         *     true: it will retries if `retryOpts` set.
         *     false: ignore `retryOpts` and won't retry.
         */
        add(taskName: string | ((...params: any[]) => any), fn?: (...params: any[]) => any, force?: boolean, retry?: boolean): Promise<any> | undefined;
        retry(opts: any): any;
        catch(customErrFn?: (...params: any[]) => any): Promise<any>;
        catchWithoutStop(customErrFn: (...params: any[]) => any): Promise<any>;
        /**
         * Adds a promise which throws an error into a chain
         */
        throw(err: any): void;
        saveFirstAsyncError(err: any): void;
        getAsyncErr(): any;
        cleanAsyncErr(): void;
        /**
         * Stops recording promises
         */
        stop(): void;
        /**
         * Get latest promise in chain.
         */
        promise(): Promise<any>;
        /**
         * Get a list of all chained tasks
         */
        scheduled(): string;
        /**
         * Get the queue id
         */
        getQueueId(): number;
        /**
         * Get a state of current queue and tasks
         */
        toString(): string;
    }
    interface RecorderSession {
        running: boolean;
        start(name: string): void;
        restore(name: string): void;
        catch(fn: (...params: any[]) => any): void;
    }
    class Secret {
        constructor(secret: string);
        toString(): string;
        static secret(secret: any): Secret;
    }
    function session(sessionName: CodeceptJS.LocatorOrString, config: ((...params: any[]) => any) | {
        [key: string]: any;
    }, fn?: (...params: any[]) => any): Promise<any> | undefined;
    /**
     * Each command in test executed through `I.` object is wrapped in Step.
     * Step allows logging executed commands and triggers hook before and after step execution.
     */
    class Step {
        constructor(helper: CodeceptJS.Helper, name: string);
        actor: string;
        helper: CodeceptJS.Helper;
        name: string;
        helperMethod: string;
        status: string;
        suffix: string;
        prefix: string;
        comment: string;
        args: any[];
        metaStep: MetaStep;
        stack: string;
        setTrace(): void;
        setArguments(args: any[]): void;
        run(...args: any[]): any;
        setStatus(status: string): void;
        humanize(): string;
        humanizeArgs(): string;
        line(): string;
        toString(): string;
        toCode(): string;
        hasBDDAncestor(): boolean;
        static MetaStep: typeof MetaStep;
    }
    class MetaStep extends Step {
        isBDD(): boolean;
        run(): any;
    }
    /**
     * global values for current session
     */
    namespace store {
        var debugMode: boolean;
    }
    /**
     * Describe a "suite" with the given `title`
     * and callback `fn` containing nested suites
     * and/or tests.
     */
    function Feature(title: string, opts?: {
        [key: string]: any;
    }): FeatureConfig;
    /**
     * Pending test suite.
     */
    const xFeature: CodeceptJS.IFeature;
    /**
     * Pending test case.
     */
    const xScenario: CodeceptJS.IScenario;
    /**
     * Pending test case with message: 'Test not implemented!'.
     */
    const todo: CodeceptJS.IScenario;
    function within(context: CodeceptJS.LocatorOrString, fn: (...params: any[]) => any): Promise<any> | undefined;
    /**
     * This is a wrapper on top of [Detox](https://github.com/wix/Detox) library, aimied to unify testing experience for CodeceptJS framework.
     * Detox provides a grey box testing for mobile applications, playing especially good for React Native apps.
     *
     * Detox plays quite differently from Appium. To establish detox testing you need to build a mobile application in a special way to inject Detox code.
     * This why **Detox is grey box testing** solution, so you need an access to application source code, and a way to build and execute it on emulator.
     *
     * Comparing to Appium, Detox runs faster and more stable but requires an additional setup for build.
     *
     * ### Setup
     *
     * 1. [Install and configure Detox for iOS](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md) and [Android](https://github.com/wix/Detox/blob/master/docs/Introduction.Android.md)
     * 2. [Build an application](https://github.com/wix/Detox/blob/master/docs/Introduction.GettingStarted.md#step-4-build-your-app-and-run-detox-tests) using `detox build` command.
     * 3. Install [CodeceptJS](https://codecept.io) and detox-helper:
     *
     * ```
     * npm i @codeceptjs/detox-helper --save
     * ```
     *
     * Detox configuration is required in `package.json` under `detox` section.
     *
     * If you completed step 1 and step 2 you should have a configuration similar this:
     *
     * ```js
     *  "detox": {
     *    "configurations": {
     *      "ios.sim.debug": {
     *        "binaryPath": "ios/build/Build/Products/Debug-iphonesimulator/example.app",
     *        "build": "xcodebuild -project ios/example.xcodeproj -scheme example -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
     *        "type": "ios.simulator",
     *        "name": "iPhone 7"
     *      }
     *    }
     *  }
     * ```
     *
     *
     * ### Configuration
     *
     * Besides Detox configuration, CodeceptJS should also be configured to use Detox.
     *
     * In `codecept.conf.js` enable Detox helper:
     *
     * ```js
     * helpers: {
     *    Detox: {
     *      require: '@codeceptjs/detox-helper',
     *      configuration: '<detox-configuration-name>',
     *    }
     * }
     *
     * ```
     *
     * It's important to specify a package name under `require` section and current detox configuration taken from `package.json`.
     *
     * Options:
     *
     * * `configuration` - a detox configuration name. Required.
     * * `reloadReactNative` - should be enabled for React Native applications.
     * * `reuse` - reuse application for tests. By default, Detox reinstalls and relaunches app.
     * * `registerGlobals` - (default: true) Register Detox helper functions `by`, `element`, `expect`, `waitFor` globally.
     */
    class Detox {
        /**
         * Saves a screenshot to the output dir
         *
         * ```js
         * I.saveScreenshot('main-window.png');
         * ```
         */
        saveScreenshot(name: string): void;
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
         * @param fn - a function which will be executed on iOS
         */
        runOnIOS(fn: (...params: any[]) => any): void;
        /**
         * Execute code only on Android
         *
         * ```js
         * I.runOnAndroid(() => {
         *    I.click('Button');
         *    I.see('Hi, Android');
         * });
         * ```
         * @param fn - a function which will be executed on android
         */
        runOnAndroid(fn: (...params: any[]) => any): void;
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
         */
        tap(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString | null): void;
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
         * @param locator - element to locate
         * @param num - number of taps
         * @param [context = null] - context element
         */
        multiTap(locator: CodeceptJS.LocatorOrString, num: number, context?: CodeceptJS.LocatorOrString | null): void;
        /**
         * Taps an element and holds for a requested time.
         *
         * ```js
         * I.longPress('Login', 2); // locate by text, hold for 2 seconds
         * I.longPress('~nav', 1); // locate by accessibility label, hold for second
         * I.longPress('Update', 2, '#menu'); // locate by text inside #menu, hold for 2 seconds
         * ```
         * @param locator - element to locate
         * @param sec - number of seconds to hold tap
         * @param [context = null] - context element
         */
        longPress(locator: CodeceptJS.LocatorOrString, sec: number, context?: CodeceptJS.LocatorOrString | null): void;
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
         */
        click(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString | null): void;
        /**
         * Performs click on element with horizontal and vertical offset.
         * An element is located by text, id, accessibility id.
         *
         * ```js
         * I.clickAtPoint('Save', 10, 10);
         * I.clickAtPoint('~save', 10, 10); // locate by accessibility id
         * ```
         * @param [x = 0] - horizontal offset
         * @param [y = 0] - vertical offset
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
         * @param text - to check visibility
         * @param [context = null] - element inside which to search for text
         */
        see(text: string, context?: CodeceptJS.LocatorOrString | null): void;
        /**
         * Checks text not to be visible.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.dontSee('Record created');
         * I.dontSee('Record updated', '#message');
         * I.dontSee('Record deleted', '~message');
         * ```
         * @param text - to check invisibility
         * @param [context = null] - element in which to search for text
         */
        dontSee(text: string, context?: CodeceptJS.LocatorOrString | null): void;
        /**
         * Checks for visibility of an element.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.seeElement('~edit'); // located by accessibility id
         * I.seeElement('~edit', '#menu'); // element inside #menu
         * ```
         * @param locator - element to locate
         * @param [context = null] - context element
         */
        seeElement(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString | null): void;
        /**
         * Checks that element is not visible.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.dontSeeElement('~edit'); // located by accessibility id
         * I.dontSeeElement('~edit', '#menu'); // element inside #menu
         * ```
         * @param locator - element to locate
         * @param [context = null] - context element
         */
        dontSeeElement(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString | null): void;
        /**
         * Checks for existence of an element. An element can be visible or not.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.seeElementExists('~edit'); // located by accessibility id
         * I.seeElementExists('~edit', '#menu'); // element inside #menu
         * ```
         * @param locator - element to locate
         * @param [context = null] - context element
         */
        seeElementExists(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Checks that element not exists.
         * Use second parameter to narrow down the search.
         *
         * ```js
         * I.dontSeeElementExist('~edit'); // located by accessibility id
         * I.dontSeeElementExist('~edit', '#menu'); // element inside #menu
         * ```
         * @param locator - element to locate
         * @param [context = null] - context element
         */
        dontSeeElementExists(locator: CodeceptJS.LocatorOrString, context?: CodeceptJS.LocatorOrString): void;
        /**
         * Fills in text field in an app.
         * A field can be located by text, accessibility id, id.
         *
         * ```js
         * I.fillField('Username', 'davert');
         * I.fillField('~name', 'davert');
         * I.fillField({ android: 'NAME', ios: 'name' }, 'davert');
         * ```
         * @param field - an input element to fill in
         * @param value - value to fill
         */
        fillField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Clears a text field.
         * A field can be located by text, accessibility id, id.
         *
         * ```js
         * I.clearField('~name');
         * ```
         * @param field - an input element to clear
         */
        clearField(field: CodeceptJS.LocatorOrString): void;
        /**
         * Appends text into the field.
         * A field can be located by text, accessibility id, id.
         *
         * ```js
         * I.appendField('name', 'davert');
         * ```
         */
        appendField(field: CodeceptJS.LocatorOrString, value: string): void;
        /**
         * Scrolls to the top of an element.
         *
         * ```js
         * I.scrollUp('#container');
         * ```
         */
        scrollUp(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Scrolls to the bottom of an element.
         *
         * ```js
         * I.scrollDown('#container');
         * ```
         */
        scrollDown(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Scrolls to the left of an element.
         *
         * ```js
         * I.scrollLeft('#container');
         * ```
         */
        scrollLeft(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Scrolls to the right of an element.
         *
         * ```js
         * I.scrollRight('#container');
         * ```
         */
        scrollRight(locator: CodeceptJS.LocatorOrString): void;
        /**
         * Performs a swipe up inside an element.
         * Can be `slow` or `fast` swipe.
         *
         * ```js
         * I.swipeUp('#container');
         * ```
         * @param locator - an element on which to perform swipe
         * @param [speed = 'slow'] - a speed to perform: `slow` or `fast`.
         */
        swipeUp(locator: CodeceptJS.LocatorOrString, speed?: string): void;
        /**
         * Performs a swipe up inside an element.
         * Can be `slow` or `fast` swipe.
         *
         * ```js
         * I.swipeUp('#container');
         * ```
         * @param locator - an element on which to perform swipe
         * @param [speed = 'slow'] - a speed to perform: `slow` or `fast`.
         */
        swipeDown(locator: CodeceptJS.LocatorOrString, speed?: string): void;
        /**
         * Performs a swipe up inside an element.
         * Can be `slow` or `fast` swipe.
         *
         * ```js
         * I.swipeUp('#container');
         * ```
         * @param locator - an element on which to perform swipe
         * @param [speed = 'slow'] - a speed to perform: `slow` or `fast`.
         */
        swipeLeft(locator: CodeceptJS.LocatorOrString, speed?: string): void;
        /**
         * Performs a swipe up inside an element.
         * Can be `slow` or `fast` swipe.
         *
         * ```js
         * I.swipeUp('#container');
         * ```
         * @param locator - an element on which to perform swipe
         * @param [speed = 'slow'] - a speed to perform: `slow` or `fast`.
         */
        swipeRight(locator: CodeceptJS.LocatorOrString, speed?: string): void;
        /**
         * Waits for number of seconds
         *
         * ```js
         * I.wait(2); // waits for 2 seconds
         * ```
         * @param sec - number of seconds to wait
         */
        wait(sec: number): void;
        /**
         * Waits for an element to exist on page.
         *
         * ```js
         * I.waitForElement('#message', 1); // wait for 1 second
         * ```
         * @param locator - an element to wait for
         * @param [sec = 5] - number of seconds to wait, 5 by default
         */
        waitForElement(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits for an element to be visible on page.
         *
         * ```js
         * I.waitForElementVisible('#message', 1); // wait for 1 second
         * ```
         * @param locator - an element to wait for
         * @param [sec = 5] - number of seconds to wait
         */
        waitForElementVisible(locator: CodeceptJS.LocatorOrString, sec?: number): void;
        /**
         * Waits an elment to become not visible.
         *
         * ```js
         * I.waitToHide('#message', 2); // wait for 2 seconds
         * ```
         * @param locator - an element to wait for
         * @param [sec = 5] - number of seconds to wait
         */
        waitToHide(locator: CodeceptJS.LocatorOrString, sec?: number): void;
    }
    /**
     * Abstract class.
     * Helpers abstracts test execution backends.
     *
     * Methods of Helper class will be available in tests in `I` object.
     * They provide user-friendly abstracted actions over NodeJS libraries.
     *
     * Hooks (methods starting with `_`) can be used to setup/teardown,
     * or handle execution flow.
     *
     * Methods are expected to return a value in order to be wrapped in promise.
     */
    class Helper {
        constructor(config: any);
        /**
         * Abstract method to provide required config options
         */
        protected static _config(): any;
        /**
         * Abstract method to validate config
         */
        protected _validateConfig(config: any): any;
        /**
         * Sets config for current test
         */
        protected _setConfig(opts: any): void;
        /**
         * Hook executed before all tests
         */
        protected _init(): void;
        /**
         * Hook executed before each test.
         */
        protected _before(): void;
        /**
         * Hook executed after each test
         */
        protected _after(): void;
        /**
         * Hook executed after each passed test
         */
        protected _passed(test: Mocha.Test): void;
        /**
         * Hook executed after each failed test
         */
        protected _failed(test: Mocha.Test): void;
        /**
         * Hook executed before each step
         */
        protected _beforeStep(step: CodeceptJS.Step): void;
        /**
         * Hook executed after each step
         */
        protected _afterStep(step: CodeceptJS.Step): void;
        /**
         * Hook executed before each suite
         */
        protected _beforeSuite(suite: Mocha.Suite): void;
        /**
         * Hook executed after each suite
         */
        protected _afterSuite(suite: Mocha.Suite): void;
        /**
         * Hook executed after all tests are executed
         */
        protected _finishTest(suite: Mocha.Suite): void;
        /**
         * Abstract method to provide common interface to accessing helpers internals inside a test.
         */
        _useTo(): void;
        /**
         * Access another configured helper: `this.helpers['AnotherHelper']`
         */
        readonly helpers: any;
        /**
         * Print debug message to console (outputs only in debug mode)
         */
        debug(msg: string): void;
        debugSection(section: string, msg: string): void;
    }
}

