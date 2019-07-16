/**
 * Current configuration
 */
declare class Config {
    /**
     * Create a config with default options
     *
     * @param {*} newConfig
     */
    static create(newConfig: any): void;
    /**
     * Load config from a file.
     * If js file provided: require it and get .config key
     * If json file provided: load and parse JSON
     * If directory provided:
     * * try to load `codecept.conf.js` from it
     * * try to load `codecept.json` from it
     * If none of above: fail.
     *
     * @param {*} configFile
     */
    static load(configFile: any): void;
    /**
     * Get current config.
     */
    static get(): void;
    /**
     * Appends values to current config
     *
     * @param {*} additionalConfig
     */
    static append(additionalConfig: any): void;
    /**
     * Resets config to default
     */
    static reset(): void;
}

/**
 * Create CodeceptJS runner.
 * Config and options should be passed
 *
 * @param {*} config
 * @param {*} opts
 */
declare class Codecept {
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
 * Dependency Injection Container
 */
declare class Container {
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
     */
    static mocha(): void;
    /**
     * Append new services to container
     *
     * @api
     */
    static append(): void;
    /**
     * Clear container
     *
     * @param {*} newHelpers
     * @param {*} newSupport
     */
    static clear(newHelpers: any, newSupport: any): void;
}

/**
 * @typedef {Object} ILocator
 * @property {string} [id]
 * @property {string} [xpath]
 * @property {string} [css]
 * @property {string} [name]
 * @property {string} [frame]
 * @property {string} [android]
 * @property {string} [ios]
 */
declare type ILocator = {
    id?: string;
    xpath?: string;
    css?: string;
    name?: string;
    frame?: string;
    android?: string;
    ios?: string;
};

/** @typedef {string | ILocator | Locator} LocatorOrString
 */
declare type LocatorOrString = string | ILocator | Locator;

/**
 * @param   {LocatorOrString}  locator
 * @param   {string}  [defaultType]
 */
declare class Locator {
    constructor(locator: LocatorOrString, defaultType?: string);
    /**
     * @return  {string}
     */
    toString(): string;
    /**
     * @return  {string}
     */
    toXPath(): string;
    /**
     * @param {LocatorOrString} locator
     * @return  {Locator}
     */
    or(locator: LocatorOrString): Locator;
    /**
     * @param {LocatorOrString} locator
     * @return  {Locator}
     */
    find(locator: LocatorOrString): Locator;
    /**
     * @param {LocatorOrString} locator
     * @return  {Locator}
     */
    withChild(locator: LocatorOrString): Locator;
    /**
     * @param {LocatorOrString} locator
     * @return  {Locator}
     */
    withDescendant(locator: LocatorOrString): Locator;
    /**
     * @param   {number}  position
     * @return  {Locator}
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
     * @param {LocatorOrString} locator
     * @return  {Locator}
     */
    inside(locator: LocatorOrString): Locator;
    /**
     * @param {LocatorOrString} locator
     * @return  {Locator}
     */
    after(locator: LocatorOrString): Locator;
    /**
     * @param {LocatorOrString} locator
     * @return  {Locator}
     */
    before(locator: LocatorOrString): Locator;
    /**
     * @param { LocatorOrString } locator
     * @returns { Locator }
     */
    static build(locator: LocatorOrString): Locator;
}

/**
 * Pauses test execution and starts interactive shell
 */
declare function pause(): void;

declare class Secret {
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
 * @param   {LocatorOrString}  sessionName
 * @param   {Function | Object<string, *>}  config
 * @param   {Function}  [fn]
 * @return  {Promise<*> | undefined}
 */
declare function session(sessionName: LocatorOrString, config: ((...params: any[]) => any) | {
    [key: string]: any;
}, fn?: (...params: any[]) => any): Promise<any> | undefined;

/**
 * @callback IHelperVoidFunc
 */
declare type IHelperVoidFunc = () => void;

declare class Helper {
    /**
     * Abstract method to provide required config options
     * @return {*}
     */
    static _config(): any;
    /**
     * Abstract method to validate config
     * @param {*} config
     * @returns {*}
     */
    _validateConfig(config: any): any;
    /**
     * Sets config for current test
     * @param {*} opts
     */
    _setConfig(opts: any): void;
    /**
     * Hook executed before all tests
     */
    _init(): void;
    /**
     * Hook executed before each test.
     */
    _before(): void;
    /**
     * Hook executed after each test
     */
    _after(): void;
    /**
     * Hook provides a test details
     * Executed in the very beginning of a test
     *
     * @param {IHelperVoidFunc} test
     */
    _test(test: IHelperVoidFunc): void;
    /**
     * Hook executed after each passed test
     *
     * @param {IHelperVoidFunc} test
     */
    _passed(test: IHelperVoidFunc): void;
    /**
     * Hook executed after each failed test
     *
     * @param {IHelperVoidFunc} test
     */
    _failed(test: IHelperVoidFunc): void;
    /**
     * Hook executed before each step
     *
     * @param {IHelperVoidFunc} step
     * @override
     */
    _beforeStep(step: IHelperVoidFunc): void;
    /**
     * Hook executed after each step
     *
     * @param {IHelperVoidFunc} step
     * @override
     */
    _afterStep(step: IHelperVoidFunc): void;
    /**
     * Hook executed before each suite
     *
     * @param {IHelperVoidFunc} suite
     */
    _beforeSuite(suite: IHelperVoidFunc): void;
    /**
     * Hook executed after each suite
     *
     * @param {IHelperVoidFunc} suite
     */
    _afterSuite(suite: IHelperVoidFunc): void;
    /**
     * Hook executed after all tests are executed
     *
     * @param {IHelperVoidFunc} suite
     */
    _finishTest(suite: IHelperVoidFunc): void;
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
     * @param   {string}  section
     * @param   {string}  msg
     */
    debugSection(section: string, msg: string): void;
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
declare function Feature(title: string, opts?: {
    [key: string]: any;
}): FeatureConfig;

/**
 * @param   {LocatorOrString}  context
 * @param   {Function}  fn
 * @return  {Promise<*> | undefined}
 */
declare function within(context: LocatorOrString, fn: (...params: any[]) => any): Promise<any> | undefined;

/** @param {Array<*>} array
 */
declare class DataTable {
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
 * @param {*} step
 * @param {*} fn
 */
declare function addStep(step: any, fn: any): void;

declare class FeatureConfig {
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
     * @param {*} tagName
     * @returns {this}
     */
    tag(tagName: any): this;
}

declare class ScenarioConfig {
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
     * @param {*} tagName
     * @returns {this}
     */
    tag(tagName: any): this;
    /**
     * Dynamically injects dependencies, see https://codecept.io/pageobjects/#dynamic-injection
     * @param {Object<string, *>} dependencies
     * @returns {this}
     */
    injectDependencies(dependencies: {
        [key: string]: any;
    }): this;
}

declare class ApiDataFactory {
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
declare class Appium {
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
     * @param  strategy  desired strategy to close keyboard (‘tapOutside’ or ‘pressKey’)
     *
     * Appium: support Android and iOS
     */
    hideDeviceKeyboard(strategy: any): void;
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
     * @param locator
     * @param {number} xoffset
     * @param {number} yoffset
     * @param {number} [speed=1000] (optional), 1000 by default
     *
     * Appium: support Android and iOS
     */
    swipe(locator: any, xoffset: number, yoffset: number, speed?: number): void;
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
     * @param locator
     * @param {number} [yoffset] (optional)
     * @param {number} [speed=1000] (optional), 1000 by default
     *
     * Appium: support Android and iOS
     */
    swipeDown(locator: any, yoffset?: number, speed?: number): void;
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
     * @param locator
     * @param {number} [xoffset] (optional)
     * @param {number} [speed=1000] (optional), 1000 by default
     *
     * Appium: support Android and iOS
     */
    swipeLeft(locator: any, xoffset?: number, speed?: number): void;
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
     * @param locator
     * @param {number} [xoffset] (optional)
     * @param {number} [speed=1000] (optional), 1000 by default
     *
     * Appium: support Android and iOS
     */
    swipeRight(locator: any, xoffset?: number, speed?: number): void;
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
     * @param locator
     * @param {number} [yoffset] (optional)
     * @param {number} [speed=1000] (optional), 1000 by default
     *
     * Appium: support Android and iOS
     */
    swipeUp(locator: any, yoffset?: number, speed?: number): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator
     * @param {string} value text value to append.
     * {--end--}
     *
     */
    appendField(field: string | any, value: string): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     *
     */
    checkOption(field: string | any, context?: string): void;
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     *
     */
    click(locator: string | any, context?: string | any): void;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeeCheckboxIsChedcked('#agree'); // located by ID
     * I.dontSeeeCheckboxIsChedcked('I agree to terms'); // located by label
     * I.dontSeeeCheckboxIsChedcked('agree'); // located by name
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     *
     */
    dontSeeCheckboxIsChecked(field: string | any): void;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     */
    dontSeeElement(locator: string | any): void;
    /**
     * Checks that value of input field or textare doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     *
     */
    dontSeeInField(field: string | any, value: string): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     *
     * {--end--}
     */
    dontSee(text: string, context?: string | any): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value text value to fill.
     * {--end--}
     *
     */
    fillField(field: string | any, value: string): void;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns an array of texts.
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     *
     */
    grabTextFrom(locator: any): Promise<string>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     *
     */
    grabValueFrom(locator: string | any): Promise<string>;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     *
     */
    seeCheckboxIsChecked(field: string | any): void;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * {--end--}
     *
     */
    seeElement(locator: string | any): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     *
     */
    seeInField(field: string | any, value: string): void;
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
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * {--end--}
     *
     */
    see(text: string, context?: string | any): void;
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
     * @param {string|object} select field located by label|name|CSS|XPath|strict locator.
     * @param {string|Array<*>} option visible text or value of option.
     * {--end--}
     *
     * * Supported on only for web testing!
     */
    selectOption(select: string | any, option: string | any[]): void;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec] (optional, `1` by default) time in seconds to wait
     * {--end--}
     *
     */
    waitForElement(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     *
     */
    waitForVisible(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     *
     */
    waitForInvisible(locator: string | any, sec?: number): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator.
     * {--end--}
     *
     */
    waitForText(text: string, sec?: number, context?: string | any): void;
}

declare class FileSystem {
    /**
     * Enters a directory In local filesystem.
     * Starts from a current directory
     */
    amInPath(): void;
    /**
     * Writes test to file
     */
    writeToFile(): void;
    /**
     * Checks that file exists
     */
    seeFile(): void;
    /**
     * Checks that file found by `seeFile` includes a text.
     */
    seeInThisFile(): void;
    /**
     * Checks that file found by `seeFile` doesn't include text.
     */
    dontSeeInThisFile(): void;
    /**
     * Checks that contents of file found by `seeFile` equal to text.
     */
    seeFileContentsEqual(): void;
    /**
     * Checks that contents of file found by `seeFile` doesn't equal to text.
     */
    dontSeeFileContentsEqual(): void;
}

declare class Nightmare {
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
     * @param {object} headers list of request headers can be passed
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
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * {--end--}
     */
    see(text: string, context?: string | any): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     *
     * {--end--}
     */
    dontSee(text: string, context?: string | any): void;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * {--end--}
     */
    seeElement(locator: string | any): void;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     */
    dontSeeElement(locator: string | any): void;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * {--end--}
     */
    seeElementInDOM(locator: string | any): void;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     */
    dontSeeElementInDOM(locator: string | any): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * {--end--}
     */
    seeNumberOfElements(locator: string | any, num: number): void;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * {--end--}
     */
    seeNumberOfVisibleElements(locator: string | any, num: number): void;
    /**
     * Grab number of visible elements by locator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @returns {Promise<number>} number of visible elements
     * {--end--}
     */
    grabNumberOfVisibleElements(locator: string | any): Promise<number>;
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     */
    click(locator: string | any, context?: string | any): void;
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     */
    doubleClick(locator: string | any, context?: string | any): void;
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
     * @param {string|object} locator clickable element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
     * {--end--}
     */
    rightClick(locator: string | any, context?: string | any): void;
    /**
     * Moves cursor to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.moveCursorTo('.tooltip');
     * I.moveCursorTo('#submit', 5,5);
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
     * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
     * {--end--}
     */
    moveCursorTo(locator: string | any, offsetX?: number, offsetY?: number): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     */
    checkOption(field: string | any, context?: string): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     */
    uncheckOption(field: string | any, context?: string): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value text value to fill.
     * {--end--}
     */
    fillField(field: string | any, value: string): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator
     * @param {string} value text value to append.
     * {--end--}
     */
    appendField(field: string | any, value: string): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     */
    seeInField(field: string | any, value: string): void;
    /**
     * Checks that value of input field or textare doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     */
    dontSeeInField(field: string | any, value: string): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     */
    seeCheckboxIsChecked(field: string | any): void;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeeCheckboxIsChedcked('#agree'); // located by ID
     * I.dontSeeeCheckboxIsChedcked('I agree to terms'); // located by label
     * I.dontSeeeCheckboxIsChedcked('agree'); // located by name
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     */
    dontSeeCheckboxIsChecked(field: string | any): void;
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
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @param {string} pathToFile local file path relative to codecept.json config file.
     * {--end--}
     *
     * Doesn't work if the Chromium DevTools panel is open (as Chromium allows only one attachment to the debugger at a time. [See more](https://github.com/rosshinkley/nightmare-upload#important-note-about-setting-file-upload-inputs))
     */
    attachFile(locator: string | any, pathToFile: string): void;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns an array of texts.
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     */
    grabTextFrom(locator: any): Promise<string>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     */
    grabValueFrom(locator: string | any): Promise<string>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * An array as a result will be returned if there are more than one matched element.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {string} attr attribute name.
     * @returns {Promise<string>} attribute value
     * {--end--}
     */
    grabAttributeFrom(locator: string | any, attr: string): Promise<string>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - an array of HTMLs returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} HTML code for an element
     * {--end--}
     */
    grabHTMLFrom(locator: any): Promise<string>;
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
     * @param {string|object} select field located by label|name|CSS|XPath|strict locator.
     * @param {string|Array<*>} option visible text or value of option.
     * {--end--}
     */
    selectOption(select: string | any, option: string | any[]): void;
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
     * @param {string} [name=null] cookie name.
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
     * @param {string} [cookie=null] (optional, `null` by default) cookie name
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator.
     * {--end--}
     */
    waitForText(text: string, sec?: number, context?: string | any): void;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForVisible(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitToHide(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForInvisible(locator: string | any, sec?: number): void;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForElement(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForDetached('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForDetached(locator: string | any, sec?: number): void;
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
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
     * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
     * {--end--}
     */
    scrollTo(locator: string | any, offsetX?: number, offsetY?: number): void;
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

declare class Protractor {
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     */
    click(locator: string | any, context?: string | any): void;
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     */
    doubleClick(locator: string | any, context?: string | any): void;
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
     * @param {string|object} locator clickable element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
     * {--end--}
     */
    rightClick(locator: string | any, context?: string | any): void;
    /**
     * Moves cursor to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.moveCursorTo('.tooltip');
     * I.moveCursorTo('#submit', 5,5);
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
     * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
     * {--end--}
     */
    moveCursorTo(locator: string | any, offsetX?: number, offsetY?: number): void;
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
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * {--end--}
     */
    see(text: string, context?: string | any): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     *
     * {--end--}
     */
    dontSee(text: string, context?: string | any): void;
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
     * @param {string|object} select field located by label|name|CSS|XPath|strict locator.
     * @param {string|Array<*>} option visible text or value of option.
     * {--end--}
     */
    selectOption(select: string | any, option: string | any[]): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value text value to fill.
     * {--end--}
     */
    fillField(field: string | any, value: string): void;
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
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @param {string} pathToFile local file path relative to codecept.json config file.
     * {--end--}
     */
    attachFile(locator: string | any, pathToFile: string): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     */
    seeInField(field: string | any, value: string): void;
    /**
     * Checks that value of input field or textare doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     */
    dontSeeInField(field: string | any, value: string): void;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * ```
     * @param {string|object} field located by label|name|CSS|XPath|strict locator
     * @param {string} value text value to append.
     * {--end--}
     */
    appendField(field: string | any, value: string): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     */
    checkOption(field: string | any, context?: string): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     */
    uncheckOption(field: string | any, context?: string): void;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     */
    seeCheckboxIsChecked(field: string | any): void;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeeCheckboxIsChedcked('#agree'); // located by ID
     * I.dontSeeeCheckboxIsChedcked('I agree to terms'); // located by label
     * I.dontSeeeCheckboxIsChedcked('agree'); // located by name
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     */
    dontSeeCheckboxIsChecked(field: string | any): void;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns an array of texts.
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     */
    grabTextFrom(locator: any): Promise<string>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - an array of HTMLs returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} HTML code for an element
     * {--end--}
     */
    grabHTMLFrom(locator: any): Promise<string>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     */
    grabValueFrom(locator: string | any): Promise<string>;
    /**
     * Grab CSS property for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {string} cssProperty CSS property name.
     * @returns {Promise<string>} CSS value
     * {--end--}
     */
    grabCssPropertyFrom(locator: string | any, cssProperty: string): Promise<string>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * An array as a result will be returned if there are more than one matched element.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {string} attr attribute name.
     * @returns {Promise<string>} attribute value
     * {--end--}
     */
    grabAttributeFrom(locator: string | any, attr: string): Promise<string>;
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
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * {--end--}
     */
    seeElement(locator: string | any): void;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     */
    dontSeeElement(locator: string | any): void;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * {--end--}
     */
    seeElementInDOM(locator: string | any): void;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     */
    dontSeeElementInDOM(locator: string | any): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * {--end--}
     */
    seeNumberOfElements(locator: string | any, num: number): void;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * {--end--}
     */
    seeNumberOfVisibleElements(locator: string | any, num: number): void;
    /**
     * Grab number of visible elements by locator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @returns {Promise<number>} number of visible elements
     * {--end--}
     */
    grabNumberOfVisibleElements(locator: string | any): Promise<number>;
    /**
     * Checks that all elements with given locator have given CSS properties.
     *
     * ```js
     * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {object} cssProperties object with CSS properties and their values to check.
     * {--end--}
     */
    seeCssPropertiesOnElements(locator: string | any, cssProperties: any): void;
    /**
     * Checks that all elements with given locator have given attributes.
     *
     * ```js
     * I.seeAttributesOnElements('//form', { method: "post"});
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {object} attributes attributes and their values to check.
     * {--end--}
     */
    seeAttributesOnElements(locator: string | any, attributes: any): void;
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
     * @param {string} [cookie=null] (optional, `null` by default) cookie name
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
     * @param {string} [name=null] cookie name.
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
     * @param {string|object} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
     * {--end--}
     */
    switchTo(locator?: string | any): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForElement(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForDetached('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForDetached(locator: string | any, sec?: number): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForVisible(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitToHide(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForInvisible(locator: string | any, sec?: number): void;
    /**
     * Waits for a specified number of elements on the page.
     *
     * ```js
     * I.waitNumberOfVisibleElements('a', 3);
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitNumberOfVisibleElements(locator: string | any, num: number, sec?: number): void;
    /**
     * Waits for element to become enabled (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional) time in seconds to wait, 1 by default.
     * {--end--}
     */
    waitForEnabled(locator: string | any, sec?: number): void;
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
     * @param {number} [interval=null]
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator.
     * {--end--}
     */
    waitForText(text: string, sec?: number, context?: string | any): void;
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
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
     * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
     * {--end--}
     */
    scrollTo(locator: string | any, offsetX?: number, offsetY?: number): void;
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

declare class Puppeteer {
    /** [existingPages.length -1
     * [existingPages.length -1
     * [existingPages.length -1
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
     */
    grabPopupText(): void;
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
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
     * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
     * {--end--}
     * {{ react }}
     */
    moveCursorTo(locator: string | any, offsetX?: number, offsetY?: number): void;
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
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
     * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
     * {--end--}
     */
    scrollTo(locator: string | any, offsetX?: number, offsetY?: number): void;
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
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * {--end--}
     * {{ react }}
     */
    seeElement(locator: string | any): void;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     * {{ react }}
     */
    dontSeeElement(locator: string | any): void;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * {--end--}
     */
    seeElementInDOM(locator: string | any): void;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     */
    dontSeeElementInDOM(locator: string | any): void;
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     *
     * {{ react }}
     */
    click(locator: string | any, context?: string | any): void;
    /**
     * Performs a click on a link and waits for navigation before moving on.
     *
     * ```js
     * I.clickLink('Logout', '#nav');
     * ```
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator
     * {--end--}
     *
     * {{ react }}
     */
    clickLink(locator: string | any, context?: string | any): void;
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
     * This method is **depreacted**.
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     *
     * {{ react }}
     */
    doubleClick(locator: string | any, context?: string | any): void;
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
     * @param {string|object} locator clickable element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
     * {--end--}
     *
     * {{ react }}
     */
    rightClick(locator: string | any, context?: string | any): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     */
    checkOption(field: string | any, context?: string): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     */
    uncheckOption(field: string | any, context?: string): void;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     */
    seeCheckboxIsChecked(field: string | any): void;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeeCheckboxIsChedcked('#agree'); // located by ID
     * I.dontSeeeCheckboxIsChedcked('I agree to terms'); // located by label
     * I.dontSeeeCheckboxIsChedcked('agree'); // located by name
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     */
    dontSeeCheckboxIsChecked(field: string | any): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value text value to fill.
     * {--end--}
     * {{ react }}
     */
    fillField(field: string | any, value: string): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator
     * @param {string} value text value to append.
     * {--end--}
     *
     * {{ react }}
     */
    appendField(field: string | any, value: string): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     */
    seeInField(field: string | any, value: string): void;
    /**
     * Checks that value of input field or textare doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     */
    dontSeeInField(field: string | any, value: string): void;
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
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @param {string} pathToFile local file path relative to codecept.json config file.
     * {--end--}
     */
    attachFile(locator: string | any, pathToFile: string): void;
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
     * @param {string|object} select field located by label|name|CSS|XPath|strict locator.
     * @param {string|Array<*>} option visible text or value of option.
     * {--end--}
     */
    selectOption(select: string | any, option: string | any[]): void;
    /**
     * Grab number of visible elements by locator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @returns {Promise<number>} number of visible elements
     * {--end--}
     * {{ react }}
     */
    grabNumberOfVisibleElements(locator: string | any): Promise<number>;
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
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * {--end--}
     *
     * {{ react }}
     */
    see(text: string, context?: string | any): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     *
     * {--end--}
     *
     * {{ react }}
     */
    dontSee(text: string, context?: string | any): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * {--end--}
     *
     * {{ react }}
     */
    seeNumberOfElements(locator: string | any, num: number): void;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * {--end--}
     *
     * {{ react }}
     */
    seeNumberOfVisibleElements(locator: string | any, num: number): void;
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
     * @param {string} [name=null] cookie name.
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
     * @param {string} [cookie=null] (optional, `null` by default) cookie name
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
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     * {{ react }}
     */
    grabTextFrom(locator: any): Promise<string>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     */
    grabValueFrom(locator: string | any): Promise<string>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - an array of HTMLs returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} HTML code for an element
     * {--end--}
     */
    grabHTMLFrom(locator: any): Promise<string>;
    /**
     * Grab CSS property for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {string} cssProperty CSS property name.
     * @returns {Promise<string>} CSS value
     * {--end--}
     * {{ react }}
     */
    grabCssPropertyFrom(locator: string | any, cssProperty: string): Promise<string>;
    /**
     * Checks that all elements with given locator have given CSS properties.
     *
     * ```js
     * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {object} cssProperties object with CSS properties and their values to check.
     * {--end--}
     * {{ react }}
     */
    seeCssPropertiesOnElements(locator: string | any, cssProperties: any): void;
    /**
     * Checks that all elements with given locator have given attributes.
     *
     * ```js
     * I.seeAttributesOnElements('//form', { method: "post"});
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {object} attributes attributes and their values to check.
     * {--end--}
     * {{ react }}
     */
    seeAttributesOnElements(locator: string | any, attributes: any): void;
    /**
     * Drag the scrubber of a slider to a given position
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.dragSlider('#slider', 30);
     * I.dragSlider('#slider', -70);
     * ```
     *
     * @param {string|object} locator located by label|name|CSS|XPath|strict locator.
     * @param {number} offsetX position to drag.
     * {--end--}
     * {{ react }}
     */
    dragSlider(locator: string | any, offsetX: number): void;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * An array as a result will be returned if there are more than one matched element.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {string} attr attribute name.
     * @returns {Promise<string>} attribute value
     * {--end--}
     * {{ react }}
     */
    grabAttributeFrom(locator: string | any, attr: string): Promise<string>;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional) time in seconds to wait, 1 by default.
     * {--end--}
     */
    waitForEnabled(locator: string | any, sec?: number): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     * {{ react }}
     */
    waitNumberOfVisibleElements(locator: string | any, num: number, sec?: number): void;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec] (optional, `1` by default) time in seconds to wait
     * {--end--}
     * {{ react }}
     */
    waitForElement(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to become visible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForVisible('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     *
     * This method accepts [React selectors](https://codecept.io/react).
     */
    waitForVisible(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForInvisible(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitToHide(locator: string | any, sec?: number): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator.
     * {--end--}
     */
    waitForText(text: string, sec?: number, context?: string | any): void;
    /**
     * Waits for a network request.
     *
     * ```js
     * I.waitForRequest('http://example.com/resource');
     * I.waitForRequest(request => request.url() === 'http://example.com' && request.method() === 'GET');
     * ```
     *
     * @param {string|function} urlOrPredicate
     * @param {number?} [sec=null] seconds to wait
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
     * @param {number?} [sec=null] number of seconds to wait
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
     * @param {string|object} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
     * {--end--}
     */
    switchTo(locator?: string | any): void;
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
     * @param {number} [interval=null]
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForDetached(locator: string | any, sec?: number): void;
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
}

declare class REST {
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

declare class SeleniumWebdriver {
}

declare class WebDriver {
    /**
     * Get elements by different locator types, including strict locator.
     * Should be used in custom helpers:
     *
     * ```js
     * this.helpers['WebDriver']._locate({name: 'password'}).then //...
     * ```
     *
     *
     * @param locator element located by CSS|XPath|strict locator.
     */
    _locate(locator: any): void;
    /**
     * Find a checkbox by providing human readable text:
     *
     * ```js
     * this.helpers['WebDriver']._locateCheckable('I agree with terms and conditions').then // ...
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     */
    _locateCheckable(locator: any): void;
    /**
     * Find a clickable element by providing human readable text:
     *
     * ```js
     * this.helpers['WebDriver']._locateClickable('Next page').then // ...
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     */
    _locateClickable(locator: any): void;
    /**
     * Find field elements by providing human readable text:
     *
     * ```js
     * this.helpers['WebDriver']._locateFields('Your email').then // ...
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     */
    _locateFields(locator: any): void;
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
     * @param {string} timeouts WebDriver timeouts object.
     */
    defineTimeout(timeouts: string): void;
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     *
     * {{ react }}
     */
    click(locator: string | any, context?: string | any): void;
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     *
     * {{ react }}
     */
    doubleClick(locator: string | any, context?: string | any): void;
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
     * @param {string|object} locator clickable element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
     * {--end--}
     *
     * {{ react }}
     */
    rightClick(locator: string | any, context?: string | any): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value text value to fill.
     * {--end--}
     * {{ react }}
     *
     */
    fillField(field: string | any, value: string): void;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * ```
     * @param {string|object} field located by label|name|CSS|XPath|strict locator
     * @param {string} value text value to append.
     * {--end--}
     * {{ react }}
     */
    appendField(field: string | any, value: string): void;
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
     * @param {string|object} select field located by label|name|CSS|XPath|strict locator.
     * @param {string|Array<*>} option visible text or value of option.
     * {--end--}
     */
    selectOption(select: string | any, option: string | any[]): void;
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
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @param {string} pathToFile local file path relative to codecept.json config file.
     * {--end--}
     * Appium: not tested
     */
    attachFile(locator: string | any, pathToFile: string): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     * Appium: not tested
     */
    checkOption(field: string | any, context?: string): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     * Appium: not tested
     */
    uncheckOption(field: string | any, context?: string): void;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns an array of texts.
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     *
     */
    grabTextFrom(locator: any): Promise<string>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - an array of HTMLs returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} HTML code for an element
     * {--end--}
     *
     */
    grabHTMLFrom(locator: any): Promise<string>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     *
     */
    grabValueFrom(locator: string | any): Promise<string>;
    /**
     * Grab CSS property for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {string} cssProperty CSS property name.
     * @returns {Promise<string>} CSS value
     * {--end--}
     */
    grabCssPropertyFrom(locator: string | any, cssProperty: string): Promise<string>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * An array as a result will be returned if there are more than one matched element.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {string} attr attribute name.
     * @returns {Promise<string>} attribute value
     * {--end--}
     * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
     */
    grabAttributeFrom(locator: string | any, attr: string): Promise<string>;
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
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * {--end--}
     *
     * {{ react }}
     */
    see(text: string, context?: string | any): void;
    /**
     * Checks that text is equal to provided one.
     *
     * ```js
     * I.seeTextEquals('text', 'h1');
     * ```
     *
     * @param {string} text element value to check.
     * @param [context] (optional) element located by CSS|XPath|strict locator.
     */
    seeTextEquals(text: string, context?: any): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     *
     * {--end--}
     *
     * {{ react }}
     */
    dontSee(text: string, context?: string | any): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     *
     */
    seeInField(field: string | any, value: string): void;
    /**
     * Checks that value of input field or textare doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     *
     */
    dontSeeInField(field: string | any, value: string): void;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     * Appium: not tested
     */
    seeCheckboxIsChecked(field: string | any): void;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeeCheckboxIsChedcked('#agree'); // located by ID
     * I.dontSeeeCheckboxIsChedcked('I agree to terms'); // located by label
     * I.dontSeeeCheckboxIsChedcked('agree'); // located by name
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     * Appium: not tested
     */
    dontSeeCheckboxIsChecked(field: string | any): void;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * {--end--}
     * {{ react }}
     *
     */
    seeElement(locator: string | any): void;
    /**
     * Opposite to `seeElement`. Checks that element is not visible (or in DOM)
     *
     * ```js
     * I.dontSeeElement('.modal'); // modal is not shown
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     * {{ react }}
     */
    dontSeeElement(locator: string | any): void;
    /**
     * Checks that a given Element is present in the DOM
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElementInDOM('#modal');
     * ```
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * {--end--}
     *
     */
    seeElementInDOM(locator: string | any): void;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     *
     */
    dontSeeElementInDOM(locator: string | any): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * {--end--}
     * {{ react }}
     */
    seeNumberOfElements(locator: string | any, num: number): void;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * {--end--}
     * {{ react }}
     */
    seeNumberOfVisibleElements(locator: string | any, num: number): void;
    /**
     * Checks that all elements with given locator have given CSS properties.
     *
     * ```js
     * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {object} cssProperties object with CSS properties and their values to check.
     * {--end--}
     */
    seeCssPropertiesOnElements(locator: string | any, cssProperties: any): void;
    /**
     * Checks that all elements with given locator have given attributes.
     *
     * ```js
     * I.seeAttributesOnElements('//form', { method: "post"});
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {object} attributes attributes and their values to check.
     * {--end--}
     */
    seeAttributesOnElements(locator: string | any, attributes: any): void;
    /**
     * Grab number of visible elements by locator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @returns {Promise<number>} number of visible elements
     * {--end--}
     */
    grabNumberOfVisibleElements(locator: string | any): Promise<number>;
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
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
     * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
     * {--end--}
     *
     */
    scrollTo(locator: string | any, offsetX?: number, offsetY?: number): void;
    /**
     * Moves cursor to element matched by locator.
     * Extra shift can be set with offsetX and offsetY options.
     *
     * ```js
     * I.moveCursorTo('.tooltip');
     * I.moveCursorTo('#submit', 5,5);
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
     * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
     * {--end--}
     *
     */
    moveCursorTo(locator: string | any, offsetX?: number, offsetY?: number): void;
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
     * @param {string} [cookie=null] (optional, `null` by default) cookie name
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
     * @param {string} [name=null] cookie name.
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
     *
     * To make combinations with modifier and mouse clicks (like Ctrl+Click) press a modifier, click, then release it.
     *
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
     * Drag the scrubber of a slider to a given position
     * For fuzzy locators, fields are matched by label text, the "name" attribute, CSS, and XPath.
     *
     * ```js
     * I.dragSlider('#slider', 30);
     * I.dragSlider('#slider', -70);
     * ```
     *
     * @param {string|object} locator located by label|name|CSS|XPath|strict locator.
     * @param {number} offsetX position to drag.
     * {--end--}
     */
    dragSlider(locator: string | any, offsetX: number): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional) time in seconds to wait, 1 by default.
     * {--end--}
     *
     */
    waitForEnabled(locator: string | any, sec?: number): void;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitForElement(locator: string | any, sec?: number): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator.
     * {--end--}
     *
     */
    waitForText(text: string, sec?: number, context?: string | any): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     *
     */
    waitForVisible(locator: string | any, sec?: number): void;
    /**
     * Waits for a specified number of elements on the page.
     *
     * ```js
     * I.waitNumberOfVisibleElements('a', 3);
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitNumberOfVisibleElements(locator: string | any, num: number, sec?: number): void;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     *
     */
    waitForInvisible(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     *
     */
    waitToHide(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForDetached('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     *
     */
    waitForDetached(locator: string | any, sec?: number): void;
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
     * @param {number} [interval=null]
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
     * @param {string|object} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
     * {--end--}
     *
     */
    switchTo(locator?: string | any): void;
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
     * @param {number|null} [sec] (optional) time in seconds to wait.
     */
    switchToPreviousTab(num?: number, sec?: number | null): void;
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

declare class WebDriverIO {
    /**
     * Get elements by different locator types, including strict locator.
     * Should be used in custom helpers:
     *
     * ```js
     * this.helpers['WebDriverIO']._locate({name: 'password'}).then //...
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     */
    _locate(locator: any): void;
    /**
     * Find a checkbox by providing human readable text:
     *
     * ```js
     * this.helpers['WebDriverIO']._locateCheckable('I agree with terms and conditions').then // ...
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     */
    _locateCheckable(locator: any): void;
    /**
     * Find a clickable element by providing human readable text:
     *
     * ```js
     * this.helpers['WebDriverIO']._locateClickable('Next page').then // ...
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     */
    _locateClickable(locator: any): void;
    /**
     * Find field elements by providing human readable text:
     *
     * ```js
     * this.helpers['WebDriverIO']._locateFields('Your email').then // ...
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     */
    _locateFields(locator: any): void;
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
     * @param timeouts WebDriver timeouts object.
     */
    defineTimeout(timeouts: any): void;
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     * Appium: support
     */
    click(locator: string | any, context?: string | any): void;
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
     * @param {string|object} locator clickable link or button located by text, or any element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element to search in CSS|XPath|Strict locator.
     * {--end--}
     * Appium: support only web testing
     */
    doubleClick(locator: string | any, context?: string | any): void;
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
     * @param {string|object} locator clickable element located by CSS|XPath|strict locator.
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
     * {--end--}
     * Appium: support, but in apps works as usual click
     */
    rightClick(locator: string | any, context?: string | any): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value text value to fill.
     * {--end--}
     * Appium: support
     */
    fillField(field: string | any, value: string): void;
    /**
     * Appends text to a input field or textarea.
     * Field is located by name, label, CSS or XPath
     *
     * ```js
     * I.appendField('#myTextField', 'appended');
     * ```
     * @param {string|object} field located by label|name|CSS|XPath|strict locator
     * @param {string} value text value to append.
     * {--end--}
     * Appium: support, but it's clear a field before insert in apps
     */
    appendField(field: string | any, value: string): void;
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
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @param {string} pathToFile local file path relative to codecept.json config file.
     * {--end--}
     * Appium: not tested
     */
    attachFile(locator: string | any, pathToFile: string): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     * Appium: not tested
     */
    checkOption(field: string | any, context?: string): void;
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
     * @param {string|object} field checkbox located by label | name | CSS | XPath | strict locator.
     * @param {string} [context=null] (optional, `null` by default) element located by CSS | XPath | strict locator.
     * {--end--}
     * Appium: not tested
     */
    uncheckOption(field: string | any, context?: string): void;
    /**
     * Retrieves a text from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let pin = await I.grabTextFrom('#pin');
     * ```
     * If multiple elements found returns an array of texts.
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     * Appium: support
     */
    grabTextFrom(locator: any): Promise<string>;
    /**
     * Retrieves the innerHTML from an element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     * If more than one element is found - an array of HTMLs returned.
     *
     * ```js
     * let postHTML = await I.grabHTMLFrom('#post');
     * ```
     *
     * @param locator element located by CSS|XPath|strict locator.
     * @returns {Promise<string>} HTML code for an element
     * {--end--}
     * Appium: support only web testing
     */
    grabHTMLFrom(locator: any): Promise<string>;
    /**
     * Retrieves a value from a form element located by CSS or XPath and returns it to test.
     * Resumes test execution, so **should be used inside async function with `await`** operator.
     *
     * ```js
     * let email = await I.grabValueFrom('input[name=email]');
     * ```
     * @param {string|object} locator field located by label|name|CSS|XPath|strict locator.
     * @returns {Promise<string>} attribute value
     * {--end--}
     * Appium: support only web testing
     */
    grabValueFrom(locator: string | any): Promise<string>;
    /**
     * Grab CSS property for given locator
     * Resumes test execution, so **should be used inside an async function with `await`** operator.
     *
     * ```js
     * const value = await I.grabCssPropertyFrom('h3', 'font-weight');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {string} cssProperty CSS property name.
     * @returns {Promise<string>} CSS value
     * {--end--}
     */
    grabCssPropertyFrom(locator: string | any, cssProperty: string): Promise<string>;
    /**
     * Retrieves an attribute from an element located by CSS or XPath and returns it to test.
     * An array as a result will be returned if there are more than one matched element.
     * Resumes test execution, so **should be used inside async with `await`** operator.
     *
     * ```js
     * let hint = await I.grabAttributeFrom('#tooltip', 'title');
     * ```
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {string} attr attribute name.
     * @returns {Promise<string>} attribute value
     * {--end--}
     * Appium: can be used for apps only with several values ("contentDescription", "text", "className", "resourceId")
     */
    grabAttributeFrom(locator: string | any, attr: string): Promise<string>;
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
     * @param {string|object} [context=null] (optional, `null` by default) element located by CSS|Xpath|strict locator in which to search for text.
     * {--end--}
     * Appium: support with context in apps
     */
    see(text: string, context?: string | any): void;
    /**
     * Checks that text is equal to provided one.
     *
     * ```js
     * I.seeTextEquals('text', 'h1');
     * ```
     *
     * @param {string} text element value to check.
     * @param [context] (optional) element located by CSS|XPath|strict locator.
     */
    seeTextEquals(text: string, context?: any): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator in which to perfrom search.
     *
     * {--end--}
     * Appium: support with context in apps
     */
    dontSee(text: string, context?: string | any): void;
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
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     * Appium: support only web testing
     */
    seeInField(field: string | any, value: string): void;
    /**
     * Checks that value of input field or textare doesn't equal to given value
     * Opposite to `seeInField`.
     *
     * ```js
     * I.dontSeeInField('email', 'user@user.com'); // field by name
     * I.dontSeeInField({ css: 'form input.email' }, 'user@user.com'); // field by CSS
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * @param {string} value value to check.
     * {--end--}
     * Appium: support only web testing
     */
    dontSeeInField(field: string | any, value: string): void;
    /**
     * Verifies that the specified checkbox is checked.
     *
     * ```js
     * I.seeCheckboxIsChecked('Agree');
     * I.seeCheckboxIsChecked('#agree'); // I suppose user agreed to terms
     * I.seeCheckboxIsChecked({css: '#signup_form input[type=checkbox]'});
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     * Appium: not tested
     */
    seeCheckboxIsChecked(field: string | any): void;
    /**
     * Verifies that the specified checkbox is not checked.
     *
     * ```js
     * I.dontSeeeCheckboxIsChedcked('#agree'); // located by ID
     * I.dontSeeeCheckboxIsChedcked('I agree to terms'); // located by label
     * I.dontSeeeCheckboxIsChedcked('agree'); // located by name
     * ```
     *
     * @param {string|object} field located by label|name|CSS|XPath|strict locator.
     * {--end--}
     * Appium: not tested
     */
    dontSeeCheckboxIsChecked(field: string | any): void;
    /**
     * Checks that a given Element is visible
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeElement('#modal');
     * ```
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * {--end--}
     * Appium: support
     */
    seeElement(locator: string | any): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * {--end--}
     * Appium: support
     */
    seeElementInDOM(locator: string | any): void;
    /**
     * Opposite to `seeElementInDOM`. Checks that element is not on page.
     *
     * ```js
     * I.dontSeeElementInDOM('.nav'); // checks that element is not on page visible or not
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|Strict locator.
     * {--end--}
     * Appium: support
     */
    dontSeeElementInDOM(locator: string | any): void;
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
     * @param locator element located by CSS|XPath|strict locator.
     * @param {number} [num] number of elements.
     */
    seeNumberOfElements(locator: any, num?: number): void;
    /**
     * Asserts that an element is visible a given number of times.
     * Element is located by CSS or XPath.
     *
     * ```js
     * I.seeNumberOfVisibleElements('.buttons', 3);
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * {--end--}
     */
    seeNumberOfVisibleElements(locator: string | any, num: number): void;
    /**
     * Checks that all elements with given locator have given CSS properties.
     *
     * ```js
     * I.seeCssPropertiesOnElements('h3', { 'font-weight': "bold"});
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {object} cssProperties object with CSS properties and their values to check.
     * {--end--}
     */
    seeCssPropertiesOnElements(locator: string | any, cssProperties: any): void;
    /**
     * Checks that all elements with given locator have given attributes.
     *
     * ```js
     * I.seeAttributesOnElements('//form', { method: "post"});
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {object} attributes attributes and their values to check.
     * {--end--}
     */
    seeAttributesOnElements(locator: string | any, attributes: any): void;
    /**
     * Grab number of visible elements by locator.
     *
     * ```js
     * let numOfElements = await I.grabNumberOfVisibleElements('p');
     * ```
     *
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @returns {Promise<number>} number of visible elements
     * {--end--}
     */
    grabNumberOfVisibleElements(locator: string | any): Promise<number>;
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
     * @param {string|object} locator located by CSS|XPath|strict locator.
     * @param {number} [offsetX=0] (optional, `0` by default) X-axis offset.
     * @param {number} [offsetY=0] (optional, `0` by default) Y-axis offset.
     * {--end--}
     * Appium: support only web testing
     */
    scrollTo(locator: string | any, offsetX?: number, offsetY?: number): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional) time in seconds to wait, 1 by default.
     * {--end--}
     * Appium: support
     */
    waitForEnabled(locator: string | any, sec?: number): void;
    /**
     * Waits for element to be present on page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForElement('.btn.continue');
     * I.waitForElement('.btn.continue', 5); // wait for 5 secs
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec] (optional, `1` by default) time in seconds to wait
     * {--end--}
     * Appium: support
     */
    waitForElement(locator: string | any, sec?: number): void;
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
     * @param {string|object} [context] (optional) element located by CSS|XPath|strict locator.
     * {--end--}
     * Appium: support
     */
    waitForText(text: string, sec?: number, context?: string | any): void;
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
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     * Appium: support
     */
    waitForVisible(locator: string | any, sec?: number): void;
    /**
     * Waits for a specified number of elements on the page.
     *
     * ```js
     * I.waitNumberOfVisibleElements('a', 3);
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} num number of elements.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     */
    waitNumberOfVisibleElements(locator: string | any, num: number, sec?: number): void;
    /**
     * Waits for an element to be removed or become invisible on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForInvisible('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     * Appium: support
     */
    waitForInvisible(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to hide (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitToHide('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     * Appium: support
     */
    waitToHide(locator: string | any, sec?: number): void;
    /**
     * Waits for an element to become not attached to the DOM on a page (by default waits for 1sec).
     * Element can be located by CSS or XPath.
     *
     * ```js
     * I.waitForDetached('#popup');
     * ```
     *
     * @param {string|object} locator element located by CSS|XPath|strict locator.
     * @param {number} [sec=1] (optional, `1` by default) time in seconds to wait
     * {--end--}
     * Appium: support
     */
    waitForDetached(locator: string | any, sec?: number): void;
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
     * @param {number} [interval=null]
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
     * @param {string|object} [locator=null] (optional, `null` by default) element located by CSS|XPath|strict locator.
     * {--end--}
     * Appium: support only web testing
     */
    switchTo(locator?: string | any): void;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
     *
     * ```js
     * I.switchToNextTab();
     * I.switchToNextTab(2);
     * ```
     *
     * @param {number} [num=1] (optional) number of tabs to switch forward, default: 1.
     * @param {number|null} [sec=null] (optional) time in seconds to wait.
     */
    switchToNextTab(num?: number, sec?: number | null): void;
    /**
     * Switch focus to a particular tab by its number. It waits tabs loading and then switch tab.
     *
     * ```js
     * I.switchToPreviousTab();
     * I.switchToPreviousTab(2);
     * ```
     *
     * @param {number} [num=1] (optional) number of tabs to switch backward, default: 1.
     * @param {number} [sec] (optional) time in seconds to wait.
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

