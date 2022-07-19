Feature('no timeout');

Scenario('no timeout test', ({ I }) => {
  I.waitForSleep(1000);
});

Scenario('timeout test in 0.5', { timeout: 0.5 }, ({ I }) => {
  I.waitForSleep(1000);
});

Scenario('timeout step in 0.5', ({ I }) => {
  I.limitTime(0.2).waitForSleep(100);
  I.limitTime(0.1).waitForSleep(3000);
});
