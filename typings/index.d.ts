// Type definitions for CodeceptJS 1.0.2
// Project: https://github.com/codeception/codeceptjs/
// Definitions by: Michael Bodnarchuk <http://github.com/DavertMik>, Drew Diamantoukos <https://github.com/KennyRules>

declare module CodeceptJS {
  class Assertion {
    comparator: Number;
    params: {
      customMessage: String;
    };

    constructor(comparator, params);
  }
}

declare module "codecept" {
  export = CodeceptJS
}