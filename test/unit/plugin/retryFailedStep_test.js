const retryFailedStep = require('../../../lib/plugin/retryFailedStep');
const within = require('../../../lib/within');
const session = require('../../../lib/session');
const container = require('../../../lib/container');
const event = require('../../../lib/event');
const recorder = require('../../../lib/recorder');

describe('retryFailedStep', () => {
  beforeEach(() => {
    container.clear({
      mock: {
        _session: () => {},
      },
    });
    recorder.start();
  });

  afterEach(() => {
    event.dispatcher.emit(event.step.finished, { });
  });

  it('should retry failed step', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 });
    event.dispatcher.emit(event.test.before, {});
    event.dispatcher.emit(event.step.started, { name: 'click' });

    let counter = 0;
    recorder.add(() => {
      counter++;
      if (counter < 3) {
        throw new Error();
      }
    });
    return recorder.promise();
  });
  it('should not retry within', async () => {
    retryFailedStep({ retries: 1, minTimeout: 1 });
    event.dispatcher.emit(event.test.before, {});

    let counter = 0;
    event.dispatcher.emit(event.step.started, { name: 'click' });
    try {
      within('foo', () => {
        recorder.add(() => {
          counter++;
          throw new Error();
        });
      });
      await recorder.promise();
    } catch (e) {
      recorder.catchWithoutStop((err) => {});
    }

    // expects to retry only once
    counter.should.equal(2);
  });

  it('should not retry steps with wait*', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 });
    event.dispatcher.emit(event.test.before, {});

    let counter = 0;
    event.dispatcher.emit(event.step.started, { name: 'waitForElement' });
    try {
      recorder.add(() => {
        counter++;
        if (counter < 3) {
          throw new Error();
        }
      });
      await recorder.promise();
    } catch (e) {
      recorder.catchWithoutStop((err) => {
      });
    }

    counter.should.equal(1);
    // expects to retry only once
  });

  it('should not retry steps with amOnPage', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1 });
    event.dispatcher.emit(event.test.before, {});

    let counter = 0;
    event.dispatcher.emit(event.step.started, { name: 'amOnPage' });
    try {
      recorder.add(() => {
        counter++;
        if (counter < 3) {
          throw new Error();
        }
      });
      await recorder.promise();
    } catch (e) {
      recorder.catchWithoutStop((err) => {
      });
    }

    counter.should.equal(1);
    // expects to retry only once
  });

  it('should add custom steps to ignore', async () => {
    retryFailedStep({ retries: 2, minTimeout: 1, ignoredSteps: ['somethingNew*'] });
    event.dispatcher.emit(event.test.before, {});

    let counter = 0;
    event.dispatcher.emit(event.step.started, { name: 'somethingNew' });
    try {
      recorder.add(() => {
        counter++;
        if (counter < 3) {
          throw new Error();
        }
      });
      await recorder.promise();
    } catch (e) {
      recorder.catchWithoutStop((err) => {
      });
    }

    counter.should.equal(1);
    // expects to retry only once
  });

  it('should not retry session', async () => {
    retryFailedStep({ retries: 1, minTimeout: 1 });
    event.dispatcher.emit(event.test.before, {});
    event.dispatcher.emit(event.step.started, { name: 'click' });
    let counter = 0;

    try {
      session('foo', () => {
        recorder.add(() => {
          counter++;
          throw new Error();
        });
      });
      await recorder.promise();
    } catch (e) {
      recorder.catchWithoutStop((err) => {});
    }

    // expects to retry only once
    counter.should.equal(2);
  });
});
