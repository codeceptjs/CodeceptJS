'use strict';
let path = require('path');
let colors = require('colors');
let fileExists = require('./utils').fileExists;

function createHelpers(config) {
  let helpers = {};
  let helperModule;
  for (let helperName in config) {
    try {
      module = config[helperName].require
        ? path.resolve(global.codecept_dir, config[helperName].require) // custom helper
        : './helper/' + helperName; // built-in helper
      let HelperClass = require(module);
      if (HelperClass._checkRequirements) {
        let requirements = HelperClass._checkRequirements();
        if (requirements) {
          let install;
          if (require('./utils').installedLocally()) {
            install = "npm install --save-dev "+requirements.join(' ');
          } else {
            install = "[sudo] npm install -g "+requirements.join(' ');
          }
          throw new Error("Required modules are not installed.\n\nRUN: "+install);
        }
      }
      helpers[helperName] = new HelperClass(config[helperName]);
    } catch (err) {
      throw new Error(`Could not load helper ${helperName} from module '${module}':\n${err.message}`);
    }
  }

  for (let name in helpers) {
    if (helpers[name]._init) helpers[name]._init();
  }
  return helpers;
}

function createSupportObjects(config) {
  let objects = {};
  for (let name in config) {
    let module = config[name];
    if (module.charAt(0) === '.') {
      module = path.join(global.codecept_dir, module);
    }
    try {
      objects[name] = require(module);
    } catch (err) {
      throw new Error(`Could not include object ${name} from module '${module}'\n${err.message}`);
    }
    try {
      if (typeof(objects[name]) === 'function') {
        objects[name] = objects[name]();
      } else if (objects[name]._init) {
        objects[name]._init();
      }
    } catch (err) {
      throw new Error(`Initialization failed for ${objects[name]}\n${err.message}`);
    }
  }
  if (!objects.I) {
    objects.I = require('./actor')();

    if (translations.I != 'I') {
      objects[translations.I] = objects.I;
    }
  }

  return objects;
}

function loadTranslations(config) {
  var translationsObj = {
    I: 'I',
    actions: {}
  };
  if (config.translations && fileExists(path.join(global.codecept_dir, config.translations))) {
      translationsObj =  require(path.join(global.codecept_dir, config.translations));
  }
  translationsObj.actionAliasFor = (actualActionName) => {
    if (translationsObj.actions && translationsObj.actions && translationsObj.actions[actualActionName]){
      return translationsObj.actions[actualActionName];
    } else {
      return actualActionName;
    }
  };
  return translationsObj;
}

let helpers = {};
let support = {};
let translations = {};

module.exports = {

  create: (config) => {
    helpers = createHelpers(config.helpers || {});
    translations = loadTranslations(config);
    support = createSupportObjects(config.include || {});
  },

  support: (name) => {
    if (!name) {
      return support;
    }
    return support[name];
  },

  helpers: (name) => {
    if (!name) {
      return helpers;
    }

    return helpers[name];
  },

  getTranslations: () => {
    return translations;
  },

  clear: (newHelpers, newSupport) => {
    helpers = newHelpers || {};
    support = newSupport || {};
  }

};
