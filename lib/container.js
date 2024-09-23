import glob from 'glob';
import path, { dirname } from 'path';
import importSync from 'import-sync';
import { fileURLToPath } from 'url';
import { MetaStep } from './step.js';
import {
  fileExists, isFunction, isAsyncFunction, deepMerge,
} from './utils.js';
import Translation from './translation.js';
import { MochaFactory } from './mochaFactory.js';
// eslint-disable-next-line import/no-named-as-default
import recorder from './recorder.js';
import * as event from './event.js';
import * as WorkerStorage from './workerStorage.js';
import { store } from './store.js';
import { actor } from './actor.js';

import ai from './ai.js';

let container = {
  helpers: {},
  support: {},
  plugins: {},
  mocha: {},
  translation: {},
};

/**
 * Dependency Injection Container
 */
export default class Container {
  /**
   * Create container with all required helpers and support objects
   *
   * @api
   * @param {*} config
   * @param {*} opts
   */
  static create(config, opts) {
    const mochaConfig = config.mocha || {};
    if (config.grep && !opts.grep) {
      mochaConfig.grep = config.grep;
    }
    this.createMocha = () => {
      container.mocha = MochaFactory.create(mochaConfig, opts || {});
    };
    this.createMocha();
    container.helpers = createHelpers(config.helpers || {});
    container.translation = loadTranslation(config.translation || null, config.vocabularies || []);
    container.support = createSupportObjects(config.include || {});
    container.plugins = createPlugins(config.plugins || {}, opts);
    if (opts && opts.ai) ai.enable(config.ai); // enable AI Assistant
    if (config.gherkin) loadGherkinSteps(config.gherkin.steps || []);
    if (opts && typeof opts.timeouts === 'boolean') store.timeouts = opts.timeouts;
  }

  /**
   * Get all plugins
   *
   * @api
   * @param {string} [name]
   * @returns { * }
   */
  static plugins(name) {
    return name ? container.plugins[name] : container.plugins;
  }

  /**
   * Get all support objects or get support object by name
   *
   * @api
   * @param {string} [name]
   * @returns { * }
   */
  static support(name) {
    if (!name) {
      return container.support;
    }
    return container.support[name];
  }

  /**
   * Get all helpers or get a helper by name
   *
   * @api
   * @param {string} [name]
   * @returns { * }
   */
  static helpers(name) {
    if (!name) {
      return container.helpers;
    }
    return container.helpers[name];
  }

  /**
   * Get translation
   *
   * @api
   */
  static translation() {
    return container.translation;
  }

  /**
   * Get Mocha instance
   *
   * @api
   * @returns { * }
   */
  static mocha() {
    return container.mocha;
  }

  /**
   * Append new services to container
   *
   * @api
   * @param {Object<string, *>} newContainer
   */
  static append(newContainer) {
    container = deepMerge(container, newContainer);
  }

  /**
   * Clear container
   *
   * @param {Object<string, *>} newHelpers
   * @param {Object<string, *>} newSupport
   * @param {Object<string, *>} newPlugins
   */
  static clear(newHelpers, newSupport, newPlugins) {
    container.helpers = newHelpers || {};
    container.support = newSupport || {};
    container.plugins = newPlugins || {};
    container.translation = loadTranslation();
  }

  /**
   * Share data across worker threads
   *
   * @param {Object} data
   * @param {Object} options - set {local: true} to not share among workers
   */
  static share(data, options = {}) {
    Container.append({ support: data });
    if (!options.local) {
      WorkerStorage.share(data);
    }
  }
}

function createHelpers(config) {
  const helpers = {};
  let moduleName;
  for (const helperName in config) {
    try {
      if (config[helperName].require) {
        if (config[helperName].require.startsWith('.')) {
          // @ts-ignore
          moduleName = path.resolve(global.codecept_dir, config[helperName].require); // custom helper
        } else {
          moduleName = config[helperName].require; // plugin helper
        }
      } else {
        moduleName = `./helper/${helperName}.js`; // built-in helper
      }

      // @ts-ignore
      let HelperClass;
      // check if the helper is the built-in, use the require() syntax.
      if (moduleName.startsWith('./helper/')) {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        HelperClass = importSync(path.resolve(__dirname, moduleName)).default;
      } else {
        // check if the new syntax export default HelperName is used and loads the Helper, otherwise loads the module that used old syntax export = HelperName.
        HelperClass = importSync(path.resolve(moduleName)).default;
      }

      if (HelperClass && HelperClass._checkRequirements) {
        const requirements = HelperClass._checkRequirements();
        if (requirements) {
          let install;
          if (importSync('./utils.js').installedLocally()) {
            install = `npm install --save-dev ${requirements.join(' ')}`;
          } else {
            console.log('WARNING: CodeceptJS is not installed locally. It is recommended to switch to local installation');
            install = `[sudo] npm install -g ${requirements.join(' ')}`;
          }
          throw new Error(`Required modules are not installed.\n\nRUN: ${install}`);
        }
      }
      helpers[helperName] = new HelperClass(config[helperName]);
    } catch (err) {
      throw new Error(`Could not load helper ${helperName} from module '${moduleName}':\n${err.message}\n${err.stack}`);
    }
  }

  for (const name in helpers) {
    if (helpers[name]._init) helpers[name]._init();
  }
  return helpers;
}

export function createSupportObjects(config) {
  const objects = {};

  for (const name in config) {
    objects[name] = {}; // placeholders
  }

  if (!config.I) {
    objects.I = actor();

    if (container.translation.I !== 'I') {
      objects[container.translation.I] = objects.I;
    }
  }

  container.support = objects;

  function lazyLoad(name) {
    let newObj = getSupportObject(config, name);
    try {
      if (typeof newObj === 'function') {
        newObj = newObj();
      } else if (newObj._init) {
        newObj._init();
      }
    } catch (err) {
      throw new Error(`Initialization failed for ${name}: ${newObj}\n${err.message}\n${err.stack}`);
    }
    return newObj;
  }

  const asyncWrapper = function (f) {
    return function () {
      return f.apply(this, arguments).catch((e) => {
        recorder.saveFirstAsyncError(e);
        throw e;
      });
    };
  };

  Object.keys(objects).forEach((object) => {
    const currentObject = objects[object];
    Object.keys(currentObject).forEach((method) => {
      const currentMethod = currentObject[method];
      if (currentMethod && currentMethod[Symbol.toStringTag] === 'AsyncFunction') {
        objects[object][method] = asyncWrapper(currentMethod);
      }
    });
  });

  return new Proxy({}, {
    has(target, key) {
      return key in config;
    },
    ownKeys() {
      return Reflect.ownKeys(config);
    },
    get(target, key) {
      // configured but not in support object, yet: load the module
      if (key in objects && !(key in target)) {
        // load default I
        if (key in objects && !(key in config)) {
          return target[key] = objects[key];
        }

        // load new object
        const object = lazyLoad(key);
        // check that object is a real object and not an array
        if (Object.prototype.toString.call(object) === '[object Object]') {
          return target[key] = Object.assign(objects[key], object);
        }
        target[key] = object;
      }
      return target[key];
    },
  });
}

function createPlugins(config, options = {}) {
  const plugins = {};

  const enabledPluginsByOptions = (options.plugins || '').split(',');
  for (const pluginName in config) {
    if (!config[pluginName]) config[pluginName] = {};
    if (!config[pluginName].enabled && (enabledPluginsByOptions.indexOf(pluginName) < 0)) {
      continue; // plugin is disabled
    }
    let module;
    try {
      if (config[pluginName].require) {
        module = config[pluginName].require;
        if (module.startsWith('.')) { // local
          // @ts-ignore
          module = path.resolve(global.codecept_dir, module); // custom plugin
        }
      } else {
        module = `./plugin/${pluginName}.js`;
      }
      plugins[pluginName] = importSync(module).default(config[pluginName]);
    } catch (err) {
      throw new Error(`Could not load plugin ${pluginName} from module '${module}':\n${err.message}\n${err.stack}`);
    }
  }
  return plugins;
}

function getSupportObject(config, name) {
  const module = config[name];
  if (typeof module === 'string') {
    return loadSupportObject(module, name);
  }
  return module;
}

export function loadGherkinSteps(paths) {
  // @ts-ignore
  global.Before = fn => event.dispatcher.on(event.test.started, fn);
  // @ts-ignore
  global.After = fn => event.dispatcher.on(event.test.finished, fn);
  global.Fail = fn => event.dispatcher.on(event.test.failed, fn);

  // If gherkin.steps is string, then this will iterate through that folder and send all step def js files to loadSupportObject
  // If gherkin.steps is Array, it will go the old way
  // This is done so that we need not enter all Step Definition files under config.gherkin.steps
  if (Array.isArray(paths)) {
    for (const path of paths) {
      loadSupportObject(path, `Step Definition from ${path}`);
    }
  } else {
    // @ts-ignore
    const folderPath = paths.startsWith('.') ? path.join(global.codecept_dir, paths) : '';
    if (folderPath !== '') {
      glob.sync(folderPath).forEach((file) => {
        loadSupportObject(file, `Step Definition from ${file}`);
      });
    }
  }

  // @ts-ignore
  delete global.Before;
  // @ts-ignore
  delete global.After;
  delete global.Fail;
}

function loadSupportObject(modulePath, supportObjectName) {
  if (modulePath.charAt(0) === '.') {
    // @ts-ignore
    modulePath = path.join(global.codecept_dir, modulePath);
  }
  try {
    const obj = importSync(modulePath).default || importSync(modulePath);

    if (typeof obj === 'function') {
      const fobj = obj();

      if (fobj.constructor.name === 'Actor') {
        const methods = getObjectMethods(fobj);
        Object.keys(methods)
          .forEach(key => {
            fobj[key] = methods[key];
          });

        return methods;
      }
    }
    if (typeof obj !== 'function'
      && Object.getPrototypeOf(obj) !== Object.prototype
      && !Array.isArray(obj)
    ) {
      const methods = getObjectMethods(obj);
      Object.keys(methods)
        .filter(key => !key.startsWith('_'))
        .forEach(key => {
          const currentMethod = methods[key];
          if (isFunction(currentMethod) || isAsyncFunction(currentMethod)) {
            const ms = new MetaStep(supportObjectName, key);
            ms.setContext(methods);
            methods[key] = ms.run.bind(ms, currentMethod);
          }
        });
      return methods;
    }
    if (!Array.isArray(obj)) {
      Object.keys(obj)
        .filter(key => !key.startsWith('_'))
        .forEach(key => {
          const currentMethod = obj[key];
          if (isFunction(currentMethod) || isAsyncFunction(currentMethod)) {
            const ms = new MetaStep(supportObjectName, key);
            ms.setContext(obj);
            obj[key] = ms.run.bind(ms, currentMethod);
          }
        });
    }

    return obj;
  } catch (err) {
    throw new Error(`Could not include object ${supportObjectName} from module '${modulePath}'\n${err.message}\n${err.stack}`);
  }
}

/**
 * Method collect own property and prototype
 */
function getObjectMethods(obj) {
  const methodsSet = new Set();
  let protoObj = Reflect.getPrototypeOf(obj);
  do {
    if (protoObj?.constructor.prototype !== Object.prototype) {
      const keys = Reflect.ownKeys(protoObj);
      keys.forEach(k => methodsSet.add(k));
    }
  } while (protoObj = Reflect.getPrototypeOf(protoObj));
  Reflect.ownKeys(obj).forEach(k => methodsSet.add(k));
  const methods = {};
  for (const key of methodsSet.keys()) {
    if (key !== 'constructor') methods[key] = obj[key];
  }
  return methods;
}

function loadTranslation(locale, vocabularies) {
  if (!locale) {
    return Translation.createEmpty();
  }

  let translation;
  locale = locale.replace('-', '_');

  // check if it is a known translation
  if (Translation.langs[locale]) {
    translation = new Translation(Translation.langs[locale]);
  } else { // @ts-ignore
    translation = Translation.createDefault();
    // @ts-ignore
    if (fileExists(path.join(global.codecept_dir, locale))) {
      // get from a provided file instead
      translation.loadVocabulary(locale);
    }
  }

  vocabularies.forEach(v => translation.loadVocabulary(v));

  return translation;
}
