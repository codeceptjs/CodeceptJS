const { event } = require('../../../../../lib/index');

Feature('Todo tests');

event.dispatcher.on(event.suite.before, (suite) => {
  for (const test of suite.tests) {
    if (test.pending) {
      console.log(`test ${test.title} was marked for todo with message: ${test.opts.skipInfo.message}`);
      console.log(`test ${test.title} was marked for todo with customOpts: ${JSON.stringify(test.opts.customOpts)}`);
    }
  }
});

Scenario.todo('@todo', () => {
  console.log('todo test not passed');
});

Scenario.todo('@todo without function');

Scenario.todo('@todo with opts', { customOpts: 'Custom options for todo' });

Scenario('@NotTodo', () => {
  console.log('simple test was passed');
});
