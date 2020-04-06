Feature('ADDT');

Data(function* () {
  yield { user: 'nick' };
  yield { user: 'pick' };
}).only.Scenario('Should log generator of strings', ({ I, current }) => {
  console.log(`Got generator login ${current.user}`);
});
