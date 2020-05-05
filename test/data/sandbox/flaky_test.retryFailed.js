const assert = require('assert');

let tries = 0;

Feature('Retry');

Scenario('auto repeat failing step @test1', async ({ I }) => {
  tries++;
  await I.failWhen(() => {
    tries++;
    return tries < 5;
  });
  assert.equal(tries, 5);
  console.log(`[T] Retries: ${tries}`);
});

Scenario('no repeat for waiter @test2', async ({ I }) => {
  await I.waitForFail(() => {
    tries++;
    return tries < 5;
  });
  assert.equal(tries, 1);
});

Scenario('no retries if disabled per test @test3', async ({ I }) => {
  await I.failWhen(() => {
    tries++;
    return tries < 5;
  });
  assert.equal(tries, 1);
}).config(test => test.disableRetryFailedStep = true);

After(() => {
  console.log(`[T] Retries: ${tries}`);
});
