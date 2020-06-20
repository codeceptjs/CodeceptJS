Feature('ADDT');

Data(['1', '2', '3']).only.Scenario('Should log array of strings', ({ current }) => {
  console.log(`Got array item ${(current)}`);
});
