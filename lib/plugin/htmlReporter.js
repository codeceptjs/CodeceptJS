const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const crypto = require('crypto')
const { threadId } = require('worker_threads')
const { template } = require('../utils')
const { getMachineInfo } = require('../command/info')

const event = require('../event')
const output = require('../output')
const Codecept = require('../codecept')

const defaultConfig = {
  output: global.output_dir || './output',
  reportFileName: 'report.html',
  includeArtifacts: true,
  showSteps: true,
  showSkipped: true,
  showMetadata: true,
  showTags: true,
  showRetries: true,
  exportStats: false,
  exportStatsPath: './stats.json',
  keepHistory: false,
  historyPath: './test-history.json',
  maxHistoryEntries: 50,
}

/**
 * HTML Reporter Plugin for CodeceptJS
 *
 * Generates comprehensive HTML reports showing:
 * - Test statistics
 * - Feature/Scenario details
 * - Individual step results
 * - Test artifacts (screenshots, etc.)
 *
 * ## Configuration
 *
 * ```js
 * "plugins": {
 *    "htmlReporter": {
 *      "enabled": true,
 *      "output": "./output",
 *      "reportFileName": "report.html",
 *      "includeArtifacts": true,
 *      "showSteps": true,
 *      "showSkipped": true,
 *      "showMetadata": true,
 *      "showTags": true,
 *      "showRetries": true,
 *      "exportStats": false,
 *      "exportStatsPath": "./stats.json",
 *      "keepHistory": false,
 *      "historyPath": "./test-history.json",
 *      "maxHistoryEntries": 50
 *    }
 * }
 * ```
 */
module.exports = function (config) {
  const options = { ...defaultConfig, ...config }
  let reportData = {
    stats: {},
    tests: [],
    failures: [],
    hooks: [],
    startTime: null,
    endTime: null,
    retries: [],
    config: options,
  }
  let currentTestSteps = []
  let currentTestHooks = []
  let currentBddSteps = [] // Track BDD/Gherkin steps
  let testRetryAttempts = new Map() // Track retry attempts per test
  let currentSuite = null // Track current suite for BDD detection

  // Initialize report directory
  const reportDir = options.output ? path.resolve(global.codecept_dir, options.output) : path.resolve(global.output_dir || './output')
  mkdirp.sync(reportDir)

  // Track overall test execution
  event.dispatcher.on(event.all.before, () => {
    reportData.startTime = new Date()
    output.plugin('htmlReporter', 'Starting HTML report generation...')
  })

  // Track test start to initialize steps and hooks collection
  event.dispatcher.on(event.test.before, test => {
    currentTestSteps = []
    currentTestHooks = []
    currentBddSteps = []

    // Track current suite for BDD detection
    currentSuite = test.parent

    // Enhanced retry detection with priority-based approach
    const testId = generateTestId(test)

    // Only set retry count if not already set, using priority order
    if (!testRetryAttempts.has(testId)) {
      // Method 1: Check retryNum property (most reliable)
      if (test.retryNum && test.retryNum > 0) {
        testRetryAttempts.set(testId, test.retryNum)
        output.print(`HTML Reporter: Retry count detected (retryNum) for ${test.title}, attempts: ${test.retryNum}`)
      }
      // Method 2: Check currentRetry property
      else if (test.currentRetry && test.currentRetry > 0) {
        testRetryAttempts.set(testId, test.currentRetry)
        output.print(`HTML Reporter: Retry count detected (currentRetry) for ${test.title}, attempts: ${test.currentRetry}`)
      }
      // Method 3: Check if this is a retried test
      else if (test.retriedTest && test.retriedTest()) {
        const originalTest = test.retriedTest()
        const originalTestId = generateTestId(originalTest)
        if (!testRetryAttempts.has(originalTestId)) {
          testRetryAttempts.set(originalTestId, 1) // Start with 1 retry
        } else {
          testRetryAttempts.set(originalTestId, testRetryAttempts.get(originalTestId) + 1)
        }
        output.print(`HTML Reporter: Retry detected (retriedTest) for ${originalTest.title}, attempts: ${testRetryAttempts.get(originalTestId)}`)
      }
      // Method 4: Check if test has been seen before (indicating a retry)
      else if (reportData.tests.some(t => t.id === testId)) {
        testRetryAttempts.set(testId, 1) // First retry detected
        output.print(`HTML Reporter: Retry detected (duplicate test) for ${test.title}, attempts: 1`)
      }
    }
  })

  // Collect step information
  event.dispatcher.on(event.step.started, step => {
    step.htmlReporterStartTime = Date.now()
  })

  event.dispatcher.on(event.step.finished, step => {
    if (step.htmlReporterStartTime) {
      step.duration = Date.now() - step.htmlReporterStartTime
    }
    currentTestSteps.push({
      name: step.name,
      actor: step.actor,
      args: step.args || [],
      status: step.failed ? 'failed' : 'success',
      duration: step.duration || 0,
    })
  })

  // Collect hook information
  event.dispatcher.on(event.hook.started, hook => {
    hook.htmlReporterStartTime = Date.now()
  })

  event.dispatcher.on(event.hook.finished, hook => {
    if (hook.htmlReporterStartTime) {
      hook.duration = Date.now() - hook.htmlReporterStartTime
    }
    const hookInfo = {
      title: hook.title,
      type: hook.type || 'unknown', // before, after, beforeSuite, afterSuite
      status: hook.err ? 'failed' : 'passed',
      duration: hook.duration || 0,
      error: hook.err ? hook.err.message : null,
    }
    currentTestHooks.push(hookInfo)
    reportData.hooks.push(hookInfo)
  })

  // Collect BDD/Gherkin step information
  event.dispatcher.on(event.bddStep.started, step => {
    step.htmlReporterStartTime = Date.now()
  })

  event.dispatcher.on(event.bddStep.finished, step => {
    if (step.htmlReporterStartTime) {
      step.duration = Date.now() - step.htmlReporterStartTime
    }
    currentBddSteps.push({
      keyword: step.actor || 'Given',
      text: step.name,
      status: step.failed ? 'failed' : 'success',
      duration: step.duration || 0,
      comment: step.comment,
    })
  })

  // Collect test results
  event.dispatcher.on(event.test.finished, test => {
    const testId = generateTestId(test)
    let retryAttempts = testRetryAttempts.get(testId) || 0

    // Additional retry detection in test.finished event
    // Check if this test has retry indicators we might have missed
    if (retryAttempts === 0) {
      if (test.retryNum && test.retryNum > 0) {
        retryAttempts = test.retryNum
        testRetryAttempts.set(testId, retryAttempts)
        output.print(`HTML Reporter: Late retry detection (retryNum) for ${test.title}, attempts: ${retryAttempts}`)
      } else if (test.currentRetry && test.currentRetry > 0) {
        retryAttempts = test.currentRetry
        testRetryAttempts.set(testId, retryAttempts)
        output.print(`HTML Reporter: Late retry detection (currentRetry) for ${test.title}, attempts: ${retryAttempts}`)
      } else if (test._retries && test._retries > 0) {
        retryAttempts = test._retries
        testRetryAttempts.set(testId, retryAttempts)
        output.print(`HTML Reporter: Late retry detection (_retries) for ${test.title}, attempts: ${retryAttempts}`)
      }
    }

    // Debug logging
    output.print(`HTML Reporter: Test finished - ${test.title}, State: ${test.state}, Retries: ${retryAttempts}`)

    // Detect if this is a BDD/Gherkin test
    const isBddTest = isBddGherkinTest(test, currentSuite)
    const steps = isBddTest ? currentBddSteps : currentTestSteps
    const featureInfo = isBddTest ? getBddFeatureInfo(test, currentSuite) : null

    // Check if this test already exists in reportData.tests (from a previous retry)
    const existingTestIndex = reportData.tests.findIndex(t => t.id === testId)
    const hasFailedBefore = existingTestIndex >= 0 && reportData.tests[existingTestIndex].state === 'failed'
    const currentlyFailed = test.state === 'failed'

    // Debug artifacts collection (but don't process them yet - screenshots may not be ready)
    output.print(`HTML Reporter: Test ${test.title} artifacts at test.finished: ${JSON.stringify(test.artifacts)}`)

    const testData = {
      ...test,
      id: testId,
      duration: test.duration || 0,
      steps: [...steps], // Copy the steps (BDD or regular)
      hooks: [...currentTestHooks], // Copy the hooks
      artifacts: test.artifacts || [], // Keep original artifacts for now
      tags: test.tags || [],
      meta: test.meta || {},
      opts: test.opts || {},
      notes: test.notes || [],
      retryAttempts: currentlyFailed || hasFailedBefore ? retryAttempts : 0, // Only show retries for failed tests
      uid: test.uid,
      isBdd: isBddTest,
      feature: featureInfo,
    }

    if (existingTestIndex >= 0) {
      // Update existing test with final result (including failed state)
      reportData.tests[existingTestIndex] = testData
      output.print(`HTML Reporter: Updated existing test - ${test.title}, Final state: ${test.state}`)
    } else {
      // Add new test
      reportData.tests.push(testData)
      output.print(`HTML Reporter: Added new test - ${test.title}, State: ${test.state}`)
    }

    // Track retry information - only add if there were actual retries AND the test failed at some point
    const existingRetryIndex = reportData.retries.findIndex(r => r.testId === testId)

    // Only track retries if:
    // 1. There are retry attempts detected AND (test failed now OR failed before)
    // 2. OR there's an existing retry record (meaning it failed before)
    if ((retryAttempts > 0 && (currentlyFailed || hasFailedBefore)) || existingRetryIndex >= 0) {
      // If no retry attempts detected but we have an existing retry record, increment it
      if (retryAttempts === 0 && existingRetryIndex >= 0) {
        retryAttempts = reportData.retries[existingRetryIndex].attempts + 1
        testRetryAttempts.set(testId, retryAttempts)
        output.print(`HTML Reporter: Incremented retry count for duplicate test ${test.title}, attempts: ${retryAttempts}`)
      }

      // Remove existing retry info for this test and add updated one
      reportData.retries = reportData.retries.filter(r => r.testId !== testId)
      reportData.retries.push({
        testId: testId,
        testTitle: test.title,
        attempts: retryAttempts,
        finalState: test.state,
        duration: test.duration || 0,
      })
      output.print(`HTML Reporter: Added retry info for ${test.title}, attempts: ${retryAttempts}, state: ${test.state}`)
    }

    // Fallback: If this test already exists and either failed before or is failing now, it's a retry
    else if (existingTestIndex >= 0 && (hasFailedBefore || currentlyFailed)) {
      const fallbackAttempts = 1
      testRetryAttempts.set(testId, fallbackAttempts)
      reportData.retries.push({
        testId: testId,
        testTitle: test.title,
        attempts: fallbackAttempts,
        finalState: test.state,
        duration: test.duration || 0,
      })
      output.print(`HTML Reporter: Fallback retry detection for failed test ${test.title}, attempts: ${fallbackAttempts}`)
    }
  })

  // Generate final report
  event.dispatcher.on(event.all.result, result => {
    reportData.endTime = new Date()
    reportData.duration = reportData.endTime - reportData.startTime

    // Process artifacts now that all async tasks (including screenshots) are complete
    output.print(`HTML Reporter: Processing artifacts for ${reportData.tests.length} tests after all async tasks complete`)

    reportData.tests.forEach(test => {
      const originalArtifacts = test.artifacts
      let collectedArtifacts = []

      output.print(`HTML Reporter: Processing test "${test.title}" (ID: ${test.id})`)
      output.print(`HTML Reporter: Test ${test.title} final artifacts: ${JSON.stringify(originalArtifacts)}`)

      if (originalArtifacts) {
        if (Array.isArray(originalArtifacts)) {
          collectedArtifacts = originalArtifacts
          output.print(`HTML Reporter: Using array artifacts: ${collectedArtifacts.length} items`)
        } else if (typeof originalArtifacts === 'object') {
          // Convert object properties to array (screenshotOnFail plugin format)
          collectedArtifacts = Object.values(originalArtifacts).filter(artifact => artifact)
          output.print(`HTML Reporter: Converted artifacts object to array: ${collectedArtifacts.length} items`)
          output.print(`HTML Reporter: Converted artifacts: ${JSON.stringify(collectedArtifacts)}`)
        }
      }

      // Only use filesystem fallback if no artifacts found from screenshotOnFail plugin
      if (collectedArtifacts.length === 0 && test.state === 'failed') {
        output.print(`HTML Reporter: No artifacts from plugin, trying filesystem for test "${test.title}"`)
        collectedArtifacts = collectScreenshotsFromFilesystem(test, test.id)
        output.print(`HTML Reporter: Collected ${collectedArtifacts.length} screenshots from filesystem for failed test "${test.title}"`)
        if (collectedArtifacts.length > 0) {
          output.print(`HTML Reporter: Filesystem screenshots for "${test.title}": ${JSON.stringify(collectedArtifacts)}`)
        }
      }

      // Update test with processed artifacts
      test.artifacts = collectedArtifacts
      output.print(`HTML Reporter: Final artifacts for "${test.title}": ${JSON.stringify(test.artifacts)}`)
    })

    // Calculate stats from our collected test data instead of using result.stats
    const passedTests = reportData.tests.filter(t => t.state === 'passed').length
    const failedTests = reportData.tests.filter(t => t.state === 'failed').length
    const pendingTests = reportData.tests.filter(t => t.state === 'pending').length
    const skippedTests = reportData.tests.filter(t => t.state === 'skipped').length

    // Populate failures from our collected test data with enhanced details
    reportData.failures = reportData.tests
      .filter(t => t.state === 'failed')
      .map(t => {
        const testName = t.title || 'Unknown Test'
        const featureName = t.parent?.title || 'Unknown Feature'

        if (t.err) {
          const errorMessage = t.err.message || t.err.toString() || 'Test failed'
          const errorStack = t.err.stack || ''
          const filePath = t.file || t.parent?.file || ''

          // Create enhanced failure object with test details
          return {
            testName: testName,
            featureName: featureName,
            message: errorMessage,
            stack: errorStack,
            filePath: filePath,
            toString: () => `${testName} (${featureName})\n${errorMessage}\n${errorStack}`.trim(),
          }
        }

        return {
          testName: testName,
          featureName: featureName,
          message: `Test failed: ${testName}`,
          stack: '',
          filePath: t.file || t.parent?.file || '',
          toString: () => `${testName} (${featureName})\nTest failed: ${testName}`,
        }
      })

    reportData.stats = {
      tests: reportData.tests.length,
      passes: passedTests,
      failures: failedTests,
      pending: pendingTests,
      skipped: skippedTests,
      duration: reportData.duration,
      failedHooks: result.stats?.failedHooks || 0,
    }

    // Debug logging for final stats
    output.print(`HTML Reporter: Calculated stats - Tests: ${reportData.stats.tests}, Passes: ${reportData.stats.passes}, Failures: ${reportData.stats.failures}`)
    output.print(`HTML Reporter: Collected ${reportData.tests.length} tests in reportData`)
    output.print(`HTML Reporter: Failures array has ${reportData.failures.length} items`)
    output.print(`HTML Reporter: Retries array has ${reportData.retries.length} items`)
    output.print(`HTML Reporter: testRetryAttempts Map size: ${testRetryAttempts.size}`)

    // Log retry attempts map contents
    for (const [testId, attempts] of testRetryAttempts.entries()) {
      output.print(`HTML Reporter: testRetryAttempts - ${testId}: ${attempts} attempts`)
    }

    reportData.tests.forEach(test => {
      output.print(`HTML Reporter: Test in reportData - ${test.title}, State: ${test.state}, Retries: ${test.retryAttempts}`)
    })

    // Check if running with workers
    if (process.env.RUNS_WITH_WORKERS) {
      // In worker mode, save results to a JSON file for later consolidation
      const workerId = threadId
      const jsonFileName = `worker-${workerId}-results.json`
      const jsonPath = path.join(reportDir, jsonFileName)

      try {
        // Always overwrite the file with the latest complete data from this worker
        // This prevents double-counting when the event is triggered multiple times
        fs.writeFileSync(jsonPath, safeJsonStringify(reportData))
        output.print(`HTML Reporter: Generated worker JSON results: ${jsonFileName}`)
      } catch (error) {
        output.print(`HTML Reporter: Failed to write worker JSON: ${error.message}`)
      }
      return
    }

    // Single process mode - generate report normally
    generateHtmlReport(reportData, options)

    // Export stats if configured
    if (options.exportStats) {
      exportTestStats(reportData, options)
    }

    // Save history if configured
    if (options.keepHistory) {
      saveTestHistory(reportData, options)
    }
  })

  // Handle worker consolidation after all workers complete
  event.dispatcher.on(event.workers.result, async result => {
    if (process.env.RUNS_WITH_WORKERS) {
      // Only run consolidation in main process
      await consolidateWorkerJsonResults(options)
    }
  })

  /**
   * Safely serialize data to JSON, handling circular references
   */
  function safeJsonStringify(data) {
    const seen = new WeakSet()
    return JSON.stringify(
      data,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            // For error objects, try to extract useful information instead of "[Circular Reference]"
            if (key === 'err' || key === 'error') {
              return {
                message: value.message || 'Error occurred',
                stack: value.stack || '',
                name: value.name || 'Error',
              }
            }
            // Skip circular references for other objects
            return undefined
          }
          seen.add(value)

          // Special handling for error objects to preserve important properties
          if (value instanceof Error || (value.message && value.stack)) {
            return {
              message: value.message || '',
              stack: value.stack || '',
              name: value.name || 'Error',
              toString: () => value.message || 'Error occurred',
            }
          }
        }
        return value
      },
      2,
    )
  }

  function generateTestId(test) {
    return crypto
      .createHash('sha256')
      .update(`${test.parent?.title || 'unknown'}_${test.title}`)
      .digest('hex')
      .substring(0, 8)
  }

  function collectScreenshotsFromFilesystem(test, testId) {
    const screenshots = []

    try {
      // Common screenshot locations to check
      const possibleDirs = [
        reportDir, // Same as report directory
        global.output_dir || './output', // Global output directory
        path.resolve(global.codecept_dir || '.', 'output'), // Codecept output directory
        path.resolve('.', 'output'), // Current directory output
        path.resolve('.', '_output'), // Alternative output directory
        path.resolve('output'), // Relative output directory
        path.resolve('qa', 'output'), // QA project output directory
        path.resolve('..', 'qa', 'output'), // Parent QA project output directory
      ]

      // Use the exact same logic as screenshotOnFail plugin's testToFileName function
      const originalTestName = test.title || 'test'
      const originalFeatureName = test.parent?.title || 'feature'

      // Replicate testToFileName logic from lib/mocha/test.js
      function replicateTestToFileName(testTitle) {
        let fileName = testTitle

        // Slice to 100 characters first
        fileName = fileName.slice(0, 100)

        // Handle data-driven tests: remove everything from '{' onwards (with 3 chars before)
        if (fileName.indexOf('{') !== -1) {
          fileName = fileName.substr(0, fileName.indexOf('{') - 3).trim()
        }

        // Apply clearString logic from utils.js
        if (fileName.endsWith('.')) {
          fileName = fileName.slice(0, -1)
        }
        fileName = fileName
          .replace(/ /g, '_')
          .replace(/"/g, "'")
          .replace(/\//g, '_')
          .replace(/</g, '(')
          .replace(/>/g, ')')
          .replace(/:/g, '_')
          .replace(/\\/g, '_')
          .replace(/\|/g, '_')
          .replace(/\?/g, '.')
          .replace(/\*/g, '^')
          .replace(/'/g, '')

        // Final slice to 100 characters
        return fileName.slice(0, 100)
      }

      const testName = replicateTestToFileName(originalTestName)
      const featureName = replicateTestToFileName(originalFeatureName)

      output.print(`HTML Reporter: Original test title: "${originalTestName}"`)
      output.print(`HTML Reporter: CodeceptJS filename: "${testName}"`)

      // Generate possible screenshot names based on CodeceptJS patterns
      const possibleNames = [
        `${testName}.failed.png`, // Primary CodeceptJS screenshotOnFail pattern
        `${testName}.failed.jpg`,
        `${featureName}_${testName}.failed.png`,
        `${featureName}_${testName}.failed.jpg`,
        `Test_${testName}.failed.png`, // Alternative pattern
        `Test_${testName}.failed.jpg`,
        `${testName}.png`,
        `${testName}.jpg`,
        `${featureName}_${testName}.png`,
        `${featureName}_${testName}.jpg`,
        `failed_${testName}.png`,
        `failed_${testName}.jpg`,
        `screenshot_${testId}.png`,
        `screenshot_${testId}.jpg`,
        'screenshot.png',
        'screenshot.jpg',
        'failure.png',
        'failure.jpg',
      ]

      output.print(`HTML Reporter: Checking ${possibleNames.length} possible screenshot names for "${testName}"`)

      // Search for screenshots in possible directories
      for (const dir of possibleDirs) {
        output.print(`HTML Reporter: Checking directory: ${dir}`)
        if (!fs.existsSync(dir)) {
          output.print(`HTML Reporter: Directory does not exist: ${dir}`)
          continue
        }

        try {
          const files = fs.readdirSync(dir)
          output.print(`HTML Reporter: Found ${files.length} files in ${dir}`)

          // Look for exact matches first
          for (const name of possibleNames) {
            if (files.includes(name)) {
              const fullPath = path.join(dir, name)
              if (!screenshots.includes(fullPath)) {
                screenshots.push(fullPath)
                output.print(`HTML Reporter: Found screenshot: ${fullPath}`)
              }
            }
          }

          // Look for screenshot files that are specifically for this test
          // Be more strict to avoid cross-test contamination
          const screenshotFiles = files.filter(file => {
            const lowerFile = file.toLowerCase()
            const lowerTestName = testName.toLowerCase()
            const lowerFeatureName = featureName.toLowerCase()

            return (
              file.match(/\.(png|jpg|jpeg|gif|webp|bmp)$/i) &&
              // Exact test name matches with .failed pattern (most specific)
              (file === `${testName}.failed.png` ||
                file === `${testName}.failed.jpg` ||
                file === `${featureName}_${testName}.failed.png` ||
                file === `${featureName}_${testName}.failed.jpg` ||
                file === `Test_${testName}.failed.png` ||
                file === `Test_${testName}.failed.jpg` ||
                // Word boundary checks for .failed pattern
                (lowerFile.includes('.failed.') &&
                  (lowerFile.startsWith(lowerTestName + '.') || lowerFile.startsWith(lowerFeatureName + '_' + lowerTestName + '.') || lowerFile.startsWith('test_' + lowerTestName + '.'))))
            )
          })

          for (const file of screenshotFiles) {
            const fullPath = path.join(dir, file)
            if (!screenshots.includes(fullPath)) {
              screenshots.push(fullPath)
              output.print(`HTML Reporter: Found related screenshot: ${fullPath}`)
            }
          }
        } catch (error) {
          // Ignore directory read errors
          output.print(`HTML Reporter: Could not read directory ${dir}: ${error.message}`)
        }
      }
    } catch (error) {
      output.print(`HTML Reporter: Error collecting screenshots: ${error.message}`)
    }

    return screenshots
  }

  function isBddGherkinTest(test, suite) {
    // Check if the suite has BDD/Gherkin properties
    return !!(suite && (suite.feature || suite.file?.endsWith('.feature')))
  }

  function getBddFeatureInfo(test, suite) {
    if (!suite) return null

    return {
      name: suite.feature?.name || suite.title,
      description: suite.feature?.description || suite.comment || '',
      language: suite.feature?.language || 'en',
      tags: suite.tags || [],
      file: suite.file || '',
    }
  }

  function exportTestStats(data, config) {
    const statsPath = path.resolve(reportDir, config.exportStatsPath)

    const exportData = {
      timestamp: data.endTime.toISOString(),
      duration: data.duration,
      stats: data.stats,
      retries: data.retries,
      testCount: data.tests.length,
      passedTests: data.tests.filter(t => t.state === 'passed').length,
      failedTests: data.tests.filter(t => t.state === 'failed').length,
      pendingTests: data.tests.filter(t => t.state === 'pending').length,
      tests: data.tests.map(test => ({
        id: test.id,
        title: test.title,
        feature: test.parent?.title || 'Unknown',
        state: test.state,
        duration: test.duration,
        tags: test.tags,
        meta: test.meta,
        retryAttempts: test.retryAttempts,
        uid: test.uid,
      })),
    }

    try {
      fs.writeFileSync(statsPath, JSON.stringify(exportData, null, 2))
      output.print(`Test stats exported to: ${statsPath}`)
    } catch (error) {
      output.print(`Failed to export test stats: ${error.message}`)
    }
  }

  function saveTestHistory(data, config) {
    const historyPath = path.resolve(reportDir, config.historyPath)
    let history = []

    // Load existing history
    try {
      if (fs.existsSync(historyPath)) {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'))
      }
    } catch (error) {
      output.print(`Failed to load existing history: ${error.message}`)
    }

    // Add current run to history
    history.unshift({
      timestamp: data.endTime.toISOString(),
      duration: data.duration,
      stats: data.stats,
      retries: data.retries.length,
      testCount: data.tests.length,
    })

    // Limit history entries
    if (history.length > config.maxHistoryEntries) {
      history = history.slice(0, config.maxHistoryEntries)
    }

    try {
      fs.writeFileSync(historyPath, JSON.stringify(history, null, 2))
      output.print(`Test history saved to: ${historyPath}`)
    } catch (error) {
      output.print(`Failed to save test history: ${error.message}`)
    }
  }

  /**
   * Consolidates JSON reports from multiple workers into a single HTML report
   */
  async function consolidateWorkerJsonResults(config) {
    const jsonFiles = fs.readdirSync(reportDir).filter(file => file.startsWith('worker-') && file.endsWith('-results.json'))

    if (jsonFiles.length === 0) {
      output.print('HTML Reporter: No worker JSON results found to consolidate')
      return
    }

    output.print(`HTML Reporter: Found ${jsonFiles.length} worker JSON files to consolidate`)

    // Initialize consolidated data structure
    const consolidatedData = {
      stats: {
        tests: 0,
        passes: 0,
        failures: 0,
        pending: 0,
        skipped: 0,
        duration: 0,
        failedHooks: 0,
      },
      tests: [],
      failures: [],
      hooks: [],
      startTime: new Date(),
      endTime: new Date(),
      retries: [],
      duration: 0,
    }

    try {
      // Process each worker's JSON file
      for (const jsonFile of jsonFiles) {
        const jsonPath = path.join(reportDir, jsonFile)
        try {
          const workerData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

          // Merge stats
          if (workerData.stats) {
            consolidatedData.stats.passes += workerData.stats.passes || 0
            consolidatedData.stats.failures += workerData.stats.failures || 0
            consolidatedData.stats.tests += workerData.stats.tests || 0
            consolidatedData.stats.pending += workerData.stats.pending || 0
            consolidatedData.stats.skipped += workerData.stats.skipped || 0
            consolidatedData.stats.duration += workerData.stats.duration || 0
            consolidatedData.stats.failedHooks += workerData.stats.failedHooks || 0
          }

          // Merge tests and failures
          if (workerData.tests) consolidatedData.tests.push(...workerData.tests)
          if (workerData.failures) consolidatedData.failures.push(...workerData.failures)
          if (workerData.hooks) consolidatedData.hooks.push(...workerData.hooks)
          if (workerData.retries) consolidatedData.retries.push(...workerData.retries)

          // Update timestamps
          if (workerData.startTime) {
            const workerStart = new Date(workerData.startTime).getTime()
            const currentStart = new Date(consolidatedData.startTime).getTime()
            if (workerStart < currentStart) {
              consolidatedData.startTime = workerData.startTime
            }
          }

          if (workerData.endTime) {
            const workerEnd = new Date(workerData.endTime).getTime()
            const currentEnd = new Date(consolidatedData.endTime).getTime()
            if (workerEnd > currentEnd) {
              consolidatedData.endTime = workerData.endTime
            }
          }

          // Update duration
          if (workerData.duration) {
            consolidatedData.duration = Math.max(consolidatedData.duration, workerData.duration)
          }

          // Clean up the worker JSON file
          try {
            fs.unlinkSync(jsonPath)
          } catch (error) {
            output.print(`Failed to delete worker JSON file ${jsonFile}: ${error.message}`)
          }
        } catch (error) {
          output.print(`Failed to process worker JSON file ${jsonFile}: ${error.message}`)
        }
      }

      // Generate the final HTML report
      generateHtmlReport(consolidatedData, config)

      // Export stats if configured
      if (config.exportStats) {
        exportTestStats(consolidatedData, config)
      }

      // Save history if configured
      if (config.keepHistory) {
        saveTestHistory(consolidatedData, config)
      }

      output.print(`HTML Reporter: Successfully consolidated ${jsonFiles.length} worker reports`)
    } catch (error) {
      output.print(`HTML Reporter: Failed to consolidate worker reports: ${error.message}`)
    }
  }

  async function generateHtmlReport(data, config) {
    const reportPath = path.join(reportDir, config.reportFileName)

    // Load history if available
    let history = []
    if (config.keepHistory) {
      const historyPath = path.resolve(reportDir, config.historyPath)
      try {
        if (fs.existsSync(historyPath)) {
          history = JSON.parse(fs.readFileSync(historyPath, 'utf8')) // Show all available history
        }
      } catch (error) {
        output.print(`Failed to load history for report: ${error.message}`)
      }

      // Add current run to history for chart display (before saving to file)
      const currentRun = {
        timestamp: data.endTime.toISOString(),
        duration: data.duration,
        stats: data.stats,
        retries: data.retries.length,
        testCount: data.tests.length,
      }
      history.unshift(currentRun)

      // Limit history entries for chart display
      if (history.length > config.maxHistoryEntries) {
        history = history.slice(0, config.maxHistoryEntries)
      }
    }

    // Get system information
    const systemInfo = await getMachineInfo()

    const html = template(getHtmlTemplate(), {
      title: `CodeceptJS Test Report v${Codecept.version()}`,
      timestamp: data.endTime.toISOString(),
      duration: formatDuration(data.duration),
      stats: JSON.stringify(data.stats),
      history: JSON.stringify(history),
      statsHtml: generateStatsHtml(data.stats),
      testsHtml: generateTestsHtml(data.tests, config),
      retriesHtml: config.showRetries ? generateRetriesHtml(data.retries) : '',
      cssStyles: getCssStyles(),
      jsScripts: getJsScripts(),
      showRetries: config.showRetries ? 'block' : 'none',
      showHistory: config.keepHistory && history.length > 0 ? 'block' : 'none',
      codeceptVersion: Codecept.version(),
      systemInfoHtml: generateSystemInfoHtml(systemInfo),
    })

    fs.writeFileSync(reportPath, html)
    output.print(`HTML Report saved to: ${reportPath}`)
  }

  function generateStatsHtml(stats) {
    const passed = stats.passes || 0
    const failed = stats.failures || 0
    const pending = stats.pending || 0
    const total = stats.tests || 0

    return `
      <div class="stats-cards">
        <div class="stat-card total">
          <h3>Total</h3>
          <span class="stat-number">${total}</span>
        </div>
        <div class="stat-card passed">
          <h3>Passed</h3>
          <span class="stat-number">${passed}</span>
        </div>
        <div class="stat-card failed">
          <h3>Failed</h3>
          <span class="stat-number">${failed}</span>
        </div>
        <div class="stat-card pending">
          <h3>Pending</h3>
          <span class="stat-number">${pending}</span>
        </div>
      </div>
      <div class="pie-chart-container">
        <canvas id="statsChart" width="300" height="300"></canvas>
        <script>
          // Pie chart data will be rendered by JavaScript
          window.chartData = {
            passed: ${passed},
            failed: ${failed},
            pending: ${pending}
          };
        </script>
      </div>
    `
  }

  function generateTestsHtml(tests, config) {
    if (!tests || tests.length === 0) {
      return '<p>No tests found.</p>'
    }

    return tests
      .map(test => {
        const statusClass = test.state || 'unknown'
        const feature = test.isBdd && test.feature ? test.feature.name : test.parent?.title || 'Unknown Feature'
        const steps = config.showSteps && test.steps ? (test.isBdd ? generateBddStepsHtml(test.steps) : generateStepsHtml(test.steps)) : ''
        const featureDetails = test.isBdd && test.feature ? generateBddFeatureHtml(test.feature) : ''
        const hooks = test.hooks && test.hooks.length > 0 ? generateHooksHtml(test.hooks) : ''
        const artifacts = config.includeArtifacts && test.artifacts ? generateArtifactsHtml(test.artifacts, test.state === 'failed') : ''
        const metadata = config.showMetadata && (test.meta || test.opts) ? generateMetadataHtml(test.meta, test.opts) : ''
        const tags = config.showTags && test.tags && test.tags.length > 0 ? generateTagsHtml(test.tags) : ''
        const retries = config.showRetries && test.retryAttempts > 0 ? generateTestRetryHtml(test.retryAttempts) : ''
        const notes = test.notes && test.notes.length > 0 ? generateNotesHtml(test.notes) : ''

        return `
        <div class="test-item ${statusClass}${test.isBdd ? ' bdd-test' : ''}" id="test-${test.id}" data-feature="${escapeHtml(feature)}" data-status="${statusClass}" data-tags="${(test.tags || []).join(',')}" data-retries="${test.retryAttempts || 0}" data-type="${test.isBdd ? 'bdd' : 'regular'}">
          <div class="test-header" onclick="toggleTestDetails('test-${test.id}')">
            <span class="test-status ${statusClass}">●</span>
            <div class="test-info">
              <h3 class="test-title">${test.isBdd ? `Scenario: ${test.title}` : test.title}</h3>
              <div class="test-meta-line">
                <span class="test-feature">${test.isBdd ? 'Feature: ' : ''}${feature}</span>
                ${test.uid ? `<span class="test-uid">${test.uid}</span>` : ''}
                <span class="test-duration">${formatDuration(test.duration)}</span>
                ${test.retryAttempts > 0 ? `<span class="retry-badge">${test.retryAttempts} retries</span>` : ''}
                ${test.isBdd ? '<span class="bdd-badge">Gherkin</span>' : ''}
              </div>
            </div>
          </div>
          <div class="test-details" id="details-test-${test.id}">
            ${test.err ? `<div class="error-message"><pre>${escapeHtml(getErrorMessage(test))}</pre></div>` : ''}
            ${featureDetails}
            ${tags}
            ${metadata}
            ${retries}
            ${notes}
            ${hooks}
            ${steps}
            ${artifacts}
          </div>
        </div>
      `
      })
      .join('')
  }

  function generateStepsHtml(steps) {
    if (!steps || steps.length === 0) return ''

    const stepsHtml = steps
      .map(step => {
        const statusClass = step.status || 'unknown'
        const args = step.args ? step.args.map(arg => JSON.stringify(arg)).join(', ') : ''
        const stepName = step.name || 'unknown step'
        const actor = step.actor || 'I'

        return `
        <div class="step-item ${statusClass}">
          <span class="step-status ${statusClass}">●</span>
          <span class="step-title">${actor}.${stepName}(${args})</span>
          <span class="step-duration">${formatDuration(step.duration)}</span>
        </div>
      `
      })
      .join('')

    return `
      <div class="steps-section">
        <h4>Steps:</h4>
        <div class="steps-list">${stepsHtml}</div>
      </div>
    `
  }

  function generateBddStepsHtml(steps) {
    if (!steps || steps.length === 0) return ''

    const stepsHtml = steps
      .map(step => {
        const statusClass = step.status || 'unknown'
        const keyword = step.keyword || 'Given'
        const text = step.text || ''
        const comment = step.comment ? `<div class="step-comment">${escapeHtml(step.comment)}</div>` : ''

        return `
        <div class="bdd-step-item ${statusClass}">
          <span class="step-status ${statusClass}">●</span>
          <span class="bdd-keyword">${keyword}</span>
          <span class="bdd-step-text">${escapeHtml(text)}</span>
          <span class="step-duration">${formatDuration(step.duration)}</span>
          ${comment}
        </div>
      `
      })
      .join('')

    return `
      <div class="bdd-steps-section">
        <h4>Scenario Steps:</h4>
        <div class="bdd-steps-list">${stepsHtml}</div>
      </div>
    `
  }

  function generateBddFeatureHtml(feature) {
    if (!feature) return ''

    const description = feature.description ? `<div class="feature-description">${escapeHtml(feature.description)}</div>` : ''
    const featureTags = feature.tags && feature.tags.length > 0 ? `<div class="feature-tags">${feature.tags.map(tag => `<span class="feature-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : ''

    return `
      <div class="bdd-feature-section">
        <h4>Feature Information:</h4>
        <div class="feature-info">
          <div class="feature-name">Feature: ${escapeHtml(feature.name)}</div>
          ${description}
          ${featureTags}
          ${feature.file ? `<div class="feature-file">File: ${escapeHtml(feature.file)}</div>` : ''}
        </div>
      </div>
    `
  }

  function generateHooksHtml(hooks) {
    if (!hooks || hooks.length === 0) return ''

    const hooksHtml = hooks
      .map(hook => {
        const statusClass = hook.status || 'unknown'
        const hookType = hook.type || 'hook'
        const hookTitle = hook.title || `${hookType} hook`

        return `
        <div class="hook-item ${statusClass}">
          <span class="hook-status ${statusClass}">●</span>
          <span class="hook-title">${hookType}: ${hookTitle}</span>
          <span class="hook-duration">${formatDuration(hook.duration)}</span>
          ${hook.error ? `<div class="hook-error">${escapeHtml(hook.error)}</div>` : ''}
        </div>
      `
      })
      .join('')

    return `
      <div class="hooks-section">
        <h4>Hooks:</h4>
        <div class="hooks-list">${hooksHtml}</div>
      </div>
    `
  }

  function generateMetadataHtml(meta, opts) {
    const allMeta = { ...(opts || {}), ...(meta || {}) }
    if (!allMeta || Object.keys(allMeta).length === 0) return ''

    const metaHtml = Object.entries(allMeta)
      .filter(([key, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        const displayValue = typeof value === 'object' ? JSON.stringify(value) : value.toString()
        return `<div class="meta-item"><span class="meta-key">${escapeHtml(key)}:</span> <span class="meta-value">${escapeHtml(displayValue)}</span></div>`
      })
      .join('')

    return `
      <div class="metadata-section">
        <h4>Metadata:</h4>
        <div class="metadata-list">${metaHtml}</div>
      </div>
    `
  }

  function generateTagsHtml(tags) {
    if (!tags || tags.length === 0) return ''

    const tagsHtml = tags.map(tag => `<span class="test-tag">${escapeHtml(tag)}</span>`).join('')

    return `
      <div class="tags-section">
        <h4>Tags:</h4>
        <div class="tags-list">${tagsHtml}</div>
      </div>
    `
  }

  function generateNotesHtml(notes) {
    if (!notes || notes.length === 0) return ''

    const notesHtml = notes.map(note => `<div class="note-item note-${note.type || 'info'}"><span class="note-type">${note.type || 'info'}:</span> <span class="note-text">${escapeHtml(note.text)}</span></div>`).join('')

    return `
      <div class="notes-section">
        <h4>Notes:</h4>
        <div class="notes-list">${notesHtml}</div>
      </div>
    `
  }

  function generateTestRetryHtml(retryAttempts) {
    return `
      <div class="retry-section">
        <h4>Retry Information:</h4>
        <div class="retry-info">
          <span class="retry-count">Total retry attempts: <strong>${retryAttempts}</strong></span>
        </div>
      </div>
    `
  }

  function generateArtifactsHtml(artifacts, isFailedTest = false) {
    if (!artifacts || artifacts.length === 0) {
      output.print(`HTML Reporter: No artifacts found for test`)
      return ''
    }

    output.print(`HTML Reporter: Processing ${artifacts.length} artifacts, isFailedTest: ${isFailedTest}`)
    output.print(`HTML Reporter: Artifacts: ${JSON.stringify(artifacts)}`)

    // Separate screenshots from other artifacts
    const screenshots = []
    const otherArtifacts = []

    artifacts.forEach(artifact => {
      output.print(`HTML Reporter: Processing artifact: ${artifact} (type: ${typeof artifact})`)

      // Handle different artifact formats
      let artifactPath = artifact
      if (typeof artifact === 'object' && artifact.path) {
        artifactPath = artifact.path
      } else if (typeof artifact === 'object' && artifact.file) {
        artifactPath = artifact.file
      } else if (typeof artifact === 'object' && artifact.src) {
        artifactPath = artifact.src
      }

      // Check if it's a screenshot file
      if (typeof artifactPath === 'string' && artifactPath.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i)) {
        screenshots.push(artifactPath)
        output.print(`HTML Reporter: Found screenshot: ${artifactPath}`)
      } else {
        otherArtifacts.push(artifact)
        output.print(`HTML Reporter: Found other artifact: ${artifact}`)
      }
    })

    output.print(`HTML Reporter: Found ${screenshots.length} screenshots and ${otherArtifacts.length} other artifacts`)

    let artifactsHtml = ''

    // For failed tests, prominently display screenshots
    if (isFailedTest && screenshots.length > 0) {
      const screenshotsHtml = screenshots
        .map(screenshot => {
          let relativePath = path.relative(reportDir, screenshot)
          const filename = path.basename(screenshot)

          // If relative path goes up directories, try to find the file in common locations
          if (relativePath.startsWith('..')) {
            // Try to find screenshot relative to output directory
            const outputRelativePath = path.relative(reportDir, path.resolve(screenshot))
            if (!outputRelativePath.startsWith('..')) {
              relativePath = outputRelativePath
            } else {
              // Use just the filename if file is in same directory as report
              const sameDir = path.join(reportDir, filename)
              if (fs.existsSync(sameDir)) {
                relativePath = filename
              } else {
                // Keep original path as fallback
                relativePath = screenshot
              }
            }
          }

          output.print(`HTML Reporter: Screenshot ${filename} -> ${relativePath}`)

          return `
              <div class="screenshot-container">
                <div class="screenshot-header">
                  <span class="screenshot-label">📸 ${escapeHtml(filename)}</span>
                </div>
                <img src="${relativePath}" alt="Test failure screenshot" class="failure-screenshot" onclick="openImageModal(this.src)"/>
              </div>
            `
        })
        .join('')

      artifactsHtml += `
        <div class="screenshots-section">
          <h4>Screenshots:</h4>
          <div class="screenshots-list">${screenshotsHtml}</div>
        </div>
      `
    } else if (screenshots.length > 0) {
      // For non-failed tests, display screenshots normally
      const screenshotsHtml = screenshots
        .map(screenshot => {
          let relativePath = path.relative(reportDir, screenshot)
          const filename = path.basename(screenshot)

          // If relative path goes up directories, try to find the file in common locations
          if (relativePath.startsWith('..')) {
            // Try to find screenshot relative to output directory
            const outputRelativePath = path.relative(reportDir, path.resolve(screenshot))
            if (!outputRelativePath.startsWith('..')) {
              relativePath = outputRelativePath
            } else {
              // Use just the filename if file is in same directory as report
              const sameDir = path.join(reportDir, filename)
              if (fs.existsSync(sameDir)) {
                relativePath = filename
              } else {
                // Keep original path as fallback
                relativePath = screenshot
              }
            }
          }

          output.print(`HTML Reporter: Screenshot ${filename} -> ${relativePath}`)
          return `<img src="${relativePath}" alt="Screenshot" class="artifact-image" onclick="openImageModal(this.src)"/>`
        })
        .join('')

      artifactsHtml += `
        <div class="screenshots-section">
          <h4>Screenshots:</h4>
          <div class="screenshots-list">${screenshotsHtml}</div>
        </div>
      `
    }

    // Display other artifacts if any
    if (otherArtifacts.length > 0) {
      const otherArtifactsHtml = otherArtifacts.map(artifact => `<div class="artifact-item">${escapeHtml(artifact.toString())}</div>`).join('')

      artifactsHtml += `
        <div class="other-artifacts-section">
          <h4>Other Artifacts:</h4>
          <div class="artifacts-list">${otherArtifactsHtml}</div>
        </div>
      `
    }

    return artifactsHtml
      ? `
      <div class="artifacts-section">
        ${artifactsHtml}
      </div>
    `
      : ''
  }

  function generateFailuresHtml(failures) {
    if (!failures || failures.length === 0) {
      return '<p>No failures.</p>'
    }

    return failures
      .map((failure, index) => {
        // Helper function to safely extract string values
        const safeString = value => {
          if (!value) return ''
          if (typeof value === 'string') return value
          if (typeof value === 'object' && value.toString) {
            const str = value.toString()
            return str === '[object Object]' ? '' : str
          }
          return String(value)
        }

        if (typeof failure === 'object' && failure !== null) {
          // Enhanced failure object with test details
          console.log('this is failure', failure)
          const testName = safeString(failure.testName) || 'Unknown Test'
          const featureName = safeString(failure.featureName) || 'Unknown Feature'
          let message = safeString(failure.message) || 'Test failed'
          const stack = safeString(failure.stack) || ''
          const filePath = safeString(failure.filePath) || ''

          // If message is still "[object Object]", try to extract from the failure object itself
          if (message === '[object Object]' || message === '') {
            if (failure.err && failure.err.message) {
              message = safeString(failure.err.message)
            } else if (failure.error && failure.error.message) {
              message = safeString(failure.error.message)
            } else if (failure.toString && typeof failure.toString === 'function') {
              const str = failure.toString()
              message = str === '[object Object]' ? 'Test failed' : str
            } else {
              message = 'Test failed'
            }
          }

          return `
        <div class="failure-item">
          <h4>Failure ${index + 1}: ${escapeHtml(testName)}</h4>
          <div class="failure-meta">
            <span class="failure-feature">Feature: ${escapeHtml(featureName)}</span>
            ${filePath ? `<span class="failure-file">File: <a href="file://${filePath}" target="_blank">${escapeHtml(filePath)}</a></span>` : ''}
          </div>
          <div class="failure-message">
            <strong>Error:</strong> ${escapeHtml(message)}
          </div>
          ${stack ? `<pre class="failure-stack">${escapeHtml(stack.replace(/\x1b\[[0-9;]*m/g, ''))}</pre>` : ''}
        </div>
      `
        } else {
          // Fallback for simple string failures
          const failureText = safeString(failure).replace(/\x1b\[[0-9;]*m/g, '') || 'Test failed'
          return `
        <div class="failure-item">
          <h4>Failure ${index + 1}</h4>
          <pre class="failure-details">${escapeHtml(failureText)}</pre>
        </div>
      `
        }
      })
      .join('')
  }

  function generateRetriesHtml(retries) {
    if (!retries || retries.length === 0) {
      return '<p>No retried tests.</p>'
    }

    return retries
      .map(
        retry => `
        <div class="retry-item">
          <h4>${retry.testTitle}</h4>
          <div class="retry-details">
            <span>Attempts: <strong>${retry.attempts}</strong></span>
            <span>Final State: <span class="status-badge ${retry.finalState}">${retry.finalState}</span></span>
            <span>Duration: ${formatDuration(retry.duration)}</span>
          </div>
        </div>
      `,
      )
      .join('')
  }

  function formatDuration(duration) {
    if (!duration) return '0ms'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(2)}s`
  }

  function escapeHtml(text) {
    if (!text) return ''
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
  }

  function getErrorMessage(test) {
    if (!test) return 'Test failed'

    // Helper function to safely extract string from potentially circular objects
    const safeExtract = (obj, prop) => {
      try {
        if (!obj || typeof obj !== 'object') return ''
        const value = obj[prop]
        if (typeof value === 'string') return value
        if (value && typeof value.toString === 'function') {
          const str = value.toString()
          return str === '[object Object]' ? '' : str
        }
        return ''
      } catch (e) {
        return ''
      }
    }

    // Helper function to safely stringify objects avoiding circular references
    const safeStringify = obj => {
      try {
        if (!obj) return ''
        if (typeof obj === 'string') return obj

        // Try to get message property first
        if (obj.message && typeof obj.message === 'string') {
          return obj.message
        }

        // For error objects, extract key properties manually
        if (obj instanceof Error || (obj.name && obj.message)) {
          return obj.message || obj.toString() || 'Error occurred'
        }

        // For other objects, try toString first
        if (obj.toString && typeof obj.toString === 'function') {
          const str = obj.toString()
          if (str !== '[object Object]' && !str.includes('[Circular Reference]')) {
            return str
          }
        }

        // Last resort: extract message-like properties
        if (obj.message) return obj.message
        if (obj.description) return obj.description
        if (obj.text) return obj.text

        return 'Error occurred'
      } catch (e) {
        return 'Error occurred'
      }
    }

    let errorMessage = ''
    let errorStack = ''

    // Primary error source
    if (test.err) {
      errorMessage = safeExtract(test.err, 'message') || safeStringify(test.err)
      errorStack = safeExtract(test.err, 'stack')
    }

    // Alternative error sources for different test frameworks
    if (!errorMessage && test.error) {
      errorMessage = safeExtract(test.error, 'message') || safeStringify(test.error)
      errorStack = safeExtract(test.error, 'stack')
    }

    // Check for nested error in parent
    if (!errorMessage && test.parent && test.parent.err) {
      errorMessage = safeExtract(test.parent.err, 'message') || safeStringify(test.parent.err)
      errorStack = safeExtract(test.parent.err, 'stack')
    }

    // Check for error details array (some frameworks use this)
    if (!errorMessage && test.err && test.err.details && Array.isArray(test.err.details)) {
      errorMessage = test.err.details
        .map(item => safeExtract(item, 'message') || safeStringify(item))
        .filter(msg => msg && msg !== '[Circular]')
        .join(' ')
    }

    // Fallback to test title if no error message found
    if (!errorMessage || errorMessage === '[Circular]') {
      errorMessage = `Test failed: ${test.title || 'Unknown test'}`
    }

    // Clean ANSI escape codes and remove circular reference markers
    const cleanMessage = (errorMessage || '')
      .replace(/\x1b\[[0-9;]*m/g, '')
      .replace(/\[Circular\]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const cleanStack = (errorStack || '')
      .replace(/\x1b\[[0-9;]*m/g, '')
      .replace(/\[Circular\]/g, '')
      .trim()

    // Return combined error information
    if (cleanStack && cleanStack !== cleanMessage && !cleanMessage.includes(cleanStack)) {
      return `${cleanMessage}\n\nStack trace:\n${cleanStack}`
    }

    return cleanMessage
  }

  function generateSystemInfoHtml(systemInfo) {
    if (!systemInfo) return ''

    const formatInfo = (key, value) => {
      if (Array.isArray(value) && value.length > 1) {
        return `<div class="info-item"><span class="info-key">${key}:</span> <span class="info-value">${escapeHtml(value[1])}</span></div>`
      } else if (typeof value === 'string' && value !== 'N/A' && value !== 'undefined') {
        return `<div class="info-item"><span class="info-key">${key}:</span> <span class="info-value">${escapeHtml(value)}</span></div>`
      }
      return ''
    }

    const infoItems = [
      formatInfo('Node.js', systemInfo.nodeInfo),
      formatInfo('OS', systemInfo.osInfo),
      formatInfo('CPU', systemInfo.cpuInfo),
      formatInfo('Chrome', systemInfo.chromeInfo),
      formatInfo('Edge', systemInfo.edgeInfo),
      formatInfo('Firefox', systemInfo.firefoxInfo),
      formatInfo('Safari', systemInfo.safariInfo),
      formatInfo('Playwright Browsers', systemInfo.playwrightBrowsers),
    ]
      .filter(item => item)
      .join('')

    if (!infoItems) return ''

    return `
      <section class="system-info-section">
        <div class="system-info-header" onclick="toggleSystemInfo()">
          <h3>Environment Information</h3>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="system-info-content" id="systemInfoContent">
          <div class="system-info-grid">
            ${infoItems}
          </div>
        </div>
      </section>
    `
  }

  function getHtmlTemplate() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>{{cssStyles}}</style>
</head>
<body>
    <header class="report-header">
        <h1>{{title}}</h1>
        <div class="report-meta">
            <span>Generated: {{timestamp}}</span>
            <span>Duration: {{duration}}</span>
        </div>
    </header>

    <main class="report-content">
        {{systemInfoHtml}}

        <section class="stats-section">
            <h2>Test Statistics</h2>
            {{statsHtml}}
        </section>

        <section class="history-section" style="display: {{showHistory}};">
            <h2>Test History</h2>
            <div class="history-chart-container">
                <canvas id="historyChart" width="800" height="300"></canvas>
            </div>
        </section>

        <section class="filters-section">
            <h2>Filters</h2>
            <div class="filter-controls">
                <div class="filter-group">
                    <label>Status:</label>
                    <select id="statusFilter" multiple>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="pending">Pending</option>
                        <option value="skipped">Skipped</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Feature:</label>
                    <input type="text" id="featureFilter" placeholder="Filter by feature...">
                </div>
                <div class="filter-group">
                    <label>Tags:</label>
                    <input type="text" id="tagFilter" placeholder="Filter by tags...">
                </div>
                <div class="filter-group">
                    <label>Retries:</label>
                    <select id="retryFilter">
                        <option value="all">All</option>
                        <option value="retried">With Retries</option>
                        <option value="no-retries">No Retries</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Test Type:</label>
                    <select id="typeFilter">
                        <option value="all">All</option>
                        <option value="bdd">BDD/Gherkin</option>
                        <option value="regular">Regular</option>
                    </select>
                </div>
                <button onclick="resetFilters()">Reset Filters</button>
            </div>
        </section>

        <section class="tests-section">
            <h2>Test Results</h2>
            <div class="tests-container">
                {{testsHtml}}
            </div>
        </section>

        <section class="retries-section" style="display: {{showRetries}};">
            <h2>Test Retries</h2>
            <div class="retries-container">
                {{retriesHtml}}
            </div>
        </section>

    </main>

    <!-- Modal for images -->
    <div id="imageModal" class="modal" onclick="closeImageModal()">
        <img id="modalImage" src="" alt="Enlarged screenshot"/>
    </div>

    <script>
        window.testData = {
            stats: {{stats}},
            history: {{history}}
        };
    </script>
    <script>{{jsScripts}}</script>
</body>
</html>
    `
  }

  function getCssStyles() {
    return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
}

.report-header {
    background: #2c3e50;
    color: white;
    padding: 2rem 1rem;
    text-align: center;
}

.report-header h1 {
    margin-bottom: 0.5rem;
    font-size: 2.5rem;
}

.report-meta {
    font-size: 0.9rem;
    opacity: 0.8;
}

.report-meta span {
    margin: 0 1rem;
}

.report-content {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
}

.stats-section, .tests-section, .retries-section, .filters-section, .history-section, .system-info-section {
    background: white;
    margin-bottom: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
}

.stats-section h2, .tests-section h2, .retries-section h2, .filters-section h2, .history-section h2 {
    background: #34495e;
    color: white;
    padding: 1rem;
    margin: 0;
}

.stats-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
}

.stat-card {
    flex: 1;
    min-width: 150px;
    padding: 1rem;
    text-align: center;
    border-radius: 4px;
    color: white;
}

.stat-card.total { background: #3498db; }
.stat-card.passed { background: #27ae60; }
.stat-card.failed { background: #e74c3c; }
.stat-card.pending { background: #f39c12; }

.stat-card h3 {
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
}

.stat-number {
    font-size: 2rem;
    font-weight: bold;
}

.pie-chart-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem 1rem;
    background: white;
    margin: 1rem 0;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

#statsChart {
    max-width: 100%;
    height: auto;
}

.test-item {
    border-bottom: 1px solid #eee;
    margin: 0;
}

.test-item:last-child {
    border-bottom: none;
}

.test-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.test-header:hover {
    background-color: #f8f9fa;
}

.test-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.test-meta-line {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
}

.test-status {
    font-size: 1.2rem;
    margin-right: 0.5rem;
}

.test-status.passed { color: #27ae60; }
.test-status.failed { color: #e74c3c; }
.test-status.pending { color: #f39c12; }
.test-status.skipped { color: #95a5a6; }

.test-title {
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0;
}

.test-feature {
    background: #ecf0f1;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #34495e;
}

.test-uid {
    background: #e8f4fd;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    color: #2980b9;
    font-family: monospace;
}

.retry-badge {
    background: #f39c12;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
}

.test-duration {
    font-size: 0.8rem;
    color: #7f8c8d;
}

.test-details {
    display: none;
    padding: 1rem;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
}

.error-message {
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.error-message pre {
    color: #c0392b;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.steps-section, .artifacts-section, .hooks-section {
    margin-top: 1rem;
}

.steps-section h4, .artifacts-section h4, .hooks-section h4 {
    color: #34495e;
    margin-bottom: 0.5rem;
    font-size: 1rem;
}

.hook-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #ecf0f1;
}

.hook-item:last-child {
    border-bottom: none;
}

.hook-status {
    margin-right: 0.5rem;
}

.hook-status.passed { color: #27ae60; }
.hook-status.failed { color: #e74c3c; }

.hook-title {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    font-weight: bold;
}

.hook-duration {
    font-size: 0.8rem;
    color: #7f8c8d;
}

.hook-error {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c0392b;
    font-size: 0.8rem;
}

.step-item {
    display: flex;
    align-items: flex-start;
    padding: 0.5rem 0;
    border-bottom: 1px solid #ecf0f1;
    word-wrap: break-word;
    overflow-wrap: break-word;
    min-height: 2rem;
}

.step-item:last-child {
    border-bottom: none;
}

.step-status {
    margin-right: 0.5rem;
    flex-shrink: 0;
    margin-top: 0.2rem;
}

.step-status.success { color: #27ae60; }
.step-status.failed { color: #e74c3c; }

.step-title {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.4;
    margin-right: 0.5rem;
    min-width: 0;
}

.step-duration {
    font-size: 0.8rem;
    color: #7f8c8d;
    flex-shrink: 0;
    margin-top: 0.2rem;
}

.artifacts-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.artifact-image {
    max-width: 200px;
    max-height: 150px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s;
}

.artifact-image:hover {
    transform: scale(1.05);
}

.artifact-item {
    background: #ecf0f1;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
}

.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.8);
    cursor: pointer;
}

.modal img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-width: 90%;
    max-height: 90%;
    border-radius: 4px;
}

/* Enhanced screenshot styles for failed tests */
.screenshots-section {
    margin-top: 1rem;
}

.screenshots-section h4 {
    color: #e74c3c;
    margin-bottom: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
}

.screenshots-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.screenshot-container {
    border: 2px solid #e74c3c;
    border-radius: 8px;
    overflow: hidden;
    background: white;
    box-shadow: 0 4px 8px rgba(231, 76, 60, 0.1);
}

.screenshot-header {
    background: #e74c3c;
    color: white;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 500;
}

.screenshot-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.failure-screenshot {
    width: 100%;
    max-width: 100%;
    height: auto;
    display: block;
    cursor: pointer;
    transition: opacity 0.2s;
}

.failure-screenshot:hover {
    opacity: 0.9;
}

.other-artifacts-section {
    margin-top: 1rem;
}

/* Filter Controls */
.filter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem;
    background: #f8f9fa;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.filter-group label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #34495e;
}

.filter-group input,
.filter-group select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    min-width: 150px;
}

.filter-group select[multiple] {
    height: auto;
    min-height: 80px;
}

.filter-controls button {
    padding: 0.5rem 1rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    align-self: flex-end;
}

.filter-controls button:hover {
    background: #2980b9;
}

/* Test Tags */
.tags-section, .metadata-section, .notes-section, .retry-section {
    margin-top: 1rem;
}

.tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.test-tag {
    background: #3498db;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
}

/* Metadata */
.metadata-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.meta-item {
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 4px;
    border-left: 3px solid #3498db;
}

.meta-key {
    font-weight: bold;
    color: #2c3e50;
}

.meta-value {
    color: #34495e;
    font-family: monospace;
}

/* Notes */
.notes-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.note-item {
    padding: 0.5rem;
    border-radius: 4px;
    border-left: 3px solid #95a5a6;
}

.note-item.note-info {
    background: #e8f4fd;
    border-left-color: #3498db;
}

.note-item.note-warning {
    background: #fef9e7;
    border-left-color: #f39c12;
}

.note-item.note-error {
    background: #fee;
    border-left-color: #e74c3c;
}

.note-item.note-retry {
    background: #f0f8e8;
    border-left-color: #27ae60;
}

.note-type {
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.8rem;
}

/* Retry Information */
.retry-info {
    padding: 0.5rem;
    background: #fef9e7;
    border-radius: 4px;
    border-left: 3px solid #f39c12;
}

.retry-count {
    color: #d68910;
    font-weight: 500;
}

/* Retries Section */
.retry-item {
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid #f39c12;
    border-radius: 4px;
    background: #fef9e7;
}

.retry-item h4 {
    color: #d68910;
    margin-bottom: 0.5rem;
}

.retry-details {
    display: flex;
    gap: 1rem;
    align-items: center;
    font-size: 0.9rem;
}

.status-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
    text-transform: uppercase;
}

.status-badge.passed {
    background: #27ae60;
    color: white;
}

.status-badge.failed {
    background: #e74c3c;
    color: white;
}

.status-badge.pending {
    background: #f39c12;
    color: white;
}

/* History Chart */
.history-chart-container {
    padding: 2rem 1rem;
    display: flex;
    justify-content: center;
}

#historyChart {
    max-width: 100%;
    height: auto;
}

/* Hidden items for filtering */
.test-item.filtered-out {
    display: none !important;
}

/* System Info Section */
.system-info-section {
    background: white;
    margin-bottom: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    overflow: hidden;
}

.system-info-header {
    background: #2c3e50;
    color: white;
    padding: 1rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s;
}

.system-info-header:hover {
    background: #34495e;
}

.system-info-header h3 {
    margin: 0;
    font-size: 1.2rem;
}

.toggle-icon {
    font-size: 1rem;
    transition: transform 0.3s ease;
}

.toggle-icon.rotated {
    transform: rotate(-180deg);
}

.system-info-content {
    display: none;
    padding: 1.5rem;
    background: #f8f9fa;
    border-top: 1px solid #e9ecef;
}

.system-info-content.visible {
    display: block;
}

.system-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}

.info-item {
    padding: 0.75rem;
    background: white;
    border-radius: 6px;
    border-left: 4px solid #3498db;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.info-key {
    font-weight: bold;
    color: #2c3e50;
    display: inline-block;
    min-width: 100px;
}

.info-value {
    color: #34495e;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
}

/* BDD/Gherkin specific styles */
.bdd-test {
    border-left: 4px solid #8e44ad;
}

.bdd-badge {
    background: #8e44ad;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: bold;
}

.bdd-feature-section {
    margin-top: 1rem;
    padding: 1rem;
    background: #f8f9fa;
    border-left: 4px solid #8e44ad;
    border-radius: 4px;
}

.feature-name {
    font-weight: bold;
    font-size: 1.1rem;
    color: #8e44ad;
    margin-bottom: 0.5rem;
}

.feature-description {
    color: #34495e;
    font-style: italic;
    margin: 0.5rem 0;
    padding: 0.5rem;
    background: white;
    border-radius: 4px;
}

.feature-file {
    font-size: 0.8rem;
    color: #7f8c8d;
    margin-top: 0.5rem;
}

.feature-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin: 0.5rem 0;
}

.feature-tag {
    background: #8e44ad;
    color: white;
    padding: 0.2rem 0.4rem;
    border-radius: 8px;
    font-size: 0.7rem;
}

.bdd-steps-section {
    margin-top: 1rem;
}

.bdd-steps-section h4 {
    color: #8e44ad;
    margin-bottom: 0.5rem;
    font-size: 1rem;
}

.bdd-step-item {
    display: flex;
    align-items: flex-start;
    padding: 0.5rem 0;
    border-bottom: 1px solid #ecf0f1;
    font-family: 'Segoe UI', sans-serif;
    word-wrap: break-word;
    overflow-wrap: break-word;
    min-height: 2rem;
}

.bdd-step-item:last-child {
    border-bottom: none;
}

.bdd-keyword {
    font-weight: bold;
    color: #8e44ad;
    margin-right: 0.5rem;
    min-width: 60px;
    text-align: left;
    flex-shrink: 0;
}

.bdd-step-text {
    flex: 1;
    color: #2c3e50;
    margin-right: 0.5rem;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.4;
    min-width: 0;
}

.step-comment {
    width: 100%;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #f8f9fa;
    border-left: 3px solid #8e44ad;
    font-style: italic;
    color: #6c757d;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.4;
}

@media (max-width: 768px) {
    .stats-cards {
        flex-direction: column;
    }
    
    .test-header {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }
    
    .test-feature, .test-duration {
        align-self: flex-start;
    }
}
    `
  }

  function getJsScripts() {
    return `
function toggleTestDetails(testId) {
    const details = document.getElementById('details-' + testId);
    if (details.style.display === 'none' || details.style.display === '') {
        details.style.display = 'block';
    } else {
        details.style.display = 'none';
    }
}

function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = src;
    modal.style.display = 'block';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none';
}

function toggleSystemInfo() {
    const content = document.getElementById('systemInfoContent');
    const icon = document.querySelector('.toggle-icon');
    
    if (content.classList.contains('visible')) {
        content.classList.remove('visible');
        icon.classList.remove('rotated');
    } else {
        content.classList.add('visible');
        icon.classList.add('rotated');
    }
}

// Filter functionality
function applyFilters() {
    const statusFilter = Array.from(document.getElementById('statusFilter').selectedOptions).map(opt => opt.value);
    const featureFilter = document.getElementById('featureFilter').value.toLowerCase();
    const tagFilter = document.getElementById('tagFilter').value.toLowerCase();
    const retryFilter = document.getElementById('retryFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    const testItems = document.querySelectorAll('.test-item');

    testItems.forEach(item => {
        let shouldShow = true;

        // Status filter
        if (statusFilter.length > 0) {
            const testStatus = item.dataset.status;
            if (!statusFilter.includes(testStatus)) {
                shouldShow = false;
            }
        }

        // Feature filter
        if (featureFilter && shouldShow) {
            const feature = (item.dataset.feature || '').toLowerCase();
            if (!feature.includes(featureFilter)) {
                shouldShow = false;
            }
        }

        // Tag filter
        if (tagFilter && shouldShow) {
            const tags = (item.dataset.tags || '').toLowerCase();
            if (!tags.includes(tagFilter)) {
                shouldShow = false;
            }
        }

        // Retry filter
        if (retryFilter !== 'all' && shouldShow) {
            const retries = parseInt(item.dataset.retries || '0');
            if (retryFilter === 'retried' && retries === 0) {
                shouldShow = false;
            } else if (retryFilter === 'no-retries' && retries > 0) {
                shouldShow = false;
            }
        }

        // Test type filter (BDD/Gherkin vs Regular)
        if (typeFilter !== 'all' && shouldShow) {
            const testType = item.dataset.type || 'regular';
            if (typeFilter !== testType) {
                shouldShow = false;
            }
        }

        if (shouldShow) {
            item.classList.remove('filtered-out');
        } else {
            item.classList.add('filtered-out');
        }
    });

    updateFilteredStats();
}

function resetFilters() {
    document.getElementById('statusFilter').selectedIndex = -1;
    document.getElementById('featureFilter').value = '';
    document.getElementById('tagFilter').value = '';
    document.getElementById('retryFilter').value = 'all';
    document.getElementById('typeFilter').value = 'all';
    
    document.querySelectorAll('.test-item').forEach(item => {
        item.classList.remove('filtered-out');
    });

    updateFilteredStats();
}

function updateFilteredStats() {
    const visibleTests = document.querySelectorAll('.test-item:not(.filtered-out)');
    const totalVisible = visibleTests.length;
    
    // Update the title to show filtered count
    const testsSection = document.querySelector('.tests-section h2');
    const totalTests = document.querySelectorAll('.test-item').length;
    
    if (totalVisible !== totalTests) {
        testsSection.textContent = 'Test Results (' + totalVisible + ' of ' + totalTests + ' shown)';
    } else {
        testsSection.textContent = 'Test Results';
    }
}

// Draw pie chart using canvas
function drawPieChart() {
    const canvas = document.getElementById('statsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const data = window.chartData;
    
    if (!data) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    
    const total = data.passed + data.failed + data.pending;
    if (total === 0) {
        // Draw empty circle for no tests
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#888';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No Tests', centerX, centerY);
        return;
    }
    
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Calculate percentages
    const passedPercent = Math.round((data.passed / total) * 100);
    const failedPercent = Math.round((data.failed / total) * 100);
    const pendingPercent = Math.round((data.pending / total) * 100);
    
    // Draw passed segment
    if (data.passed > 0) {
        const angle = (data.passed / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fillStyle = '#27ae60';
        ctx.fill();
        
        // Add percentage text on segment if significant enough
        if (passedPercent >= 10) {
            const textAngle = currentAngle + angle / 2;
            const textRadius = radius * 0.7;
            const textX = centerX + Math.cos(textAngle) * textRadius;
            const textY = centerY + Math.sin(textAngle) * textRadius;
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(passedPercent + '%', textX, textY);
        }
        
        currentAngle += angle;
    }
    
    // Draw failed segment
    if (data.failed > 0) {
        const angle = (data.failed / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        
        // Add percentage text on segment if significant enough
        if (failedPercent >= 10) {
            const textAngle = currentAngle + angle / 2;
            const textRadius = radius * 0.7;
            const textX = centerX + Math.cos(textAngle) * textRadius;
            const textY = centerY + Math.sin(textAngle) * textRadius;
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(failedPercent + '%', textX, textY);
        }
        
        currentAngle += angle;
    }
    
    // Draw pending segment
    if (data.pending > 0) {
        const angle = (data.pending / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + angle);
        ctx.closePath();
        ctx.fillStyle = '#f39c12';
        ctx.fill();
        
        // Add percentage text on segment if significant enough
        if (pendingPercent >= 10) {
            const textAngle = currentAngle + angle / 2;
            const textRadius = radius * 0.7;
            const textX = centerX + Math.cos(textAngle) * textRadius;
            const textY = centerY + Math.sin(textAngle) * textRadius;
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pendingPercent + '%', textX, textY);
        }
    }
    
    // Add legend with percentages
    const legendY = centerY + radius + 40;
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    let legendX = centerX - 150;
    
    // Passed legend
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(legendX, legendY, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Passed (' + data.passed + ' - ' + passedPercent + '%)', legendX + 20, legendY + 12);
    
    // Failed legend
    legendX += 130;
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(legendX, legendY, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Failed (' + data.failed + ' - ' + failedPercent + '%)', legendX + 20, legendY + 12);
    
    // Pending legend
    if (data.pending > 0) {
        legendX += 120;
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(legendX, legendY, 15, 15);
        ctx.fillStyle = '#333';
        ctx.fillText('Pending (' + data.pending + ' - ' + pendingPercent + '%)', legendX + 20, legendY + 12);
    }
}

// Draw history chart
function drawHistoryChart() {
    const canvas = document.getElementById('historyChart');
    
    if (!canvas || !window.testData || !window.testData.history || window.testData.history.length === 0) {
        return;
    }
    
    const ctx = canvas.getContext('2d');
    const history = window.testData.history.slice().reverse(); // Most recent last
    console.log('History chart - Total data points:', window.testData.history.length);
    console.log('History chart - Processing points:', history.length);
    console.log('History chart - Raw history data:', window.testData.history);
    console.log('History chart - Reversed history:', history);
    
    const padding = 60;
    const bottomPadding = 80; // Extra space for timestamps
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - padding - bottomPadding;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate success rates and max values
    const dataPoints = history.map((run, index) => {
        const total = run.stats.tests || 0;
        const passed = run.stats.passes || 0;
        const failed = run.stats.failures || 0;
        const successRate = total > 0 ? (passed / total) * 100 : 0;
        const timestamp = new Date(run.timestamp);
        
        return {
            index,
            timestamp,
            total,
            passed,
            failed,
            successRate,
            duration: run.duration || 0,
            retries: run.retries || 0
        };
    });
    
    console.log('History chart - Data points created:', dataPoints.length);
    console.log('History chart - Data points:', dataPoints);
    
    const maxTests = Math.max(...dataPoints.map(d => d.total));
    const maxSuccessRate = 100;
    
    if (maxTests === 0) return;
    
    // Draw background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(padding, padding, chartWidth, chartHeight);
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
        const y = padding + (chartHeight * i / 4);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
    }
    
    // Calculate positions
    const stepX = dataPoints.length > 1 ? chartWidth / (dataPoints.length - 1) : chartWidth / 2;
    
    // Draw success rate area chart
    ctx.fillStyle = 'rgba(39, 174, 96, 0.1)';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    dataPoints.forEach((point, index) => {
        const x = dataPoints.length === 1 ? padding + chartWidth / 2 : padding + (index * stepX);
        const y = padding + chartHeight - (point.successRate / maxSuccessRate) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, padding + chartHeight);
            ctx.lineTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        point.x = x;
        point.y = y;
    });
    
    // Close the area
    if (dataPoints.length > 0) {
        const lastPoint = dataPoints[dataPoints.length - 1];
        ctx.lineTo(lastPoint.x, padding + chartHeight);
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw success rate line
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    dataPoints.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.stroke();
    
    // Draw data points with enhanced styling
    dataPoints.forEach(point => {
        // Outer ring based on status
        const ringColor = point.failed > 0 ? '#e74c3c' : '#27ae60';
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Inner circle
        ctx.fillStyle = point.failed > 0 ? '#e74c3c' : '#27ae60';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // White center dot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Y-axis labels (Success Rate %)
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const value = Math.round((maxSuccessRate * i) / 4);
        const y = padding + chartHeight - (chartHeight * i / 4);
        ctx.fillText(value + '%', padding - 10, y + 4);
    }
    
    // X-axis labels (Timestamps)
    ctx.textAlign = 'center';
    ctx.font = '10px Arial';
    dataPoints.forEach((point, index) => {
        const timeStr = point.timestamp.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        const dateStr = point.timestamp.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        console.log('Drawing label ' + index + ': ' + timeStr + ' at x=' + point.x);
        ctx.fillText(timeStr, point.x, padding + chartHeight + 15);
        ctx.fillText(dateStr, point.x, padding + chartHeight + 30);
    });
    
    // Enhanced legend with statistics
    const legendY = 25;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // Success rate legend
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(padding + 20, legendY, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Success Rate', padding + 40, legendY + 12);
    
    // Current stats
    if (dataPoints.length > 0) {
        const latest = dataPoints[dataPoints.length - 1];
        const trend = dataPoints.length > 1 ? 
            (latest.successRate - dataPoints[dataPoints.length - 2].successRate) : 0;
        const trendIcon = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
        const trendColor = trend > 0 ? '#27ae60' : trend < 0 ? '#e74c3c' : '#666';
        
        ctx.fillStyle = '#666';
        ctx.fillText('Latest: ' + latest.successRate.toFixed(1) + '%', padding + 150, legendY + 12);
        
        ctx.fillStyle = trendColor;
        ctx.fillText(trendIcon + ' ' + Math.abs(trend).toFixed(1) + '%', padding + 240, legendY + 12);
    }
    
    // Chart title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Test Success Rate History', canvas.width / 2, 20);
}

// Initialize charts and filters
document.addEventListener('DOMContentLoaded', function() {
    
    // Draw charts
    drawPieChart();
    drawHistoryChart();
    
    // Set up filter event listeners
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('featureFilter').addEventListener('input', applyFilters);
    document.getElementById('tagFilter').addEventListener('input', applyFilters);
    document.getElementById('retryFilter').addEventListener('change', applyFilters);
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
});
    `
  }
}
