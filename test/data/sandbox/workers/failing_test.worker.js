Feature('Workers Failing');

Before(() => {
  throw new Error('worker has failed');
});

Scenario('should not be executed', ({ I }) => {
  I.say('Hello Workers');
  I.seeThisIsWorker();
});
