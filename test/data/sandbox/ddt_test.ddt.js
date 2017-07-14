let accounts1 = new DataTable(['login', 'password']);
accounts1.add(['davert', '123456']);
accounts1.add(['admin', '666666']);

Feature('DDT', accounts1);

let accounts2 = new DataTable(['login', 'password']);
accounts2.add(['andrey', '555555']);
accounts2.add(['collaborator', '222222']);

Scenario('Should log accounts1', (scenarioContext) => {
  console.log(`Got login ${scenarioContext.login} and password ${scenarioContext.password}`);
});

Scenario('Should log accounts2', accounts2, (scenarioContext) => {
  console.log(`Got changed login ${scenarioContext.login} and password ${scenarioContext.password}`);
});

