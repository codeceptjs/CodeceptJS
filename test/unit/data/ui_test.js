const { expect } = require('chai');
const Mocha = require('mocha/lib/mocha');
const Suite = require('mocha/lib/suite');

const makeUI = require('../../../lib/ui');
const addData = require('../../../lib/data/context');
const DataTable = require('../../../lib/data/table');
const Secret = require('../../../lib/secret');

describe('ui', () => {
  let suite;
  let context;
  let dataTable;

  beforeEach(() => {
    context = {};
    suite = new Suite('empty', null);
    makeUI(suite);
    suite.emit('pre-require', context, {}, new Mocha());
    addData(context);

    dataTable = new DataTable(['username', 'password']);
    dataTable.add(['jon', 'snow']);
    dataTable.xadd(['tyrion', 'lannister']);
    dataTable.add(['jaime', 'lannister']);
    dataTable.add(['Username', new Secret('theSecretPassword')]);
  });

  describe('Data', () => {
    it('can add a tag to all scenarios', () => {
      const dataScenarioConfig = context.Data(dataTable)
        .Scenario('scenario', () => {
        });

      dataScenarioConfig.tag('@user');

      dataScenarioConfig.scenarios.forEach((scenario) => {
        expect(scenario.test.tags).to.include('@user');
      });
    });

    it('can add a timout to all scenarios', () => {
      const dataScenarioConfig = context.Data(dataTable).Scenario('scenario', () => {});

      dataScenarioConfig.timeout(3);

      dataScenarioConfig.scenarios.forEach(scenario => expect(3).to.equal(scenario.test._timeout));
    });

    it('can add retries to all scenarios', () => {
      const dataScenarioConfig = context.Data(dataTable).Scenario('scenario', () => {});

      dataScenarioConfig.retry(3);

      dataScenarioConfig.scenarios.forEach(scenario => expect(3).to.equal(scenario.test._retries));
    });

    it('can expect failure for all scenarios', () => {
      const dataScenarioConfig = context.Data(dataTable).Scenario('scenario', () => {});

      dataScenarioConfig.fails();

      dataScenarioConfig.scenarios.forEach(scenario => expect(scenario.test.throws).to.exist);
    });

    it('can expect a specific error for all scenarios', () => {
      const err = new Error();

      const dataScenarioConfig = context.Data(dataTable).Scenario('scenario', () => {});

      dataScenarioConfig.throws(err);

      dataScenarioConfig.scenarios.forEach(scenario => expect(err).to.equal(scenario.test.throws));
    });

    it('can configure a helper for all scenarios', () => {
      const helperName = 'myHelper';
      const helper = {};

      const dataScenarioConfig = context.Data(dataTable).Scenario('scenario', () => {});

      dataScenarioConfig.config(helperName, helper);

      dataScenarioConfig.scenarios.forEach(scenario => expect(helper).to.equal(scenario.test.config[helperName]));
    });

    it("should shows object's toString() method in each scenario's name if the toString() method is overridden", () => {
      const data = [{ toString: () => 'test case title' }];
      const dataScenarioConfig = context.Data(data).Scenario('scenario', () => { });
      expect('scenario | test case title').to.equal(dataScenarioConfig.scenarios[0].test.title);
    });

    it("should shows JSON.stringify() in each scenario's name if the toString() method isn't overridden", () => {
      const data = [{ name: 'John Do' }];
      const dataScenarioConfig = context.Data(data).Scenario('scenario', () => {});
      expect(`scenario | ${JSON.stringify(data[0])}`).to.equal(dataScenarioConfig.scenarios[0].test.title);
    });

    it('should shows secret value as *****', () => {
      const dataScenarioConfig = context.Data(dataTable).Scenario('scenario', () => {});
      expect('scenario | {"username":"Username","password":"*****"}').to.equal(dataScenarioConfig.scenarios[2].test.title);
    });
  });
});
