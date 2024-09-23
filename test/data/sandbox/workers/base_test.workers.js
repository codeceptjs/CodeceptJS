const { I } = inject();

Feature('Workers');

Scenario('say something', () => {
  I.say('Hello Workers');
  I.seeThisIsWorker();
});

Scenario('glob current dir', () => {
  I.amInPath('.');
  // I.say('hello world');
  I.seeThisIsWorker();
  I.seeFile('codecept.glob.js');
});

Scenario('fail a test', () => {
  I.amInPath('.');
  I.seeThisIsWorker();
  I.seeFile('notafile');
});
