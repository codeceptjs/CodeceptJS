const event = require('../event');

module.exports = function () {
  let failedTests = [];

  event.dispatcher.on(event.test.failed, (testOrSuite) => {
    // NOTE When an error happens in one of the hooks (BeforeAll/BeforeEach...) the event object
    // is a suite and not a test
    const id = testOrSuite.uid || (testOrSuite.ctx && testOrSuite.ctx.test.uid) || 'empty';
    failedTests.push(id);
  });

  // if test was successful after retries
  event.dispatcher.on(event.test.passed, (testOrSuite) => {
    // NOTE When an error happens in one of the hooks (BeforeAll/BeforeEach...) the event object
    // is a suite and not a test
    const id = testOrSuite.uid || (testOrSuite.ctx && testOrSuite.ctx.test.uid) || 'empty';
    failedTests = failedTests.filter(failed => id !== failed);
  });

  process.on('beforeExit', (code) => {
    if (failedTests.length) {
      code = 1;
    }

    if (code) {
      process.exit(code);
    }
  });
};
