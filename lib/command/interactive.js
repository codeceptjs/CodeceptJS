const { getConfig, getTestRoot } = require('./utils');
const recorder = require('../recorder');
const Codecept = require('../codecept');
const event = require('../event');
const output = require('../output');

module.exports = function (path, options) {
  // Backward compatibility for --profile
  process.profile = options.profile;
  process.env.profile = options.profile;

  const testsPath = getTestRoot(path);
  const config = getConfig(testsPath);
  const codecept = new Codecept(config, options);
  codecept.init(testsPath);

  codecept.runBootstrap((err) => {
    if (err) {
      output.error(`Error while running bootstrap file :${err}`);
      return;
    }

    if (options.verbose) output.level(3);

    output.print('String interactive shell for current suite...');
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
  });
};
