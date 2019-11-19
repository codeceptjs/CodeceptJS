const event = require('../event');

module.exports = function () {
  let failedTests = [];

  event.dispatcher.on(event.test.failed, (testOrSuite) => {
    // NOTE When an error happens in one of the hooks (BeforeAll/BeforeEach...) the event object
    // is a suite and not a test
    const id = testOrSuite.id || (testOrSuite.ctx && testOrSuite.ctx.test.id) || 'empty';
    failedTests.push(id);
  });

  // if test was successful after retries
  event.dispatcher.on(event.test.passed, (testOrSuite) => {
    // NOTE When an error happens in one of the hooks (BeforeAll/BeforeEach...) the event object
    // is a suite and not a test
    const id = testOrSuite.id || (testOrSuite.ctx && testOrSuite.ctx.test.id) || 'empty';
    failedTests = failedTests.filter(failed => id !== failed);
  });

  event.dispatcher.on(event.all.result, () => {
    if (failedTests.length) {
      process.exitCode = 1;
    }
  });
};
