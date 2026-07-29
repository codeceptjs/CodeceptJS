import fs from 'fs'
import os from 'os'
import path from 'path'
import { assert, expect } from 'chai'
import { describe, it, beforeEach, afterEach } from 'mocha'
import xml2js from 'xml2js'

import junitReporter from '../../lib/plugin/junitReporter.js'
import event from '../../lib/event.js'
import store from '../../lib/store.js'
import { BeforeSuiteHook, BeforeHook } from '../../lib/mocha/hooks.js'
import Step from '../../lib/step/base.js'
import MetaStep from '../../lib/step/meta.js'

function step(name, args, status) {
  const s = new Step(name)
  s.args = args
  s.status = status
  s.startTime = 1000
  s.endTime = 1042
  return s
}

function metaStep(actor, method, args, status) {
  const m = new MetaStep(actor, method)
  m.args = args
  m.status = status
  m.startTime = 1000
  m.endTime = 1310
  return m
}

function makeResult() {
  const loginSuite = { title: 'Login', file: '/tests/login_test.js', startedAt: Date.now() }
  const dashSuite = { title: 'Dashboard', file: '/tests/dashboard_test.js', startedAt: Date.now() }

  const login = metaStep('user', 'login', ['joe'], 'success')
  const passed = {
    title: 'logs in successfully',
    state: 'passed',
    duration: 1234,
    uid: 'pass-1',
    parent: loginSuite,
    file: loginSuite.file,
    tags: ['@important', '@smoke'],
    meta: { severity: 'critical', owner: 'qa-team' },
    steps: [step('amOnPage', ['/login'], 'success'), step('fillField', ['login', 'joe'], 'success'), step('click', ['Sign in'], 'success'), step('see', ['Welcome'], 'success')],
  }
  passed.steps[1].setMetaStep(login)
  passed.steps[2].setMetaStep(login)

  const failLogin = metaStep('user', 'login', ['bad'], 'failed')
  const failed = {
    title: 'fails to log in',
    state: 'failed',
    duration: 567,
    uid: 'fail-1',
    parent: loginSuite,
    file: loginSuite.file,
    meta: {},
    err: new Error('expected dashboard to be visible'),
    steps: [step('amOnPage', ['/login'], 'success'), step('fillField', ['login', 'bad'], 'failed')],
  }
  failed.steps[1].setMetaStep(failLogin)

  const skipped = {
    title: 'shows widgets',
    state: 'skipped',
    uid: 'skip-1',
    parent: dashSuite,
    file: dashSuite.file,
    meta: {},
    steps: [],
  }

  return {
    tests: [passed, failed, skipped],
    stats: { start: new Date(), passes: 1, failures: 1, pending: 1, tests: 3 },
    duration: 4321,
  }
}

function parseReport(dir) {
  return new xml2js.Parser().parseStringPromise(fs.readFileSync(path.join(dir, 'report.xml'), 'utf8'))
}

describe('JUnit Reporter Plugin', () => {
  let tmpDir
  let prevOutputDir

  beforeEach(() => {
    prevOutputDir = store._outputDir
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cjs-junit-'))
    store.outputDir = tmpDir
    event.dispatcher.removeAllListeners(event.all.result)
    event.dispatcher.removeAllListeners(event.workers.result)
    event.dispatcher.removeAllListeners(event.hook.failed)
  })

  afterEach(() => {
    event.dispatcher.removeAllListeners(event.all.result)
    event.dispatcher.removeAllListeners(event.workers.result)
    event.dispatcher.removeAllListeners(event.hook.failed)
    store._outputDir = prevOutputDir
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('exports a default function', () => {
    assert.isFunction(junitReporter, 'junitReporter should export a default function')
  })

  it('writes a well-formed JUnit XML report on event.all.result', async () => {
    junitReporter({})
    event.dispatcher.emit(event.all.result, makeResult())

    const reportFile = path.join(tmpDir, 'report.xml')
    assert.isTrue(fs.existsSync(reportFile), 'report.xml should be created')

    const xml = fs.readFileSync(reportFile, 'utf8')
    assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/)

    const parsed = await parseReport(tmpDir)
    expect(parsed.testsuites.$.name).to.equal('CodeceptJS')
    expect(parsed.testsuites.$.tests).to.equal('3')
    expect(parsed.testsuites.$.failures).to.equal('1')
    expect(parsed.testsuites.$.skipped).to.equal('1')
    expect(parsed.testsuites.testsuite).to.have.length(2)
  })

  it('respects a custom outputName', () => {
    junitReporter({ outputName: 'junit-results.xml' })
    event.dispatcher.emit(event.all.result, makeResult())
    assert.isTrue(fs.existsSync(path.join(tmpDir, 'junit-results.xml')))
  })

  it('puts the test meta information into <properties>, not steps', async () => {
    junitReporter({})
    event.dispatcher.emit(event.all.result, makeResult())

    const parsed = await parseReport(tmpDir)
    const loginSuite = parsed.testsuites.testsuite.find(s => s.$.name === 'Login')
    const passedCase = loginSuite.testcase.find(c => c.$.name === 'logs in successfully')

    const props = {}
    for (const p of passedCase.properties[0].property) props[p.$.name] = p.$.value
    expect(props).to.deep.include({ severity: 'critical', owner: 'qa-team', tags: '@important @smoke' })
    expect(Object.keys(props)).to.not.include('step.1')
    expect(passedCase.properties[0].property.some(p => /^step\./.test(p.$.name))).to.be.false
  })

  it('writes the step/substep log to <system-out> without [passed] markers', async () => {
    junitReporter({})
    event.dispatcher.emit(event.all.result, makeResult())

    const parsed = await parseReport(tmpDir)
    const loginSuite = parsed.testsuites.testsuite.find(s => s.$.name === 'Login')
    const passedCase = loginSuite.testcase.find(c => c.$.name === 'logs in successfully')

    const systemOut = passedCase['system-out'][0]
    expect(systemOut).to.contain('am on page')
    expect(systemOut).to.contain('fill field')
    expect(systemOut).to.not.contain('[passed]')
    expect(systemOut).to.not.contain('[FAILED]')

    const lines = systemOut.split('\n')
    const fillFieldLine = lines.find(l => l.includes('fill field'))
    expect(fillFieldLine).to.match(/^\s{2,}/, 'substeps should be indented under their meta step')
  })

  it('records failures with message, stack and a step trace marking the failed step', async () => {
    junitReporter({})
    event.dispatcher.emit(event.all.result, makeResult())

    const parsed = await parseReport(tmpDir)
    const loginSuite = parsed.testsuites.testsuite.find(s => s.$.name === 'Login')
    const failedCase = loginSuite.testcase.find(c => c.$.name === 'fails to log in')

    expect(failedCase.failure).to.have.length(1)
    expect(failedCase.failure[0].$.message).to.contain('expected dashboard to be visible')
    expect(failedCase.failure[0].$.type).to.equal('Error')
    expect(failedCase.failure[0]._).to.contain('Steps:')
    expect(failedCase.failure[0]._).to.contain('[FAILED]')
  })

  it('marks skipped tests with a <skipped/> element', async () => {
    junitReporter({})
    event.dispatcher.emit(event.all.result, makeResult())

    const parsed = await parseReport(tmpDir)
    const dashSuite = parsed.testsuites.testsuite.find(s => s.$.name === 'Dashboard')
    const skippedCase = dashSuite.testcase.find(c => c.$.name === 'shows widgets')

    expect(skippedCase.skipped).to.exist
  })

  it('does not write the report twice when both result events fire', () => {
    junitReporter({})
    event.dispatcher.emit(event.all.result, makeResult())
    const firstMtime = fs.statSync(path.join(tmpDir, 'report.xml')).mtimeMs
    event.dispatcher.emit(event.workers.result, makeResult())
    const secondMtime = fs.statSync(path.join(tmpDir, 'report.xml')).mtimeMs
    expect(secondMtime).to.equal(firstMtime)
  })

  it('adds suite hook failures as failed testcases', async () => {
    junitReporter({})

    const suite = { title: 'Suite hooks @smoke', file: '/tests/hooks_test.js', tags: ['@smoke'], startedAt: Date.now() }
    const beforeSuiteRunnable = { title: '"before all" hook: BeforeSuite for "test something"', parent: suite, file: suite.file, duration: 42 }
    event.dispatcher.emit(event.hook.failed, new BeforeSuiteHook({ ctx: { test: beforeSuiteRunnable } }, new Error('BeforeSuite failed')))

    const beforeRunnable = { title: '"before each" hook: Before for "test something"', parent: suite, file: suite.file, duration: 7 }
    event.dispatcher.emit(event.hook.failed, new BeforeHook({ ctx: { test: beforeRunnable } }, new Error('Before failed')))

    event.dispatcher.emit(event.all.result, {
      tests: [],
      stats: { start: new Date(), passes: 0, failures: 0, pending: 0, tests: 0 },
    })

    const parsed = await parseReport(tmpDir)
    expect(parsed.testsuites.$.tests).to.equal('1')
    expect(parsed.testsuites.$.failures).to.equal('1')

    const suiteEl = parsed.testsuites.testsuite[0]
    expect(suiteEl.$.name).to.equal('Suite hooks @smoke')
    expect(suiteEl.testcase).to.have.length(1)
    expect(suiteEl.testcase[0].$.name).to.contain('"before all" hook: BeforeSuite')
    expect(suiteEl.testcase[0].failure[0].$.message).to.contain('BeforeSuite failed')

    const tagsProp = suiteEl.testcase[0].properties[0].property.find(p => p.$.name === 'tags')
    expect(tagsProp.$.value).to.equal('@smoke')
  })

  it('adds suite hook failures forwarded from workers as failed testcases', async () => {
    junitReporter({})

    event.dispatcher.emit(event.hook.failed, {
      hookName: 'AfterSuite',
      title: '"after all" hook: AfterSuite for "test something"',
      error: { message: 'AfterSuite failed', stack: 'Error: AfterSuite failed\n  at suite' },
    })

    event.dispatcher.emit(event.workers.result, {
      tests: [],
      stats: { start: new Date(), passes: 0, failures: 0, pending: 0, tests: 0 },
    })

    const parsed = await parseReport(tmpDir)
    expect(parsed.testsuites.$.tests).to.equal('1')
    expect(parsed.testsuites.$.failures).to.equal('1')

    const suiteEl = parsed.testsuites.testsuite[0]
    expect(suiteEl.testcase[0].$.name).to.contain('"after all" hook: AfterSuite')
    expect(suiteEl.testcase[0].failure[0].$.message).to.contain('AfterSuite failed')
  })
})
