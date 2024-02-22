Feature('Workers');

Scenario('say something', ({ I }) => {
  share({ fromWorker: true });
});

Scenario('glob current dir', ({ I }) => {
  I.amInPath('.');
  I.seeFile('codecept.glob.js');
});
