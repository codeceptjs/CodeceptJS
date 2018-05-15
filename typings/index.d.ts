// Type definitions for CodeceptJS 1.0.2
// Project: https://github.com/codeception/codeceptjs/
// Definitions by: Michael Bodnarchuk <http://github.com/DavertMik>, Drew Diamantoukos <https://github.com/KennyRules>

declare class Locator {
  or(locator): Locator;
  find(locator): Locator;
  withChild(locator): Locator;
  find(locator): Locator;
  at(position): Locator;
  first(): Locator;
  last(): Locator;
  inside(locator): Locator;
  before(locator): Locator;
  after(locator): Locator;
  withText(text): Locator;
  withAttr(attr): Locator;
  as(output): Locator;
}

declare module NodeJS {
  interface Process {
    profile: string;
  }

  interface Global {
    codecept_actor: any;
    codecept_dir: string;
    codecept_helper: any;
    output_dir: string;

    actor: any;
    Helper: any;
    pause: any;
    within: any;
    session: any;
    DataTable: any;
    locate: Locator,
    by: any;

    // Used by Protractor helper
    By: any;
    ExpectedConditions: any;
    element: any;
    $: any;
    $$: any;
    browser: any;
  }
}

declare interface Window {
  codeceptjs: any;
}

declare var window: Window;


/**
 * Special Mocha definitions for reporter Base and Suite.
 * The mocha type definitions on DefinitelyTyped are for an older version of Mocha!
 */

declare module 'mocha/lib/reporters/base' {
  class base {
    constructor(runner: any);
    static cursor: any;
    static color: any;
    static list(items: any);
    static symbols: any;
    failures: any;
    stats: any;
  }

  export = base;
}

declare interface Suite {
  addTest: any;
  afterAll: any;
  afterEach: any;
  beforeAll: any;
  beforeEach: any;
  pending: any;
  on: any;
  timeout: any;
  title: any;

  create(suite: any, title: any): any;
}

declare module 'mocha/lib/suite' {
  export = Suite;
}