const assert = require('assert');
const Mocha = require('mocha/lib/mocha');
const Suite = require('mocha/lib/suite');
const container = require('../../lib/container');

const makeUI = require('../../lib/ui');

describe('ui', () => {
  let suite;
  let context;

  beforeEach(() => {
    context = {};
    suite = new Suite('empty');
    container.create({});
    makeUI(suite);
    suite.emit('pre-require', context, {}, new Mocha());
  });

  describe('basic constants', () => {
    const constants = ['Before', 'Background', 'BeforeAll', 'After', 'AfterAll', 'Scenario', 'xScenario'];

    constants.forEach((c) => {
      it(`context should contain ${c}`, () => assert.ok(context[c]));
    });
  });

  describe('Feature', () => {
    let suiteConfig;

    it('Feature should return featureConfig', () => {
      suiteConfig = context.Feature('basic suite');
      assert.ok(suiteConfig.suite);
    });

    it('should contain title', () => {
      suiteConfig = context.Feature('basic suite');
      assert.ok(suiteConfig.suite);
      assert.equal(suiteConfig.suite.title, 'basic suite');
      assert.equal(suiteConfig.suite.fullTitle(), 'basic suite:');
    });

    it('should contain tags', () => {
      suiteConfig = context.Feature('basic suite');
      assert.equal(0, suiteConfig.suite.tags.length);

      suiteConfig = context.Feature('basic suite @very @important');
      assert.ok(suiteConfig.suite);

      suiteConfig.suite.tags.should.include('@very');
      suiteConfig.suite.tags.should.include('@important');

      suiteConfig.tag('@user');
      suiteConfig.suite.tags.should.include('@user');

      suiteConfig.suite.tags.should.not.include('@slow');
      suiteConfig.tag('slow');
      suiteConfig.suite.tags.should.include('@slow');
    });

    it('retries can be set', () => {
      suiteConfig = context.Feature('basic suite');
      suiteConfig.retry(3);
      assert.equal(3, suiteConfig.suite.retries());
    });

    it.only('timeout can be set', () => {
      suiteConfig = context.Feature('basic suite');
      console.log(suiteConfig.suite.timeout());
      assert.equal(0, suiteConfig.suite.timeout());
      suiteConfig.timeout(3);
      assert.equal(3, suiteConfig.suite.timeout());
    });

    it('helpers can be configured', () => {
      suiteConfig = context.Feature('basic suite');
      assert(!suiteConfig.suite.config);
      suiteConfig.config('WebDriver', { browser: 'chrome' });
      assert.equal('chrome', suiteConfig.suite.config.WebDriver.browser);
      suiteConfig.config({ browser: 'firefox' });
      assert.equal('firefox', suiteConfig.suite.config[0].browser);
      suiteConfig.config('WebDriver', () => {
        return { browser: 'edge' };
      });
      assert.equal('edge', suiteConfig.suite.config.WebDriver.browser);
    });

    it('Feature can be skipped', () => {
      suiteConfig = context.Feature.skip('skipped suite');
      assert.equal(suiteConfig.suite.pending, true, 'Skipped Feature must be contain pending === true');
      assert.equal(suiteConfig.suite.opts.skipInfo.message, 'Skipped due to "skip" on Feature.');
      assert.equal(suiteConfig.suite.opts.skipInfo.skipped, true, 'Skip should be set on skipInfo');
    });

    it('Feature can be skipped via xFeature', () => {
      suiteConfig = context.xFeature('skipped suite');
      assert.equal(suiteConfig.suite.pending, true, 'Skipped Feature must be contain pending === true');
      assert.equal(suiteConfig.suite.opts.skipInfo.message, 'Skipped due to "skip" on Feature.');
      assert.equal(suiteConfig.suite.opts.skipInfo.skipped, true, 'Skip should be set on skipInfo');
    });

    it('Feature are not skipped by default', () => {
      suiteConfig = context.Feature('not skipped suite');
      assert.equal(suiteConfig.suite.pending, false, 'Feature must not contain pending === true');
      assert.equal(suiteConfig.suite.opts, undefined, 'Features should have no skip info');
    });
  });

  describe('Scenario', () => {
    let scenarioConfig;

    it('Scenario should return scenarioConfig', () => {
      scenarioConfig = context.Scenario('basic scenario');
      assert.ok(scenarioConfig.test);
    });

    it('should contain title', () => {
      context.Feature('suite');
      scenarioConfig = context.Scenario('scenario');
      assert.equal(scenarioConfig.test.title, 'scenario');
      assert.equal(scenarioConfig.test.fullTitle(), 'suite: scenario');
      assert.equal(scenarioConfig.test.tags.length, 0);
    });

    it('should contain tags', () => {
      context.Feature('basic suite @cool');

      scenarioConfig = context.Scenario('scenario @very @important');

      scenarioConfig.test.tags.should.include('@cool');
      scenarioConfig.test.tags.should.include('@very');
      scenarioConfig.test.tags.should.include('@important');

      scenarioConfig.tag('@user');
      scenarioConfig.test.tags.should.include('@user');
    });

    it('should dynamically inject dependencies', () => {
      scenarioConfig = context.Scenario('scenario');
      scenarioConfig.injectDependencies({ Data: 'data' });
      assert.equal(scenarioConfig.test.inject.Data, 'data');
    });

    describe('todo', () => {
      it('should inject skipInfo to opts', () => {
        scenarioConfig = context.Scenario.todo('scenario', () => { console.log('Scenario Body'); });

        assert.equal(scenarioConfig.test.pending, true, 'Todo Scenario must be contain pending === true');
        assert.equal(scenarioConfig.test.opts.skipInfo.message, 'Test not implemented!');
        assert.equal(scenarioConfig.test.opts.skipInfo.description, "() => { console.log('Scenario Body'); }");
      });

      it('should contain empty description in skipInfo and empty body', () => {
        scenarioConfig = context.Scenario.todo('scenario');

        assert.equal(scenarioConfig.test.pending, true, 'Todo Scenario must be contain pending === true');
        assert.equal(scenarioConfig.test.opts.skipInfo.description, '');
        assert.equal(scenarioConfig.test.body, '');
      });

      it('should inject custom opts to opts and without callback', () => {
        scenarioConfig = context.Scenario.todo('scenario', { customOpts: 'Custom Opts' });

        assert.equal(scenarioConfig.test.opts.customOpts, 'Custom Opts');
      });

      it('should inject custom opts to opts and with callback', () => {
        scenarioConfig = context.Scenario.todo('scenario', { customOpts: 'Custom Opts' }, () => { console.log('Scenario Body'); });

        assert.equal(scenarioConfig.test.opts.customOpts, 'Custom Opts');
      });
    });
  });
});
