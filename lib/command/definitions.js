const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const Codecept = require('../codecept');
const container = require('../container');
const output = require('../output');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const template = ({
  helperNames, callbackParams, importPaths,
}) => `/// <reference types='codeceptjs' />
${importPaths.join('\n')}

declare namespace CodeceptJS {
  export type I = ${helperNames.join(' & ')};
}

type ICodeceptCallback = (i: CodeceptJS.I${callbackParams}) => void;

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

${importPaths && importPaths.length > 0 ? `declare global {
  ${globals.join('\n\t')}
}
` : globals.map(item => `declare ${item}`).join('\n')}
`;

const globals = [
  `function actor(customSteps?: {
    [action: string]: (this: CodeceptJS.I, ...args: any[]) => void
  }): CodeceptJS.I;`,
  'const codecept_actor: typeof actor;',
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
    callbackParams.push(`arg_${name}:typeof ${name}`);
  }

  const importPaths = getImportString(testsPath, targetFolderPath);

  const definitionsTemplate = template({
    helperNames: Object.keys(helpers),
    callbackParams: [undefined, ...callbackParams, '...args: any[]'].join(', '),
    importPaths,
  });

  fs.writeFileSync(path.join(targetFolderPath, 'steps.d.ts'), definitionsTemplate);
  output.print('TypeScript Definitions provide autocompletion in Visual Studio Code and other IDEs');
  output.print('Definitions were generated in steps.d.ts');
};

function getImportString(testsPath, targetFolderPath) {
  const importStrings = [];

  for (const name in customFilePaths) {
    const value = customFilePaths[name];
    const parsedPath = path.parse(value);
    const relativePath = path.relative(targetFolderPath, path.join(testsPath, parsedPath.dir, parsedPath.name));
    importStrings.push(`import ${name} = require('./${relativePath}')`);
  }

  return importStrings;
}
