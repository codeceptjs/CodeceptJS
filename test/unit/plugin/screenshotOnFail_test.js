const { expect } = require('chai');
const sinon = require('sinon');

const screenshotOnFail = require('../../../lib/plugin/screenshotOnFail');
const container = require('../../../lib/container');
const event = require('../../../lib/event');
const recorder = require('../../../lib/recorder');

const WebDriver = require('../../../lib/helper/WebDriver');

let webDriverStub;

describe('screenshotOnFail', () => {
  beforeEach(() => {
    webDriverStub = sinon.createStubInstance(WebDriver);
    recorder.reset();
    container.clear({
      WebDriver: webDriverStub,
    });
  });

  it('should exclude the data driven in failed screenshot file name', async () => {
    screenshotOnFail({});
    event.dispatcher.emit(event.test.failed, { title: 'Scenario with data driven | {"login":"admin","password":"123456"}' });
    await recorder.promise();
    expect(webDriverStub.saveScreenshot.called).is.ok;
    expect('Scenario_with_data_driven.failed.png').is.equal(webDriverStub.saveScreenshot.getCall(0).args[0]);
  });

  it('should create screenshot on fail', async () => {
    screenshotOnFail({});
    event.dispatcher.emit(event.test.failed, { title: 'test1' });
    await recorder.promise();
    expect(webDriverStub.saveScreenshot.called).is.ok;
    expect('test1.failed.png').is.equal(webDriverStub.saveScreenshot.getCall(0).args[0]);
  });

  it('should create screenshot with unique name', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1', uuid: 1 });
    await recorder.promise();
    expect(webDriverStub.saveScreenshot.called).is.ok;
    expect('test1_1.failed.png').is.equal(webDriverStub.saveScreenshot.getCall(0).args[0]);
  });

  it('should create screenshot with unique name when uuid is null', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1' });
    await recorder.promise();
    expect(webDriverStub.saveScreenshot.called).is.ok;
    const fileName = webDriverStub.saveScreenshot.getCall(0).args[0];
    const regexpFileName = /test1_[0-9]{10}.failed.png/;
    expect(fileName.match(regexpFileName).length).is.equal(1);
  });

  // TODO: write more tests for different options
});
