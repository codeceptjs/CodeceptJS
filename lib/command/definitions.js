const fs = require('fs');
const path = require('path');

const { getConfig, getTestRoot } = require('./utils');
const Codecept = require('../codecept');
const container = require('../container');
const output = require('../output');

const template = ({
  helperNames, supportObject, importPaths, translations, hasCustomStepsFile,
}) => `/// <reference types='codeceptjs' />
${importPaths.join('\n')}

declare namespace CodeceptJS {
  interface SupportObject ${convertMapToType(supportObject)}
  interface CallbackOrder { ${convertMapToIndexedInterface(supportObject)} }
  ${helperNames.length > 0 ? `interface Methods extends ${helperNames.join(', ')} {}` : ''}
  interface I extends ${hasCustomStepsFile ? 'ReturnType<steps_file>' : 'WithTranslation<Methods>'} {}
  namespace Translation {
    interface Actions ${JSON.stringify(translations.vocabulary.actions, null, 2)}
  }
}
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
    if (name === 'I' || name === translations.I) {
      hasCustomStepsFile = true;
      supportPaths.steps_file = includePath;
      continue;
    }
    supportPaths[name] = includePath;
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
  const parsedPath = path.parse(originalPath);

  // Remove typescript extension if exists.
  if (parsedPath.base.endsWith('.d.ts')) parsedPath.base = parsedPath.base.substring(0, parsedPath.base.length - 5);
  else if (parsedPath.ext === '.ts') parsedPath.base = parsedPath.name;

  if (!parsedPath.dir.startsWith('.')) return path.posix.join(parsedPath.dir, parsedPath.base);
  const relativePath = path.posix.relative(targetFolderPath, path.posix.join(testsPath, parsedPath.dir, parsedPath.base));

  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
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
    importStrings.push(`type ${name} = typeof import('${relativePath}');`);
  }

  for (const name in pathsToValue) {
    const relativePath = getPath(pathsToValue[name], targetFolderPath, testsPath);
    importStrings.push(`type ${name} = import('${relativePath}');`);
  }

  return importStrings;
}

/**
 * @param {Map} map
 */
function convertMapToIndexedInterface(map) {
  return [...map.values()].map((value, i) => `[${i}]: ${value}`).join('; ');
}

/**
 * @param {Map} map
 */
function convertMapToType(map) {
  return `{ ${Array.from(map).map(([key, value]) => `${key}: ${value}`).join(', ')} }`;
}
