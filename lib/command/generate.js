'use strict';
let output = require("../output");
let inquirer = require("inquirer");
let fs = require('fs');
let path = require('path');
let colors = require('colors');
let fileExists = require('../utils').fileExists;
let ucfirst = require('../utils').ucfirst;
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;

function updateConfig(testsPath, config) {
  let configFile = path.join(testsPath, 'codecept.json');
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

let testTemplate = `
Feature('{{feature}}');

Scenario('test something', (I) => {

});
`;

// generates empty test
module.exports.test = function (genPath) {
  let testsPath = getTestRoot(genPath);
  let config = getConfig(testsPath);
  if (!config) return;

  output.print(`Creating a new test...`);
  output.print('----------------------');

  let defaultExt = config.tests.match(/\*(.*?)$/)[1] || '_test.js';

  inquirer.prompt([
    {
      type: 'input',
      message: 'Filename of a test',
      name: 'filename'
    },
    {
      type: 'input',
      name: 'feature',
      message: 'Feature which is being tested',
      default: function (answers) {
        return ucfirst(answers.filename).replace('_', ' ').replace('-', ' ');
      }
    }
  ], (result) => {
    let testFilePath = path.dirname(path.join(testsPath, config.tests));
    let testFile = path.join(testFilePath, result.filename);
    let ext = path.extname(testFile);
    if (!ext) testFile += defaultExt;
    let dir = path.dirname(testFile);
    if (!fileExists(dir)) fs.mkdirSync(dir);

    let testContent = testTemplate.replace('{{feature}}', result.feature);
    if (!safeFileWrite(testFile, testContent)) return;
    output.success(`Test for ${result.filename} was created in ${testFile}`);
  });
};

let pageObjectTemplate = `
'use strict';

let I;

module.exports = {

  _init() {
    I = require('{{actor}}')();
  }

  // insert your locators and methods here
}
`;

module.exports.pageObject = function (genPath, opts) {
  let testsPath = getTestRoot(genPath);
  let config = getConfig(testsPath);
  let kind = opts.kind || 'page';
  if (!config) return;

  output.print(`Creating a new page object`);
  output.print('--------------------------');

  inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: `Name of a ${kind} object`
  }, {
    type: 'input',
    name: 'filename',
    message: 'Where should it be stored',
    default: (answers) => {
      return `./${kind}s/${answers.name}.js`;
    }
  }], (result) => {
    let pageObjectFile = path.join(testsPath, result.filename);
    let dir = path.dirname(pageObjectFile);
    if (!fileExists(dir)) fs.mkdirSync(dir);

    let actor = config.include.I || 'codeceptjs/actor';
    if (actor.charAt(0) === '.') { // relative path
      let relativePath = path.relative(dir, path.dirname(path.join(testsPath, config.include.I))); // get an upper level
      actor = relativePath + actor.substring(1);
    }
    if (!safeFileWrite(pageObjectFile, pageObjectTemplate.replace('{{actor}}', actor))) return;
    config.include[result.name] = result.filename;
    updateConfig(testsPath, config);
    output.success(`Page object for ${result.name} was created in ${pageObjectFile}`);
  });
};

let helperTemplate = `
'use strict';
let Helper = require('codeceptjs/helper');

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
  let testsPath = getTestRoot(genPath);
  let config = getConfig(testsPath);

  output.print(`Creating a new helper`);
  output.print('--------------------------');

  inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: `Name of a Helper`
  }, {
    type: 'input',
    name: 'filename',
    message: 'Where should it be stored',
    default: (answers) => {
      return `./${answers.name.toLowerCase()}_helper.js`;
    }
  }], (result) => {
    let name = ucfirst(result.name);
    let helperFile = path.join(testsPath, result.filename);
    let dir = path.dirname(helperFile);
    if (!fileExists(dir)) fs.mkdirSync(dir);

    if (!safeFileWrite(helperFile, helperTemplate.replace(/{{name}}/g, name))) return;
    config.helpers[name] = {
      require: result.filename
    };
    updateConfig(testsPath, config);
    output.success(`Helper for ${name} was created in ${helperFile}`);
  });

};
