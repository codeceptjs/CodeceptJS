const event = require('../event');

module.exports = function () {
  let failedTests = [];
  let failedTestName = [];
  let passedTest = [];
  const FailedTestRerun = require('./../rerunFailed');
  const failedTestRerun = new FailedTestRerun();

  event.dispatcher.on(event.test.failed, (testOrSuite) => {
    // NOTE When an error happens in one of the hooks (BeforeAll/BeforeEach...) the event object
    // is a suite and not a test
    const id = testOrSuite.id || (testOrSuite.ctx && testOrSuite.ctx.test.id) || 'empty';
    const name = testOrSuite.file;
    failedTests.push(id);
    failedTestName.push(name);
  });

  // if test was successful after retries
  event.dispatcher.on(event.test.passed, (testOrSuite) => {
    // NOTE When an error happens in one of the hooks (BeforeAll/BeforeEach...) the event object
    // is a suite and not a test
    const id = testOrSuite.id || (testOrSuite.ctx && testOrSuite.ctx.test.id) || 'empty';
    const name = testOrSuite.file;
    failedTests = failedTests.filter(failed => id !== failed);
    failedTestRerun.removePassedTests(name);
  });

  event.dispatcher.on(event.all.result, () => {
    if (failedTests.length) {
      process.exitCode = 1;
    }
  });

  event.dispatcher.on(event.all.after, () => {
    // Writes the Failed Test Names In The JSON File For Rerun
    failedTestRerun.writeFailedTests(failedTestName);
    failedTestRerun.checkAndRemoveFailedCasesFile(failedTestName)
  });

  process.on('beforeExit', (code) => {
    if (code) {
      process.exit(code);
    }
  });
};
