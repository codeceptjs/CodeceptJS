import { getConfig, getTestRoot } from './utils.js';
import Codecept from '../codecept.js';
import container from '../container.js';
import { getParamsToString } from '../parser.js';
import { methodsOfObject } from '../utils.js';
import output from '../output.js';

export default function (path) {
  const testsPath = getTestRoot(path);
  const config = getConfig(testsPath);
  const codecept = new Codecept(config, {});
  codecept.init(testsPath);

  output.print('List of test actions: -- ');
  const helpers = container.helpers();
  const supportI = container.support('I');
  const actions = [];
  for (const name in helpers) {
    const helper = helpers[name];
    methodsOfObject(helper).forEach((action) => {
      const params = getParamsToString(helper[action]);
      actions[action] = 1;
      output.print(` ${output.colors.grey(name)} I.${output.colors.bold(action)}(${params})`);
    });
  }
  for (const name in supportI) {
    if (actions[name]) {
      continue;
    }
    const actor = supportI[name];
    const params = getParamsToString(actor);
    output.print(` I.${output.colors.bold(name)}(${params})`);
  }
  output.print('PS: Actions are retrieved from enabled helpers. ');
  output.print('Implement custom actions in your helper classes.');
}
