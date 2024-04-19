const assert = require('assert');

let tries = 0;
let tries2 = 0;
let tries3 = 0;

Feature('Flaky').retry(4);

Scenario('Not so flaky test', () => {
  tries++;
  assert.equal(tries, 2);
  console.log(`[T1] Retries: ${tries}`);
}).retry(2);

Scenario('Really flaky test', () => {
  tries2++;
  assert.equal(tries2, 4);
  console.log(`[T2] Retries: ${tries2}`);
});

Scenario('Old style flaky', { retries: 1 }, () => {
  tries3++;
  assert.equal(tries3, 1);
  console.log(`[T3] Retries: ${tries3}`);
});
