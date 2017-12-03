const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const Codecept = require('../codecept');
const container = require('../container');
const methodsOfObject = require('../utils').methodsOfObject;
const getParamsToString = require('../utils').getParamsToString;
const output = require('../output');
const fs = require('fs');
const path = require('path');

const template = `
type ICodeceptCallback = (i: CodeceptJS.{{I}}) => void;

declare const actor: () => CodeceptJS.{{I}};
declare const Feature: (string: string) => void;
declare const Scenario: (string: string, callback: ICodeceptCallback) => void;
declare const Before: (callback: ICodeceptCallback) => void;
declare const After: (callback: ICodeceptCallback) => void;
declare const within: (selector: string, callback: Function) => void;

declare namespace CodeceptJS {
  export interface {{I}} {
{{methods}}
  }
}

declare module "codeceptjs" {
    export = CodeceptJS;
}
`;

module.exports = function (genPath) {
  const testsPath = getTestRoot(genPath);
  const config = getConfig(testsPath);
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
    const methods = [];
    const actions = [];
    for (const name in helpers) {
      const helper = helpers[name];
      methodsOfObject(helper).forEach((action) => {
        const actionAlias = container.translation() ? container.translation().actionAliasFor(action) : action;
        if (!actions[actionAlias]) {
          const params = getParamsToString(helper[action]);
          methods.push(`    ${(actionAlias)}: (${params}) => any; \n`);
          actions[actionAlias] = 1;
        }
      });
    }
    for (const name in suppportI) {
      if (actions[name]) {
        continue;
      }
      const actor = suppportI[name];
      const params = getParamsToString(actor);
      methods.push(`    ${(name)}: (${params}) => any; \n`);
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
