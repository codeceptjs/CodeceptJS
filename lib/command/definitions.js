const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const Codecept = require('../codecept');
const container = require('../container');
const output = require('../output');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const template = `
/// <reference path='../typings/types.d.ts' />
/// <reference path='./types.d.ts' />

type ICodeceptCallback = (i: CodeceptJS.I{{callbackParams}}) => void;

declare namespace CodeceptJS {
  export interface I extends {{helpers}} {}
}

declare module "codeceptjs" {
  export = CodeceptJS;
}
`;

const customFilePaths = [];

module.exports = function (genPath, options) {
  const configFile = options.config || genPath;
  const testsPath = getTestRoot(configFile);
  const config = getConfig(configFile);
  if (!config) return;

  const targetFolderPath = options.output && getTestRoot(options.output) || testsPath;

  const codecept = new Codecept(config, {});
  codecept.init(testsPath);

  const helpers = container.helpers();
  for (const name in helpers) {
    const require = codecept.config.helpers[name].require;
    if (require) customFilePaths.push(require);
  }

  const supports = container.support(); // return all support objects
  const callbackParams = [];
  for (const name in supports) {
    const path = codecept.config.include[name];
    if (path) customFilePaths.push(path);
    if (name === 'I') continue;
    callbackParams.push(`${name}:CodeceptJS.${name}`);
  }

  let definitionsTemplate = template.replace('{{helpers}}', Object.keys(helpers).join(', '));
  definitionsTemplate = definitionsTemplate.replace('{{callbackParams}}', `, ${[...callbackParams, '...args: any'].join(', ')}`);

  generateDefintionsFromJSDoc(targetFolderPath);
  fs.writeFileSync(path.join(targetFolderPath, 'steps.d.ts'), definitionsTemplate);
  output.print('TypeScript Definitions provide autocompletion in Visual Studio Code and other IDEs');
  output.print('Definitions were generated in steps.d.ts');
};

function generateDefintionsFromJSDoc(targetFolderPath) {
  exec(
    `jsdoc -t node_modules/tsd-jsdoc/dist -r -d ${targetFolderPath} ${customFilePaths.join(' ')}`,
    (error, stdout) => {
      if (error) output.error(error);
      if (stdout) output.log(error);
    },
  );
}
