const { event } = require('../../../../../lib/index');

Feature('Skip tests');

event.dispatcher.on(event.suite.before, (suite) => {
  for (const test of suite.tests) {
    if (test.pending) {
      console.log(`test ${test.title} was marked for skip with customOpts: ${JSON.stringify(test.opts.customOpts)}`);
    }
  }
});

Scenario.skip('@skip', () => {
  console.log('skip test not passed');
});

Scenario.skip('@skip with opts', { customOpts: 'Custom options for skip' });

Scenario('@NotSkip', () => {
  console.log('simple test was passed');
});
