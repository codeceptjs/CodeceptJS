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
      .withArgs('../../lib/output/failedTest1.srt', sinon.match((value) => {
        return value.match(/1\n[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\s-->\s[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\nI\.click\(Continue\)\n\n/gm);
      }));

    event.dispatcher.emit(event.test.before, test);
    const step1 = { name: 'click', actor: 'I', args: ['Continue'] };
    event.dispatcher.emit(event.step.started, step1);
    event.dispatcher.emit(event.step.finished, step1);
    event.dispatcher.emit(event.test.after, test);
    fsMock.verify();
  });
});
