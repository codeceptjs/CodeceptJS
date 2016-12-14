Feature('Filesystem');

Scenario('check current dir', (I) => {
  I.amInPath('.');
  I.seeFile('codecept.json');
});