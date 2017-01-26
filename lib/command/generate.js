'use strict';
let output = require("../output");
let inquirer = require("inquirer");
let fs = require('fs');
let path = require('path');
let colors = require('chalk');
let fileExists = require('../utils').fileExists;
let ucfirst = require('../utils').ucfirst;
let lcfirst = require('../utils').lcfirst;
let getConfig = require('./utils').getConfig;
let getTestRoot = require('./utils').getTestRoot;
let mkdirp = require('mkdirp');

function updateConfig(testsPath, config) {
  let configFile = path.join(testsPath, 'codecept.json');
  if (!fileExists(configFile)) {
    console.log();
    console.log(`${colors.bold.red(`codecept.conf.js config can't be updated automatically`)}`);
    console.log(`Please add generated object to "include" section of a config file`);
    console.log();
    return;
  }
  console.log(`${colors.yellow(`Updating configuration file...`)}`);
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

Scenario('test something', ({{actor}}) => {

});
`;

// generates empty test
module.exports.test = function (genPath) {
  let testsPath = getTestRoot(genPath);
  let config = getConfig(testsPath);
  if (!config) return;

  output.print(`Creating a new test...`);
  output.print('----------------------');

  let defaultExt = config.tests.match(/\*(.*?)$/[1])[0] || '_test.js';

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
    let testFilePath = path.dirname(path.join(testsPath, config.tests)).replace(/\*\*$/, '');
    let testFile = path.join(testFilePath, result.filename);
    let ext = path.extname(testFile);
    if (!ext) testFile += defaultExt;
    let dir = path.dirname(testFile);
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

let pageObjectTemplate = `
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
  let testsPath = getTestRoot(genPath);
  let config = getConfig(testsPath);
  let kind = opts.T || 'page';
  if (!config) return;

  output.print(`Creating a new ${kind} object`);
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

    let actor = 'actor';
    if (config.include.I) {
      let actorPath = config.include.I;
      if (actorPath.charAt(0) === '.') { // relative path
        actorPath = path.relative(dir, path.dirname(path.join(testsPath, actorPath))) + actorPath.substring(1); // get an upper level
      }
      actor = `require('${actorPath}')`;
    }
    if (!safeFileWrite(pageObjectFile, pageObjectTemplate.replace('{{actor}}', actor))) return;
    let name = lcfirst(result.name) + ucfirst(kind);
    config.include[name] = result.filename;
    updateConfig(testsPath, config);
    output.success(ucfirst(kind) + ` object for ${result.name} was created in ${pageObjectFile}`);
    output.print(`Use ${output.colors.bold(name)} as parameter in test scenarios to access it`);
  });
};

let helperTemplate = `
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
