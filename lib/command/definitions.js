const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const Codecept = require('../codecept');
const container = require('../container');
const output = require('../output');
const fs = require('fs');
const path = require('path');

const template = ({
  helperNames, supportObject, importPaths, translations, hasCustomStepsFile,
}) => `/// <reference types='codeceptjs' />
${importPaths.join('\n')}

type translation = ${JSON.stringify(translations.vocabulary, null, 2)};
type WithTranslation<T> = T & import('codeceptjs/typings/utils').Translate<T, translation["actions"]>;
type methods = ${helperNames.length > 0 ? `${helperNames.join(' & ')} & ` : ''} import('codeceptjs/typings/utils').ActorStatic;

type ICodeceptCallback = (${convertMapToParameterList(supportObject)}) => void;
type SupportObject = ${convertMapToType(supportObject)};

interface IScenario {
  (title: string, callback: ICodeceptCallback): CodeceptJS.ScenarioConfig;
  (title: string, opts: { [key: string]: any }, callback: ICodeceptCallback): CodeceptJS.ScenarioConfig;
}

interface Scenario extends IScenario {
  only: IScenario
  skip: IScenario
}

interface IData {
  Scenario: IScenario
  only: {
    Scenario: IScenario
  };
}

declare namespace CodeceptJS {
  interface I extends ${hasCustomStepsFile ? 'ReturnType<typeof I>' : 'WithTranslation<methods>'} {}
  interface index {
    actor: typeof actor;
  }
}

declare function actor<T extends { [action: string]: Function }>(
  customSteps: T & ThisType<WithTranslation<methods & T>>
): WithTranslation<methods & T>;
declare function inject(): SupportObject;
declare function inject<T extends keyof SupportObject>(name: T): SupportObject[T];
declare const codecept_actor: typeof actor;
declare const Scenario: Scenario;
declare const xScenario: IScenario;
declare function Data(data: any): IData;
declare function xData(data: any): IData;
declare function BeforeSuite(callback: ICodeceptCallback): void;
declare function AfterSuite(callback: ICodeceptCallback): void;
declare function Background(callback: ICodeceptCallback): void;
declare function Before(callback: ICodeceptCallback): void;
declare function After(callback: ICodeceptCallback): void;
`;

const helperNames = [];

module.exports = function (genPath, options) {
  const configFile = options.config || genPath;
  const testsPath = getTestRoot(configFile);
  const config = getConfig(configFile);
  if (!config) return;

  /** @type {Object<string, string>} */
  const helperPaths = {};
  /** @type {Object<string, string>} */
  const supportPaths = {};
  let hasCustomStepsFile = false;

  const targetFolderPath = options.output && getTestRoot(options.output) || testsPath;

  const codecept = new Codecept(config, {});
  codecept.init(testsPath);

  const helpers = container.helpers();
  const translations = container.translation();
  for (const name in helpers) {
    const require = codecept.config.helpers[name].require;
    if (require) {
      helperPaths[name] = require;
      helperNames.push(name);
    } else {
      helperNames.push(`CodeceptJS.${name}`);
    }
  }

  const supportObject = new Map();
  supportObject.set('I', 'CodeceptJS.I');
  for (const name in codecept.config.include) {
    const includePath = codecept.config.include[name];
    if (includePath) supportPaths[name] = includePath;
    if (name === 'I' || name === translations.I) {
      hasCustomStepsFile = true;
      continue;
    }
    supportObject.set(name, name);
  }

  const definitionsTemplate = template({
    helperNames,
    supportObject,
    importPaths: getImportString(testsPath, targetFolderPath, supportPaths, helperPaths),
    translations,
    hasCustomStepsFile,
  });

  fs.writeFileSync(path.join(targetFolderPath, 'steps.d.ts'), definitionsTemplate);
  output.print('TypeScript Definitions provide autocompletion in Visual Studio Code and other IDEs');
  output.print('Definitions were generated in steps.d.ts');
};

/**
 * Returns the relative path from the  to the targeted folder.
 * @param {string} originalPath
 * @param { string} targetFolderPath
 * @param { string} testsPath
 */
function getPath(originalPath, targetFolderPath, testsPath) {
  if (!originalPath.startsWith('.')) return originalPath;
  const parsedPath = path.parse(originalPath);
  return path.relative(targetFolderPath, path.join(testsPath, parsedPath.dir, parsedPath.name));
}

/**
 *
 *
 * @param {string} testsPath
 * @param {string} targetFolderPath
 * @param {Object<string, string>} pathsToType
 * @param {Object<string, string>} pathsToValue
 * @returns
 */
function getImportString(testsPath, targetFolderPath, pathsToType, pathsToValue) {
  const importStrings = [];

  for (const name in pathsToType) {
    const relativePath = getPath(pathsToType[name], targetFolderPath, testsPath);
    importStrings.push(`type ${name} = typeof import ('./${relativePath}');`);
  }

  for (const name in pathsToValue) {
    const relativePath = getPath(pathsToValue[name], targetFolderPath, testsPath);
    importStrings.push(`type ${name} = import ('./${relativePath}');`);
  }

  return importStrings;
}

/**
 * @param {Map} map
 */
function convertMapToParameterList(map) {
  const argumentValues = Array.from(map).map(([key, value]) => `${key}: ${value}`);
  return `${argumentValues.join(', ')}, ...args: any[]`;
}

/**
 * @param {Map} map
 */
function convertMapToType(map) {
  return `{ ${Array.from(map).map(([key, value]) => `${key}: ${value}`).join(', ')} }`;
}
