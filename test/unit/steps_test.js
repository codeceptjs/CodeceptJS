'use strict';

let assert = require('assert');
let Step = require('../../lib/step');
let event = require('../../lib/event');
let sinon = require('sinon');
let step, action;

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
    step.humanizeArgs().should.eql("[some,data], 1");

    step.args = [{css: '.class'}];
    step.humanizeArgs().should.eql('{"css":".class"}');
  });

  it('should provide nice output', () => {
    step.args = [1, 'yo'];
    step.toString().should.eql('I do something 1, "yo"');
  });

  it('should provide code output', () => {
    step.args = [1, 'yo'];
    step.toCode().should.eql('I.doSomething(1, "yo")');
  });

  describe('#run', () => {
    let init, before, after, failed;

    afterEach(() => event.cleanDispatcher());

    it('should run step', () => {
      assert.equal(step.status, 'pending');
      let res = step.run();
      assert.equal(res, 'done');
      assert(action.called);
      assert.equal(step.status, 'success');
    });

  });

});
