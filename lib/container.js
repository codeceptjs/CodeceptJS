'use strict';
let path = require('path');
let fileExists = require('./utils').fileExists;
let Translation = require('./translation');

let container = {
  helpers: {},
  support: {},
  translation: {}
};

module.exports = {

  create: (config) => {
    container.helpers = createHelpers(config.helpers || {});
    container.translation = loadTranslation(config.translation || null);
    container.support = createSupportObjects(config.include || {});
  },

  support: (name) => {
    if (!name) {
      return container.support;
    }
    return container.support[name];
  },

  helpers: (name) => {
    if (!name) {
      return container.helpers;
    }
    return container.helpers[name];
  },

  translation: () => {
    return container.translation;
  },

  append: (newContainer) => {
    this.container = Object.assign(this.container, newContainer);
  },

  clear: (newHelpers, newSupport) => {
    container.helpers = newHelpers || {};
    container.support = newSupport || {};
    container.translation = loadTranslation();
  }
};

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
            install = "npm install --save-dev " + requirements.join(' ');
          } else {
            install = "[sudo] npm install -g " + requirements.join(' ');
          }
          throw new Error("Required modules are not installed.\n\nRUN: " + install);
        }
      }
      helpers[helperName] = new HelperClass(config[helperName]);
    } catch (err) {
      throw new Error(`Could not load helper ${helperName} from module '${module}':\n${err.message}\n${JSON.stringify(err)}`);
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
      if (typeof objects[name] === 'function') {
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

    if (container.translation.I != 'I') {
      objects[container.translation.I] = objects.I;
    }
  }

  return objects;
}

function loadTranslation(translation) {
  if (!translation) {
    return new Translation({
      I: 'I',
      actions: {}
    }, false);
  }

  let vocabulary;
  // check if it is a known translation
  if (require('../translations')[translation]) {
    vocabulary = require('../translations')[translation];
    return new Translation(vocabulary);
  } else if (fileExists(path.join(global.codecept_dir, translation))) {
    // get from a provided file instead
    vocabulary = require(path.join(global.codecept_dir, translation));
  } else {
    throw new Error(`Translation option is set in config, but ${translation} is not a translated locale or filename`);
  }

  return new Translation(vocabulary);
}
