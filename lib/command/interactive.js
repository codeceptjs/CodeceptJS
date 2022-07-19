const { getConfig, getTestRoot } = require('./utils');
const recorder = require('../recorder');
const Codecept = require('../codecept');
const event = require('../event');
const output = require('../output');

module.exports = async function (path, options) {
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
    });
    require('../pause')();
    recorder.add(() => event.emit(event.test.after));
    recorder.add(() => event.emit(event.suite.after, {}));
    recorder.add(() => event.emit(event.all.result, {}));
    recorder.add(() => codecept.teardown());
  } catch (err) {
    output.error(`Error while running bootstrap file :${err}`);
  }
};
