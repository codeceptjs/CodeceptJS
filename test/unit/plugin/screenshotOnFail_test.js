const expect = require('expect');
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
      WebDriver: {
        options: {},
        saveScreenshot: screenshotSaved,
      },
    });
  });

  it('should remove the . at the end of test title', async () => {
    screenshotOnFail({});
    event.dispatcher.emit(event.test.failed, { title: 'test title.' });
    await recorder.promise();
    expect(screenshotSaved.called).toBeTruthy();
    expect('test_title.failed.png').toEqual(screenshotSaved.getCall(0).args[0]);
  });

  it('should exclude the data driven in failed screenshot file name', async () => {
    screenshotOnFail({});
    event.dispatcher.emit(event.test.failed, { title: 'Scenario with data driven | {"login":"admin","password":"123456"}' });
    await recorder.promise();
    expect(screenshotSaved.called).toBeTruthy();
    expect('Scenario_with_data_driven.failed.png').toEqual(screenshotSaved.getCall(0).args[0]);
  });

  it('should create screenshot on fail', async () => {
    screenshotOnFail({});
    event.dispatcher.emit(event.test.failed, { title: 'test1' });
    await recorder.promise();
    expect(screenshotSaved.called).toBeTruthy();
    expect('test1.failed.png').toEqual(screenshotSaved.getCall(0).args[0]);
  });

  it('should create screenshot with unique name', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1', uuid: 1 });
    await recorder.promise();
    expect(screenshotSaved.called).toBeTruthy();
    expect('test1_1.failed.png').toEqual(screenshotSaved.getCall(0).args[0]);
  });

  it('should create screenshot with unique name when uuid is null', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1' });
    await recorder.promise();
    expect(screenshotSaved.called).toBeTruthy();
    const fileName = screenshotSaved.getCall(0).args[0];
    const regexpFileName = /test1_[0-9]{10}.failed.png/;
    expect(fileName.match(regexpFileName).length).toEqual(1);
  });
  // TODO: write more tests for different options
});
