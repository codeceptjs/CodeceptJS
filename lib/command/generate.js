const output = require('../output');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const colors = require('chalk');
const fileExists = require('../utils').fileExists;
const ucfirst = require('../utils').ucfirst;
const lcfirst = require('../utils').lcfirst;
const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const mkdirp = require('mkdirp');

function updateConfig(testsPath, config) {
  const configFile = path.join(testsPath, 'codecept.json');
  if (!fileExists(configFile)) {
    console.log();
    console.log(`${colors.bold.red('codecept.conf.js config can\'t be updated automatically')}`);
    console.log('Please add generated object to "include" section of a config file');
    console.log();
    return;
  }
  console.log(`${colors.yellow('Updating configuration file...')}`);
  return fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

function safeFileWrite(file, contents) {
  if (fileExists(file)) {
    output.error(`File ${file} already exist, skipping...`);
    return false;
  }
  fs.writeFileSync(file, contents);
  return true;
}

const testTemplate = `
Feature('{{feature}}');

Scenario('test something', ({{actor}}) => {

});
`;

// generates empty test
module.exports.test = function (genPath) {
  const testsPath = getTestRoot(genPath);
  const config = getConfig(testsPath);
  if (!config) return;

  output.print('Creating a new test...');
  output.print('----------------------');

  const defaultExt = config.tests.match(/\*(.*?)$/[1])[0] || '_test.js';

  inquirer.prompt([
    {
      type: 'input',
      message: 'Filename of a test',
      name: 'filename',
    },
    {
      type: 'input',
      name: 'feature',
      message: 'Feature which is being tested',
      default(answers) {
        return ucfirst(answers.filename).replace('_', ' ').replace('-', ' ');
      },
    },
  ], (result) => {
    const testFilePath = path.dirname(path.join(testsPath, config.tests)).replace(/\*\*$/, '');
    let testFile = path.join(testFilePath, result.filename);
    const ext = path.extname(testFile);
    if (!ext) testFile += defaultExt;
    const dir = path.dirname(testFile);
    if (!fileExists(dir)) mkdirp.sync(dir);
    let testContent = testTemplate.replace('{{feature}}', result.feature);

    // can be confusing before translations are documented
    // commenting it out:

    // let container = require('../container');
    // container.create(config);
    // testContent = testContent.replace('{{actor}}', container.translation().I);
    testContent = testContent.replace('{{actor}}', 'I');

    if (!safeFileWrite(testFile, testContent)) return;
    output.success(`Test for ${result.filename} was created in ${testFile}`);
  });
};

const pageObjectTemplate = `
'use strict';

let I;

module.exports = {

  _init() {
    I = {{actor}}();
  }

  // insert your locators and methods here
}
`;

module.exports.pageObject = function (genPath, opts) {
  const testsPath = getTestRoot(genPath);
  const config = getConfig(testsPath);
  const kind = opts.T || 'page';
  if (!config) return;

  output.print(`Creating a new ${kind} object`);
  output.print('--------------------------');

  inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: `Name of a ${kind} object`,
  }, {
    type: 'input',
    name: 'filename',
    message: 'Where should it be stored',
    default: answers => `./${kind}s/${answers.name}.js`,
  }], (result) => {
    const pageObjectFile = path.join(testsPath, result.filename);
    const dir = path.dirname(pageObjectFile);
    if (!fileExists(dir)) fs.mkdirSync(dir);

    let actor = 'actor';
    if (config.include.I) {
      let actorPath = config.include.I;
      if (actorPath.charAt(0) === '.') { // relative path
        actorPath = path.relative(dir, path.dirname(path.join(testsPath, actorPath))) + actorPath.substring(1); // get an upper level
      }
      actor = `require('${actorPath}')`;
    }
    if (!safeFileWrite(pageObjectFile, pageObjectTemplate.replace('{{actor}}', actor))) return;
    const name = lcfirst(result.name) + ucfirst(kind);
    config.include[name] = result.filename;
    updateConfig(testsPath, config);
    output.success(`${ucfirst(kind)} object for ${result.name} was created in ${pageObjectFile}`);
    output.print(`Use ${output.colors.bold(name)} as parameter in test scenarios to access it`);
  });
};

const helperTemplate = `
'use strict';

class {{name}} extends Helper {

  // before/after hooks
  _before() {
    // remove if not used
  }

  _after() {
    // remove if not used
  }

  // add custom methods here
  // If you need to access other helpers
  // use: this.helpers['helperName']

}

module.exports = {{name}};
`;

module.exports.helper = function (genPath) {
  const testsPath = getTestRoot(genPath);
  const config = getConfig(testsPath);

  output.print('Creating a new helper');
  output.print('--------------------------');

  inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: 'Name of a Helper',
  }, {
    type: 'input',
    name: 'filename',
    message: 'Where should it be stored',
    default: answers => `./${answers.name.toLowerCase()}_helper.js`,
  }], (result) => {
    const name = ucfirst(result.name);
    const helperFile = path.join(testsPath, result.filename);
    const dir = path.dirname(helperFile);
    if (!fileExists(dir)) fs.mkdirSync(dir);

    if (!safeFileWrite(helperFile, helperTemplate.replace(/{{name}}/g, name))) return;
    config.helpers[name] = {
      require: result.filename,
    };
    updateConfig(testsPath, config);
    output.success(`Helper for ${name} was created in ${helperFile}`);
  });
};
