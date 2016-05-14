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
    let methods = '';
    for (let name in helpers) {
        let helper = helpers[name];
        methodsOfObject(helper).forEach((action) => {
            let params = getParamNames(helper[action]);
            if (params) params = params.join(', ');
            if (!params) params = '';
            methods += `    ${(action)}: (${params}) => any; \n`;
        });
    }
    let definitionsTemplate = template.replace('{{methods}}', methods);
    fs.writeFileSync(path.join(testsPath, 'steps.d.ts'), definitionsTemplate);
    output.print('TypeScript Definitions provide autocompletion in Visual Studio Code and other IDEs');
    output.print('Definitions were generated in steps.d.ts');
    output.print('Load them by adding at the top of a test file:');
    output.print(output.colors.grey(`\n/// <reference path="./steps.d.ts" />`));

}