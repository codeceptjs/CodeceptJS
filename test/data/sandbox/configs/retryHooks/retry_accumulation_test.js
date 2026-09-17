Feature('Retry Config Accumulation Test');

Scenario('first scenario', async ({ I }) => {
  I.failingStep();
});

Scenario('second scenario', async ({ I }) => {
  I.failingStep();
});
