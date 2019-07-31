const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const Codecept = require('../codecept');
const container = require('../container');
const output = require('../output');
const fs = require('fs');
const path = require('path');

const template = ({
  helperNames, supportObject, importPaths, translations,
}) => `/// <reference types='codeceptjs' />
import { ActorStatic, Translate } from "codeceptjs/typings/utils";
${importPaths.join('\n')}

type translation = ${JSON.stringify(translations.vocabulary, null, 2)};
type WithTranslation<T> = T & Translate<T, translation["actions"]>;
type methods = ${helperNames.length > 0 ? helperNames.join(' & ') : 'undefined'};

declare namespace CodeceptJS {
  export type I = ${customFilePaths.I ? 'ReturnType<typeof I>' : 'WithTranslation<methods>'};
}

type ICodeceptCallback = (${convertObjectToParameterList(supportObject)}) => void;
type SupportObject = ${convertObjectToType(supportObject)};

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

declare global {
  function actor<T extends { [action: string]: Function }>(
    customSteps: T & ThisType<WithTranslation<methods & T>>
  ): WithTranslation<methods & T>;
  function inject(): SupportObject;
  function inject<T extends keyof SupportObject>(name: T): SupportObject[T];
  const codecept_actor: typeof actor;
  const Scenario: Scenario;
  const xScenario: IScenario;
  function Data(data: any): IData;
  function xData(data: any): IData;
  function BeforeSuite(callback: ICodeceptCallback): void;
  function AfterSuite(callback: ICodeceptCallback): void;
  function Background(callback: ICodeceptCallback): void;
  function Before(callback: ICodeceptCallback): void;
  function After(callback: ICodeceptCallback): void;
}
`;

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
  const translations = container.translation();
  for (const name in helpers) {
    const require = codecept.config.helpers[name].require;
    if (require) customFilePaths[name] = require;
  }

  const supportObject = { I: 'CodeceptJS.I' };
  for (const name in codecept.config.include) {
    const includePath = codecept.config.include[name];
    if (includePath) customFilePaths[name] = includePath;
    if (name === 'I' || name === translations.I) continue;
    supportObject[name] = `typeof ${name}`;
  }

  const importPaths = getImportString(testsPath, targetFolderPath);

  const definitionsTemplate = template({
    helperNames: Object.keys(helpers),
    supportObject,
    importPaths,
    translations,
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
    importStrings.push(`import ${name} = require('./${relativePath}');`);
  }

  return importStrings;
}

function convertObjectToParameterList(object) {
  const argumentValues = Object.entries(object).map(([key, value]) => `arg_${key}: ${value}`);
  return `${argumentValues.join(', ')}, ...args: any[]`;
}

function convertObjectToType(object) {
  return `{ ${Object.entries(object).map(([key, value]) => `${key}: ${value}`).join(', ')} }`;
}
