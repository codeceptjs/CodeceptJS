const { expect } = require('chai');
const Mocha = require('mocha/lib/mocha');
const Suite = require('mocha/lib/suite');

global.codeceptjs = require('../../lib');
const makeUI = require('../../lib/ui');

describe('ui', () => {
  let suite;
  let context;

  beforeEach(() => {
    context = {};
    suite = new Suite('empty');
    makeUI(suite);
    suite.emit('pre-require', context, {}, new Mocha());
  });

  describe('basic constants', () => {
    const constants = ['Before', 'Background', 'BeforeAll', 'After', 'AfterAll', 'Scenario', 'xScenario'];

    constants.forEach((c) => {
      it(`context should contain ${c}`, () => expect(context[c]).is.ok);
    });
  });

  describe('Feature', () => {
    let suiteConfig;

    it('Feature should return featureConfig', () => {
      suiteConfig = context.Feature('basic suite');
      expect(suiteConfig.suite).is.ok;
    });

    it('should contain title', () => {
      suiteConfig = context.Feature('basic suite');
      expect(suiteConfig.suite).is.ok;
      expect(suiteConfig.suite.title).eq('basic suite');
      expect(suiteConfig.suite.fullTitle()).eq('basic suite:');
    });

    it('should contain tags', () => {
      suiteConfig = context.Feature('basic suite');
      expect(0).eq(suiteConfig.suite.tags.length);

      suiteConfig = context.Feature('basic suite @very @important');
      expect(suiteConfig.suite).is.ok;

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
      expect(3).eq(suiteConfig.suite.retries());
    });

    it('timeout can be set', () => {
      suiteConfig = context.Feature('basic suite');
      expect(0).eq(suiteConfig.suite.timeout());
      suiteConfig.timeout(3);
      expect(3).eq(suiteConfig.suite.timeout());
    });

    it('helpers can be configured', () => {
      suiteConfig = context.Feature('basic suite');
      expect(!suiteConfig.suite.config);
      suiteConfig.config('WebDriver', { browser: 'chrome' });
      expect('chrome').eq(suiteConfig.suite.config.WebDriver.browser);
      suiteConfig.config({ browser: 'firefox' });
      expect('firefox').eq(suiteConfig.suite.config[0].browser);
      suiteConfig.config('WebDriver', () => {
        return { browser: 'edge' };
      });
      expect('edge').eq(suiteConfig.suite.config.WebDriver.browser);
    });

    it('Feature can be skipped', () => {
      suiteConfig = context.Feature.skip('skipped suite');
      expect(suiteConfig.suite.pending).eq(true, 'Skipped Feature must be contain pending === true');
      expect(suiteConfig.suite.opts.skipInfo.message).eq('Skipped due to "skip" on Feature.');
      expect(suiteConfig.suite.opts.skipInfo.skipped).eq(true, 'Skip should be set on skipInfo');
    });

    it('Feature can be skipped via xFeature', () => {
      suiteConfig = context.xFeature('skipped suite');
      expect(suiteConfig.suite.pending).eq(true, 'Skipped Feature must be contain pending === true');
      expect(suiteConfig.suite.opts.skipInfo.message).eq('Skipped due to "skip" on Feature.');
      expect(suiteConfig.suite.opts.skipInfo.skipped).eq(true, 'Skip should be set on skipInfo');
    });

    it('Feature are not skipped by default', () => {
      suiteConfig = context.Feature('not skipped suite');
      expect(suiteConfig.suite.pending).eq(false, 'Feature must not contain pending === true');
      // expect(suiteConfig.suite.opts, undefined, 'Features should have no skip info');
    });

    it('Feature can be skipped', () => {
      suiteConfig = context.Feature.skip('skipped suite');
      expect(suiteConfig.suite.pending).eq(true, 'Skipped Feature must be contain pending === true');
      expect(suiteConfig.suite.opts.skipInfo.message).eq('Skipped due to "skip" on Feature.');
      expect(suiteConfig.suite.opts.skipInfo.skipped).eq(true, 'Skip should be set on skipInfo');
    });

    it('Feature can be skipped via xFeature', () => {
      suiteConfig = context.xFeature('skipped suite');
      expect(suiteConfig.suite.pending).eq(true, 'Skipped Feature must be contain pending === true');
      expect(suiteConfig.suite.opts.skipInfo.message).eq('Skipped due to "skip" on Feature.');
      expect(suiteConfig.suite.opts.skipInfo.skipped).eq(true, 'Skip should be set on skipInfo');
    });

    it('Feature are not skipped by default', () => {
      suiteConfig = context.Feature('not skipped suite');
      expect(suiteConfig.suite.pending).eq(false, 'Feature must not contain pending === true');
      // expect(suiteConfig.suite.opts, undefined, 'Features should have no skip info');
    });

    it('Feature can be skipped', () => {
      suiteConfig = context.Feature.skip('skipped suite');
      expect(suiteConfig.suite.pending).eq(true, 'Skipped Feature must be contain pending === true');
      expect(suiteConfig.suite.opts.skipInfo.message).eq('Skipped due to "skip" on Feature.');
      expect(suiteConfig.suite.opts.skipInfo.skipped).eq(true, 'Skip should be set on skipInfo');
    });

    it('Feature can be skipped via xFeature', () => {
      suiteConfig = context.xFeature('skipped suite');
      expect(suiteConfig.suite.pending).eq(true, 'Skipped Feature must be contain pending === true');
      expect(suiteConfig.suite.opts.skipInfo.message).eq('Skipped due to "skip" on Feature.');
      expect(suiteConfig.suite.opts.skipInfo.skipped).eq(true, 'Skip should be set on skipInfo');
    });

    it('Feature are not skipped by default', () => {
      suiteConfig = context.Feature('not skipped suite');
      expect(suiteConfig.suite.pending).eq(false, 'Feature must not contain pending === true');
      expect(suiteConfig.suite.opts).to.deep.eq({}, 'Features should have no skip info');
    });

    it('Feature should correctly pass options to suite context', () => {
      suiteConfig = context.Feature('not skipped suite', { key: 'value' });
      expect(suiteConfig.suite.opts).to.deep.eq({ key: 'value' }, 'Features should have passed options');
    });
  });

  describe('Scenario', () => {
    let scenarioConfig;

    it('Scenario should return scenarioConfig', () => {
      scenarioConfig = context.Scenario('basic scenario');
      expect(scenarioConfig.test).is.ok;
    });

    it('should contain title', () => {
      context.Feature('suite');
      scenarioConfig = context.Scenario('scenario');
      expect(scenarioConfig.test.title).eq('scenario');
      expect(scenarioConfig.test.fullTitle()).eq('suite: scenario');
      expect(scenarioConfig.test.tags.length).eq(0);
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
      expect(scenarioConfig.test.inject.Data).eq('data');
    });

    describe('todo', () => {
      it('should inject skipInfo to opts', () => {
        scenarioConfig = context.Scenario.todo('scenario', () => { console.log('Scenario Body'); });

        expect(scenarioConfig.test.pending).eq(true, 'Todo Scenario must be contain pending === true');
        expect(scenarioConfig.test.opts.skipInfo.message).eq('Test not implemented!');
        expect(scenarioConfig.test.opts.skipInfo.description).eq("() => { console.log('Scenario Body'); }");
      });

      it('should contain empty description in skipInfo and empty body', () => {
        scenarioConfig = context.Scenario.todo('scenario');

        expect(scenarioConfig.test.pending).eq(true, 'Todo Scenario must be contain pending === true');
        expect(scenarioConfig.test.opts.skipInfo.description).eq('');
        expect(scenarioConfig.test.body).eq('');
      });

      it('should inject custom opts to opts and without callback', () => {
        scenarioConfig = context.Scenario.todo('scenario', { customOpts: 'Custom Opts' });

        expect(scenarioConfig.test.opts.customOpts).eq('Custom Opts');
      });

      it('should inject custom opts to opts and with callback', () => {
        scenarioConfig = context.Scenario.todo('scenario', { customOpts: 'Custom Opts' }, () => { console.log('Scenario Body'); });

        expect(scenarioConfig.test.opts.customOpts).eq('Custom Opts');
      });
    });
  });
});
