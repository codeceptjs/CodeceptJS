Feature('Filesystem');

Scenario('glob current dir', ({ I }) => {
  I.amInPath('.');
  I.say('hello world');
  I.seeFile('codecept.glob.js');
});
