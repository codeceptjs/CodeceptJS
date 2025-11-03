import { expect } from 'chai'
import event from '../../lib/event.js'
import Config from '../../lib/config.js'
import globalRetry from '../../lib/listener/globalRetry.js'
import retryFailedStep from '../../lib/plugin/retryFailedStep.js'
import store from '../../lib/store.js'
import recorder from '../../lib/recorder.js'
import { createTest } from '../../lib/mocha/test.js'
import { createSuite } from '../../lib/mocha/suite.js'
import MochaSuite from 'mocha/lib/suite.js'
import output from '../../lib/output.js'

describe('Retry Mechanisms Conflict Tests', function () {
  let originalConfig
  let capturedLogs
  let originalLog

  beforeEach(function () {
    // Capture original configuration
    originalConfig = Config.get()

    // Setup log capturing
    capturedLogs = []
    originalLog = output.log
    output.log = message => {
      capturedLogs.push(message)
      originalLog(message)
    }

    // Reset state
    store.autoRetries = false
    event.dispatcher.removeAllListeners()
    recorder.reset()
  })

  afterEach(function () {
    // Restore original log
    if (originalLog) {
      output.log = originalLog
    }

    // Restore original configuration
    Config.create(originalConfig)

    // Reset event listeners
    event.dispatcher.removeAllListeners()

    // Reset state
    store.autoRetries = false
    recorder.reset()
  })

  describe.skip('Global Retry and RetryFailedStep Plugin Conflicts', function () {
    it('should demonstrate configuration priority conflicts', function () {
      // Setup global retry configuration
      Config.create({
        retry: {
          Scenario: 3,
          Feature: 2,
        },
      })

      // Setup retryFailedStep plugin
      const retryStepConfig = {
        retries: 2,
        minTimeout: 1,
      }

      // Initialize both mechanisms
      globalRetry()
      retryFailedStep(retryStepConfig)

      // Create test suite and test
      const rootSuite = new MochaSuite('', null, true)
      const suite = createSuite(rootSuite, 'Test Suite')
      const test = createTest('Test with conflicts', () => {})

      // Simulate suite.before event (global retry should set suite retries)
      event.dispatcher.emit(event.suite.before, suite)

      // Simulate test.before event (both mechanisms should set test retries)
      event.dispatcher.emit(event.test.before, test)

      // Check the actual behavior - suite retries are set
      // Suite retries() returns -1 by default, Feature config should set it
      console.log('Suite retries:', suite.retries())
      console.log('Test retries:', test.retries())
      console.log('Conditional retries:', test.opts.conditionalRetries)
      console.log('AutoRetries:', store.autoRetries)

      // The actual issue is that Feature-level retries don't work as expected
      // This shows a gap in the current implementation
      expect(suite.retries()).to.equal(-1) // Feature retry not properly set

      // Test retries should be set to Scenario value
      expect(test.retries()).to.equal(3) // Scenario retry from global config

      // Plugin sets conditional retries for steps
      expect(test.opts.conditionalRetries).to.equal(2) // Step retry from plugin

      // Plugin activates auto retries
      expect(store.autoRetries).to.equal(true) // Plugin sets this

      // This demonstrates overlapping retry mechanisms:
      // 1. Test will be retried 3 times at scenario level (global retry)
      // 2. Each step will be retried 2 times at step level (retryFailedStep plugin)
      // 3. Total possible executions = 3 * (1 + 2) = 9 times for a single step
      // 4. Both mechanisms log their configurations
      expect(capturedLogs.some(log => log.includes('Retries: 3'))).to.be.true
    })

    it('should show step retry and global retry can work together', function () {
      // This is actually a valid scenario but shows the complexity
      Config.create({
        retry: {
          Scenario: 2,
        },
      })

      globalRetry()
      retryFailedStep({ retries: 1, minTimeout: 1 })

      const test = createTest('Test with mixed retries', () => {})

      // Initialize mechanisms
      event.dispatcher.emit(event.test.before, test)

      // Global retry sets scenario-level retries
      expect(test.retries()).to.equal(2)

      // Step retry plugin sets conditional retries and enables auto retries
      expect(test.opts.conditionalRetries).to.equal(1)
      expect(store.autoRetries).to.be.true

      // User might not realize they have both levels active
    })
  })

  describe.skip('State Management Conflicts', function () {
    it('should demonstrate autoRetries flag conflicts', function () {
      // Initialize retryFailedStep
      retryFailedStep({ retries: 2 })

      const test = createTest('Test', () => {})

      // Initially autoRetries should be false
      expect(store.autoRetries).to.be.false

      // retryFailedStep sets it to true
      event.dispatcher.emit(event.test.before, test)
      expect(store.autoRetries).to.be.true

      // But if test has disableRetryFailedStep, it sets it back to false
      test.opts.disableRetryFailedStep = true
      event.dispatcher.emit(event.test.before, test)
      expect(store.autoRetries).to.be.false

      // This shows how the flag can be toggled unpredictably
    })

    it('should show logging conflicts', function () {
      Config.create({
        retry: {
          Scenario: 2,
        },
      })

      globalRetry()
      retryFailedStep({ retries: 3 })

      const rootSuite = new MochaSuite('', null, true)
      const suite = createSuite(rootSuite, 'Suite')
      const test = createTest('Test', () => {})

      event.dispatcher.emit(event.suite.before, suite)
      event.dispatcher.emit(event.test.before, test)

      // Check for multiple logging of retry configurations
      const retryLogs = capturedLogs.filter(log => log.includes('Retries:'))
      expect(retryLogs.length).to.be.greaterThan(1)

      // This shows conflicting/duplicate logging
    })
  })

  describe.skip('Configuration Overlap Detection', function () {
    it('should identify when multiple retry types are configured', function () {
      const config = {
        retry: {
          Scenario: 3,
          Feature: 2,
          Before: 1,
        },
        plugins: {
          retryFailedStep: {
            enabled: true,
            retries: 2,
          },
        },
      }

      Config.create(config)

      // This test shows that users can easily misconfigure
      // multiple retry levels without understanding the implications
      const retryConfig = Config.get('retry')
      const pluginConfig = Config.get('plugins')
      const retryPluginConfig = pluginConfig ? pluginConfig.retryFailedStep : null

      expect(retryConfig).to.exist
      expect(retryPluginConfig).to.exist

      // User doesn't realize they've configured 4 different retry levels:
      // 1. Feature level (2 retries)
      // 2. Scenario level (3 retries)
      // 3. Hook level (1 retry)
      // 4. Step level (2 retries)
    })
  })
})
