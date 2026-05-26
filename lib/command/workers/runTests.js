import tty from 'tty'

if (!tty.getWindowSize) {
  // this is really old method, long removed from Node, but Mocha
  // reporters fall back on it if they cannot use `process.stdout.getWindowSize`
  // we need to polyfill it.
  tty.getWindowSize = () => [40, 80]
}

import { parentPort, workerData } from 'worker_threads'

// Delay imports to avoid ES Module loader race conditions in Node 22.x worker threads
// These will be imported dynamically when needed
let event, container, Codecept, getConfig, tryOrDefault, deepMerge, fixErrorStack

let stdout = ''

const stderr = ''

const { options, tests, testRoot, workerIndex, poolMode } = workerData

// Global error handlers to catch critical errors but not test failures
process.on('uncaughtException', (err) => {
  if (container?.tsFileMapping && fixErrorStack) {
    const fileMapping = container.tsFileMapping()
    if (fileMapping) {
      fixErrorStack(err, fileMapping)
    }
  }

  // Log to stderr to bypass stdout suppression
  process.stderr.write(`[Worker ${workerIndex}] UNCAUGHT EXCEPTION: ${err.message}\n`)
  process.stderr.write(`${err.stack}\n`)

  // Don't exit on test assertion errors - those are handled by mocha
  if (err.name === 'AssertionError' || err.message?.includes('expected')) {
    return
  }
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  if (reason && typeof reason === 'object' && reason.stack && container?.tsFileMapping && fixErrorStack) {
    const fileMapping = container.tsFileMapping()
    if (fileMapping) {
      fixErrorStack(reason, fileMapping)
    }
  }

  // Log to stderr to bypass stdout suppression
  const msg = reason?.message || String(reason)
  process.stderr.write(`[Worker ${workerIndex}] UNHANDLED REJECTION: ${msg}\n`)
  if (reason?.stack) {
    process.stderr.write(`${reason.stack}\n`)
  }

  // Do not exit — killing the worker silently drops every remaining test from the report.
})

// hide worker output
// In pool mode, only suppress output if debug is NOT enabled
// In regular mode, hide result output but allow step output in verbose/debug
if (poolMode && !options.debug) {
  // In pool mode without debug, allow test names and important output but suppress verbose details
  const originalWrite = process.stdout.write
  process.stdout.write = string => {
    // Always allow Worker logs
    if (string.includes('[Worker')) {
      return originalWrite.call(process.stdout, string)
    }
    // Allow test names (✔ or ✖), Scenario Steps, failures, and important markers
    if (
      string.includes('✔') ||
      string.includes('✖') ||
      string.includes('Scenario Steps:') ||
      string.includes('◯ Scenario Steps:') ||
      string.includes('-- FAILURES:') ||
      string.includes('AssertionError:') ||
      string.includes('Feature(')
    ) {
      return originalWrite.call(process.stdout, string)
    }
    // Suppress result summaries to avoid duplicates
    if (string.includes('  FAIL  |') || string.includes('  OK  |') || string.includes('◯ File:')) {
      return true
    }
    return originalWrite.call(process.stdout, string)
  }
} else if (!poolMode && !options.debug && !options.verbose) {
  const originalWrite = process.stdout.write
  process.stdout.write = string => {
    // Always allow Worker logs
    if (string.includes('[Worker')) {
      return originalWrite.call(process.stdout, string)
    }
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

// Declare codecept and mocha at module level so they can be accessed by functions
let codecept
let mocha
let initPromise
let config

// Load test and run
initPromise = (async function () {
  try {
    // Add staggered delay at the very start to prevent resource conflicts
    // Longer delay for browser initialization conflicts
    const delay = (workerIndex - 1) * 2000 // 0ms, 2s, 4s, etc.
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    // Import modules dynamically to avoid ES Module loader race conditions in Node 22.x
    const eventModule = await import('../../event.js')
    const containerModule = await import('../../container.js')
    const utilsModule = await import('../utils.js')
    const coreUtilsModule = await import('../../utils.js')
    const CodeceptModule = await import('../../codecept.js')
    const typescriptModule = await import('../../utils/typescript.js')

    event = eventModule.default
    container = containerModule.default
    getConfig = utilsModule.getConfig
    tryOrDefault = coreUtilsModule.tryOrDefault
    deepMerge = coreUtilsModule.deepMerge
    Codecept = CodeceptModule.default
    fixErrorStack = typescriptModule.fixErrorStack
    
    const overrideConfigs = tryOrDefault(() => JSON.parse(options.override), {})
    
    let baseConfig
    try {
      // IMPORTANT: await is required here since getConfig is async
      baseConfig = await getConfig(options.config || testRoot)
    } catch (configErr) {
      if (container?.tsFileMapping && fixErrorStack) {
        const fileMapping = container.tsFileMapping()
        if (fileMapping) {
          fixErrorStack(configErr, fileMapping)
        }
      }
      process.stderr.write(`[Worker ${workerIndex}] FAILED loading config: ${configErr.message}\n`)
      process.stderr.write(`${configErr.stack}\n`)
      await new Promise(resolve => setTimeout(resolve, 100))
      process.exit(1)
    }
    
    // important deep merge so dynamic things e.g. functions on config are not overridden
    config = deepMerge(baseConfig, overrideConfigs)
    
    // Pass workerIndex as child option for output.process() to display worker prefix
    const optsWithChild = { ...options, child: workerIndex }
    codecept = new Codecept(config, optsWithChild)
    
    try {
      await codecept.init(testRoot)
    } catch (initErr) {
      if (container?.tsFileMapping && fixErrorStack) {
        const fileMapping = container.tsFileMapping()
        if (fileMapping) {
          fixErrorStack(initErr, fileMapping)
        }
      }
      process.stderr.write(`[Worker ${workerIndex}] FAILED during codecept.init(): ${initErr.message}\n`)
      process.stderr.write(`${initErr.stack}\n`)
      process.exit(1)
    }
    
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
      console.error(`[Worker ${workerIndex}] ERROR: No tests found after filtering! Assigned ${tests.length} UIDs but none matched.`)
      parentPort?.close()
    }
  } catch (err) {
    if (container?.tsFileMapping && fixErrorStack) {
      const fileMapping = container.tsFileMapping()
      if (fileMapping) {
        fixErrorStack(err, fileMapping)
      }
    }
    process.stderr.write(`[Worker ${workerIndex}] FATAL ERROR: ${err.message}\n`)
    process.stderr.write(`${err.stack}\n`)
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
  } catch (err) {
    throw err
  } finally {
    try {
      await codecept.teardown()
    } catch (err) {
      // Ignore teardown errors
    }
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

  // Emit event.all.before once at the start of pool mode
  event.dispatcher.emit(event.all.before, codecept)

  // Accumulate results across all tests in pool mode
  let consolidatedStats = { passes: 0, failures: 0, tests: 0, pending: 0, failedHooks: 0 }
  let allTests = []
  let allFailures = []
  let previousStats = { passes: 0, failures: 0, tests: 0, pending: 0, failedHooks: 0 }

  // Keep requesting tests until no more available
  while (true) {
    // Request a test assignment and wait for response
    const testResult = await new Promise((resolve, reject) => {
      // Set up pool mode message handler FIRST before sending request
      const messageHandler = async eventData => {
        // Remove handler immediately to prevent duplicate processing
        parentPort?.off('message', messageHandler)
        
        if (eventData.type === 'TEST_ASSIGNED') {
          // In pool mode with ESM, we receive test FILE paths instead of UIDs
          // because UIDs are not stable across different mocha instances
          const testIdentifier = eventData.test

          try {
            // Create a fresh Mocha instance for each test file
            container.createMocha()
            const mocha = container.mocha()
            
            // Load only the assigned test file
            mocha.files = [testIdentifier]
            mocha.loadFiles()

            try {
              require('fs').appendFileSync('/tmp/config_listener_debug.log', `${new Date().toISOString()} [POOL] Loaded ${testIdentifier}, tests: ${mocha.suite.total()}\n`)
            } catch (e) { /* ignore */ }

            if (mocha.suite.total() > 0) {
              // Run only the tests in the current mocha suite
              // Don't use codecept.run() as it overwrites mocha.files with ALL test files
              await new Promise((resolve, reject) => {
                mocha.run(() => {
                  try {
                    require('fs').appendFileSync('/tmp/config_listener_debug.log', `${new Date().toISOString()} [POOL] Finished ${testIdentifier}\n`)
                  } catch (e) { /* ignore */ }
                  resolve()
                })
              })

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

            // Signal test completed
            resolve('TEST_COMPLETED')
          } catch (err) {
            reject(err)
          }
        } else if (eventData.type === 'NO_MORE_TESTS') {
          // No tests available, exit worker
          resolve('NO_MORE_TESTS')
        } else {
          // Handle other message types (support messages, etc.)
          container.append({ support: eventData.data })
          // Don't re-add handler - each test request creates its own one-time handler
        }
      }

      // Set up handler BEFORE sending request to avoid race condition
      parentPort?.on('message', messageHandler)
      
      // Now send the request
      sendToParentThread({ type: 'REQUEST_TEST', workerIndex })
    })

    // Exit if no more tests
    if (testResult === 'NO_MORE_TESTS') {
      break
    }
  }

  // Emit event.all.after once at the end of pool mode
  event.dispatcher.emit(event.all.after, codecept)

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
  // In pool mode with ESM, test files are already loaded once at initialization
  // We just need to filter the existing mocha suite to only include the target test
  
  // Get the existing mocha instance
  const mocha = container.mocha()

  // Save reference to all suites before clearing
  const allSuites = [...mocha.suite.suites]
  
  // Clear suites and tests but preserve other mocha settings
  mocha.suite.suites = []
  mocha.suite.tests = []

  // Find and add only the suite containing our target test
  let foundTest = false
  for (const suite of allSuites) {
    const originalTests = [...suite.tests]
    
    // Check if this suite has our target test
    const targetTest = originalTests.find(test => test.uid === testUid)
    
    if (targetTest) {
      // Create a filtered suite with only the target test
      suite.tests = [targetTest]
      mocha.suite.suites.push(suite)
      foundTest = true
      break // Only include one test
    }
  }

  if (!foundTest) {
    console.error(`WARNING: Test with UID ${testUid} not found in mocha suites`)
  }
}

function filterTests() {
  const files = codecept.testFiles
  mocha.files = files
  mocha.loadFiles()

  // Recursively filter tests in all suites (including nested ones)
  const filterSuiteTests = (suite) => {
    suite.tests = suite.tests.filter(test => tests.indexOf(test.uid) >= 0)
    for (const childSuite of suite.suites) {
      filterSuiteTests(childSuite)
    }
  }

  for (const suite of mocha.suite.suites) {
    filterSuiteTests(suite)
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
  event.dispatcher.on(event.test.failed, (test, err, hookName) => {
    const simplifiedData = test.simplify()
    const serializableErr = serializeError(err)
    // Include hookName to identify hook failures
    safelySendToParent({ event: event.test.failed, workerIndex, data: { ...simplifiedData, err: serializableErr, hookName } })
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
