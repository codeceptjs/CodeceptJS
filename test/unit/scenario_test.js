import { expect } from 'chai';
import * as sinon from 'sinon';
import * as Scenario from '../../lib/Scenario.js';
import recorder from '../../lib/recorder.js';
import * as event from '../../lib/event.js';

let test;
let fn;
let before;
let after;
let beforeSuite;
let afterSuite;
let failed;
let started;

describe('Scenario', () => {
  beforeEach(() => {
    recorder.reset();
    test = { timeout: () => { } };
    fn = sinon.spy();
    test.fn = fn;
  });
  afterEach(() => event.cleanDispatcher());

  it('should wrap test function', () => {
    Scenario.test(test).fn(() => null);
    expect(fn.called).is.ok;
  });

  it('should work with async func', async () => {
    let counter = 0;
    test.fn = async () => {
      await recorder.add('test', () => {
        counter++;
        counter++;
        counter++;
        counter++;
      });
    };

    Scenario.setup();
    Scenario.test(test).fn(() => null);
    await recorder.add('validation', () => expect(counter).to.eq(4));
    return await recorder.promise();
  });

  describe('events', () => {
    beforeEach(() => {
      event.dispatcher.on(event.test.before, before = sinon.spy());
      event.dispatcher.on(event.test.after, after = sinon.spy());
      event.dispatcher.on(event.test.started, started = sinon.spy());
      event.dispatcher.on(event.suite.before, beforeSuite = sinon.spy());
      event.dispatcher.on(event.suite.after, afterSuite = sinon.spy());
      Scenario.suiteSetup();
      Scenario.setup();
    });

    it('should fire events', async () => {
      Scenario.test(test).fn(() => null);
      expect(started.called).is.ok;
      await Scenario.teardown();
      await Scenario.suiteTeardown();
      return await recorder.promise()
        .then(() => expect(beforeSuite.called).is.ok)
        .then(() => expect(afterSuite.called).is.ok)
        .then(() => expect(before.called).is.ok)
        .then(() => expect(after.called).is.ok);
    });

    it('should fire failed event on error', async () => {
      event.dispatcher.on(event.test.failed, failed = sinon.spy());
      Scenario.setup();
      test.fn = () => {
        throw new Error('ups');
      };
      Scenario.test(test).fn(() => {});
      return await recorder.promise()
        .then(() => {
          expect(failed.called).is.ok;
        })
        .catch(() => null);
    });

    it('should fire failed event on async error', async () => {
      test.fn = () => {
        recorder.throw(new Error('ups'));
      };
      Scenario.test(test).fn(() => {});
      return await recorder.promise()
        .then(() => {
          expect(failed.called).is.ok;
        })
        .catch(() => null);
    });
  });
});
