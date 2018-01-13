const event = require('../event');

module.exports = function () {
  const failed = false;

  let failedTests = [];

  event.dispatcher.on(event.test.failed, (testOrSuite) => {
    // NOTE When an error happens in one of the hooks (BeforeAll/BeforeEach...) the event object
    // is a suite and not a test
    const uuid = testOrSuite.uuid || testOrSuite.ctx.test.uuid;
    failedTests.push(`${testOrSuite.fullTitle()}_${uuid}`);
  });

  // if test was successful after retries
  event.dispatcher.on(event.test.passed, (testOrSuite) => {
    // NOTE When an error happens in one of the hooks (BeforeAll/BeforeEach...) the event object
    // is a suite and not a test
    const uuid = testOrSuite.uuid || testOrSuite.ctx.test.uuid;
    failedTests = failedTests.filter(failed => `${testOrSuite.fullTitle()}_${uuid}` !== failed);
  });

  event.dispatcher.on(event.all.result, () => {
    if (failedTests.length) {
      process.exitCode = 1;
    }
  });
};
