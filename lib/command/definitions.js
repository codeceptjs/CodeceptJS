const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const Codecept = require('../codecept');
const container = require('../container');
const methodsOfObject = require('../utils').methodsOfObject;
const output = require('../output');
const { toTypeDef } = require('../parser');
const fs = require('fs');
const path = require('path');

const template = `
type ICodeceptCallback = (i: CodeceptJS.{{I}}) => void;

declare class FeatureConfig {
  retry(integer): FeatureConfig
  timeout(integer): FeatureConfig
  config(object): FeatureConfig
  config(string, object): FeatureConfig
}

declare class ScenarioConfig {
  throws(any) : ScenarioConfig;
  fails() : ScenarioConfig;
  retry(integer): ScenarioConfig
  timeout(integer): ScenarioConfig
  inject(object): ScenarioConfig
  config(object): ScenarioConfig
  config(string, object): ScenarioConfig
}

interface ILocator {
  xpath?: string;
  css?: string;
  name?: string;
  value?: string;
  frame?: string;
  android?: string;
  ios?: string;
}

<<<<<<< HEAD
declare class Locator implements ILocator {
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

declare function actor(customSteps?: {}): CodeceptJS.{{I}};
declare function Feature(string: string, opts?: {}): FeatureConfig;
declare function Scenario(string: string, callback: ICodeceptCallback): ScenarioConfig;
declare function Scenario(string: string, opts: {}, callback: ICodeceptCallback): ScenarioConfig;
declare function xScenario(string: string, callback: ICodeceptCallback): ScenarioConfig;
declare function xScenario(string: string, opts: {}, callback: ICodeceptCallback): ScenarioConfig;
declare function Data(data: any): any;
declare function xData(data: any): any;
declare function Before(callback: ICodeceptCallback): void;
declare function BeforeSuite(callback: ICodeceptCallback): void;
declare function After(callback: ICodeceptCallback): void;
declare function AfterSuite(callback: ICodeceptCallback): void;

declare const locate: (selector: string): Locator;
declare const locate: (selector: ILocator): Locator;
declare const within: (selector: string, callback: Function): Promise;
declare const within: (selector: ILocator, callback: Function): Promise;
declare const session: (selector: string, callback: Function): Promise;
declare const session: (selector: ILocator, callback: Function): Promise;
declare const session: (selector: string, config: any, callback: Function): Promise;
declare const session: (selector: ILocator, config: any, callback: Function): Promise;
=======
declare function actor(customSteps?: {}): CodeceptJS.{{I}};
declare function Feature(string: string, opts?: {}): void;
declare function Scenario(string: string, callback: ICodeceptCallback): void;
declare function Scenario(string: string, opts: {}, callback: ICodeceptCallback): void;
declare function xScenario(string: string, callback: ICodeceptCallback): void;
declare function xScenario(string: string, opts: {}, callback: ICodeceptCallback): void;
declare function Data(data: any): any;
declare function xData(data: any): any;
declare function Before(callback: ICodeceptCallback): void;
declare function BeforeSuite(callback: ICodeceptCallback): void;
declare function After(callback: ICodeceptCallback): void;
declare function AfterSuite(callback: ICodeceptCallback): void;
declare function within(selector: string, callback: Function): void;
declare const codecept_helper: any;
>>>>>>> 7cb353f30b4f672d54cfe807344e50a47891c267

declare namespace CodeceptJS {
  export interface {{I}} {
{{methods}}
  }
}

declare module "codeceptjs" {
    export = CodeceptJS;
}
`;

module.exports = function (genPath, options) {
  const configFile = options.config || genPath;
  const testsPath = getTestRoot(configFile);
  const config = getConfig(configFile);
  if (!config) return;

  const codecept = new Codecept(config, {});
  codecept.init(testsPath, (err) => {
    if (err) {
      output.error(`Error while running bootstrap file :${err}`);
      return;
    }

    const helpers = container.helpers();
    const suppportI = container.support('I');
    const translations = container.translation();
    let methods = [];
    const actions = [];
    for (const name in helpers) {
      const helper = helpers[name];
      for (const action of methodsOfObject(helper)) {
        const actionAlias = container.translation() ? container.translation().actionAliasFor(action) : action;
        if (!actions[actionAlias]) {
          methods = methods.concat(toTypeDef(helper[action]));
          actions[actionAlias] = 1;
        }
      }
    }
    for (const name in suppportI) {
      if (actions[name]) {
        continue;
      }
      const actor = suppportI[name];
      // const params = toTypeDef(actor);
      // methods.push(`    ${(name)}: (${params}) => any; \n`);
    }
    let definitionsTemplate = template.replace('{{methods}}', methods.join(''));
    definitionsTemplate = definitionsTemplate.replace(/\{\{I\}\}/g, container.translation().I);

    fs.writeFileSync(path.join(testsPath, 'steps.d.ts'), definitionsTemplate);
    output.print('TypeScript Definitions provide autocompletion in Visual Studio Code and other IDEs');
    output.print('Definitions were generated in steps.d.ts');
    output.print('Load them by adding at the top of a test file:');
    output.print(output.colors.grey('\n/// <reference path="./steps.d.ts" />'));

    codecept.teardown();
  });
};
