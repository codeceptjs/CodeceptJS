const path = require('path');

const actor = require('../../lib/actor');
const container = require('../../lib/container');
const recorder = require('../../lib/recorder');
const event = require('../../lib/event');

global.codecept_dir = path.join(__dirname, '/..');
let I;
let counter;

describe('Actor', () => {
  beforeEach(() => {
    counter = 0;
    container.clear({
      MyHelper: {
        hello: () => 'hello world',
        bye: () => 'bye world',
        die: () => { throw new Error('ups'); },
        _hidden: () => 'hidden',
        failFirst: () => {
          counter++;
          if (counter < 2) throw new Error('ups');
        },
      },
      MyHelper2: {
        greeting: () => 'greetings, world',
      },
    });
    I = actor();
    event.cleanDispatcher();
  });

  it('should take all methods from helpers and built in', () => {
    I.should.contain.keys(['hello', 'bye', 'die', 'greeting', 'say', 'failFirst']);
  });

  it('should return promise', () => {
    recorder.start();
    const promise = I.hello();
    promise.should.be.instanceOf(Promise);
    return promise.then(val => val.should.eql('hello world'));
  });

  it('should produce step events', () => {
    recorder.start();
    let listeners = 0;
    event.dispatcher.addListener(event.step.before, () => listeners++);
    event.dispatcher.addListener(event.step.after, () => listeners++);
    event.dispatcher.addListener(event.step.passed, (step) => {
      listeners++;
      step.endTime.should.not.be.null;
      step.startTime.should.not.be.null;
      step.startTime.should.not.eql(step.endTime);
    });

    return I.hello().then(() => {
      listeners.should.eql(3);
    });
  });


  it('should retry failed step with #retry', () => {
    return I.retry(2).failFirst();
  });

  it('should retry once step with #retry', () => {
    return I.retry().failFirst();
  });


  it('should print handle failed steps', () => {
    recorder.start();
    let listeners = 0;
    event.dispatcher.addListener(event.step.before, () => listeners++);
    event.dispatcher.addListener(event.step.after, () => listeners++);
    event.dispatcher.addListener(event.step.failed, (step) => {
      listeners++;
      step.endTime.should.not.be.null;
      step.startTime.should.not.be.null;
      step.startTime.should.not.eql(step.endTime);
    });

    return I.die()
      .then(() => listeners = 0)
      .catch(() => null)
      .then(() => {
        listeners.should.eql(3);
      });
  });
});
