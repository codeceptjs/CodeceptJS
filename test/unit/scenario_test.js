const expect = require('expect');
const sinon = require('sinon');

const scenario = require('../../lib/scenario');
const recorder = require('../../lib/recorder');
const event = require('../../lib/event');

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
    test = { timeout: () => { } };
    fn = sinon.spy();
    test.fn = fn;
  });
  beforeEach(() => recorder.reset());
  afterEach(() => event.cleanDispatcher());

  it('should wrap test function', () => {
    scenario.test(test).fn(() => {});
    expect(fn.called).toBeTruthy();
  });

  it('should work with async func', () => {
    let counter = 0;
    test.fn = () => {
      recorder.add('test', async () => {
        await counter++;
        await counter++;
        await counter++;
        counter++;
      });
    };

    scenario.setup();
    scenario.test(test).fn(() => null);
    recorder.add('validation', () => expect(counter).toEqual(4));
    return recorder.promise();
  });

  describe('events', () => {
    beforeEach(() => {
      event.dispatcher.on(event.test.before, before = sinon.spy());
      event.dispatcher.on(event.test.after, after = sinon.spy());
      event.dispatcher.on(event.test.started, started = sinon.spy());
      event.dispatcher.on(event.suite.before, beforeSuite = sinon.spy());
      event.dispatcher.on(event.suite.after, afterSuite = sinon.spy());
      scenario.suiteSetup();
      scenario.setup();
    });

    it('should fire events', () => {
      scenario.test(test).fn(() => null);
      expect(started.called).toBeTruthy();
      scenario.teardown();
      scenario.suiteTeardown();
      return recorder.promise()
        .then(() => expect(beforeSuite.called).toBeTruthy())
        .then(() => expect(afterSuite.called).toBeTruthy())
        .then(() => expect(before.called).toBeTruthy())
        .then(() => expect(after.called).toBeTruthy());
    });

    it('should fire failed event on error', () => {
      event.dispatcher.on(event.test.failed, failed = sinon.spy());
      scenario.setup();
      test.fn = () => {
        throw new Error('ups');
      };
      scenario.test(test).fn(() => {});
      return recorder.promise()
        .then(() => expect(failed.called).toBeTruthy())
        .catch(() => null);
    });

    it('should fire failed event on async error', () => {
      test.fn = () => {
        recorder.throw(new Error('ups'));
      };
      scenario.test(test).fn(() => {});
      return recorder.promise()
        .then(() => expect(failed.called).toBeTruthy())
        .catch(() => null);
    });
  });
});
