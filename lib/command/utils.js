import fs from 'fs';
import path from 'path';
import util from 'util';
import mkdirp from 'mkdirp';
import output from '../output.js';
import { fileExists, beautify } from '../utils.js';

// alias to deep merge
import { deepMerge } from "../utils.js";

export const getConfig = function (configFile) {
  try {
    return require('../config').load(configFile);
  } catch (err) {
    fail(err.stack);
  }
};

export const readConfig = function (configFile) {
  try {
    const data = fs.readFileSync(configFile, 'utf8');
    return data;
  } catch (err) {
    output.error(err);
  }
};

function getTestRoot(currentPath) {
  if (!currentPath) currentPath = '.';
  if (!path.isAbsolute(currentPath)) currentPath = path.join(process.cwd(), currentPath);
  currentPath = fs.lstatSync(currentPath).isDirectory() || !path.extname(currentPath) ? currentPath : path.dirname(currentPath);
  return currentPath;
}
export { getTestRoot };

function fail(msg) {
  output.error(msg);
  process.exit(1);
}

export { fail };

function updateConfig(testsPath, config, key, extension = 'js') {
  const configFile = path.join(testsPath, `codecept.conf.${extension}`);
  if (!fileExists(configFile)) {
    console.log();
    const msg = `codecept.conf.${extension} config can\'t be updated automatically`;
    console.log(`${output.colors.bold.red(msg)}`);
    console.log('Please update it manually:');
    console.log();
    console.log(`${key}: ${config[key]}`);
    console.log();
    return;
  }
  console.log(`${output.colors.yellow('Updating configuration file...')}`);
  return fs.writeFileSync(configFile, beautify(`exports.config = ${util.inspect(config, false, 4, false)}`), 'utf-8');
}

export { updateConfig };

function safeFileWrite(file, contents) {
  if (fileExists(file)) {
    output.error(`File ${file} already exist, skipping...`);
    return false;
  }
  fs.writeFileSync(file, contents);
  return true;
}

export { safeFileWrite };

export const captureStream = (stream) => {
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

export const printError = (err) => {
  output.print('');
  output.error(err.message);
  output.print('');
  output.print(output.colors.grey(err.stack.replace(err.message, '')));
};

export const createOutputDir = (config, testRoot) => {
  let outputDir;
  if (path.isAbsolute(config.output)) outputDir = config.output;
  else outputDir = path.join(testRoot, config.output);

  if (!fileExists(outputDir)) {
    output.print(`creating output directory: ${outputDir}`);
    mkdirp.sync(outputDir);
  }
};
