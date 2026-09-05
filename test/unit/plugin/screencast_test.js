import { expect } from 'chai'
import sinon from 'sinon'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'

import screencast from '../../../lib/plugin/screencast.js'
import container from '../../../lib/container.js'
import event from '../../../lib/event.js'
import recorder from '../../../lib/recorder.js'
import store from '../../../lib/store.js'
import { createTest } from '../../../lib/mocha/test.js'

function makeFakeScreencast() {
  return {
    start: sinon.stub().resolves(),
    stop: sinon.stub().resolves(),
    showActions: sinon.stub().resolves(),
    hideActions: sinon.stub().resolves(),
    showChapter: sinon.stub().resolves(),
  }
}

function fakeHelper(screencastApi) {
  return {
    options: {},
    page: screencastApi === undefined
      ? { screencast: makeFakeScreencast() }
      : screencastApi === null
        ? null
        : { screencast: screencastApi },
  }
}

function fakeCdpHelper(apngBuffer) {
  return {
    options: {},
    startScreencast: sinon.stub().resolves(),
    stopScreencast: sinon.stub().resolves(apngBuffer === undefined ? Buffer.from('fake-apng-bytes') : apngBuffer),
  }
}

function detachAll() {
  for (const evt of [
    event.test.before, event.test.started, event.test.after, event.test.failed,
    event.step.started, event.step.finished,
  ]) {
    event.dispatcher.removeAllListeners(evt)
  }
}

describe('screencast', () => {
  let unlinkStub
  let mkdirpStub
  let writeFileStub
  let outputDirOriginal

  beforeEach(() => {
    recorder.reset()
    recorder.start()
    outputDirOriginal = store.outputDir
    store.outputDir = '/tmp/codeceptjs-screencast-test'

    unlinkStub = sinon.stub(fs, 'unlinkSync')
    writeFileStub = sinon.stub(fsPromises, 'writeFile').resolves()
  })

  afterEach(() => {
    detachAll()
    sinon.restore()
    store.outputDir = outputDirOriginal
  })

  const aStep = () => ({ title: 'click', actor: 'I', args: ['x'] })

  it('on=test keeps the file on pass and sets test.artifacts.screencast', async () => {
    const sc = makeFakeScreencast()
    container.clear({ Playwright: { options: {}, page: { screencast: sc } } })

    screencast({ on: 'test' })
    const test = createTest('keep-on-pass')

    event.dispatcher.emit(event.test.before, test)
    event.dispatcher.emit(event.test.started, test)
    event.dispatcher.emit(event.step.started, aStep())
    await recorder.promise()

    event.dispatcher.emit(event.test.after, test)
    await recorder.promise()

    expect(sc.start.calledOnce).to.equal(true)
    expect(sc.stop.calledOnce).to.equal(true)
    expect(unlinkStub.called).to.equal(false)
    expect(test.artifacts.screencast).to.match(/keep-on-pass.*\.webm$/)
  })

  it('on=fail deletes the file on pass and leaves no artifact', async () => {
    const sc = makeFakeScreencast()
    container.clear({ Playwright: { options: {}, page: { screencast: sc } } })

    screencast({ on: 'fail' })
    const test = createTest('delete-on-pass')

    event.dispatcher.emit(event.test.before, test)
    event.dispatcher.emit(event.test.started, test)
    event.dispatcher.emit(event.step.started, aStep())
    await recorder.promise()

    event.dispatcher.emit(event.test.after, test)
    await recorder.promise()

    expect(sc.start.calledOnce).to.equal(true)
    expect(sc.stop.calledOnce).to.equal(true)
    expect(unlinkStub.calledOnce).to.equal(true)
    expect(unlinkStub.firstCall.args[0]).to.match(/delete-on-pass.*\.webm$/)
    expect(test.artifacts.screencast).to.equal(undefined)
  })

  it('on=fail keeps the file when test.failed fires', async () => {
    const sc = makeFakeScreencast()
    container.clear({ Playwright: { options: {}, page: { screencast: sc } } })

    screencast({ on: 'fail' })
    const test = createTest('keep-on-fail')

    event.dispatcher.emit(event.test.before, test)
    event.dispatcher.emit(event.test.started, test)
    event.dispatcher.emit(event.step.started, aStep())
    await recorder.promise()

    event.dispatcher.emit(event.test.failed, test, new Error('boom'))
    event.dispatcher.emit(event.test.after, test)
    await recorder.promise()

    expect(unlinkStub.called).to.equal(false)
    expect(test.artifacts.screencast).to.match(/keep-on-fail.*\.webm$/)
  })

  it('captions=true triggers showActions; captions=false does not', async () => {
    const sc = makeFakeScreencast()
    container.clear({ Playwright: { options: {}, page: { screencast: sc } } })

    screencast({ on: 'test', captions: true })
    let test = createTest('with-captions')
    event.dispatcher.emit(event.test.before, test)
    event.dispatcher.emit(event.test.started, test)
    event.dispatcher.emit(event.step.started, aStep())
    await recorder.promise()
    event.dispatcher.emit(event.test.after, test)
    await recorder.promise()
    expect(sc.showActions.calledOnce).to.equal(true)

    detachAll()
    sc.showActions.resetHistory()

    screencast({ on: 'test', captions: false })
    test = createTest('no-captions')
    event.dispatcher.emit(event.test.before, test)
    event.dispatcher.emit(event.test.started, test)
    event.dispatcher.emit(event.step.started, aStep())
    await recorder.promise()
    event.dispatcher.emit(event.test.after, test)
    await recorder.promise()
    expect(sc.showActions.called).to.equal(false)
  })

  it('subtitles=true writes an SRT alongside the webm', async () => {
    const sc = makeFakeScreencast()
    container.clear({ Playwright: { options: {}, page: { screencast: sc } } })

    screencast({ on: 'test', subtitles: true })
    const test = createTest('with-srt')

    event.dispatcher.emit(event.test.before, test)
    event.dispatcher.emit(event.test.started, test)
    await recorder.promise()

    const step = { title: 'click', actor: 'I', args: ['Continue'] }
    event.dispatcher.emit(event.step.started, step)
    event.dispatcher.emit(event.step.finished, step)
    event.dispatcher.emit(event.test.after, test)
    await recorder.promise()

    expect(writeFileStub.calledOnce).to.equal(true)
    const [target, body] = writeFileStub.firstCall.args
    expect(target).to.match(/with-srt.*\.srt$/)
    expect(body).to.match(/^1\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\nI\.click\(Continue\)\n\n$/)
    expect(test.artifacts.subtitle).to.equal(target)
  })

  it('video=false, subtitles=true skips screencast.start and writes SRT next to test.artifacts.video', async () => {
    const sc = makeFakeScreencast()
    container.clear({ Playwright: { options: {}, page: { screencast: sc } } })

    screencast({ on: 'test', video: false, subtitles: true })
    const test = createTest('srt-only')
    test.artifacts.video = '/tmp/some-video-dir/myrun.webm'

    event.dispatcher.emit(event.test.before, test)
    event.dispatcher.emit(event.test.started, test)
    const step = { title: 'see', actor: 'I', args: ['Github'] }
    event.dispatcher.emit(event.step.started, step)
    event.dispatcher.emit(event.step.finished, step)
    event.dispatcher.emit(event.test.after, test)
    await recorder.promise()

    expect(sc.start.called).to.equal(false)
    expect(writeFileStub.calledOnce).to.equal(true)
    expect(writeFileStub.firstCall.args[0]).to.equal('/tmp/some-video-dir/myrun.srt')
    expect(test.artifacts.subtitle).to.equal('/tmp/some-video-dir/myrun.srt')
  })

  it('warns once and bails when helper.page.screencast is missing', async () => {
    container.clear({ Playwright: { options: {}, page: {} } })

    screencast({ on: 'test' })
    const test = createTest('no-api')

    event.dispatcher.emit(event.test.before, test)
    event.dispatcher.emit(event.test.started, test)
    await recorder.promise()
    event.dispatcher.emit(event.test.after, test)
    await recorder.promise()

    expect(test.artifacts.screencast).to.equal(undefined)
    expect(unlinkStub.called).to.equal(false)
  })

  it('rejects invalid mode (on=step) without throwing', () => {
    container.clear({ Playwright: { options: {}, page: { screencast: makeFakeScreencast() } } })
    expect(() => screencast({ on: 'step' })).to.not.throw()
  })

  describe('CDP-family helpers (CDPBrowser/Obscura/Kitesurf)', () => {
    it('on=test keeps the file on pass and sets test.artifacts.screencast to .apng', async () => {
      const helper = fakeCdpHelper()
      container.clear({ Obscura: helper })

      screencast({ on: 'test' })
      const test = createTest('cdp-keep-on-pass')

      event.dispatcher.emit(event.test.before, test)
      event.dispatcher.emit(event.test.started, test)
      event.dispatcher.emit(event.step.started, aStep())
      await recorder.promise()

      event.dispatcher.emit(event.test.after, test)
      await recorder.promise()

      expect(helper.startScreencast.calledOnce).to.equal(true)
      expect(helper.stopScreencast.calledOnce).to.equal(true)
      expect(writeFileStub.calledOnce).to.equal(true)
      expect(writeFileStub.firstCall.args[0]).to.match(/cdp-keep-on-pass.*\.apng$/)
      expect(test.artifacts.screencast).to.match(/cdp-keep-on-pass.*\.apng$/)
    })

    it('on=fail does not write the apng on pass and leaves no artifact', async () => {
      const helper = fakeCdpHelper()
      container.clear({ Obscura: helper })

      screencast({ on: 'fail' })
      const test = createTest('cdp-delete-on-pass')

      event.dispatcher.emit(event.test.before, test)
      event.dispatcher.emit(event.test.started, test)
      event.dispatcher.emit(event.step.started, aStep())
      await recorder.promise()

      event.dispatcher.emit(event.test.after, test)
      await recorder.promise()

      expect(helper.startScreencast.calledOnce).to.equal(true)
      expect(helper.stopScreencast.calledOnce).to.equal(true)
      expect(writeFileStub.called).to.equal(false)
      expect(test.artifacts.screencast).to.equal(undefined)
    })

    it('on=fail keeps the apng when test.failed fires', async () => {
      const helper = fakeCdpHelper()
      container.clear({ Obscura: helper })

      screencast({ on: 'fail' })
      const test = createTest('cdp-keep-on-fail')

      event.dispatcher.emit(event.test.before, test)
      event.dispatcher.emit(event.test.started, test)
      event.dispatcher.emit(event.step.started, aStep())
      await recorder.promise()

      event.dispatcher.emit(event.test.failed, test, new Error('boom'))
      event.dispatcher.emit(event.test.after, test)
      await recorder.promise()

      expect(writeFileStub.calledOnce).to.equal(true)
      expect(test.artifacts.screencast).to.match(/cdp-keep-on-fail.*\.apng$/)
    })

    it('does not write an apng when stopScreencast returns null (no frames captured)', async () => {
      const helper = fakeCdpHelper(null)
      container.clear({ Obscura: helper })

      screencast({ on: 'test' })
      const test = createTest('cdp-no-frames')

      event.dispatcher.emit(event.test.before, test)
      event.dispatcher.emit(event.test.started, test)
      event.dispatcher.emit(event.step.started, aStep())
      await recorder.promise()

      event.dispatcher.emit(event.test.after, test)
      await recorder.promise()

      expect(writeFileStub.called).to.equal(false)
      expect(test.artifacts.screencast).to.equal(undefined)
    })

    it('does not touch page.screencast on the CDP path (captions/showActions are Playwright-only)', async () => {
      const helper = fakeCdpHelper()
      container.clear({ Obscura: helper })

      screencast({ on: 'test', captions: true })
      const test = createTest('cdp-no-captions-api')

      event.dispatcher.emit(event.test.before, test)
      event.dispatcher.emit(event.test.started, test)
      await recorder.promise()
      event.dispatcher.emit(event.test.after, test)
      await recorder.promise()

      expect(helper.page).to.equal(undefined)
      expect(helper.startScreencast.calledOnce).to.equal(true)
    })

    it('subtitles=true writes an SRT alongside the apng', async () => {
      const helper = fakeCdpHelper()
      container.clear({ Obscura: helper })

      screencast({ on: 'test', subtitles: true })
      const test = createTest('cdp-with-srt')

      event.dispatcher.emit(event.test.before, test)
      event.dispatcher.emit(event.test.started, test)
      await recorder.promise()

      const step = { title: 'click', actor: 'I', args: ['Continue'] }
      event.dispatcher.emit(event.step.started, step)
      event.dispatcher.emit(event.step.finished, step)
      event.dispatcher.emit(event.test.after, test)
      await recorder.promise()

      const srtCall = writeFileStub.getCalls().find(c => /\.srt$/.test(c.args[0]))
      expect(srtCall, 'expected a .srt write').to.exist
      expect(test.artifacts.subtitle).to.match(/cdp-with-srt.*\.srt$/)
    })
  })
})
