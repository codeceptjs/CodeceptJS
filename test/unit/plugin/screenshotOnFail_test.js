let expect
import('chai').then(chai => {
  expect = chai.expect
})
const sinon = require('sinon')

const screenshotOnFail = require('../../../lib/plugin/screenshotOnFail')
const container = require('../../../lib/container')
const event = require('../../../lib/event')
const recorder = require('../../../lib/recorder')
const { createTest } = require('../../../lib/mocha/test')
const { deserializeSuite } = require('../../../lib/mocha/suite')
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
  // TODO: write more tests for different options
})
