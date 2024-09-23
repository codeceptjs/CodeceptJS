import { expect } from 'chai';
import sinon from 'sinon';
import screenshotOnFail from '../../../lib/plugin/screenshotOnFail.js';
import container from '../../../lib/container.js';
import * as event from '../../../lib/event.js';
import recorder from '../../../lib/recorder.js';

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
    expect(screenshotSaved.called).is.ok;
    expect('test_title.failed.png').is.equal(screenshotSaved.getCall(0).args[0]);
  });

  it('should exclude the data driven in failed screenshot file name', async () => {
    screenshotOnFail({});
    event.dispatcher.emit(event.test.failed, { title: 'Scenario with data driven | {"login":"admin","password":"123456"}' });
    await recorder.promise();
    expect(screenshotSaved.called).is.ok;
    expect('Scenario_with_data_driven.failed.png').is.equal(screenshotSaved.getCall(0).args[0]);
  });

  it('should create screenshot on fail', async () => {
    screenshotOnFail({});
    event.dispatcher.emit(event.test.failed, { title: 'test1' });
    await recorder.promise();
    expect(screenshotSaved.called).is.ok;
    expect('test1.failed.png').is.equal(screenshotSaved.getCall(0).args[0]);
  });

  it('should create screenshot with unique name', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1', uuid: 1 });
    await recorder.promise();
    expect(screenshotSaved.called).is.ok;
    expect('test1_1.failed.png').is.equal(screenshotSaved.getCall(0).args[0]);
  });

  it('should create screenshot with unique name when uuid is null', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1' });
    await recorder.promise();
    expect(screenshotSaved.called).is.ok;
    const fileName = screenshotSaved.getCall(0).args[0];
    const regexpFileName = /test1_[0-9]{10}.failed.png/;
    expect(fileName.match(regexpFileName).length).is.equal(1);
  });

  it('should not save screenshot in BeforeSuite', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1', ctx: { _runnable: { title: 'hook: BeforeSuite' } } });
    await recorder.promise();
    expect(screenshotSaved.called).to.be.false;
  });

  it('should not save screenshot in AfterSuite', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true });
    event.dispatcher.emit(event.test.failed, { title: 'test1', ctx: { _runnable: { title: 'hook: AfterSuite' } } });
    await recorder.promise();
    expect(screenshotSaved.called).to.be.false;
  });
  // TODO: write more tests for different options
});
