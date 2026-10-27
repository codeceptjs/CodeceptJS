Feature('Retry FailedStep - Multiple Consequent Scenarios');

Scenario('first scenario', async ({ I }) => {
  I.failingStep();
});

Scenario('second scenario', async ({ I }) => {
  I.failingStep();
});

Scenario('third scenario', async ({ I }) => {
  I.failingStep();
});
