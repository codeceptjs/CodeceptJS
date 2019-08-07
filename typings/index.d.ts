// Type definitions for CodeceptJS
// Project: https://github.com/codeception/codeceptjs/
/// <reference path="./types.d.ts" />
/// <reference path="../node_modules/webdriverio/webdriverio-core.d.ts" />

import index = require("../lib/index");

declare global {
  namespace CodeceptJS {
    interface index {
      codecept: typeof CodeceptJS.Codecept;
      container: typeof CodeceptJS.Container;
      config: typeof CodeceptJS.Config;
      helper: typeof CodeceptJS.Helper;
      pause: typeof CodeceptJS.pause;
      within: typeof CodeceptJS.within;
      dataTable: typeof CodeceptJS.DataTable;
      locator: typeof CodeceptJS.Locator;

      // export typings from JS files, type any when allowJs is set to false
      recorder: typeof index.recorder;
      event: typeof index.event;
      output: typeof index.output;
      store: typeof index.store;
    }

    interface Globals {
      codeceptjs: typeof codeceptjs;
    }

    type ILocator = {id: string }
      | {xpath: string }
      | {css: string }
      | {name: string }
      | {frame: string }
      | {android: string }
      | {ios: string }
      | {react: string };

    type LocatorOrString = string | ILocator | Locator;
  }
  const codeceptjs: CodeceptJS.index;
  const Helper: typeof CodeceptJS.Helper;
  const pause: typeof CodeceptJS.pause;
  const within: typeof CodeceptJS.within;
  const session: typeof CodeceptJS.session;
  const DataTable: typeof CodeceptJS.DataTable;

  const codecept_dir: string;
  const codecept_helper: typeof CodeceptJS.Helper;
  const output_dir: string;

  const locate: typeof CodeceptJS.Locator.build;
  const secret: typeof CodeceptJS.Secret.secret;

  const Given: typeof CodeceptJS.addStep;
  const When: typeof CodeceptJS.addStep;
  const Then: typeof CodeceptJS.addStep;

  const Feature: typeof CodeceptJS.Feature;

  // Make sure type are available within an browser context.
  interface Window extends CodeceptJS.Globals {}

  namespace NodeJS {
    interface Process {
      profile: string;
    }

    interface Global extends CodeceptJS.Globals {
      codecept_dir: typeof codecept_dir;
      codecept_helper: typeof CodeceptJS.Helper;
      output_dir: typeof output_dir;

      Helper: typeof CodeceptJS.Helper;
      pause: typeof CodeceptJS.pause;
      within: typeof CodeceptJS.within;
      session: typeof CodeceptJS.session;
      DataTable: typeof CodeceptJS.DataTable;

      locate: typeof locate;
      inject: any;
      secret: typeof secret;

      Given: typeof Given;
      When: typeof When;
      Then: typeof Then;
    }
  }
}

export = codeceptjs;
