Feature('Workers');

Scenario('say something', ({ I }) => {
  I.say('Hello Workers');
  I.seeThisIsWorker();
});

Scenario('glob current dir', ({ I }) => {
  I.amInPath('.');
  I.say('hello world');
  I.seeThisIsWorker();
  I.seeFile('codecept.glob.json');
});


Scenario('fail a test', ({ I }) => {
  I.amInPath('.');
  I.seeThisIsWorker();
  I.seeFile('notafile');
});
