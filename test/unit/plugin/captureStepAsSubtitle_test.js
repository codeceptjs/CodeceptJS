const { expect } = require('chai');

const captureStepAsSubtitle = require('../../../lib/plugin/captureStepAsSubtitle');
const within = require('../../../lib/within');
const session = require('../../../lib/session');
const container = require('../../../lib/container');
const event = require('../../../lib/event');
const recorder = require('../../../lib/recorder');

describe('captureStepAsSubtitle', () => {
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
    captureStepAsSubtitle({ enabled: true });
    event.dispatcher.emit(event.test.before, {});
    event.dispatcher.emit(event.step.started, { name: 'click' });
    event.dispatcher.emit(event.step.started, { name: 'amOnPage' });
    event.dispatcher.emit(event.step.started, { name: 'click' });
    event.dispatcher.emit(event.step.started, { name: 'click' });
    event.dispatcher.emit(event.step.started, { name: 'click' });

    let counter = 0;
    recorder.add(() => {
      counter++;
      if (counter < 3) {
        throw new Error();
      }
    }, undefined, undefined, true);
    return recorder.promise();
  });
});
