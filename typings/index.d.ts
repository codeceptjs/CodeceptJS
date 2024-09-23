// Project: https://github.com/codeception/codeceptjs/
/// <reference path="./types.d.ts" />
/// <reference path="./promiseBasedTypes.d.ts" />
/// <reference types="webdriverio" />
/// <reference path="./Mocha.d.ts" />
/// <reference types="joi" />
/// <reference types="playwright" />

declare namespace CodeceptJS {
  // Utility Types
  type WithTranslation<T> = T & import("./utils").Translate<T, Translation.Actions>;

  // Cookie Type
  type Cookie = {
    name: string;
    value: string | boolean;
    domain?: string;
    path?: string;
  };

  // Retry Configuration
  type RetryConfig = {
    grep?: string | RegExp;
    Feature?: number;
    Scenario?: number;
    Before?: number;
    After?: number;
    BeforeSuite?: number;
    AfterSuite?: number;
  };

  // Timeout Configuration
  type TimeoutConfig = {
    grep: string | RegExp;
    Feature: number;
    Scenario: number;
  };

  // AI Configuration
  type AiPrompt = {
    role: string;
    content: string;
  };

  type AiConfig = {
    request: (messages: any) => Promise<string>;
    prompts?: {
      writeStep?: (html: string, input: string) => Array<AiPrompt>;
      healStep?: (html: string, object) => Array<AiPrompt>;
      generatePageObject?: (
        html: string,
        extraPrompt?: string,
        rootLocator?: string
      ) => Array<AiPrompt>;
    };
    maxTokens?: number;
    html?: {
      maxLength?: number;
      simplify?: boolean;
      minify?: boolean;
      interactiveElements?: Array<string>;
      textElements?: Array<string>;
      allowedAttrs?: Array<string>;
      allowedRoles?: Array<string>;
    };
  };

  // Main Configuration
  type MainConfig = {
    tests: string;
    output: string;
    emptyOutputFolder?: boolean;
    grep?: string;
    helpers?: {
      Playwright?: PlaywrightConfig;
      Puppeteer?: PuppeteerConfig;
      WebDriver?: WebDriverConfig;
      REST?: RESTConfig;
      JSONResponse?: any;
      AI?: any;
      [key: string]: any;
    };
    plugins?: any;
    include?: any;
    timeout?: number | Array<TimeoutConfig> | TimeoutConfig;
    retry?: number | Array<RetryConfig> | RetryConfig;
    noGlobals?: boolean;
    mocha?: any;
    bootstrap?: (() => Promise<void>) | boolean | string;
    teardown?: (() => Promise<void>) | boolean | string;
    bootstrapAll?: (() => Promise<void>) | boolean | string;
    teardownAll?: (() => Promise<void>) | boolean | string;
    translation?: string;
    vocabularies?: Array<string>;
    require?: Array<string>;
    gherkin?: {
      features: string | Array<string>;
      steps: string | Array<string>;
    };
    ai?: AiConfig;
    fullPromiseBased?: boolean;
    [key: string]: any;
  };

  // Mocking
  type MockRequest = {
    method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE' | string;
    path: string;
    queryParams?: object;
  };

  type MockResponse = {
    status: number;
    body?: object;
  };

  type MockInteraction = {
    request: MockRequest;
    response: MockResponse;
  };

  // Page Scroll
  interface PageScrollPosition {
    x: number;
    y: number;
  }

  // Actors and Support
  interface Methods extends ActorStatic {}
  interface I {}
  interface IHook {}
  interface IScenario {}
  interface IFeature {
    (title: string): FeatureConfig;
  }
  interface SupportObject {
    I: CodeceptJS.I;
  }

  // Locator Types
  type ILocator =
    | { id: string }
    | { xpath: string }
    | { css: string }
    | { name: string }
    | { frame: string }
    | { android: string }
    | { ios: string }
    | { react: string }
    | { vue: string }
    | { shadow: string[] }
    | { custom: string }
    | { pw: string };

  type LocatorOrString = string | ILocator | OtherLocators | CustomLocators[keyof CustomLocators];

  type StringOrSecret = string | CodeceptJS.Secret;

  // Hook and Scenario Callbacks
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

  // Scenario Interface
  interface IScenario {
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

  // Global Utilities
  interface Globals {
    codeceptjs: typeof codeceptjs;
  }

  // BDD Parameter Types
  interface IParameterTypeDefinition<T> {
    name: string;
    regexp: readonly RegExp[] | readonly string[] | RegExp | string;
    transformer: (...match: string[]) => T;
    useForSnippets?: boolean;
    preferForRegexpMatch?: boolean;
  }
}

// Globals
declare const codecept_dir: string;
declare const output_dir: string;
declare function tryTo<T>(...fn: unknown[]): Promise<T>;
declare function retryTo<T>(...fn: unknown[]): Promise<T>;

declare const actor: CodeceptJS.actor;
declare const Helper: typeof CodeceptJS.Helper;
declare const pause: typeof CodeceptJS.pause;
declare const within: typeof CodeceptJS.within;
declare const session: typeof CodeceptJS.session;
declare const DataTable: typeof CodeceptJS.DataTable;
declare const locate: typeof CodeceptJS.Locator.build;
declare const secret: typeof CodeceptJS.Secret.secret;

// BDD
declare const Given: typeof CodeceptJS.addStep;
declare const When: typeof CodeceptJS.addStep;
declare const Then: typeof CodeceptJS.addStep;

// Hooks
declare const BeforeSuite: CodeceptJS.IHook;
declare const AfterSuite: CodeceptJS.IHook;
declare const Before: CodeceptJS.IHook;
declare const After: CodeceptJS.IHook;

// Process Interface
declare namespace NodeJS {
  interface Process {
    profile?: string;
    env?: {
      [key: string]: string | undefined;
    };
  }

  interface Global extends CodeceptJS.Globals {
    codecept_dir: typeof codecept_dir;
    output_dir: typeof output_dir;
    actor: typeof actor;
    Helper: typeof Helper;
    pause: typeof pause;
    within: typeof within;
    session: typeof session;
    DataTable: typeof DataTable;
    locate: typeof locate;
    secret: typeof secret;
    tryTo: typeof tryTo;
    retryTo: typeof retryTo;
    Given: typeof Given;
    When: typeof When;
    Then: typeof Then;
  }
}

declare namespace Mocha {
  interface MochaGlobals {
    Feature: typeof Feature;
    Scenario: typeof Scenario;
    BeforeSuite: typeof BeforeSuite;
    AfterSuite: typeof AfterSuite;
    Before: typeof Before;
    After: typeof After;
  }

  interface Suite extends SuiteRunnable {
    tags?: any[];
    feature?: any;
  }

  interface Test extends Runnable {
    artifacts?: [];
    tags?: any[];
  }
}

declare module "codeceptjs" {
  export = codeceptjs;
}

declare module "@codeceptjs/helper" {
  export = CodeceptJS.Helper;
}
