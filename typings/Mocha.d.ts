/// <reference types="Mocha" />

declare namespace Mocha {
  interface MochaGlobals {
    Feature: typeof CodeceptJS.Feature;
  }
}

declare module "mocha/lib/reporters/base" {
  export = Mocha.reporters.Base;
}

declare module "mocha/lib/suite" {
  export = Mocha.Suite;
}

declare module "mocha/lib/context" {
  export = Mocha.Context;
}

declare module "mocha/lib/test" {
  export = Mocha.Test;
}

declare module "mocha/lib/mocha" {
  export = Mocha;
}
