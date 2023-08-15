const sinon = require('sinon');
const chai = require('chai');
const Step = require('../../lib/step');
const { MetaStep } = require('../../lib/step');
const event = require('../../lib/event');
const { secret } = require('../../lib/secret');

const expect = chai.expect;
chai.use(require('chai-as-promised'));

let step;
let action;

describe('Steps', () => {
  describe('Step', () => {
    beforeEach(() => {
      action = sinon.spy(() => 'done');
      step = new Step({ doSomething: action }, 'doSomething');
    });

    it('has name', () => {
      expect(step.name).eql('doSomething');
    });

    it('should convert method names for output', () => {
      expect(step.humanize()).eql('do something');
    });

    it('should convert arguments for output', () => {
      step.args = ['word', 1];
      expect(step.humanizeArgs()).eql('"word", 1');

      step.args = [['some', 'data'], 1];
      expect(step.humanizeArgs()).eql('["some","data"], 1');

      step.args = [{ css: '.class' }];
      expect(step.humanizeArgs()).eql('{"css":".class"}');

      let testUndefined;
      step.args = [testUndefined, 'undefined'];
      expect(step.humanizeArgs()).eql(', "undefined"');

      step.args = [secret('word'), 1];
      expect(step.humanizeArgs()).eql('*****, 1');
    });

    it('should provide nice output', () => {
      step.args = [1, 'yo'];
      expect(step.toString()).eql('I do something 1, "yo"');
    });

    it('should provide code output', () => {
      step.args = [1, 'yo'];
      expect(step.toCode()).eql('I.doSomething(1, "yo")');
    });

    it('should set status for Step and MetaStep if exist', () => {
      const metaStep = new MetaStep({ doSomethingMS: action }, 'doSomethingMS');
      step.metaStep = metaStep;
      step.run();
      expect(step.metaStep.status).eq('success');
    });

    it('should set status only for Step when MetaStep not exist', () => {
      step.run();
      expect(step.metaStep);
    });

    describe('#run', () => {
      afterEach(() => event.cleanDispatcher());

      it('should run step', () => {
        expect(step.status).is.equal('pending');
        const res = step.run();
        expect(res).is.equal('done');
        expect(action.called);
        expect(step.status).is.equal('success');
      });
    });
  });

  describe('MetaStep', () => {
    // let metaStep;
    beforeEach(() => {
      action = sinon.spy(() => 'done');
      asyncAction = sinon.spy(async () => 'done');
      // metaStep = new MetaStep({ doSomething: action }, 'doSomething');
    });

    describe('#isBDD', () => {
      ['Given', 'When', 'Then', 'And'].forEach(key => {
        it(`[${key}] #isBdd should return true if it BDD style`, () => {
          const metaStep = new MetaStep(key, 'I need to open Google');
          expect(metaStep.isBDD()).to.be.true;
        });
      });
    });

    it('#isWithin should return true if it Within step', () => {
      const metaStep = new MetaStep('Within', 'clickByName');
      expect(metaStep.isWithin()).to.be.true;
    });

    describe('#toString', () => {
      ['Given', 'When', 'Then', 'And'].forEach(key => {
        it(`[${key}] should correct print BDD step`, () => {
          const metaStep = new MetaStep(key, 'I need to open Google');
          expect(metaStep.toString()).to.include(`${key} I need to open Google`);
        });
      });

      it('should correct print step info for simple PageObject', () => {
        const metaStep = new MetaStep('MyPage', 'clickByName');
        expect(metaStep.toString()).to.include('MyPage click by name');
      });

      it('should correct print step with args', () => {
        const metaStep = new MetaStep('MyPage', 'clickByName');
        const msg = 'first message';
        const msg2 = 'second message';
        const fn = (msg) => `result from callback = ${msg}`;
        metaStep.run.bind(metaStep, fn)(msg, msg2);
        expect(metaStep.toString()).eql(`MyPage click by name "${msg}", "${msg2}"`);
      });
    });

    it('#setContext should correct init context variable', () => {
      const context = { prop: 'prop' };
      const metaStep = new MetaStep('MyPage', 'clickByName');
      metaStep.setContext(context);
      expect(metaStep.context).eql(context);
    });

    describe('#run', () => {
      let metaStep;
      let fn;
      let boundedRun;
      let boundedAsyncRun;
      beforeEach(() => {
        metaStep = new MetaStep({ metaStepDoSomething: action }, 'metaStepDoSomething');
        asyncMetaStep = new MetaStep({ metaStepDoSomething: asyncAction }, 'metaStepDoSomething');
        fn = (msg) => `result from callback = ${msg}`;
        asyncFn = async (msg) => `result from callback = ${msg}`;
        boundedRun = metaStep.run.bind(metaStep, fn);
        boundedAsyncRun = metaStep.run.bind(metaStep, asyncFn);
      });

      it('should return result from run callback function', () => {
        const fn = () => 'result from callback';
        expect(metaStep.run(fn)).eql('result from callback');
      });

      it('should return result from run async callback function', async () => {
        const fn = async () => 'result from callback';
        expect(await metaStep.run(fn)).eql('result from callback');
      });

      it('should return result when run is bound', () => {
        const fn = () => 'result from callback';
        const boundedRun = metaStep.run.bind(metaStep, fn);
        expect(boundedRun()).eql('result from callback');
      });

      it('should return result when async run is bound', async () => {
        const fn = async () => 'result from callback';
        const boundedRun = metaStep.run.bind(metaStep, fn);
        expect(await boundedRun()).eql('result from callback');
      });

      it('should correct init args when run is bound', () => {
        const msg = 'arg message';
        expect(boundedRun(msg)).eql(`result from callback = ${msg}`);
      });

      it('should correct init args when async run is bound', async () => {
        const msg = 'arg message';
        expect(await boundedAsyncRun(msg)).eql(`result from callback = ${msg}`);
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
        expect(step1.metaStep).eql(metaStep);
        expect(step2.metaStep).eql(metaStep);
      });

      it('should init as metaStep in step with async metaStep', async () => {
        let step1;
        let step2;
        const stepAction1 = sinon.spy(() => event.emit(event.step.before, step1));
        const stepAction2 = sinon.spy(() => event.emit(event.step.before, step2));
        step1 = new Step({ doSomething: stepAction1 }, 'doSomething');
        step2 = new Step({ doSomething2: stepAction2 }, 'doSomething2');
        boundedRun = asyncMetaStep.run.bind(asyncMetaStep, async () => {
          step1.run();
          await Promise.resolve('Oh wait, need to do something async stuff!!');
          step2.run();
          return Promise.resolve('Give me some promised return value');
        });

        const result = await boundedRun();
        expect(step1.metaStep).eql(asyncMetaStep);
        expect(step2.metaStep).eql(asyncMetaStep);
        expect(result).eql('Give me some promised return value');
      });

      it('should fail if async method fails inside async metaStep', async () => {
        let step1;
        let step2;
        const stepAction1 = sinon.spy(() => event.emit(event.step.before, step1));
        const stepAction2 = sinon.spy(() => event.emit(event.step.before, step2));
        step1 = new Step({ doSomething: stepAction1 }, 'doSomething');
        step2 = new Step({ doSomething2: stepAction2 }, 'doSomething2');
        boundedRun = asyncMetaStep.run.bind(asyncMetaStep, async () => {
          step1.run();
          await Promise.reject(new Error('FAILED INSIDE ASYNC METHOD OF METASTEP'));
          throw new Error('FAILED INSIDE METASTEP');
        });
        await expect(boundedRun()).to.be.rejectedWith('FAILED INSIDE ASYNC METHOD OF METASTEP');
      });

      it('should fail if async method fails', async () => {
        let step1;
        let step2;
        const stepAction1 = sinon.spy(() => event.emit(event.step.before, step1));
        const stepAction2 = sinon.spy(() => event.emit(event.step.before, step2));
        step1 = new Step({ doSomething: stepAction1 }, 'doSomething');
        step2 = new Step({ doSomething2: stepAction2 }, 'doSomething2');
        boundedRun = asyncMetaStep.run.bind(asyncMetaStep, async () => {
          step1.run();
          await Promise.resolve('Oh wait, need to do something async stuff!!');
          throw new Error('FAILED INSIDE METASTEP');
        });
        await expect(boundedRun()).to.be.rejectedWith('FAILED INSIDE METASTEP');
      });
    });
  });
});
