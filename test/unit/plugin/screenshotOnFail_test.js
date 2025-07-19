let expect
import('chai').then(chai => {
  expect = chai.expect
})
const sinon = require('sinon')

const screenshotOnFail = require('../../../lib/plugin/screenshotOnFail')
const containerModule = require('../../../lib/container')
const container = containerModule.default || containerModule
const eventModule = require('../../../lib/event')
const event = eventModule.default || eventModule
const recorder = require('../../../lib/recorder')
const { createTest } = require('../../../lib/mocha/test')
const { deserializeSuite } = require('../../../lib/mocha/suite')
const MochawesomeHelper = require('../../../lib/helper/Mochawesome')

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
    const regexpFileName = /test1_[0-9]{13}.failed.png/
    expect(fileName.match(regexpFileName).length).is.equal(1)
  })

  it('should create screenshot with unique name when uid is null', async () => {
    screenshotOnFail({ uniqueScreenshotNames: true })

    const test = createTest('test1')
    event.dispatcher.emit(event.test.failed, test)
    await recorder.promise()
    expect(screenshotSaved.called).is.ok
    const fileName = screenshotSaved.getCall(0).args[0]
    const regexpFileName = /test1_[0-9]{13}.failed.png/
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

    // Use sinon to stub Date.now to return consistent timestamp
    const clock = sinon.useFakeTimers(1755596785000) // Fixed timestamp

    const helper = new MochawesomeHelper({ uniqueScreenshotNames: true })
    const spy = sinon.spy(helper, '_addContext')
    helper._failed(test)

    event.dispatcher.emit(event.test.failed, test)
    await recorder.promise()

    clock.restore()

    const screenshotFileName = screenshotSaved.getCall(0).args[0]
    expect(spy.getCall(0).args[1]).to.equal(screenshotFileName)
  })

  describe('Data() scenarios', () => {
    let savedFilenames = []

    beforeEach(() => {
      savedFilenames = []

      // Override screenshotSaved to capture filenames
      screenshotSaved = sinon.stub().callsFake(filename => {
        savedFilenames.push(filename)
        return Promise.resolve()
      })

      container.clear({
        WebDriver: {
          options: {},
          saveScreenshot: screenshotSaved,
        },
      })
    })

    it('should generate unique screenshot names for Data() iterations with uniqueScreenshotNames: true', async () => {
      screenshotOnFail({ uniqueScreenshotNames: true })

      // Simulate Data() test scenario - same test title, different data
      const dataScenario1 = createTest('test something | {"nr":"1","url":"http://codecept.io"}')
      const dataScenario2 = createTest('test something | {"nr":"2","url":"http://playwright.dev"}')

      // Both tests don't have uid (typical for Data() scenarios)
      dataScenario1.uid = null
      dataScenario2.uid = null

      // Use fake timers to control timing but allow small progression
      const clock = sinon.useFakeTimers(1731340123000)

      // Emit first failure
      event.dispatcher.emit(event.test.failed, dataScenario1)
      await recorder.promise()

      // Advance time slightly (simulate quick succession like Data() iterations)
      clock.tick(100) // 100ms later

      // Emit second failure
      event.dispatcher.emit(event.test.failed, dataScenario2)
      await recorder.promise()

      clock.restore()

      // Verify both screenshots were attempted
      expect(screenshotSaved.callCount).to.equal(2)

      // Get the generated filenames
      const filename1 = savedFilenames[0]
      const filename2 = savedFilenames[1]

      // Verify filenames are different (no collision)
      expect(filename1).to.not.equal(filename2, `Screenshot filenames should be unique for Data() iterations. Got: ${filename1} and ${filename2}`)

      // Verify both contain the base test name (without data part)
      expect(filename1).to.include('test_something')
      expect(filename2).to.include('test_something')

      // Verify both have unique suffixes (timestamp-based)
      expect(filename1).to.match(/test_something_[0-9]{13}\.failed\.png/)
      expect(filename2).to.match(/test_something_[0-9]{13}\.failed\.png/)
    })

    it('should generate same filename for Data() iterations with uniqueScreenshotNames: false', async () => {
      screenshotOnFail({ uniqueScreenshotNames: false })

      // Same scenario but without unique names
      const dataScenario1 = createTest('test something | {"nr":"1","url":"http://codecept.io"}')
      const dataScenario2 = createTest('test something | {"nr":"2","url":"http://playwright.dev"}')

      // Emit failures
      event.dispatcher.emit(event.test.failed, dataScenario1)
      await recorder.promise()

      event.dispatcher.emit(event.test.failed, dataScenario2)
      await recorder.promise()

      // Verify both screenshots were attempted
      expect(screenshotSaved.callCount).to.equal(2)

      // Get the generated filenames
      const filename1 = savedFilenames[0]
      const filename2 = savedFilenames[1]

      // With uniqueScreenshotNames: false, both should have the same base name
      expect(filename1).to.equal('test_something.failed.png')
      expect(filename2).to.equal('test_something.failed.png')
    })
  })

  // TODO: write more tests for different options
})
