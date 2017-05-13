'use strict';
const fs = require('fs');
const path = require('path');
const output = require('../output');

// alias to deep merge
module.exports.deepMerge = require('../utils').deepMerge;
module.exports.getConfig = function (configFile) {
  try {
    return require('../config').load(configFile);
  } catch (err) {
    fail(err.message);
  }
};

function getTestRoot(currentPath) {
  if (!currentPath) currentPath = '.';
  if (!path.isAbsolute(currentPath)) currentPath = path.join(process.cwd(), currentPath);
  return currentPath = !path.extname(currentPath) ? currentPath : path.dirname(currentPath);
}
module.exports.getTestRoot = getTestRoot;

function fail(msg) {
  output.error(msg);
  process.exit(1);
}

module.exports.fail = fail;
