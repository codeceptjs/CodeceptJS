Feature('Workers');

Scenario('say something', (I) => {
  I.say('Hello Workers');
  console.log('hii');
  share({ fromWorker: true });
});

Scenario('glob current dir', (I) => {
  I.amInPath('.');
  I.say('hello world');
  I.seeFile('codecept.glob.json');
});
