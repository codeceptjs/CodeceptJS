// Type definitions for CodeceptJS 1.0.2
// Project: https://github.com/codeception/codeceptjs/
// Definitions by: Michael Bodnarchuk <http://github.com/DavertMik>, Drew Diamantoukos <https://github.com/KennyRules>

declare module NodeJS {
  interface Process {
    profile: string;
  }

  interface Global {
    codecept_dir: string;
    output_dir: string;
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
