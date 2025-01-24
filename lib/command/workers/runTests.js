const tty = require('tty')

if (!tty.getWindowSize) {
  // this is really old method, long removed from Node, but Mocha
  // reporters fall back on it if they cannot use `process.stdout.getWindowSize`
  // we need to polyfill it.
  tty.getWindowSize = () => [40, 80]
}

const { parentPort, workerData } = require('worker_threads')
const event = require('../../event')
const container = require('../../container')
const { getConfig } = require('../utils')
const { tryOrDefault, deepMerge } = require('../../utils')

let stdout = ''

const stderr = ''

// Requiring of Codecept need to be after tty.getWindowSize is available.
const Codecept = require(process.env.CODECEPT_CLASS_PATH || '../../codecept')

const { options, tests, testRoot, workerIndex } = workerData

// hide worker output
if (!options.debug && !options.verbose)
  process.stdout.write = string => {
    stdout += string
    return true
  }

const overrideConfigs = tryOrDefault(() => JSON.parse(options.override), {})

// important deep merge so dynamic things e.g. functions on config are not overridden
const config = deepMerge(getConfig(options.config || testRoot), overrideConfigs)

// Load test and run
const codecept = new Codecept(config, options)
codecept.init(testRoot)
codecept.loadTests()
const mocha = container.mocha()
filterTests()

// run tests
;(async function () {
  if (mocha.suite.total()) {
    await runTests()
  }
})()

async function runTests() {
  try {
    await codecept.bootstrap()
  } catch (err) {
    throw new Error(`Error while running bootstrap file :${err}`)
  }
  listenToParentThread()
  initializeListeners()
  disablePause()
  try {
    await codecept.run()
  } finally {
    await codecept.teardown()
  }
}

function filterTests() {
  const files = codecept.testFiles
  mocha.files = files
  mocha.loadFiles()

  for (const suite of mocha.suite.suites) {
    suite.tests = suite.tests.filter(test => tests.indexOf(test.uid) >= 0)
  }
}

function initializeListeners() {
  // suite
  event.dispatcher.on(event.suite.before, suite => sendToParentThread({ event: event.suite.before, workerIndex, data: suite.simplify() }))
  event.dispatcher.on(event.suite.after, suite => sendToParentThread({ event: event.suite.after, workerIndex, data: suite.simplify() }))

  // calculate duration
  event.dispatcher.on(event.test.started, test => (test.start = new Date()))

  // tests
  event.dispatcher.on(event.test.before, test => sendToParentThread({ event: event.test.before, workerIndex, data: test.simplify() }))
  event.dispatcher.on(event.test.after, test => sendToParentThread({ event: event.test.after, workerIndex, data: test.simplify() }))
  // we should force-send correct errors to prevent race condition
  event.dispatcher.on(event.test.finished, (test, err) => sendToParentThread({ event: event.test.finished, workerIndex, data: { ...test.simplify(), err } }))
  event.dispatcher.on(event.test.failed, (test, err) => sendToParentThread({ event: event.test.failed, workerIndex, data: { ...test.simplify(), err } }))
  event.dispatcher.on(event.test.passed, (test, err) => sendToParentThread({ event: event.test.passed, workerIndex, data: { ...test.simplify(), err } }))
  event.dispatcher.on(event.test.started, test => sendToParentThread({ event: event.test.started, workerIndex, data: test.simplify() }))
  event.dispatcher.on(event.test.skipped, test => sendToParentThread({ event: event.test.skipped, workerIndex, data: test.simplify() }))

  // steps
  event.dispatcher.on(event.step.finished, step => sendToParentThread({ event: event.step.finished, workerIndex, data: step.simplify() }))
  event.dispatcher.on(event.step.started, step => sendToParentThread({ event: event.step.started, workerIndex, data: step.simplify() }))
  event.dispatcher.on(event.step.passed, step => sendToParentThread({ event: event.step.passed, workerIndex, data: step.simplify() }))
  event.dispatcher.on(event.step.failed, step => sendToParentThread({ event: event.step.failed, workerIndex, data: step.simplify() }))

  event.dispatcher.on(event.hook.failed, (hook, err) => sendToParentThread({ event: event.hook.failed, workerIndex, data: { ...hook.simplify(), err } }))
  event.dispatcher.on(event.hook.passed, hook => sendToParentThread({ event: event.hook.passed, workerIndex, data: hook.simplify() }))
  event.dispatcher.on(event.hook.finished, hook => sendToParentThread({ event: event.hook.finished, workerIndex, data: hook.simplify() }))

  event.dispatcher.once(event.all.after, () => {
    sendToParentThread({ event: event.all.after, workerIndex, data: container.result().simplify() })
  })
  // all
  event.dispatcher.once(event.all.result, () => {
    sendToParentThread({ event: event.all.result, workerIndex, data: container.result().simplify() })
    parentPort?.close()
  })
}

function disablePause() {
  global.pause = () => {}
}

function sendToParentThread(data) {
  parentPort?.postMessage(data)
}

function listenToParentThread() {
  parentPort?.on('message', eventData => {
    container.append({ support: eventData.data })
  })
}
