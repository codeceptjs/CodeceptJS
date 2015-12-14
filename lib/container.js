'use strict';
let path = require('path');
let colors = require('colors');

function createHelpers(config) {
  let helpers = {};
  let helperModule;
  for (let helperName in config) {
    try {
      module = config[helperName].require
        ? path.join(global.codecept_dir, config[helperName].require) // custom helper
        : './helper/' + helperName; // built-in helper
      let HelperClass = require(module);
      helpers[helperName] = new HelperClass(config[helperName]);
    } catch (err) {
      throw new Error(`Could not load helper ${helperName} from module '${module}'\n     Error: ${colors.bold(err.message)}\n`);
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
  }

  return objects;
}

let helpers = {};
let support = {};

module.exports = {

  create: (config) => {
    helpers = createHelpers(config.helpers || {});
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

  clear: (newHelpers, newSupport) => {
    helpers = newHelpers || {};
    support = newSupport || {};
  }

};