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
const { serializeTest } = require('../../mocha/test')

let stdout = ''

const stderr = ''

// Requiring of Codecept need to be after tty.getWindowSize is available.
const Codecept = require(process.env.CODECEPT_CLASS_PATH || '../../codecept')

const { options, tests, testRoot, workerIndex, poolMode } = workerData

// hide worker output
// In pool mode, only suppress output if debug is NOT enabled
// In regular mode, hide result output but allow step output in verbose/debug
if (poolMode && !options.debug) {
  // In pool mode without debug, suppress verbose output to keep it clean
  // Only show the [Worker XX] prefixed test results, hide everything else
  const originalWrite = process.stdout.write
  process.stdout.write = string => {
    // Only allow worker-prefixed test results to show
    if (string.startsWith('[Worker ') && (string.includes('✔') || string.includes('✖'))) {
      return originalWrite.call(process.stdout, string)
    }
    // Suppress all other output including:
    // - CodeceptJS version banners
    // - Suite headers (Feature --)
    // - Individual test results without worker prefix
    // - Per-test summaries
    // - Hook errors
    // - Feature summaries
    return true
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

// Load test and run
const codecept = new Codecept(config, options)
codecept.init(testRoot)
codecept.loadTests()
const mocha = container.mocha()

if (poolMode) {
  // In pool mode, don't filter tests upfront - wait for assignments
  // We'll reload test files fresh for each test request
} else {
  // Legacy mode - filter tests upfront
  filterTests()
}

// run tests
;(async function () {
  if (poolMode) {
    // Pool mode handles its own exit logic after all tests complete
    await runPoolTests()
  } else {
    // For test/suite mode, add safety timeout to prevent hanging
    const safetyTimeout = setTimeout(() => {
      // Force exit if we're still running after tests should have completed
      // This handles the case where mocha's done callback doesn't fire
      // Send final results before exiting
      const resultData = container.result().simplify()
      sendToParentThread({ event: event.all.after, workerIndex, data: resultData })
      sendToParentThread({ event: event.all.result, workerIndex, data: resultData })
      setTimeout(() => process.exit(process.exitCode || 0), 100)
    }, 5000) // 5 seconds after tests complete should be enough

    if (mocha.suite.total()) {
      await runTests()
    }

    // If we get here naturally, clear the safety timeout and exit
    clearTimeout(safetyTimeout)
    process.exit(process.exitCode || 0)
  }
})()

let globalStats = { passes: 0, failures: 0, tests: 0, pending: 0, failedHooks: 0 }

// Store listener references for cleanup
const eventListeners = {
  suiteHandlers: [],
  testHandlers: [],
  stepHandlers: [],
  hookHandlers: [],
  allHandlers: [],
  parentPortHandler: null,
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

  // Fallback timeout to force exit if mocha doesn't complete properly
  const fallbackExit = setTimeout(() => {
    // This should rarely happen, but ensures workers don't hang indefinitely
    process.exit(0)
  }, 30000) // 30 second fallback
  fallbackExit.unref() // Don't keep process alive just for this timer

  try {
    await codecept.run()
  } finally {
    await codecept.teardown()
    clearTimeout(fallbackExit)
    // Force worker thread to exit after a brief delay to ensure messages are sent
    setTimeout(() => process.exit(0), 100)
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

  // Track start time for duration calculation
  const poolStartTime = Date.now()

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
              try {
                // Race codecept.run() against a timeout
                // codecept.run() never completes, so we use a timeout to force completion
                await Promise.race([
                  codecept.run(),
                  new Promise(resolve => setTimeout(resolve, 2000)), // 2 second timeout per test
                ])

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

                // Add test objects for feature/worker grouping
                if (result.tests && result.tests.length > allTests.length) {
                  const newTests = result.tests.slice(allTests.length)
                  allTests.push(...newTests)
                }
              } catch (err) {
                // Silently continue to next test
              }
            }

            // Signal test completed and request next
            parentPort?.off('message', messageHandler)
            resolve('TEST_COMPLETED')
          } catch (err) {
            parentPort?.off('message', messageHandler)
            // Silently continue to next test even on error
            resolve('TEST_COMPLETED')
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
  const poolDuration = Date.now() - poolStartTime

  // Serialize test objects to make them transferable across worker threads
  const serializedTests = allTests.map(test => serializeTest(test))

  const finalResult = {
    hasFailed: consolidatedStats.failures > 0,
    stats: consolidatedStats,
    duration: poolDuration, // Actual duration for this worker in pool mode
    tests: serializedTests, // Include serialized test objects for feature/worker grouping
    failures: allFailures, // Include all failures for error reporting
  }

  sendToParentThread({ event: event.all.after, workerIndex, data: finalResult })
  sendToParentThread({ event: event.all.result, workerIndex, data: finalResult })

  // Don't explicitly exit - let the worker thread exit naturally after sending messages
  // The parent will detect the exit and call _finishRun() when all workers have closed
}

function filterTestById(testUid) {
  // Reload test files fresh for each test in pool mode
  const files = codecept.testFiles

  // Get the existing mocha instance
  const mocha = container.mocha()

  // Clear suites and tests but preserve other mocha settings
  mocha.suite.suites = []
  mocha.suite.tests = []

  // Clear require cache for test files to ensure fresh loading
  files.forEach(file => {
    delete require.cache[require.resolve(file)]
  })

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
  const suiteBeforeHandler = suite => sendToParentThread({ event: event.suite.before, workerIndex, data: suite.simplify() })
  const suiteAfterHandler = suite => sendToParentThread({ event: event.suite.after, workerIndex, data: suite.simplify() })
  event.dispatcher.on(event.suite.before, suiteBeforeHandler)
  event.dispatcher.on(event.suite.after, suiteAfterHandler)
  eventListeners.suiteHandlers.push([event.suite.before, suiteBeforeHandler])
  eventListeners.suiteHandlers.push([event.suite.after, suiteAfterHandler])

  // calculate duration
  const testStartedDurationHandler = test => (test.start = new Date())
  event.dispatcher.on(event.test.started, testStartedDurationHandler)
  eventListeners.testHandlers.push([event.test.started, testStartedDurationHandler])

  // tests
  const testBeforeHandler = test => sendToParentThread({ event: event.test.before, workerIndex, data: test.simplify() })
  const testAfterHandler = test => sendToParentThread({ event: event.test.after, workerIndex, data: test.simplify() })
  const testFinishedHandler = (test, err) => sendToParentThread({ event: event.test.finished, workerIndex, data: { ...test.simplify(), err } })
  const testFailedHandler = (test, err) => sendToParentThread({ event: event.test.failed, workerIndex, data: { ...test.simplify(), err } })
  const testPassedHandler = (test, err) => sendToParentThread({ event: event.test.passed, workerIndex, data: { ...test.simplify(), err } })
  const testStartedHandler = test => sendToParentThread({ event: event.test.started, workerIndex, data: test.simplify() })
  const testSkippedHandler = test => sendToParentThread({ event: event.test.skipped, workerIndex, data: test.simplify() })

  event.dispatcher.on(event.test.before, testBeforeHandler)
  event.dispatcher.on(event.test.after, testAfterHandler)
  event.dispatcher.on(event.test.finished, testFinishedHandler)
  event.dispatcher.on(event.test.failed, testFailedHandler)
  event.dispatcher.on(event.test.passed, testPassedHandler)
  event.dispatcher.on(event.test.started, testStartedHandler)
  event.dispatcher.on(event.test.skipped, testSkippedHandler)

  eventListeners.testHandlers.push([event.test.before, testBeforeHandler])
  eventListeners.testHandlers.push([event.test.after, testAfterHandler])
  eventListeners.testHandlers.push([event.test.finished, testFinishedHandler])
  eventListeners.testHandlers.push([event.test.failed, testFailedHandler])
  eventListeners.testHandlers.push([event.test.passed, testPassedHandler])
  eventListeners.testHandlers.push([event.test.started, testStartedHandler])
  eventListeners.testHandlers.push([event.test.skipped, testSkippedHandler])

  // steps
  const stepFinishedHandler = step => sendToParentThread({ event: event.step.finished, workerIndex, data: step.simplify() })
  const stepStartedHandler = step => sendToParentThread({ event: event.step.started, workerIndex, data: step.simplify() })
  const stepPassedHandler = step => sendToParentThread({ event: event.step.passed, workerIndex, data: step.simplify() })
  const stepFailedHandler = step => sendToParentThread({ event: event.step.failed, workerIndex, data: step.simplify() })

  event.dispatcher.on(event.step.finished, stepFinishedHandler)
  event.dispatcher.on(event.step.started, stepStartedHandler)
  event.dispatcher.on(event.step.passed, stepPassedHandler)
  event.dispatcher.on(event.step.failed, stepFailedHandler)

  eventListeners.stepHandlers.push([event.step.finished, stepFinishedHandler])
  eventListeners.stepHandlers.push([event.step.started, stepStartedHandler])
  eventListeners.stepHandlers.push([event.step.passed, stepPassedHandler])
  eventListeners.stepHandlers.push([event.step.failed, stepFailedHandler])

  const hookFailedHandler = (hook, err) => sendToParentThread({ event: event.hook.failed, workerIndex, data: { ...hook.simplify(), err } })
  const hookPassedHandler = hook => sendToParentThread({ event: event.hook.passed, workerIndex, data: hook.simplify() })
  const hookFinishedHandler = hook => sendToParentThread({ event: event.hook.finished, workerIndex, data: hook.simplify() })

  event.dispatcher.on(event.hook.failed, hookFailedHandler)
  event.dispatcher.on(event.hook.passed, hookPassedHandler)
  event.dispatcher.on(event.hook.finished, hookFinishedHandler)

  eventListeners.hookHandlers.push([event.hook.failed, hookFailedHandler])
  eventListeners.hookHandlers.push([event.hook.passed, hookPassedHandler])
  eventListeners.hookHandlers.push([event.hook.finished, hookFinishedHandler])

  if (!poolMode) {
    // In regular mode, close worker after all tests are complete
    const allAfterHandler = () => {
      sendToParentThread({ event: event.all.after, workerIndex, data: container.result().simplify() })
    }
    const allResultHandler = () => {
      const resultData = container.result().simplify()
      sendToParentThread({ event: event.all.result, workerIndex, data: resultData })
      // Exit immediately - process exit will handle cleanup
      process.exit(0)
    }
    event.dispatcher.once(event.all.after, allAfterHandler)
    event.dispatcher.once(event.all.result, allResultHandler)
    eventListeners.allHandlers.push([event.all.after, allAfterHandler])
    eventListeners.allHandlers.push([event.all.result, allResultHandler])
  } else {
    // In pool mode, don't send result events for individual tests
    // Results will be sent once when the worker completes all tests
  }
}

function cleanupListeners() {
  // Remove all registered event listeners to allow worker thread to exit cleanly
  eventListeners.suiteHandlers.forEach(([eventName, handler]) => {
    event.dispatcher.removeListener(eventName, handler)
  })
  eventListeners.testHandlers.forEach(([eventName, handler]) => {
    event.dispatcher.removeListener(eventName, handler)
  })
  eventListeners.stepHandlers.forEach(([eventName, handler]) => {
    event.dispatcher.removeListener(eventName, handler)
  })
  eventListeners.hookHandlers.forEach(([eventName, handler]) => {
    event.dispatcher.removeListener(eventName, handler)
  })
  eventListeners.allHandlers.forEach(([eventName, handler]) => {
    event.dispatcher.removeListener(eventName, handler)
  })

  // Remove parentPort message listener
  if (eventListeners.parentPortHandler) {
    parentPort?.removeListener('message', eventListeners.parentPortHandler)
    eventListeners.parentPortHandler = null
  }

  // Clear arrays
  eventListeners.suiteHandlers = []
  eventListeners.testHandlers = []
  eventListeners.stepHandlers = []
  eventListeners.hookHandlers = []
  eventListeners.allHandlers = []
}

function disablePause() {
  global.pause = () => {}
}

function sendToParentThread(data) {
  parentPort?.postMessage(data)
}

function listenToParentThread() {
  if (!poolMode) {
    const messageHandler = eventData => {
      container.append({ support: eventData.data })
    }
    parentPort?.on('message', messageHandler)
    // Store for cleanup
    eventListeners.parentPortHandler = messageHandler
  }
  // In pool mode, message handling is done in runPoolTests()
}
