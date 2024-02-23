import { getConfig, getTestRoot } from '../utils.js';
import Codecept from '../../codecept.js';
import * as output from '../../output.js';
import { getSteps } from '../../interfaces/bdd.js';

export default function (genPath, options) {
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
    output.print(`  ${output.output.colors.bold(step)} ${output.output.colors.green(steps[step].line || '')}`);
  }
  output.print();
  if (!Object.keys(steps).length) {
    output.output.error('No Gherkin steps defined');
  }
}
