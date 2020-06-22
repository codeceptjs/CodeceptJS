Feature('@feature_grep in worker');

Scenario('From worker @1_grep print message 1', (I) => {
  console.log('message 1');
  I.seeThisIsWorker();
});

Scenario('From worker @2_grep print message 2', (I) => {
  console.log('message 2');
  I.seeThisIsWorker();
});
