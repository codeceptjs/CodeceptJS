const assert = require('assert');

let tries = 0;

Feature('Retry');

Scenario('flaky step', async (I) => {
  tries++;
  await I.retry(3).failWhen(() => {
    tries++;
    return tries < 4;
  });
  assert.equal(tries, 4);
  console.log(`[T] Retries: ${tries}`);
});
