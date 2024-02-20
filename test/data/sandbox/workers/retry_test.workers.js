import assert from 'assert';

Feature('Retry Workers');

let tries = 0;

Scenario('retry a test', { retries: 2 }, () => {
  tries++;
  assert.equal(tries, 2);
});
