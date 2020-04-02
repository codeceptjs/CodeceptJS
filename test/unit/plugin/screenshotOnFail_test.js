const assert = require('assert');
const sinon = require('sinon');

const screenshotOnFail = require('../../../lib/plugin/screenshotOnFail');
const container = require('../../../lib/container');
const event = require('../../../lib/event');
const recorder = require('../../../lib/recorder');

let screenshotSaved;

describe('screenshotOnFail', () => {
  beforeEach(() => {
    recorder.reset();
    screenshotSaved = sinon.spy();
    container.clear({
      WebDriverIO: {
        options: {},
        saveScreenshot: screenshotSaved,
      },
    });
  });

  it('should exclude the data driven in failed screenshot file name', async () => {
    screenshotOnFail({});
    event.dispatcher.emit(event.test.failed, { title: 'Scenario with data driven | {"login":"admin","password":"123456"}' });
    await recorder.promise();
    assert.ok(screenshotSaved.called);
    assert.equal('Scenario_with_data_driven.failed.png', screenshotSaved.getCall(0).args[0]);
  });

  it('should create screenshot on fail', async () => {
    screenshotOnFail({});
    event.dispatcher.emit(event.test.failed, { title: 'test1' });
    await recorder.promise();
    assert.ok(screenshotSaved.called);
    assert.equal('test1.failed.png', screenshotSaved.getCall(0).args[0]);
  });

  it('should create screenshot with unique name', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1', uuid: 1 });
    await recorder.promise();
    assert.ok(screenshotSaved.called);
    assert.equal('test1_1.failed.png', screenshotSaved.getCall(0).args[0]);
  });
  
  it('should create screenshot with unique name when uuid is null', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1' });
    await recorder.promise();
    assert.ok(screenshotSaved.called);
    const fileName = screenshotSaved.getCall(0).args[0];
    const regexpFileName = /test1_[0-9]{10}.failed.png/;
    assert.equal(fileName.match(regexpFileName).length, 1);
  });


  // TODO: write more tests for different options
});
