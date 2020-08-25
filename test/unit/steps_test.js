const assert = require('assert');
const sinon = require('sinon');

const Step = require('../../lib/step');
const event = require('../../lib/event');
const secret = require('../../lib/secret').secret;

let step;
let action;

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
    step.humanizeArgs().should.eql(', "undefined"');

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
