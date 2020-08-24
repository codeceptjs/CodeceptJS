Feature('Workers - negative Results1');

Scenario('the same name', () => {
  throw new Error('The same error');
});

Scenario('the same name', () => {
  throw new Error('The same error');
});

Scenario('the another name', () => {
  console.log('asd');
});
