import tty from 'tty'

if (!tty.getWindowSize) {
  // this is really old method, long removed from Node, but Mocha
  // reporters fall back on it if they cannot use `process.stdout.getWindowSize`
  // we need to polyfill it.
  tty.getWindowSize = () => [40, 80]
}

import { parentPort, workerData } from 'worker_threads'
import event from '../../event.js'
import container from '../../container.js'
import { getConfig } from '../utils.js'
import { tryOrDefault, deepMerge } from '../../utils.js'

let stdout = ''

const stderr = ''

// Importing of Codecept need to be after tty.getWindowSize is available.
import Codecept from '../../codecept.js'

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
;(async function () {
  const codecept = new Codecept(config, options)
  await codecept.init(testRoot)
  codecept.loadTests()
  const mocha = container.mocha()

  function filterTests() {
    const files = codecept.testFiles
    mocha.files = files
    mocha.loadFiles()

    for (const suite of mocha.suite.suites) {
      suite.tests = suite.tests.filter(test => tests.indexOf(test.uid) >= 0)
    }
  }

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

  filterTests()

  // run tests
  if (mocha.suite.total()) {
    await runTests()
  }
})()

function initializeListeners() {
  // suite
  event.dispatcher.on(event.suite.before, suite => safelySendToParent({ event: event.suite.before, workerIndex, data: suite.simplify() }))
  event.dispatcher.on(event.suite.after, suite => safelySendToParent({ event: event.suite.after, workerIndex, data: suite.simplify() }))

  // calculate duration
  event.dispatcher.on(event.test.started, test => (test.start = new Date()))

  // tests
  event.dispatcher.on(event.test.before, test => safelySendToParent({ event: event.test.before, workerIndex, data: test.simplify() }))
  event.dispatcher.on(event.test.after, test => safelySendToParent({ event: event.test.after, workerIndex, data: test.simplify() }))
  // we should force-send correct errors to prevent race condition
  event.dispatcher.on(event.test.finished, (test, err) => {
    const simplifiedData = test.simplify()
    const serializableErr = serializeError(err)
    safelySendToParent({ event: event.test.finished, workerIndex, data: { ...simplifiedData, err: serializableErr } })
  })
  event.dispatcher.on(event.test.failed, (test, err) => {
    const simplifiedData = test.simplify()
    const serializableErr = serializeError(err)
    safelySendToParent({ event: event.test.failed, workerIndex, data: { ...simplifiedData, err: serializableErr } })
  })
  event.dispatcher.on(event.test.passed, (test, err) => safelySendToParent({ event: event.test.passed, workerIndex, data: { ...test.simplify(), err } }))
  event.dispatcher.on(event.test.started, test => safelySendToParent({ event: event.test.started, workerIndex, data: test.simplify() }))
  event.dispatcher.on(event.test.skipped, test => safelySendToParent({ event: event.test.skipped, workerIndex, data: test.simplify() }))

  // steps
  event.dispatcher.on(event.step.finished, step => safelySendToParent({ event: event.step.finished, workerIndex, data: step.simplify() }))
  event.dispatcher.on(event.step.started, step => safelySendToParent({ event: event.step.started, workerIndex, data: step.simplify() }))
  event.dispatcher.on(event.step.passed, step => safelySendToParent({ event: event.step.passed, workerIndex, data: step.simplify() }))
  event.dispatcher.on(event.step.failed, step => safelySendToParent({ event: event.step.failed, workerIndex, data: step.simplify() }))

  event.dispatcher.on(event.hook.failed, (hook, err) => {
    const serializableErr = serializeError(err)
    safelySendToParent({ event: event.hook.failed, workerIndex, data: { ...hook.simplify(), err: serializableErr } })
  })
  event.dispatcher.on(event.hook.passed, hook => safelySendToParent({ event: event.hook.passed, workerIndex, data: hook.simplify() }))
  event.dispatcher.on(event.hook.finished, hook => safelySendToParent({ event: event.hook.finished, workerIndex, data: hook.simplify() }))

  event.dispatcher.once(event.all.after, () => safelySendToParent({ event: event.all.after, workerIndex, data: container.result().simplify() }))
  // all
  event.dispatcher.once(event.all.result, () => {
    safelySendToParent({ event: event.all.result, workerIndex, data: container.result().simplify() })
    parentPort?.close()
  })
}

function disablePause() {
  global.pause = () => {}
}

function serializeError(err) {
  if (!err) return null
  try {
    return {
      message: err.message,
      stack: err.stack,
      name: err.name,
      actual: err.actual,
      expected: err.expected,
    }
  } catch {
    return { message: 'Error could not be serialized', name: 'Error' }
  }
}

function safelySendToParent(data) {
  try {
    parentPort?.postMessage(data)
  } catch (cloneError) {
    // Fallback for non-serializable data
    const fallbackData = { ...data }

    // Try to serialize error objects if present
    if (fallbackData.data && fallbackData.data.err) {
      fallbackData.data.err = serializeError(fallbackData.data.err)
    }

    // If still fails, send minimal data
    try {
      parentPort?.postMessage(fallbackData)
    } catch (finalError) {
      parentPort?.postMessage({
        event: data.event,
        workerIndex,
        data: {
          title: fallbackData.data?.title || 'Unknown',
          state: fallbackData.data?.state || 'error',
          err: { message: 'Data could not be serialized' },
        },
      })
    }
  }
}

function sendToParentThread(data) {
  parentPort?.postMessage(data)
}

function listenToParentThread() {
  parentPort?.on('message', eventData => {
    container.append({ support: eventData.data })
  })
}
