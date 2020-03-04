const assert = require('assert');

Feature('Retry Workers');

let tries = 0;

Scenario('retry a test', { retries: 2 }, (I) => {
  tries++;
  assert.equal(tries, 2);
});
