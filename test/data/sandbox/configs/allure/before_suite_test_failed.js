Feature('failing setup test suite');

BeforeSuite(async () => {
  throw new Error('the before suite setup failed');
});

Scenario('failing setup test 1', async I => {
  I.say('Test was fine.');
});

Scenario('failing setup test 2', async I => {
  I.say('Test was fine.');
});
