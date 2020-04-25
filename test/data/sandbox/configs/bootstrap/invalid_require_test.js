require('invalidRequire');

Feature('Filesystem');

Scenario('check current dir', ({ I }) => {
  I.amInPath('.');
  I.say('hello world');
  I.seeFile('codecept.json');
});
