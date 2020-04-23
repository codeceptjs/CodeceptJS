const assert = require('assert');

Feature('Before Test');

let val = 0;

Before(() => {
  assert.equal(val, 0);
  val++;
});


Scenario('First test will be passed @grep', () => {
  assert(true);
});

Scenario('Second test will be Failed @grep', () => {
  assert(true);
});

Scenario('Third test will be skipped @grep', () => {
  assert(true);
});

Scenario('Fourth test will be skipped', () => {
  assert(true);
});
