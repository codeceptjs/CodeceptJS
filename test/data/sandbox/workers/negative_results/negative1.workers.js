Feature('Workers - negative Results1');

Scenario('the same name', (I) => {
  throw new Error('The same error');
});

Scenario('the same name', (I) => {
  throw new Error('The same error');
});

Scenario('the another name', (I) => {
  console.log('asd');
});
