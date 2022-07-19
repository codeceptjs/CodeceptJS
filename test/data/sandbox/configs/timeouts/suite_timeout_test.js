Feature('timed out in 2s', { timeout: 2 });

Scenario('no timeout', ({ I }) => {
  I.waitForSleep(3000);
});

Scenario('timeout in 1', { timeout: 1 }, ({ I }) => {
  I.waitForSleep(3000);
});
