const scenario = require('../../lib/scenario');
const recorder = require('../../lib/recorder');
const event = require('../../lib/event');
const assert = require('assert');
const sinon = require('sinon');

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
    assert.ok(fn.called);
  });

  it('should work with async func', () => {
    let counter = 0;
    let error;
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
    recorder.add('validation', () => assert.equal(counter, 4));
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
      assert.ok(started.called);
      scenario.teardown();
      scenario.suiteTeardown();
      return recorder.promise()
        .then(() => assert.ok(beforeSuite.called))
        .then(() => assert.ok(afterSuite.called))
        .then(() => assert.ok(before.called))
        .then(() => assert.ok(after.called));
    });

    it('should fire failed event on error', () => {
      event.dispatcher.on(event.test.failed, failed = sinon.spy());
      scenario.setup();
      test.fn = () => {
        throw new Error('ups');
      };
      scenario.test(test).fn(() => {});
      return recorder.promise()
        .then(() => assert.ok(failed.called))
        .catch(() => null);
    });

    it('should fire failed event on async error', () => {
      test.fn = () => {
        recorder.throw(new Error('ups'));
      };
      scenario.test(test).fn(() => {});
      return recorder.promise()
        .then(() => assert.ok(failed.called))
        .catch(() => null);
    });
  });
});
