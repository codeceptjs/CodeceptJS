import { getConfig, getTestRoot } from './utils.js';
import { printError, createOutputDir } from './utils.js';
import Config from '../config.js';
import Codecept from '../rerun';

export default async function (test, options) {
  // registering options globally to use in config
  // Backward compatibility for --profile
  process.profile = options.profile;
  process.env.profile = options.profile;
  const configFile = options.config;

  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }
  const testRoot = getTestRoot(configFile);
  createOutputDir(config, testRoot);

  function processError(err) {
    printError(err);
    process.exit(1);
  }
  const codecept = new Codecept(config, options);

  try {
    codecept.init(testRoot);

    await codecept.bootstrap();
    codecept.loadTests(test);
    await codecept.run();
  } catch (err) {
    printError(err);
    process.exitCode = 1;
  } finally {
    await codecept.teardown();
  }
}
