Feature('DDT');

const accounts1 = new DataTable(['login', 'password']);
accounts1.add(['davert', '123456']);
accounts1.add(['admin', '666666']);

const accounts2 = new DataTable(['login', 'password']);
accounts2.add(['andrey', '555555']);
accounts2.add(['collaborator', '222222']);

Data(accounts1).Scenario('Should log accounts1', ({ I, current }) => {
  console.log(`Got login ${current.login} and password ${current.password}`);
});

Data(accounts2).Scenario('Should log accounts2', ({ I, current }) => {
  console.log(`Got changed login ${current.login} and password ${current.password}`);
});

Data(function* () {
  yield ['nick', 'pick'];
  yield ['jack', 'sacj'];
}).Scenario('Should log accounts3', ({ I, current }) => {
  console.log(`Got changed login ${current[0]}`);
});

Data(function* () {
  yield { user: 'nick' };
  yield { user: 'pick' };
}).Scenario('Should log accounts4', ({ I, current }) => {
  console.log(`Got generator login ${current.user}`);
});

Data(['1', '2', '3']).Scenario('Should log array of strings', ({ I, current }) => {
  console.log(`Got array item ${current}`);
});
