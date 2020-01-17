Feature('Workers Retry').retry(3);

let counter = 0;
Scenario('should pass on third time', (I) => {
  counter++;
  if (counter < 3) {
    throw new Error('worker has failed');
  }
  I.say('Hello Workers');
  I.seeThisIsWorker();
});
