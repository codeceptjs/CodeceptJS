const assert = require('assert');

const recorder = hermiona.recorder;

let tries = 0;

Feature('Retry');

Scenario('flaky step @test1', async ({ I }) => {
  tries++;
  await I.retry(3).failWhen(() => {
    tries++;
    return tries < 4;
  });
  assert.equal(tries, 4);
});

Scenario('flaky step passed globally @test2', ({ I }) => {
  recorder.retry({
    retries: 3,
    when: () => false,
  });
  I.retry(5).asyncStep();
  I.failWhen(() => {
    tries++;
    return tries < 4;
  });
});

After(() => {
  console.log(`[T] Retries: ${tries}`);
});
