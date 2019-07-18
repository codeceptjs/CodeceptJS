// Type definitions for CodeceptJS 2.1.4
// Project: https://github.com/codeception/codeceptjs/
/// <reference path="./types.d.ts" />

import * as Protractor from "protractor";
import index = require("../lib/index");

type ValueOf<T> = T[keyof T]
type KeyValueTupleToObject<T extends [keyof any, any]> = {
  [K in T[0]]: Extract<T, [K, any]>[1]
}

declare global {
  type Translate<T, M extends Record<string, string>> =
    KeyValueTupleToObject<ValueOf<{
      [K in keyof T]: [K extends keyof M ? M[K] : K, T[K]]
    }>>

  const codeceptjs: {
    codecept: typeof Codecept,
    container: typeof Container,
    config: typeof Config,
    actor: any,
    helper: typeof Helper,
    pause: typeof pause,
    within: typeof within,
    dataTable: typeof DataTable,
    locator: typeof Locator,
    
    // export typings from JS files, type any when allowJs is set to false
    recorder: typeof index.recorder,
    event: typeof index.event,
    output: typeof index.output,
    store: typeof index.store,
  };
  const codecept_dir: string;
  const codecept_helper: Helper;
  const output_dir: string;

  const locate: typeof Locator.build;
  const inject: typeof Container.support;
  const secret: typeof Secret.secret;

  const Given: typeof addStep;
  const When: typeof addStep;
  const Then: typeof addStep;

  // Used by Protractor helper
  const by: Protractor.ProtractorBy;
  const By: Protractor.ProtractorBy;
  const ExpectedConditions: Protractor.ProtractorExpectedConditions;
  const element: typeof Protractor.element;
  const $: typeof Protractor.$;
  const $$: typeof Protractor.$$;
  const browser: Protractor.ProtractorBrowser;
  namespace NodeJS {
    interface Process {
      profile: string;
    }
  }
}
