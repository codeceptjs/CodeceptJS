const assert = require('assert');

let tries = 0;
let tries2 = 0;

Feature('Flaky', { retries: 4 });

Scenario('Not so flaky test', { retries: 2 }, () => {
  tries += 1;
  assert.equal(tries, 2);
  console.log(`[T1] Retries: ${tries}`);
});

Scenario('Really flaky test', () => {
  tries2 += 1;
  assert.equal(tries2, 4);
  console.log(`[T2] Retries: ${tries2}`);
});

