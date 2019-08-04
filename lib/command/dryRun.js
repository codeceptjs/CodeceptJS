const getConfig = require('./utils').getConfig;
const getTestRoot = require('./utils').getTestRoot;
const Config = require('../config');
const Codecept = require('../codecept');
const output = require('../output');
const event = require('../event');
const store = require('../store');

module.exports = function (test, options) {
  // registering options globally to use in config
  const configFile = options.config;
  let codecept;
  let outputDir;

  const testRoot = getTestRoot(configFile);
  let config = getConfig(configFile);
  if (options.override) {
    config = Config.append(JSON.parse(options.override));
  }

  config.plugins = {}; // disable all plugins

  try {
    codecept = new Codecept(config, options);
    codecept.init(testRoot);
    codecept.loadTests();
    store.dryRun = true;
    codecept.run(test);
  } catch (err) {
    process.exit(0);
  }
  event.dispatcher.on(event.all.result, () => {
    output.print();
    output.print('--- Tests finished in DRY mode ---');
  });
};
