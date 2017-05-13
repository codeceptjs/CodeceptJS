var assert = require('assert');
var tries = 0;
var tries2 = 0;

Feature('Flacky', {retries: 4});

Scenario('Not so flacky test', { retries: 2}, () => {
  tries++;
  assert.equal(tries, 2);
  console.log('[T1] Retries: '+tries);
});

Scenario('Really flacky test', () => {
  tries2++;
  assert.equal(tries2, 4);
  console.log('[T2] Retries: '+tries2);
});

