const sinon = require('sinon');

const fsPromises = require('fs').promises;
const captureStepAsSubtitle = require('../../../lib/plugin/captureStepAsSubtitle');
const container = require('../../../lib/container');
const event = require('../../../lib/event');
const recorder = require('../../../lib/recorder');

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('captureStepAsSubtitle', () => {
  beforeEach(() => {
    container.clear({
      mock: {
        _session: () => {},
      },
    });
    recorder.start();
  });
  before(() => {
    captureStepAsSubtitle({});
  });

  it('should not capture subtitle as video artifact was missing', async () => {
    const fsMock = sinon.mock(fsPromises);

    const test = {};

    fsMock.expects('writeFile')
      .never();

    event.dispatcher.emit(event.test.before, test);
    const step1 = { name: 'see', actor: 'I', args: ['Test 1'] };
    event.dispatcher.emit(event.step.started, step1);
    event.dispatcher.emit(event.step.finished, step1);
    event.dispatcher.emit(event.test.after, test);
    fsMock.verify();
  });

  it('should capture subtitle as video artifact is present', async () => {
    const fsMock = sinon.mock(fsPromises);

    const test = {
      artifacts: {
        video: '../../lib/output/failedTest1.webm',
      },
    };

    fsMock.expects('writeFile')
      .once()
      .withExactArgs('../../lib/output/failedTest1.srt', sinon.match((value) => {
        return value.match(/^1\n[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\s-->\s[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\nI\.click\(Continue\)\n\n$/gm);
      }));

    event.dispatcher.emit(event.test.before, test);
    const step1 = { name: 'click', actor: 'I', args: ['Continue'] };
    event.dispatcher.emit(event.step.started, step1);
    event.dispatcher.emit(event.step.finished, step1);
    event.dispatcher.emit(event.test.after, test);
    fsMock.verify();
  });

  it('should capture mutiple steps as subtitle', async () => {
    const fsMock = sinon.mock(fsPromises);

    const test = {
      artifacts: {
        video: '../../lib/output/failedTest1.webm',
      },
    };

    fsMock.expects('writeFile')
      .once()
      .withExactArgs('../../lib/output/failedTest1.srt', sinon.match((value) => {
        return value.match(/^1\n[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\s-->\s[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\nI\.click\(Continue\)\n\n2\n[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\s-->\s[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\nI\.see\(Github\)\n\n$/gm);
      }));

    event.dispatcher.emit(event.test.before, test);
    const step1 = { name: 'click', actor: 'I', args: ['Continue'] };
    const step2 = { name: 'see', actor: 'I', args: ['Github'] };
    event.dispatcher.emit(event.step.started, step1);
    event.dispatcher.emit(event.step.started, step2);
    event.dispatcher.emit(event.step.finished, step2);
    await sleep(300);

    event.dispatcher.emit(event.step.finished, step1);
    event.dispatcher.emit(event.test.after, test);
    fsMock.verify();
  });

  it('should capture seperate steps for separate tests', async () => {
    const fsMock = sinon.mock(fsPromises);

    const test1 = {
      artifacts: {
        video: '../../lib/output/failedTest1.webm',
      },
    };

    fsMock.expects('writeFile')
      .once()
      .withExactArgs('../../lib/output/failedTest1.srt', sinon.match((value) => {
        return value.match(/^1\n[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\s-->\s[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\nI\.click\(Continue\)\n\n2\n[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\s-->\s[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\nI\.see\(Github\)\n\n$/gm);
      }));

    event.dispatcher.emit(event.test.before, test1);
    const step1 = { name: 'click', actor: 'I', args: ['Continue'] };
    const step2 = { name: 'see', actor: 'I', args: ['Github'] };
    event.dispatcher.emit(event.step.started, step1);
    event.dispatcher.emit(event.step.started, step2);
    event.dispatcher.emit(event.step.finished, step2);
    await sleep(300);

    event.dispatcher.emit(event.step.finished, step1);
    event.dispatcher.emit(event.test.after, test1);
    fsMock.verify();
    fsMock.restore();

    /**
     * To Ensure that when multiple tests are run steps are not incorrectly captured
     */
    const fsMock1 = sinon.mock(fsPromises);
    fsMock1.expects('writeFile')
      .once()
      .withExactArgs('../../lib/output/failedTest2.srt', sinon.match((value) => {
        return value.match(/^1\n[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\s-->\s[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}\nI\.click\(Login\)\n\n$/gm);
      }));
    const test2 = {
      artifacts: {
        video: '../../lib/output/failedTest2.webm',
      },
    };

    event.dispatcher.emit(event.test.before, test2);
    const step3 = { name: 'click', actor: 'I', args: ['Login'] };
    event.dispatcher.emit(event.step.started, step3);
    await sleep(300);

    event.dispatcher.emit(event.step.finished, step3);
    event.dispatcher.emit(event.test.after, test2);
    fsMock1.verify();
  });
});
