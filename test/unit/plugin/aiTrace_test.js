import { expect } from 'chai'
import sinon from 'sinon'
import aiTrace from '../../../lib/plugin/aiTrace.js'
import container from '../../../lib/container.js'
import event from '../../../lib/event.js'
import recorder from '../../../lib/recorder.js'
import output from '../../../lib/output.js'
import { createTest } from '../../../lib/mocha/test.js'
import path from 'path'
import fs from 'fs'

const testsDir = path.join(process.cwd(), 'test/output')

describe('aiTrace plugin', () => {
  let helperStub

  beforeEach(() => {
    recorder.reset()

    helperStub = {
      saveScreenshot: sinon.stub().resolves(),
      grabSource: sinon.stub().resolves('<html></html>'),
      grabAriaSnapshot: sinon.stub().resolves('- region\n- text: Test'),
      grabBrowserLogs: sinon.stub().resolves([]),
    }

    container.clear({
      Playwright: helperStub,
    })

    sinon.stub(output, 'print')
  })

  afterEach(() => {
    sinon.restore()
    event.dispatcher.removeAllListeners(event.test.before)
    event.dispatcher.removeAllListeners(event.test.after)
    event.dispatcher.removeAllListeners(event.test.passed)
    event.dispatcher.removeAllListeners(event.test.failed)
    event.dispatcher.removeAllListeners(event.step.after)
  })

  it('should save artifacts for each step', async () => {
    aiTrace({
      enabled: true,
      output: testsDir,
    })

    const test = createTest('test one')
    event.dispatcher.emit(event.test.before, test)
    await recorder.promise()

    const step = {
      title: 'amOnPage',
      toString: () => 'I am on page',
      meta: { url: 'https://example.com' },
      status: 'success',
      startTime: Date.now(),
      endTime: Date.now() + 100,
    }

    event.dispatcher.emit(event.step.after, step)
    await recorder.promise()

    expect(helperStub.saveScreenshot.calledOnce).to.be.true
    expect(helperStub.grabSource.calledOnce).to.be.true
    expect(helperStub.grabAriaSnapshot.calledOnce).to.be.true
    expect(helperStub.grabBrowserLogs.calledOnce).to.be.true
  })

  it('should generate trace on test passed', async () => {
    aiTrace({
      enabled: true,
      output: testsDir,
    })

    const test = createTest('test one')
    test.art = {}

    event.dispatcher.emit(event.test.before, test)
    await recorder.promise()

    const step = {
      title: 'see',
      toString: () => 'I see test',
      status: 'success',
      startTime: Date.now(),
      endTime: Date.now() + 100,
    }

    event.dispatcher.emit(event.step.after, step)
    await recorder.promise()

    event.dispatcher.emit(event.test.passed, test)
    await recorder.promise()

    expect(test.artifacts.aiTrace).to.be.ok
    expect(test.artifacts.aiTrace).to.include('trace.md')
  })

  it('should generate trace on test failed', async () => {
    aiTrace({
      enabled: true,
      output: testsDir,
    })

    const test = createTest('test one')
    test.art = {
      message: 'Element not found',
      stack: 'Error',
    }

    event.dispatcher.emit(event.test.before, test)
    await recorder.promise()

    const step = {
      title: 'see',
      toString: () => 'I see test',
      status: 'failed',
      startTime: Date.now(),
      endTime: Date.now() + 100,
    }

    event.dispatcher.emit(event.step.after, step)
    await recorder.promise()

    event.dispatcher.emit(event.test.failed, test)
    await recorder.promise()

    expect(test.artifacts.aiTrace).to.be.ok
  })

  it('should ignore steps matching ignoreSteps pattern', async () => {
    aiTrace({
      enabled: true,
      output: testsDir,
      ignoreSteps: [/^grab/],
    })

    const test = createTest('test one')
    event.dispatcher.emit(event.test.before, test)
    await recorder.promise()

    const step = {
      title: 'grabText',
      toString: () => 'I grab text',
      status: 'success',
      startTime: Date.now(),
      endTime: Date.now() + 100,
    }
    event.dispatcher.emit(event.step.after, step)
    await recorder.promise()

    expect(helperStub.saveScreenshot.called).to.be.false
  })

  it('should not save duplicate steps', async () => {
    aiTrace({
      enabled: true,
      output: testsDir,
    })

    const test = createTest('test one')
    event.dispatcher.emit(event.test.before, test)
    await recorder.promise()

    const step = {
      title: 'see',
      toString: () => 'I see test',
      status: 'success',
      startTime: Date.now(),
      endTime: Date.now() + 100,
    }

    event.dispatcher.emit(event.step.after, step)
    await recorder.promise()

    event.dispatcher.emit(event.step.after, step)
    await recorder.promise()

    expect(helperStub.saveScreenshot.calledOnce).to.be.true
  })

  it('should not create trace for BeforeSuite failures', async () => {
    aiTrace({
      enabled: true,
      output: testsDir,
    })

    const test = createTest('test one')
    test.artifacts = {}
    event.dispatcher.emit(event.test.before, test)
    await recorder.promise()

    event.dispatcher.emit(event.test.failed, test, null, 'BeforeSuite')
    await recorder.promise()

    expect(test.artifacts.aiTrace).to.be.undefined
  })

  it('should not create trace for AfterSuite failures', async () => {
    aiTrace({
      enabled: true,
      output: testsDir,
    })

    const test = createTest('test one')
    test.artifacts = {}
    event.dispatcher.emit(event.test.before, test)
    await recorder.promise()

    event.dispatcher.emit(event.test.failed, test, null, 'AfterSuite')
    await recorder.promise()

    expect(test.artifacts.aiTrace).to.be.undefined
  })

  describe('Artifact capture options', () => {
    it('should not capture HTML when captureHTML is false', async () => {
      aiTrace({
        enabled: true,
        output: testsDir,
        captureHTML: false,
      })

      const test = createTest('test one')
      event.dispatcher.emit(event.test.before, test)
      await recorder.promise()

      const step = {
        title: 'amOnPage',
        toString: () => 'I am on page',
        status: 'success',
        startTime: Date.now(),
        endTime: Date.now() + 100,
      }

      event.dispatcher.emit(event.step.after, step)
      await recorder.promise()

      expect(helperStub.grabSource.called).to.be.false
    })

    it('should not capture ARIA when captureARIA is false', async () => {
      aiTrace({
        enabled: true,
        output: testsDir,
        captureARIA: false,
      })

      const test = createTest('test one')
      event.dispatcher.emit(event.test.before, test)
      await recorder.promise()

      const step = {
        title: 'amOnPage',
        toString: () => 'I am on page',
        status: 'success',
        startTime: Date.now(),
        endTime: Date.now() + 100,
      }

      event.dispatcher.emit(event.step.after, step)
      await recorder.promise()

      expect(helperStub.grabAriaSnapshot.called).to.be.false
    })

    it('should not capture browser logs when captureBrowserLogs is false', async () => {
      aiTrace({
        enabled: true,
        output: testsDir,
        captureBrowserLogs: false,
      })

      const test = createTest('test one')
      event.dispatcher.emit(event.test.before, test)
      await recorder.promise()

      const step = {
        title: 'amOnPage',
        toString: () => 'I am on page',
        status: 'success',
        startTime: Date.now(),
        endTime: Date.now() + 100,
      }

      event.dispatcher.emit(event.step.after, step)
      await recorder.promise()

      expect(helperStub.grabBrowserLogs.called).to.be.false
    })
  })

  describe('Failed step handling', () => {
    it('should skip queued steps after test fails', async () => {
      aiTrace({
        enabled: true,
        output: testsDir,
      })

      event.dispatcher.emit(event.suite.before, {})
      await recorder.promise()

      const test = createTest('failing test')
      test.art = { message: 'Test failed' }

      event.dispatcher.emit(event.test.before, test)
      await recorder.promise()

      const step1 = {
        title: 'see',
        toString: () => 'I see success',
        status: 'success',
        startTime: Date.now(),
        endTime: Date.now() + 100,
      }

      const step2 = {
        title: 'click',
        toString: () => 'I click button',
        status: 'failed',
        startTime: Date.now() + 100,
        endTime: Date.now() + 200,
      }

      const step3 = {
        title: 'fillField',
        toString: () => 'I fill field',
        status: 'queued',
        startTime: Date.now() + 200,
        endTime: Date.now() + 300,
      }

      event.dispatcher.emit(event.step.after, step1)
      await recorder.promise()

      event.dispatcher.emit(event.step.after, step2)
      await recorder.promise()

      event.dispatcher.emit(event.step.after, step3)
      await recorder.promise()

      event.dispatcher.emit(event.test.failed, test)
      await recorder.promise()

      expect(helperStub.saveScreenshot.calledTwice).to.be.true
    })
  })

  describe('Step file naming', () => {
    it('should use step names in file names instead of just numbers', async () => {
      aiTrace({
        enabled: true,
        output: testsDir,
      })

      event.dispatcher.emit(event.suite.before, {})
      await recorder.promise()

      const test = createTest('naming test')
      event.dispatcher.emit(event.test.before, test)
      await recorder.promise()

      const step = {
        title: 'see',
        toString: () => 'I see "Test Element"',
        status: 'success',
        startTime: Date.now(),
        endTime: Date.now() + 100,
      }

      event.dispatcher.emit(event.step.after, step)
      await recorder.promise()

      expect(helperStub.saveScreenshot.calledOnce).to.be.true

      const screenshotPath = helperStub.saveScreenshot.firstCall.args[0]
      expect(screenshotPath).to.include('I_see_Test_Element')
      expect(screenshotPath).to.match(/_I_see_Test_Element_screenshot\.png$/)
    })
  })

  describe('Directory cleanup', () => {
    it('should clean directory before each test run', async () => {
      aiTrace({
        enabled: true,
        output: testsDir,
      })

      event.dispatcher.emit(event.suite.before, {})
      await recorder.promise()

      const test = createTest('cleanup test')
      event.dispatcher.emit(event.test.before, test)
      await recorder.promise()

      const step = {
        title: 'see',
        toString: () => 'I see test',
        status: 'success',
        startTime: Date.now(),
        endTime: Date.now() + 100,
      }

      event.dispatcher.emit(event.step.after, step)
      await recorder.promise()

      event.dispatcher.emit(event.test.passed, test)
      await recorder.promise()

      const traceFile = test.artifacts.aiTrace
      expect(traceFile).to.be.ok
      expect(fs.existsSync(traceFile)).to.be.true
    })
  })
})
