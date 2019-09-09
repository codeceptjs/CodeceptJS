const fs = require('fs');
const path = require('path');
const output = require('../output');
const { fileExists, beautify } = require('../utils');
const util = require('util');
const semver = require('semver');

// alias to deep merge
module.exports.deepMerge = require('../utils').deepMerge;

module.exports.getConfig = function (configFile) {
  try {
    return require('../config').load(configFile);
  } catch (err) {
    fail(err.stack);
  }
};

function getTestRoot(currentPath) {
  if (!currentPath) currentPath = '.';
  if (!path.isAbsolute(currentPath)) currentPath = path.join(process.cwd(), currentPath);
  currentPath = fs.lstatSync(currentPath).isDirectory() || !path.extname(currentPath) ? currentPath : path.dirname(currentPath);
  return currentPath;
}
module.exports.getTestRoot = getTestRoot;

function fail(msg) {
  output.error(msg);
  process.exit(1);
}

module.exports.fail = fail;

function updateConfig(testsPath, config, key) {
  const configFile = path.join(testsPath, 'codecept.conf.js');
  if (!fileExists(configFile)) {
    console.log();
    console.log(`${output.colors.bold.red('codecept.conf.js config can\'t be updated automatically')}`);
    console.log('Please update it manually:');
    console.log();
    console.log(`${key}: ${config[key]}`);
    console.log();
    return;
  }
  console.log(`${output.colors.yellow('Updating configuration file...')}`);
  return fs.writeFileSync(configFile, beautify(`exports.config = ${util.inspect(config, false, 4, false)}`), 'utf-8');
}

module.exports.updateConfig = updateConfig;

function safeFileWrite(file, contents) {
  if (fileExists(file)) {
    output.error(`File ${file} already exist, skipping...`);
    return false;
  }
  fs.writeFileSync(file, contents);
  return true;
}

module.exports.safeFileWrite = safeFileWrite;

module.exports.satisfyNodeVersion = (
  version,
  failureMessage = `Required Node version: ${version}`,
) => {
  if (!semver.satisfies(process.version, version)) {
    fail(failureMessage);
  }
};

module.exports.captureStream = (stream) => {
  let oldStream;
  let buffer = '';

  return {
    startCapture() {
      buffer = '';
      oldStream = stream.write.bind(stream);
      stream.write = chunk => (buffer += chunk);
    },
    stopCapture() {
      if (oldStream !== undefined) stream.write = oldStream;
    },
    getData: () => buffer,
  };
};
