import { expect } from 'chai'
import sinon from 'sinon'
import screenshotOnFail from '../../../lib/plugin/screenshotOnFail.js'
import container from '../../../lib/container.js'
import event from '../../../lib/event.js'
import recorder from '../../../lib/recorder.js'
import { createTest } from '../../../lib/mocha/test.js'
import { deserializeSuite } from '../../../lib/mocha/suite.js'
import MochawesomeHelper from '../../../lib/helper/Mochawesome.js'

let screenshotSaved

describe('screenshotOnFail', () => {
  beforeEach(() => {
    recorder.reset()
    screenshotSaved = sinon.spy()
    container.clear({
      WebDriver: {
        options: {},
        saveScreenshot: screenshotSaved,
      },
    })
  })

  it('should remove the . at the end of test title', async () => {
    screenshotOnFail({})
    event.dispatcher.emit(event.test.failed, createTest('test title.'))
    await recorder.promise()
    expect(screenshotSaved.called).is.ok
    expect('test_title.failed.png').is.equal(screenshotSaved.getCall(0).args[0])
  })

  it('should exclude the data driven in failed screenshot file name', async () => {
    screenshotOnFail({})
    event.dispatcher.emit(event.test.failed, createTest('Scenario with data driven | {"login":"admin","password":"123456"}'))
    await recorder.promise()
    expect(screenshotSaved.called).is.ok
    expect('Scenario_with_data_driven.failed.png').is.equal(screenshotSaved.getCall(0).args[0])
  })

  it('should create screenshot on fail', async () => {
    screenshotOnFail({})
    event.dispatcher.emit(event.test.failed, createTest('test1'))
    await recorder.promise()
    expect(screenshotSaved.called).is.ok
    expect('test1.failed.png').is.equal(screenshotSaved.getCall(0).args[0])
  })

  it('should create screenshot with unique name', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true })

    const test = createTest('test1')
    const suite = deserializeSuite({ title: 'suite1' })
    test.addToSuite(suite)

    event.dispatcher.emit(event.test.failed, test)
    await recorder.promise()
    expect(screenshotSaved.called).is.ok
    expect(screenshotSaved.getCall(0).args[0]).not.to.include('/')
    expect(`test1_${test.uid}.failed.png`).is.equal(screenshotSaved.getCall(0).args[0])
  })

  it('should create screenshot with unique name when uid is null', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true })

    const test = createTest('test1')
    event.dispatcher.emit(event.test.failed, test)
    await recorder.promise()
    expect(screenshotSaved.called).is.ok
    const fileName = screenshotSaved.getCall(0).args[0]
    const regexpFileName = /test1_[0-9]{10}.failed.png/
    expect(fileName.match(regexpFileName).length).is.equal(1)
  })

  it('should create screenshot with unique name when uid is null', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true })

    const test = createTest('test1')
    event.dispatcher.emit(event.test.failed, test)
    await recorder.promise()
    expect(screenshotSaved.called).is.ok
    const fileName = screenshotSaved.getCall(0).args[0]
    const regexpFileName = /test1_[0-9]{10}.failed.png/
    expect(fileName.match(regexpFileName).length).is.equal(1)
  })

  it('should not save screenshot in BeforeSuite', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true })
    const test = createTest('test1')
    event.dispatcher.emit(event.test.failed, test, null, 'BeforeSuite')
    await recorder.promise()
    expect(!screenshotSaved.called).is.ok
  })

  it('should not save screenshot in AfterSuite', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true })
    const test = createTest('test1')
    event.dispatcher.emit(event.test.failed, test, null, 'AfterSuite')
    await recorder.promise()
    expect(!screenshotSaved.called).is.ok
  })

  it('should have the same unique file name as the mochawesome helper when the uuid is present', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true })
    const test = createTest('test1')
    test.uid = '1234'

    const helper = new MochawesomeHelper({ uniqueScreenshotNames: true })
    const spy = sinon.spy(helper, '_addContext')
    helper._failed(test)

    event.dispatcher.emit(event.test.failed, test)
    await recorder.promise()

    const screenshotFileName = screenshotSaved.getCall(0).args[0]
    expect(spy.getCall(0).args[1]).to.equal(screenshotFileName)
  })

  it('should have the same unique file name as the mochawesome helper when the uuid is not present', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true })
    const test = createTest('test1')

    const helper = new MochawesomeHelper({ uniqueScreenshotNames: true })
    const spy = sinon.spy(helper, '_addContext')
    helper._failed(test)

    event.dispatcher.emit(event.test.failed, test)
    await recorder.promise()

    const screenshotFileName = screenshotSaved.getCall(0).args[0]
    expect(spy.getCall(0).args[1]).to.equal(screenshotFileName)
  })
  // TODO: write more tests for different options
})
