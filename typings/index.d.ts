// Project: https://github.com/codeception/codeceptjs/
/// <reference path="./types.d.ts" />
/// <reference path="./promiseBasedTypes.d.ts" />
/// <reference types="webdriverio" />
/// <reference path="./Mocha.d.ts" />
/// <reference types="joi" />
/// <reference types="playwright" />

declare namespace CodeceptJS {
  type WithTranslation<T> = T &
    import("./utils").Translate<T, Translation.Actions>;

  type Cookie = {
    name: string;
    value: string;
    domain?: string,
    path?: string,
  };

  type MainConfig = {
    /** Pattern to locate CodeceptJS tests.
     * Allows to enter glob pattern or an Array<string> of patterns to match tests / test file names.
     *
     * For tests in JavaScript:
     *
     * ```js
     * tests: 'tests/**.test.js'
     * ```
     * For tests in TypeScript:
     *
     * ```js
     * tests: 'tests/**.test.ts'
     * ```
     */
    tests: string;
    /**
     * Where to store failure screenshots, artifacts, etc
     *
     * ```js
     * output: './output'
     * ```
     */
    output: string;
    /**
     * Pattern to filter tests by name.
     * This option is useful if you plan to use multiple configs for different environments.
     *
     * To execute only tests with @firefox tag
     *
     * ```js
     * grep: '@firefox'
     * ```
     */
    grep?: string;
    /**
     * Enable and configure helpers:
     *
     * ```js
     * helpers: {
     *   Playwright: {
     *     url: 'https://mysite.com',
     *     browser: 'firefox'
     *   }
     * }
     * ```
    */
    helpers?: {
      /**
       * Run web tests controlling browsers via Playwright engine.
       *
       * https://codecept.io/helpers/playwright
       *
       * Available commands:
       * ```js
       * I.amOnPage('/');
       * I.click('Open');
       * I.see('Welcome');
       * ```
       */
      Playwright?: PlaywrightConfig;
      /**
       * Run web tests controlling browsers via Puppeteer engine.
       *
       * https://codecept.io/helpers/puppeteer
       *
       * Available commands:
       * ```js
       * I.amOnPage('/');
       * I.click('Open');
       * I.see('Welcome');
       * ```
       */
      Puppeteer?: PuppeteerConfig;

      /**
       * Run web tests controlling browsers via WebDriver engine.
       *
       * Available commands:
       * ```js
       * I.amOnPage('/');
       * I.click('Open');
       * I.see('Welcome');
       * ```
       *
       * https://codecept.io/helpers/webdriver
       */
      WebDriver?: WebDriverConfig;
      /**
       * Execute REST API requests for API testing or to assist web testing.
       *
       * https://codecept.io/helpers/REST
       *
       * Available commands:
       * ```js
       * I.sendGetRequest('/');
       * ```
       */
      REST?: RESTConfig;

      /**
       * Use JSON assertions for API testing.
       * Can be paired with REST or GraphQL helpers.
       *
       * https://codecept.io/helpers/JSONResponse
       *
       * Available commands:
       * ```js
       * I.seeResponseContainsJson({ user: { email: 'jon@doe.com' } });
       * ```
       */
      JSONResponse?: any;

      [key: string]: any;
    },
    /**
     * Enable CodeceptJS plugins.
     *
     * https://codecept.io/plugins/
     *
     * Plugins listen to test events and extend functionality of CodeceptJS.
     *
     * Example:
     *
     * ```js
     * plugins: {
     *   autoDelay: {
     *     enabled: true
     *   }
      }
     * ```
     */
    plugins?: any;
    /**
     * Include page objects to access them via dependency injection
     *
     * ```js
     * I: "./custom_steps.js",
     * loginPage: "./pages/Login.js",
     * User: "./pages/User.js",
     * ```
     * Configured modules can be injected by name in a Scenario:
     *
     * ```js
     * Scenario('test', { I, loginPage, User })
     * ```
     */
    include?: any;
    /**
     * Set default tests timeout in seconds.
     * Tests will be killed on no response after timeout.
     *
     * ```js
     * timeout: 20,
     * ```
     */
    timeout?: number;
    /** Disable registering global functions (Before, Scenario, etc). Not recommended */
    noGlobals?: boolean;
    /**
     * [Mocha test runner options](https://mochajs.org/#configuring-mocha-nodejs), additional [reporters](https://codecept.io/reports/#xml) can be configured here.
     *
     * Example:
     *
     * ```js
     * mocha: {
     *   "mocha-junit-reporter": {
     *      stdout: "./output/console.log",
     *      options: {
     *        mochaFile: "./output/result.xml",
     *        attachments: true //add screenshot for a failed test
     *      }
     *   }
     * }
     * ```
     */
    mocha?: any;
    /**
     * [Execute code before](https://codecept.io/bootstrap/) tests are run.
     *
     * Can be either JS module file or async function:
     *
     * ```js
     * bootstrap: async () => server.launch(),
     * ```
     * or
     * ```js
     * bootstrap: 'bootstrap.js',
     * ```
    */
    bootstrap?: (() => Promise<void>) | boolean | string;
    /**
     * [Execute code after tests](https://codecept.io/bootstrap/) finished.
     *
     * Can be either JS module file or async function:
     *
     * ```js
     * teardown: async () => server.stop(),
     * ```
     * or
     * ```js
     * teardown: 'teardown.js',
     * ```
    */
    teardown?: (() => Promise<void>) | boolean | string;
    /**
     * [Execute code before launching tests in parallel mode](https://codecept.io/bootstrap/#bootstrapall-teardownall)
     *
     */
    bootstrapAll?: (() => Promise<void>) | boolean | string;
    /**
     * [Execute JS code after finishing tests in parallel mode](https://codecept.io/bootstrap/#bootstrapall-teardownall)
    */
    teardownAll?: (() => Promise<void>) | boolean | string;

    /** Enable [localized test commands](https://codecept.io/translation/) */
    translation?: string;

    /** Additional vocabularies for [localication](https://codecept.io/translation/) */
    vocabularies?: Array<string>;

    /**
     * [Require additional JS modules](https://codecept.io/configuration/#require)
     *
     * Example:
     * ```
     * require: ["should"]
     * ```
    */
    require?: Array<string>;

    /**
     * Enable [BDD features](https://codecept.io/bdd/#configuration).
     *
     * Sample configuration:
     * ```js
     * gherkin: {
     *   features: "./features/*.feature",
     *   steps: ["./step_definitions/steps.js"]
     * }
     * ```
     */
    gherkin?: {
      /** load feature files by pattern. Multiple patterns can be specified as array */
      features: string | Array<string>,
      /** load step definitions from JS files */
      steps: string | Array<string>
    };

    /**
     * Enable full promise-based helper methods for [TypeScript](https://codecept.io/typescript/) project.
     * If true, all helper methods are typed as asynchronous;
     * Otherwise, it remains as it works in versions prior to 3.3.6
     */
    fullPromiseBased?: boolean;

    [key: string]: any;
  };

  interface PageScrollPosition {
    x: number;
    y: number;
  }

  // Could get extended by user generated typings
  interface Methods extends ActorStatic {}
  interface I {}
  interface IHook {}
  interface IScenario {}
  interface IFeature {
    (title: string): FeatureConfig;
  }
  interface CallbackOrder extends Array<any> {}
  interface SupportObject {
    I: CodeceptJS.I;
  }
  namespace Translation {
    interface Actions {}
  }

  // Extending JSDoc generated typings
  interface Step {
    isMetaStep(): this is MetaStep;
  }

  // Types who are not be defined by JSDoc
  type actor = <T extends { [action: string]: (...args: any[]) => void }>(
    customSteps?: T & ThisType<WithTranslation<Methods & T>>
  ) => WithTranslation<Methods & T>;

  type ILocator =
    | { id: string }
    | { xpath: string }
    | { css: string }
    | { name: string }
    | { frame: string }
    | { android: string }
    | { ios: string }
    | { android: string; ios: string }
    | { react: string }
    | { shadow: string }
    | { custom: string };

  interface CustomLocators {}
  type LocatorOrString =
    | string
    | ILocator
    | Locator
    | CustomLocators[keyof CustomLocators];

  type StringOrSecret = string | CodeceptJS.Secret;

  interface HookCallback {
    (args: SupportObject): void | Promise<void>;
  }
  interface Scenario extends IScenario {
    only: IScenario;
    skip: IScenario;
    todo: IScenario;
  }
  interface Feature extends IFeature {
    skip: IFeature;
  }
  interface IData {
    Scenario: IScenario;
    only: { Scenario: IScenario };
  }

  interface IScenario {
    // Scenario.todo can be called only with a title.
    (title: string, callback?: HookCallback): ScenarioConfig;
    (
      title: string,
      opts: { [key: string]: any },
      callback: HookCallback
    ): ScenarioConfig;
  }
  interface IHook {
    (callback: HookCallback): void;
  }

  interface Globals {
    codeceptjs: typeof codeceptjs;
  }

  interface IParameterTypeDefinition<T> {
    name: string
    regexp: readonly RegExp[] | readonly string[] | RegExp | string
    transformer: (...match: string[]) => T
    useForSnippets?: boolean
    preferForRegexpMatch?: boolean
  }
}

// Globals
declare const codecept_dir: string;
declare const output_dir: string;
declare function tryTo(...fn): Promise<boolean>;
declare function retryTo(...fn): Promise<null>;

declare const actor: CodeceptJS.actor;
declare const codecept_actor: CodeceptJS.actor;
declare const Helper: typeof CodeceptJS.Helper;
declare const codecept_helper: typeof CodeceptJS.Helper;
declare const pause: typeof CodeceptJS.pause;
declare const within: typeof CodeceptJS.within;
declare const session: typeof CodeceptJS.session;
declare const DataTable: typeof CodeceptJS.DataTable;
declare const DataTableArgument: typeof CodeceptJS.DataTableArgument;
declare const codeceptjs: typeof CodeceptJS.index;
declare const locate: typeof CodeceptJS.Locator.build;
declare function inject(): CodeceptJS.SupportObject;
declare function inject<T extends keyof CodeceptJS.SupportObject>(
  name: T
): CodeceptJS.SupportObject[T];
declare const secret: typeof CodeceptJS.Secret.secret;

// BDD
declare const Given: typeof CodeceptJS.addStep;
declare const When: typeof CodeceptJS.addStep;
declare const Then: typeof CodeceptJS.addStep;

declare const Feature: typeof CodeceptJS.Feature;
declare const Scenario: CodeceptJS.Scenario;
declare const xScenario: CodeceptJS.IScenario;
declare const xFeature: CodeceptJS.IFeature;
declare function Data(data: any): CodeceptJS.IData;
declare function xData(data: any): CodeceptJS.IData;
declare function defineParameterType(options: CodeceptJS.IParameterTypeDefinition<any>): void

// Hooks
declare const BeforeSuite: CodeceptJS.IHook;
declare const AfterSuite: CodeceptJS.IHook;
declare const Background: CodeceptJS.IHook;
declare const Before: CodeceptJS.IHook;
declare const After: CodeceptJS.IHook;

interface Window {
  codeceptjs: typeof CodeceptJS.browserCodecept;
  resq: any;
}

declare namespace NodeJS {
  interface Process {
    profile: string;
  }

  interface Global extends CodeceptJS.Globals {
    codecept_dir: typeof codecept_dir;
    output_dir: typeof output_dir;

    actor: typeof actor;
    codecept_actor: typeof codecept_actor;
    Helper: typeof Helper;
    codecept_helper: typeof codecept_helper;
    pause: typeof pause;
    within: typeof within;
    session: typeof session;
    DataTable: typeof DataTable;
    DataTableArgument: typeof DataTableArgument;
    locate: typeof locate;
    inject: typeof inject;
    secret: typeof secret;
    // plugins
    tryTo: typeof tryTo;
    retryTo: typeof retryTo;

    // BDD
    Given: typeof Given;
    When: typeof When;
    Then: typeof Then;
    DefineParameterType: typeof defineParameterType
  }
}

declare namespace Mocha {
  interface MochaGlobals {
    Feature: typeof Feature;
    Scenario: typeof Scenario;
    xFeature: typeof xFeature;
    xScenario: typeof xScenario;
    Data: typeof Data;
    xData: typeof xData;
    BeforeSuite: typeof BeforeSuite;
    AfterSuite: typeof AfterSuite;
    Background: typeof Background;
    Before: typeof Before;
    After: typeof After;
  }

  interface Suite extends SuiteRunnable {
    tags: any[];
    comment: string;
    feature: any;
  }

  interface Test extends Runnable {
    artifacts: [],
    tags: any[];
  }
}

declare module "codeceptjs" {
  export = codeceptjs;
}

declare module "@codeceptjs/helper" {
  export = CodeceptJS.Helper;
}
