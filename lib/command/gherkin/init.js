const path = require('path');
const mkdirp = require('mkdirp');

const output = require('../../output');
const { fileExists } = require('../../utils');
const {
  getConfig, getTestRoot, updateConfig, safeFileWrite,
} = require('../utils');

const featureFile = `Feature: Business rules
  In order to achieve my goals
  As a persona
  I want to be able to interact with a system

  Scenario: do something
    Given I have a defined step
`;

const stepsFile = `const { I } = inject();
// Add in your custom step files

Given('I have a defined step', () => {
  // TODO: replace with your own step
});
`;

module.exports = function (genPath) {
  const testsPath = getTestRoot(genPath);
  const config = getConfig(testsPath);

  output.print('Initializing Gherkin (Cucumber BDD) for CodeceptJS');
  output.print('--------------------------');

  if (config.gherkin && config.gherkin.steps) {
    output.error('Gherkin is already initialized in this project. See `gherkin` section in the config');
    process.exit(1);
  }

  let dir;
  dir = path.join(testsPath, 'features');
  if (!fileExists(dir)) {
    mkdirp.sync(dir);
    output.success(`Created ${dir}, place your *.feature files in it`);
  }

  if (safeFileWrite(path.join(dir, 'basic.feature'), featureFile)) {
    output.success('Created sample feature file: features/basic.feature');
  }

  dir = path.join(testsPath, 'step_definitions');
  if (!fileExists(dir)) {
    mkdirp.sync(dir);
    output.success(`Created ${dir}, place step definitions into it`);
  }

  if (safeFileWrite(path.join(dir, 'steps.js'), stepsFile)) {
    output.success('Created sample steps file: step_definitions/steps.js');
  }

  config.gherkin = {
    features: './features/*.feature',
    steps: [
      './step_definitions/steps.js',
    ],
  };

  updateConfig(testsPath, config);

  output.success('Gherkin setup is done.');
  output.success('Start writing feature files and implement corresponding steps.');
};
