import assert from 'assert';
import step from 'codeceptjs/steps';

const recorder = codeceptjs.recorder;

let tries = 0;

Feature('Retry');

Scenario('flaky step @test1', async ({ I }) => {
  tries++;
  await I.failWhen(() => {
    tries++;
    return tries < 4;
  }, step.retry(3));
  assert.equal(tries, 4);
});

Scenario('flaky step passed globally @test2', ({ I }) => {
  recorder.retry({
    retries: 3,
    when: () => false,
  });
  I.asyncStep(step.retry(5));
  I.failWhen(() => {
    tries++;
    return tries < 4;
  });
});

After(() => {
  console.log(`[T] Retries: ${tries}`);
});
