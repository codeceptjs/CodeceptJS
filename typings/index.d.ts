// Project: https://github.com/codeception/codeceptjs/
/// <reference path="./types.d.ts" />
/// <reference path="./promiseBasedTypes.d.ts" />
/// <reference types="webdriverio" />
/// <reference path="./Mocha.d.ts" />
/// <reference types="joi" />
/// <reference types="playwright" />

declare namespace CodeceptJS {
  type WithTranslation<T> = T &
    // @ts-ignore
    import("./utils").Translate<T, Translation.Actions>;

  type Cookie = {
    name: string;
    value: string | boolean;
    domain?: string,
    path?: string,
  };

  type RetryConfig = {
    /** Filter tests by string or regexp pattern */
    grep?: string | RegExp;
    /** Number of times to repeat scenarios of a Feature */
    Feature?: number;
    /** Number of times to repeat scenarios */
    Scenario?: number;
    /** Number of times to repeat Before hook */
    Before?: number;
    /** Number of times to repeat After hook */
    After?: number;
    /** Number of times to repeat BeforeSuite hook */
    BeforeSuite?: number;
    /** Number of times to repeat AfterSuite hook */
    AfterSuite?: number;
  };

  type TimeoutConfig = {
    /** Filter tests by string or regexp pattern */
    grep: string | RegExp;
    /** Set timeout for a scenarios of a Feature */
    Feature: number;
    /** Set timeout for scenarios */
    Scenario: number;
  };

  type AiPrompt = {
    role: string;
    content: string;
  }

  type AiConfig = {
    /** request function to send prompts to AI provider */
    request: (messages: any) => Promise<string>,

    /** custom prompts */
    prompts?: {
      /** Returns prompt to write CodeceptJS steps inside pause mode  */
      writeStep?: (html: string, input: string) => Array<AiPrompt>;
      /** Returns prompt to heal step when test fails on CI if healing is on  */
      healStep?: (html: string, object) => Array<AiPrompt>;
      /** Returns prompt to generate page object inside pause mode  */
      generatePageObject?: (html: string, extraPrompt?: string, rootLocator?: string) => Array<AiPrompt>;
    },

    /** max tokens to use */
    maxTokens?: number,


    /** configuration for processing HTML for GPT */
    html?: {
      /** max size of HTML to be sent to OpenAI to avoid token limit */
      maxLength?: number,
      /** should HTML be changed by removing non-interactive elements */
      simplify?: boolean,
      /** should HTML be minified before sending */
      minify?: boolean,
      interactiveElements?: Array<string>,
      textElements?: Array<string>,
      allowedAttrs?: Array<string>,
      allowedRoles?: Array<string>,
    }
  }

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
     * empty output folder for next run
     *
     * ```js
     * emptyOutputFolder: true
     * ```
     */
    emptyOutputFolder?: boolean;
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

      /** Enable AI features for development purposes */
      AI?: any;

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
     *
     * Can be customized to use different timeouts for a subset of tests:
     *
     * ```js
     * timeout: [
     *    10,
     *    {
     *      grep: '@slow',
     *      Scenario: 20
     *    }
     * ]
     * ```
     */
    timeout?: number | Array<TimeoutConfig> | TimeoutConfig;

    /**
     * Configure retry strategy for tests
     *
     * To retry all tests 3 times:
     *
     * ```js
     * retry: 3
     * ```
     *
     * To retry only Before hook 3 times:
     *
     * ```js
     * retry: {
     *    Before: 3
     * }
     * ```
     *
     * To retry tests marked as flaky 3 times, other 1 time:
     *
     * ```js
     * retry: [
     *   {
     *     Scenario: 1,
     *     Before: 1
     *   },
     *   {
     *     grep: '@flaky',
     *     Scenario: 3
     *     Before: 3
     *   }
     * ]
     * ```
     */
    retry?: number | Array<RetryConfig> | RetryConfig;


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
     * [AI](https://codecept.io/ai/) features configuration.
     */
    ai?: AiConfig,

    /**
     * Enable full promise-based helper methods for [TypeScript](https://codecept.io/typescript/) project.
     * If true, all helper methods are typed as asynchronous;
     * Otherwise, it remains as it works in versions prior to 3.3.6
     */
    fullPromiseBased?: boolean;

    [key: string]: any;
  };

  type MockRequest = {
    method: 'GET'|'PUT'|'POST'|'PATCH'|'DELETE'|string;
    path: string;
    queryParams?: object;
  }

  type MockResponse = {
    status: number;
    body?: object;
  }

  type MockInteraction = {
    request: MockRequest;
    response: MockResponse;
  }

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
    | { vue: string }
    | { shadow: string[] }
    | { custom: string }
    | { pw: string };
  interface CustomLocators {}
  interface OtherLocators { props?: object }
  type LocatorOrString =
    | string
    | ILocator
    | Locator
    | OtherLocators
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

// Plugins
declare const __: any

interface Window {
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
