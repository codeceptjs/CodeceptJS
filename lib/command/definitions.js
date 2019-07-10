const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const Codecept = require('../codecept');
const container = require('../container');
const output = require('../output');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const template = ({
  helpers, callbackParams, importJSDocTypes, importPaths,
}) => `
/// <reference types='codeceptjs' />
${importJSDocTypes ? '/// <reference path="./types.d.ts" />' : ''}
${importPaths}

declare namespace CodeceptJS {
  export interface I extends ${helpers} {}
}

type ICodeceptCallback = (i: CodeceptJS.I${callbackParams}) => void;

declare function actor(customSteps?: {
  [action: string]: (this: CodeceptJS.I, ...args: any[]) => void
}): CodeceptJS.I;

declare function actor(customSteps?: {
  [action: string]: (this: CodeceptJS.I, ...args: any[]) => void
}): CodeceptJS.I;

declare interface IScenario {
  (title: string, callback: ICodeceptCallback): ScenarioConfig;
  (title: string, opts: { [key: string]: any }, callback: ICodeceptCallback): ScenarioConfig;
}

declare interface Scenario extends IScenario {
  only: IScenario
  skip: IScenario
}

interface IData {
  Scenario: IScenario
  only: {
    Scenario: IScenario
  };
}

${importPaths ? `declare global {
  ${globals.join('\n\t')}
}
` : `${globals.map(item => `declare ${item}`).join('\n')}`}
`;

const globals = [
  'const Scenario: Scenario;',
  'const xScenario: IScenario;',
  'function Data(data: any): IData;',
  'function xData(data: any): IData;',
  'function BeforeSuite(callback: ICodeceptCallback): void;',
  'function AfterSuite(callback: ICodeceptCallback): void;',
  'function Background(callback: ICodeceptCallback): void;',
  'function Before(callback: ICodeceptCallback): void;',
  'function After(callback: ICodeceptCallback): void;',
];

const customFilePaths = {};
const importStrings = [];

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
    if (require) customFilePaths[name] = require;
  }

  const supports = container.support(); // return all support objects
  const callbackParams = [];
  for (const name in supports) {
    const fullPath = codecept.config.include[name];
    let parsedPath;
    if (fullPath) {
      parsedPath = path.parse(fullPath);
      customFilePaths[name] = fullPath;
    }
    if (name === 'I') continue;
    if (!parsedPath || ['.ts', '.tsx'].includes(parsedPath.ext)) {
      callbackParams.push(`arg_${name}:typeof ${name}`);
    } else {
      callbackParams.push(`arg_${name}:${name}`);
    }
  }

  importTypescriptFiles(testsPath, targetFolderPath);
  const importJSDocTypes = customFilePaths.length > 0;
  if (importJSDocTypes) generateDefintionsFromJSDoc(targetFolderPath);

  const definitionsTemplate = template({
    helpers: Object.keys(helpers).join(', '),
    callbackParams: `, ${[...callbackParams, '...args: any[]'].join(', ')}`,
    importJSDocTypes,
    importPaths: importStrings.join('\n'),
  });

  generateDefintionsFromJSDoc(targetFolderPath);
  fs.writeFileSync(path.join(targetFolderPath, 'steps.d.ts'), definitionsTemplate);
  output.print('TypeScript Definitions provide autocompletion in Visual Studio Code and other IDEs');
  output.print('Definitions were generated in steps.d.ts');
};

function importTypescriptFiles(testsPath, targetFolderPath) {
  for (const name in customFilePaths) {
    const value = customFilePaths[name];
    const parsedPath = path.parse(value);
    const relativePath = path.relative(targetFolderPath, path.join(testsPath, parsedPath.dir, parsedPath.name));
    if (['.ts', '.tsx'].includes(parsedPath.ext)) {
      delete customFilePaths[name];
      importStrings.push(`import ${name} = require('${relativePath}')`);
    }
  }
}

function generateDefintionsFromJSDoc(targetFolderPath) {
  exec(
    `jsdoc -t node_modules/tsd-jsdoc/dist -r -d ${targetFolderPath} ${Object.values(customFilePaths).join(' ')}`,
    (error, stdout) => {
      if (error) output.error(error);
      if (stdout) output.log(error);
    },
  );
}
