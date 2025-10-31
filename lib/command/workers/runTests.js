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

const { options, tests, testRoot, workerIndex, poolMode } = workerData

// hide worker output
// In pool mode, only suppress output if debug is NOT enabled
// In regular mode, hide result output but allow step output in verbose/debug
if (poolMode && !options.debug) {
  // In pool mode without debug, suppress only result summaries and failures, but allow Scenario Steps
  const originalWrite = process.stdout.write
  process.stdout.write = string => {
    // Always allow Scenario Steps output (including the circle symbol)
    if (string.includes('Scenario Steps:') || string.includes('◯ Scenario Steps:')) {
      return originalWrite.call(process.stdout, string)
    }
    if (string.includes('  FAIL  |') || string.includes('  OK  |') || string.includes('-- FAILURES:') || string.includes('AssertionError:') || string.includes('◯ File:')) {
      return true
    }
    return originalWrite.call(process.stdout, string)
  }
} else if (!poolMode && !options.debug && !options.verbose) {
  process.stdout.write = string => {
    stdout += string
    return true
  }
} else {
  // In verbose/debug mode for test/suite modes, show step details
  // but suppress individual worker result summaries to avoid duplicate output
  const originalWrite = process.stdout.write
  const originalConsoleLog = console.log

  process.stdout.write = string => {
    // Suppress individual worker result summaries and failure reports
    if (string.includes('  FAIL  |') || string.includes('  OK  |') || string.includes('-- FAILURES:') || string.includes('AssertionError:') || string.includes('◯ File:') || string.includes('◯ Scenario Steps:')) {
      return true
    }
    return originalWrite.call(process.stdout, string)
  }

  // Override console.log to catch result summaries
  console.log = (...args) => {
    const fullMessage = args.join(' ')
    if (fullMessage.includes('  FAIL  |') || fullMessage.includes('  OK  |') || fullMessage.includes('-- FAILURES:')) {
      return
    }
    return originalConsoleLog.apply(console, args)
  }
}

const overrideConfigs = tryOrDefault(() => JSON.parse(options.override), {})

// important deep merge so dynamic things e.g. functions on config are not overridden
const config = deepMerge(getConfig(options.config || testRoot), overrideConfigs)

// Declare codecept and mocha at module level so they can be accessed by functions
let codecept
let mocha
let initPromise

// Load test and run
initPromise = (async function () {
  try {
    codecept = new Codecept(config, options)
    await codecept.init(testRoot)
    codecept.loadTests()
    mocha = container.mocha()

    if (poolMode) {
      // In pool mode, don't filter tests upfront - wait for assignments
      // We'll reload test files fresh for each test request
    } else {
      // Legacy mode - filter tests upfront
      filterTests()
    }

    // run tests
    if (poolMode) {
      await runPoolTests()
    } else if (mocha.suite.total()) {
      await runTests()
    } else {
      // No tests to run, close the worker
      parentPort?.close()
    }
  } catch (err) {
    console.error('Error in worker initialization:', err)
    process.exit(1)
  }
})()

let globalStats = { passes: 0, failures: 0, tests: 0, pending: 0, failedHooks: 0 }

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

async function runPoolTests() {
  try {
    await codecept.bootstrap()
  } catch (err) {
    throw new Error(`Error while running bootstrap file :${err}`)
  }

  initializeListeners()
  disablePause()

  // Accumulate results across all tests in pool mode
  let consolidatedStats = { passes: 0, failures: 0, tests: 0, pending: 0, failedHooks: 0 }
  let allTests = []
  let allFailures = []
  let previousStats = { passes: 0, failures: 0, tests: 0, pending: 0, failedHooks: 0 }

  // Keep requesting tests until no more available
  while (true) {
    // Request a test assignment
    sendToParentThread({ type: 'REQUEST_TEST', workerIndex })

    const testResult = await new Promise((resolve, reject) => {
      // Set up pool mode message handler
      const messageHandler = async eventData => {
        if (eventData.type === 'TEST_ASSIGNED') {
          const testUid = eventData.test

          try {
            // In pool mode, we need to create a fresh Mocha instance for each test
            // because Mocha instances become disposed after running tests
            container.createMocha() // Create fresh Mocha instance
            filterTestById(testUid)
            const mocha = container.mocha()

            if (mocha.suite.total() > 0) {
              // Run the test and complete
              await codecept.run()

              // Get the results from this specific test run
              const result = container.result()
              const currentStats = result.stats || {}

              // Calculate the difference from previous accumulated stats
              const newPasses = Math.max(0, (currentStats.passes || 0) - previousStats.passes)
              const newFailures = Math.max(0, (currentStats.failures || 0) - previousStats.failures)
              const newTests = Math.max(0, (currentStats.tests || 0) - previousStats.tests)
              const newPending = Math.max(0, (currentStats.pending || 0) - previousStats.pending)
              const newFailedHooks = Math.max(0, (currentStats.failedHooks || 0) - previousStats.failedHooks)

              // Add only the new results
              consolidatedStats.passes += newPasses
              consolidatedStats.failures += newFailures
              consolidatedStats.tests += newTests
              consolidatedStats.pending += newPending
              consolidatedStats.failedHooks += newFailedHooks

              // Update previous stats for next comparison
              previousStats = { ...currentStats }

              // Add new failures to consolidated collections
              if (result.failures && result.failures.length > allFailures.length) {
                const newFailures = result.failures.slice(allFailures.length)
                allFailures.push(...newFailures)
              }
            }

            // Signal test completed and request next
            parentPort?.off('message', messageHandler)
            resolve('TEST_COMPLETED')
          } catch (err) {
            parentPort?.off('message', messageHandler)
            reject(err)
          }
        } else if (eventData.type === 'NO_MORE_TESTS') {
          // No tests available, exit worker
          parentPort?.off('message', messageHandler)
          resolve('NO_MORE_TESTS')
        } else {
          // Handle other message types (support messages, etc.)
          container.append({ support: eventData.data })
        }
      }

      parentPort?.on('message', messageHandler)
    })

    // Exit if no more tests
    if (testResult === 'NO_MORE_TESTS') {
      break
    }
  }

  try {
    await codecept.teardown()
  } catch (err) {
    // Log teardown errors but don't fail
    console.error('Teardown error:', err)
  }

  // Send final consolidated results for the entire worker
  const finalResult = {
    hasFailed: consolidatedStats.failures > 0,
    stats: consolidatedStats,
    duration: 0, // Pool mode doesn't track duration per worker
    tests: [], // Keep tests empty to avoid serialization issues - stats are sufficient
    failures: allFailures, // Include all failures for error reporting
  }

  sendToParentThread({ event: event.all.after, workerIndex, data: finalResult })
  sendToParentThread({ event: event.all.result, workerIndex, data: finalResult })

  // Add longer delay to ensure messages are delivered before closing
  await new Promise(resolve => setTimeout(resolve, 100))

  // Close worker thread when pool mode is complete
  parentPort?.close()
}

function filterTestById(testUid) {
  // Reload test files fresh for each test in pool mode
  const files = codecept.testFiles

  // Get the existing mocha instance
  const mocha = container.mocha()

  // Clear suites and tests but preserve other mocha settings
  mocha.suite.suites = []
  mocha.suite.tests = []

  // Note: ESM doesn't have require.cache, modules are cached by the loader
  // In ESM, we rely on mocha.loadFiles() to handle test file loading

  // Set files and load them
  mocha.files = files
  mocha.loadFiles()

  // Now filter to only the target test - use a more robust approach
  let foundTest = false
  for (const suite of mocha.suite.suites) {
    const originalTests = [...suite.tests]
    suite.tests = []

    for (const test of originalTests) {
      if (test.uid === testUid) {
        suite.tests.push(test)
        foundTest = true
        break // Only add one matching test
      }
    }

    // If no tests found in this suite, remove it
    if (suite.tests.length === 0) {
      suite.parent.suites = suite.parent.suites.filter(s => s !== suite)
    }
  }

  // Filter out empty suites from the root
  mocha.suite.suites = mocha.suite.suites.filter(suite => suite.tests.length > 0)

  if (!foundTest) {
    // If testUid doesn't match, maybe it's a simple test name - try fallback
    mocha.suite.suites = []
    mocha.suite.tests = []
    mocha.loadFiles()

    // Try matching by title
    for (const suite of mocha.suite.suites) {
      const originalTests = [...suite.tests]
      suite.tests = []

      for (const test of originalTests) {
        if (test.title === testUid || test.fullTitle() === testUid || test.uid === testUid) {
          suite.tests.push(test)
          foundTest = true
          break
        }
      }
    }

    // Clean up empty suites again
    mocha.suite.suites = mocha.suite.suites.filter(suite => suite.tests.length > 0)
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

  event.dispatcher.on(event.hook.failed, (hook, err) => sendToParentThread({ event: event.hook.failed, workerIndex, data: { ...hook.simplify(), err } }))
  event.dispatcher.on(event.hook.passed, hook => sendToParentThread({ event: event.hook.passed, workerIndex, data: hook.simplify() }))
  event.dispatcher.on(event.hook.finished, hook => sendToParentThread({ event: event.hook.finished, workerIndex, data: hook.simplify() }))

  if (!poolMode) {
    // In regular mode, close worker after all tests are complete
    event.dispatcher.once(event.all.after, () => {
      sendToParentThread({ event: event.all.after, workerIndex, data: container.result().simplify() })
    })
    // all
    event.dispatcher.once(event.all.result, () => {
      sendToParentThread({ event: event.all.result, workerIndex, data: container.result().simplify() })
      parentPort?.close()
    })
  } else {
    // In pool mode, don't send result events for individual tests
    // Results will be sent once when the worker completes all tests
  }
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
  if (!poolMode) {
    parentPort?.on('message', eventData => {
      container.append({ support: eventData.data })
    })
  }
  // In pool mode, message handling is done in runPoolTests()
}
