const assert = require('assert');
const sinon = require('sinon');
const expect = require('expect');
const Step = require('../../lib/step');
const { MetaStep } = require('../../lib/step');
const event = require('../../lib/event');
const secret = require('../../lib/secret').secret;

let step;
let action;

describe('Steps', () => {
  describe('Step', () => {
    beforeEach(() => {
      action = sinon.spy(() => 'done');
      step = new Step({ doSomething: action }, 'doSomething');
    });

    it('has name', () => {
      step.name.should.eql('doSomething');
    });

    it('should convert method names for output', () => {
      step.humanize().should.eql('do something');
    });

    it('should convert arguments for output', () => {
      step.args = ['word', 1];
      step.humanizeArgs().should.eql('"word", 1');

      step.args = [['some', 'data'], 1];
      step.humanizeArgs().should.eql('["some","data"], 1');

      step.args = [{ css: '.class' }];
      step.humanizeArgs().should.eql('{"css":".class"}');

      let testUndefined;
      step.args = [testUndefined, 'undefined'];
      step.humanizeArgs().should.eql('undefined, "undefined"');

      step.args = [secret('word'), 1];
      step.humanizeArgs().should.eql('*****, 1');
    });

    it('should provide nice output', () => {
      step.args = [1, 'yo'];
      step.toString().should.eql('I do something 1, "yo"');
    });

    it('should provide code output', () => {
      step.args = [1, 'yo'];
      step.toCode().should.eql('I.doSomething(1, "yo")');
    });

    it('should set status for Step and MetaStep if exist', () => {
      const metaStep = new MetaStep({ doSomethingMS: action }, 'doSomethingMS');
      step.metaStep = metaStep;
      step.run();
      expect(step.metaStep.status).toEqual('success');
    });

    it('should set status only for Step when MetaStep not exist', () => {
      step.run();
      expect(step.metaStep).toBeFalsy();
    });

    describe('#run', () => {
      afterEach(() => event.cleanDispatcher());

      it('should run step', () => {
        assert.equal(step.status, 'pending');
        const res = step.run();
        assert.equal(res, 'done');
        assert(action.called);
        assert.equal(step.status, 'success');
      });
    });
  });

  describe('MetaStep', () => {
    // let metaStep;
    beforeEach(() => {
      action = sinon.spy(() => 'done');
      // metaStep = new MetaStep({ doSomething: action }, 'doSomething');
    });

    describe('#isBDD', () => {
      ['Given', 'When', 'Then', 'And'].forEach(key => {
        it(`[${key}] #isBdd should return true if it BDD style`, () => {
          const metaStep = new MetaStep(key, 'I need to open Google');
          expect(metaStep.isBDD()).toBe(true);
        });
      });
    });

    it('#isWithin should return true if it Within step', () => {
      const metaStep = new MetaStep('Within', 'clickByName');
      expect(metaStep.isWithin()).toBe(true);
    });

    describe('#toString', () => {
      ['Given', 'When', 'Then', 'And'].forEach(key => {
        it(`[${key}] should correct print BDD step`, () => {
          const metaStep = new MetaStep(key, 'I need to open Google');
          expect(metaStep.toString()).toContain(`${key} I need to open Google`);
        });
      });

      it('should correct print step info for simple PageObject', () => {
        const metaStep = new MetaStep('MyPage', 'clickByName');
        expect(metaStep.toString()).toContain('MyPage: clickByName');
      });

      it('should correct print step with args', () => {
        const metaStep = new MetaStep('MyPage', 'clickByName');
        const msg = 'first message';
        const msg2 = 'second message';
        const fn = (msg) => `result from callback = ${msg}`;
        metaStep.run.bind(metaStep, fn)(msg, msg2);
        expect(metaStep.toString()).toEqual(`MyPage: clickByName "${msg}", "${msg2}"`);
      });
    });

    it('#setContext should correct init context variable', () => {
      const context = { prop: 'prop' };
      const metaStep = new MetaStep('MyPage', 'clickByName');
      metaStep.setContext(context);
      expect(metaStep.context).toEqual(context);
    });

    describe('#run', () => {
      let metaStep;
      let fn;
      let boundedRun;
      beforeEach(() => {
        metaStep = new MetaStep({ doSomething: action }, 'doSomething');
        fn = (msg) => `result from callback = ${msg}`;
        boundedRun = metaStep.run.bind(metaStep, fn);
      });

      it('should return result from run callback function', () => {
        const fn = () => 'result from callback';
        expect(metaStep.run(fn)).toEqual('result from callback');
      });

      it('should return result when run is bound', () => {
        const fn = () => 'result from callback';
        const boundedRun = metaStep.run.bind(metaStep, fn);
        expect(boundedRun()).toEqual('result from callback');
      });

      it('should correct init args when run is bound', () => {
        const msg = 'arg message';
        expect(boundedRun(msg)).toEqual(`result from callback = ${msg}`);
      });

      it('should init as metaStep in step', () => {
        let step1;
        let step2;
        const stepAction1 = sinon.spy(() => event.emit(event.step.before, step1));
        const stepAction2 = sinon.spy(() => event.emit(event.step.before, step2));
        step1 = new Step({ doSomething: stepAction1 }, 'doSomething');
        step2 = new Step({ doSomething2: stepAction2 }, 'doSomething2');
        boundedRun = metaStep.run.bind(metaStep, () => {
          step1.run();
          step2.run();
        });
        boundedRun();
        expect(step1.metaStep).toEqual(metaStep);
        expect(step2.metaStep).toEqual(metaStep);
      });
    });
  });
});
