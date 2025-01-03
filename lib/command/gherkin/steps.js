const { getConfig, getTestRoot } = require('../utils');
const Codecept = require('../../codecept');
const output = require('../../output');
const { getSteps } = require('../../mocha/bdd');

module.exports = function (genPath, options) {
  const configFile = options.config || genPath;
  const testsPath = getTestRoot(configFile);
  const config = getConfig(configFile);
  if (!config) return;

  const codecept = new Codecept(config, {});
  codecept.init(testsPath);

  output.print('Gherkin Step Definitions:');
  output.print();
  const steps = getSteps();
  for (const step of Object.keys(steps)) {
    output.print(`  ${output.colors.bold(step)} ${output.colors.green(steps[step].line || '')}`);
  }
  output.print();
  if (!Object.keys(steps).length) {
    output.error('No Gherkin steps defined');
  }
};
