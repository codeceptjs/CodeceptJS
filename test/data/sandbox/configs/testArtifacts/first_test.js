const { event } = require('../../../../../lib/index');

event.dispatcher.on(event.test.failed, test => {
  test.artifacts.screenshot = '[ SCREEENSHOT FILE ]';
});

Feature('Test artifacts');

Scenario('test 1', ({ I }) => {
  I.shouldDoSomething();
  I.fail();
});

Scenario('test 2', ({ I }) => {
  throw new Error('Empty');
});
