/// <reference types="Mocha" />

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
