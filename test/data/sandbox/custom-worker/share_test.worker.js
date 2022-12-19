const assert = require('assert');

Feature('Shared Memory in Workers');

Scenario('Should get the data shared from main process', ({ I }) => {
  I.say('Hello Workers');
  const { fromMain } = inject();
  console.log(fromMain);
  assert.toEqual(fromMain, true);
});

Scenario('Should get the data shared from other worker', ({ I }) => {
  I.amInPath('.');
  I.say('hello world');
  const { fromWorker } = inject();
  assert.toEqual(fromWorker, true);
});
