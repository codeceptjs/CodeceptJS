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
type ICodeceptCallback = (i: CodeceptJS.{{I}}{{callbackParams}}) => void;

declare class FeatureConfig {
  retry(times:number): FeatureConfig
  timeout(seconds:number): FeatureConfig
  config(config:object): FeatureConfig
  config(helperName:string, config:object): FeatureConfig
}

declare class ScenarioConfig {
  throws(err:any) : ScenarioConfig;
  fails() : ScenarioConfig;
  retry(times:number): ScenarioConfig
  timeout(timeout:number): ScenarioConfig
  inject(inject:object): ScenarioConfig
  config(config:object): ScenarioConfig
  config(helperName:string, config:object): ScenarioConfig
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

declare class Locator implements ILocator {
  xpath?: string;
  css?: string;
  name?: string;
  value?: string;
  frame?: string;
  android?: string;
  ios?: string;

  or(locator:string): Locator;
  find(locator:string): Locator;
  withChild(locator:string): Locator;
  find(locator:string): Locator;
  at(position:number): Locator;
  first(): Locator;
  last(): Locator;
  inside(locator:string): Locator;
  before(locator:string): Locator;
  after(locator:string): Locator;
  withText(locator:string): Locator;
  withAttr(locator:object): Locator;
  as(locator:string): Locator;
}

declare function actor(customSteps?: {}): CodeceptJS.{{I}};
declare function Feature(title: string, opts?: {}): FeatureConfig;
declare function Scenario(title: string, callback: ICodeceptCallback): ScenarioConfig;
declare function Scenario(title: string, opts: {}, callback: ICodeceptCallback): ScenarioConfig;
declare function xScenario(title: string, callback: ICodeceptCallback): ScenarioConfig;
declare function xScenario(title: string, opts: {}, callback: ICodeceptCallback): ScenarioConfig;
declare function Data(data: any): any;
declare function xData(data: any): any;
declare function Before(callback: ICodeceptCallback): void;
declare function BeforeSuite(callback: ICodeceptCallback): void;
declare function After(callback: ICodeceptCallback): void;
declare function AfterSuite(callback: ICodeceptCallback): void;

declare function locate(selector: string): Locator;
declare function locate(selector: ILocator): Locator;
declare function within(selector: string, callback: Function): Promise<any>;
declare function within(selector: ILocator, callback: Function): Promise<any>;
declare function session(selector: string, callback: Function): Promise<any>;
declare function session(selector: ILocator, callback: Function): Promise<any>;
declare function session(selector: string, config: any, callback: Function): Promise<any>;
declare function session(selector: ILocator, config: any, callback: Function): Promise<any>;
declare function pause(): void;

declare const codecept_helper: any;

declare namespace CodeceptJS {
  export interface {{I}} {
{{methods}}
  }
{{exportPageObjects}}
}

declare module "codeceptjs" {
    export = CodeceptJS;
}
`;

const pageObjectTemplate = `
  export interface {{name}} {
{{methods}}
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
      methods = addAllMethodsInObject(helper, actions, methods, translations);
    }
    methods = addAllNamesInObject(suppportI, actions, methods);

    const supports = container.support(); // return all support objects
    const exportPageObjects = [];
    const callbackParams = [];
    for (const name in supports) {
      if (name === 'I') continue;
      callbackParams.push(`${name}:any`);
      const pageObject = supports[name];
      const pageMethods = addAllMethodsInObject(pageObject, {}, []);
      let pageObjectExport = pageObjectTemplate.replace('{{methods}}', pageMethods.join(''));
      pageObjectExport = pageObjectExport.replace('{{name}}', name);
      exportPageObjects.push(pageObjectExport);
    }

    let definitionsTemplate = template.replace('{{methods}}', methods.join(''));
    definitionsTemplate = definitionsTemplate.replace('{{exportPageObjects}}', exportPageObjects.join('\n'));
    if (callbackParams.length > 0) {
      definitionsTemplate = definitionsTemplate.replace('{{callbackParams}}', `, ${callbackParams.join(', ')}`);
    } else {
      definitionsTemplate = definitionsTemplate.replace('{{callbackParams}}', '');
    }
    if (translations) {
      definitionsTemplate = definitionsTemplate.replace(/\{\{I\}\}/g, translations.I);
    }

    fs.writeFileSync(path.join(testsPath, 'steps.d.ts'), definitionsTemplate);
    output.print('TypeScript Definitions provide autocompletion in Visual Studio Code and other IDEs');
    output.print('Definitions were generated in steps.d.ts');
    output.print('Load them by adding at the top of a test file:');
    output.print(output.colors.grey('\n/// <reference path="./steps.d.ts" />'));

    codecept.teardown();
  });
};

function addAllMethodsInObject(supportObj, actions, methods, translations) {
  for (const action of methodsOfObject(supportObj)) {
    const actionAlias = translations ? translations.actionAliasFor(action) : action;
    if (!actions[actionAlias]) {
      methods.push(toTypeDef(supportObj[action]));
      actions[actionAlias] = 1;
    }
  }
  return methods;
}

function addAllNamesInObject(supportObj, actions, methods) {
  for (const name in supportObj) {
    if (actions[name]) {
      continue;
    }
    const actor = supportObj[name];
    let params = toTypeDef(actor);
    if (params !== undefined) {
      if (params.indexOf(' : ') > 0) {
        if (params.indexOf(' (') > 0) {
          params = params.trim();
          methods.push(`    ${(name)}${params}\n`);
        } else {
          methods.push(`${params}`);
        }
      } else {
        methods.push(`    ${(name)}: (${params}) => any; \n`);
      }
    }
  }
  return methods;
}
