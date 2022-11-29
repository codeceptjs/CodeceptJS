Feature('Not-A-Filesystem');

Scenario('file is not in dir', ({ I }) => {
  I.amInPath('.');
  I.seeFile('not-a-codecept.js');
});
