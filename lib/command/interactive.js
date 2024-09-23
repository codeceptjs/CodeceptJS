import { getConfig, getTestRoot } from './utils.js';
import recorder from '../recorder.js';
import Codecept from '../codecept.js';
import Container from '../container.js';
import * as event from '../event.js';
import * as output from '../output.js';
import webHelpers from '../plugin/standardActingHelpers.js';

export default async function (path, options) {
  // Backward compatibility for --profile
  process.profile = options.profile;
  process.env.profile = options.profile;
  const configFile = options.config;

  const config = getConfig(configFile);
  const testsPath = getTestRoot(configFile);

  const codecept = new Codecept(config, options);
  codecept.init(testsPath);

  try {
    await codecept.bootstrap();

    if (options.verbose) output.level(3);

    output.print('Starting interactive shell for current suite...');
    recorder.start();
    event.emit(event.suite.before, {
      fullTitle: () => 'Interactive Shell',
      tests: [],
    });
    event.emit(event.test.before, {
      title: '',
      artifacts: {},
    });

    const enabledHelpers = Container.helpers();
    for (const helperName of Object.keys(enabledHelpers)) {
      if (webHelpers.includes(helperName)) {
        const I = enabledHelpers[helperName];
        recorder.add(() => I.amOnPage('/'));
        recorder.catchWithoutStop(e => output.print(`Error while loading home page: ${e.message}}`));
        break;
      }
    }
    require('../pause')();
    // recorder.catchWithoutStop((err) => console.log(err.stack));
    recorder.add(() => event.emit(event.test.after, {}));
    recorder.add(() => event.emit(event.suite.after, {}));
    recorder.add(() => event.emit(event.all.result, {}));
    recorder.add(() => codecept.teardown());
  } catch (err) {
    output.output.error(`Error while running bootstrap file :${err}`);
  }
}
