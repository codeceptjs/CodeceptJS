'use strict';
let scenario = require('../../lib/scenario');
let recorder = require('../../lib/recorder');
let event = require('../../lib/event');
let assert = require('assert');
let sinon = require('sinon');
let test, fn, before, after, failed, started;

describe('Scenario', () => {

  beforeEach(() => {
    test = {};
    fn = sinon.spy();
    test.fn = fn;
  });
  beforeEach(() => recorder.reset());
  afterEach(() => event.cleanDispatcher());

  it('should wrap test function', () => {
    scenario.test(test).fn();
    assert.ok(fn.called);
  });

  it('should work with generator func', () => {
    let counter = 0;
    test.fn = function*() {
      yield counter++;
      yield counter++;
      yield counter++;
      counter++;
    };
    scenario.setup();
    scenario.test(test).fn(() => null);
    return recorder.promise()
      .then(() => assert.equal(counter, 3));
  });

  describe('events', () => {
    beforeEach(() => {
      event.dispatcher.on(event.test.before, before = sinon.spy());
      event.dispatcher.on(event.test.after, after = sinon.spy());
      event.dispatcher.on(event.test.started, started = sinon.spy());
      scenario.setup();
    });

    it('should fire events', () => {
      scenario.test(test).fn(() => null);
      assert.ok(started.called);
      scenario.teardown();
      return recorder.promise()
        .then(() => assert.ok(before.called))
        .then(() => assert.ok(after.called));
    });

    it('should fire failed event on error', () => {
      event.dispatcher.on(event.test.failed, failed = sinon.spy());
      scenario.setup();
      test.fn = () => {
        throw new Error('ups');
      };
      scenario.test(test).fn();
      return recorder.promise()
        .then(() => assert.ok(failed.called));
    });

    it('should fire failed event on async error', () => {
      test.fn = () => {
        recorder.throw(new Error('ups'));
      };
      scenario.test(test).fn();
      return recorder.promise()
        .then(() => assert.ok(failed.called));
    });
  });
});
