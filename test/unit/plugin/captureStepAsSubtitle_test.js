const { expect } = require('chai');
const sinon = require('sinon');

const { v4: uuidv4 } = require('uuid');
const fsPromises = require('fs/promises');
const captureStepAsSubtitle = require('../../../lib/plugin/captureStepAsSubtitle');
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

  it('should capture subtitle as video artifact is present', async () => {
    captureStepAsSubtitle({});
    const fsMock = sinon.mock(fsPromises);

    const test = {
      id: uuidv4(),
      artifacts: {
        video: '../../lib/output/failedTest1.webm',
      },
    };

    fsMock.expects('writeFile')
      .once()
      .withArgs('../../lib/output/failedTest1.srt', '1\n00:00:00,000 --> 00:00:00,000\nI.click(Continue)\n\n');

    event.dispatcher.emit(event.test.before, test);
    const step1 = { name: 'click', actor: 'I', args: ['Continue'] };
    event.dispatcher.emit(event.step.started, step1);
    event.dispatcher.emit(event.step.finished, step1);
    event.dispatcher.emit(event.test.after, test);
    fsMock.verify();
  });
});
