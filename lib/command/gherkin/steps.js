const { getConfig } = require('../utils');
const { getTestRoot } = require('../utils');
const Codecept = require('../../codecept');
const output = require('../../output');
const { getSteps } = require('../../interfaces/bdd');

module.exports = function (genPath, options) {
  const configFile = options.config || genPath;
  const testsPath = getTestRoot(configFile);
  const config = getConfig(configFile);
  if (!config) return;

  const codecept = new Codecept(config, {});
  codecept.init(testsPath);

  output.print('Gherkin Step definitions:');
  output.print();
  const steps = getSteps();
  for (const step of Object.keys(steps)) {
    output.print(`  ${output.colors.bold(step)} \n    => ${output.colors.green(steps[step].line || '')}`);
  }
  output.print();
  if (!Object.keys(steps).length) {
    output.error('No Gherkin steps defined');
  }
};
