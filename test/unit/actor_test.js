const path = require('path');
const { expect } = require('expect');

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
        failAfter: (i = 1) => {
          counter++;
          if (counter <= i) throw new Error('ups');
          counter = 0;
        },
      },
      MyHelper2: {
        greeting: () => 'greetings, world',
      },
    }, undefined, undefined);
    container.translation().vocabulary.actions.hello = 'привет';
    I = actor();
    event.cleanDispatcher();
  });

  it('should init actor on store', () => {
    const store = require('../../lib/store');
    expect(store.actor).toBeTruthy();
  });

  it('should collect pageobject methods in actor', () => {
    const poI = actor({
      customStep: () => {},
    });
    expect(poI).toHaveProperty('customStep');
    expect(I).toHaveProperty('customStep');
  });

  it('should correct run step from Helper inside PageObject', () => {
    actor({
      customStep() {
        return this.hello();
      },
    });
    recorder.start();
    const promise = I.customStep();
    return promise.then(val => expect(val).toEqual('hello world'));
  });

  it('should init pageobject methods as metastep', () => {
    actor({
      customStep: () => 3,
    });
    expect(I.customStep()).toEqual(3);
  });

  it('should correct add translation for step from Helper', () => {
    expect(I).toHaveProperty('привет');
  });

  it('should correct add translation for step from PageObject', () => {
    container.translation().vocabulary.actions.customStep = 'кастомный_шаг';
    actor({
      customStep: () => 3,
    });
    expect(I).toHaveProperty('кастомный_шаг');
  });

  it('should take all methods from helpers and built in', () => {
    ['hello', 'bye', 'die', 'failAfter', 'say', 'retry', 'greeting'].forEach(key => {
      expect(I).toHaveProperty(key);
    });
  });

  it('should return promise', () => {
    recorder.start();
    const promise = I.hello();
    expect(promise).toBeInstanceOf(Promise);
    return promise.then(val => expect(val).toEqual('hello world'));
  });

  it('should produce step events', () => {
    recorder.start();
    let listeners = 0;
    event.dispatcher.addListener(event.step.before, () => listeners++);
    event.dispatcher.addListener(event.step.after, () => listeners++);
    event.dispatcher.addListener(event.step.passed, (step) => {
      listeners++;
      expect(step.endTime).toBeTruthy();
      expect(step.startTime).toBeTruthy();
    });

    return I.hello().then(() => {
      expect(listeners).toEqual(3);
    });
  });

  it('should retry failed step with #retry', () => {
    recorder.start();
    return I.retry({ retries: 2, minTimeout: 0 }).failAfter(1);
  });

  it('should retry once step with #retry', () => {
    recorder.start();
    return I.retry().failAfter(1);
  });

  it('should alway use the latest global retry options', () => {
    recorder.start();
    recorder.retry({
      retries: 0,
      minTimeout: 0,
      when: () => true,
    });
    recorder.retry({
      retries: 1,
      minTimeout: 0,
      when: () => true,
    });
    I.hello(); // before fix: this changed the order of retries
    return I.failAfter(1);
  });

  it('should not delete a global retry option', () => {
    recorder.start();
    recorder.retry({
      retries: 2,
      minTimeout: 0,
      when: () => true,
    });
    I.retry(1).failAfter(1); // before fix: this changed the order of retries
    return I.failAfter(2);
  });

  it('should print handle failed steps', () => {
    recorder.start();
    let listeners = 0;
    event.dispatcher.addListener(event.step.before, () => listeners++);
    event.dispatcher.addListener(event.step.after, () => listeners++);
    event.dispatcher.addListener(event.step.failed, (step) => {
      listeners++;
      expect(step.endTime).toBeTruthy();
      expect(step.startTime).toBeTruthy();
    });

    return I.die()
      .then(() => listeners = 0)
      .catch(() => null)
      .then(() => {
        expect(listeners).toEqual(3);
      });
  });
});
