'use strict';

let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let Codecept = require('../codecept');
let container = require('../container');
let methodsOfObject = require('../utils').methodsOfObject;
let getParamNames = require('../utils').getParamNames;
let output = require('../output');
let fs = require('fs');
let path = require('path');
let template = `
type ICodeceptCallback = (i: CodeceptJS.I) => void;

declare const actor: () => CodeceptJS.I;
declare const Feature: (string: string) => void;
declare const Scenario: (string: string, callback: ICodeceptCallback) => void;
declare const Before: (callback: ICodeceptCallback) => void;
declare const After: (callback: ICodeceptCallback) => void;
declare const within: (selector: string, callback: Function) => void;

declare namespace CodeceptJS {
  export interface I {
{{methods}}
  }
}

declare module "codeceptjs" {
    export = CodeceptJS;
}
`

module.exports = function (genPath) {
    let testsPath = getTestRoot(genPath);
    let config = getConfig(testsPath);
    if (!config) return;

    let codecept = new Codecept(config, {});
    codecept.init(testsPath);
    let helpers = container.helpers();
    let suppportI = container.support('I');
    let methods = [];
    let actions = [];
    for (let name in helpers) {
        let helper = helpers[name];
        methodsOfObject(helper).forEach((action) => {
            let params = getParamNames(helper[action]);
            if (params) params = params.join(', ');
            if (!params) params = '';
            methods.push(`    ${(action)}: (${params}) => any; \n`);
            actions[action] = 1
        });
    }
    for (let name in suppportI) {
        if (actions[name]) {
            continue
        }
        let actor = suppportI[name];
        let params = getParamNames(actor);
        if (params) params = params.join(', ');
        if (!params) params = '';
        methods.push(`    ${(name)}: (${params}) => any; \n`);
    }
    let definitionsTemplate = template.replace('{{methods}}', methods.join(''));
    fs.writeFileSync(path.join(testsPath, 'steps.d.ts'), definitionsTemplate);
    output.print('TypeScript Definitions provide autocompletion in Visual Studio Code and other IDEs');
    output.print('Definitions were generated in steps.d.ts');
    output.print('Load them by adding at the top of a test file:');
    output.print(output.colors.grey(`\n/// <reference path="./steps.d.ts" />`));

}
