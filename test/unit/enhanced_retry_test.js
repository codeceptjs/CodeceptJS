import { expect } from 'chai'
import event from '../../lib/event.js'
import Config from '../../lib/config.js'
import enhancedGlobalRetry from '../../lib/listener/enhancedGlobalRetry.js'
import enhancedRetryFailedStep from '../../lib/plugin/enhancedRetryFailedStep.js'
import * as retryCoordinator from '../../lib/retryCoordinator.js'
import store from '../../lib/store.js'
import recorder from '../../lib/recorder.js'
import { createTest } from '../../lib/mocha/test.js'
import { createSuite } from '../../lib/mocha/suite.js'
import MochaSuite from 'mocha/lib/suite.js'
import output from '../../lib/output.js'

describe('Enhanced Retry Mechanisms', function () {
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
      // Comment out to reduce noise: originalLog(message)
    }

    // Reset state
    store.autoRetries = false
    event.dispatcher.removeAllListeners()
    recorder.reset()
    retryCoordinator.reset()
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
    retryCoordinator.reset()
  })

  describe('Enhanced Global Retry', function () {
    it('should use priority system to coordinate retries', function () {
      // Setup configuration with multiple retry levels
      Config.create({
        retry: {
          Scenario: 3,
          Feature: 2,
        },
      })

      enhancedGlobalRetry()

      const rootSuite = new MochaSuite('', null, true)
      const suite = createSuite(rootSuite, 'Test Suite')
      const test = createTest('Test with priorities', () => {})

      // Apply retry configurations
      event.dispatcher.emit(event.suite.before, suite)
      event.dispatcher.emit(event.test.before, test)

      // Check that priority information is tracked
      expect(suite.opts.retryPriority).to.equal(retryCoordinator.RETRY_PRIORITIES.FEATURE_CONFIG)
      expect(test.opts.retryPriority).to.equal(retryCoordinator.RETRY_PRIORITIES.SCENARIO_CONFIG)

      // Check logging includes enhanced information
      const globalRetryLogs = capturedLogs.filter(log => log.includes('[Global Retry]'))
      expect(globalRetryLogs.length).to.be.greaterThan(0)
    })

    it('should respect priority when setting retries', function () {
      Config.create({
        retry: {
          Scenario: 2,
        },
      })

      enhancedGlobalRetry()

      const test = createTest('Priority test', () => {})

      // First set by global retry
      event.dispatcher.emit(event.test.before, test)
      expect(test.retries()).to.equal(2)
      expect(test.opts.retryPriority).to.equal(retryCoordinator.RETRY_PRIORITIES.SCENARIO_CONFIG)

      // Simulate a higher priority mechanism (like manual retry)
      test.opts.retryPriority = retryCoordinator.RETRY_PRIORITIES.MANUAL_STEP
      test.retries(1) // Manual override

      // Global retry should not override higher priority
      event.dispatcher.emit(event.test.before, test)
      expect(test.retries()).to.equal(1) // Should remain unchanged
    })
  })

  describe('Enhanced RetryFailedStep Plugin', function () {
    it('should coordinate with scenario retries', function () {
      Config.create({
        retry: {
          Scenario: 3,
        },
      })

      enhancedGlobalRetry()
      enhancedRetryFailedStep({ retries: 2, minTimeout: 1 })

      const test = createTest('Coordinated test', () => {})

      // Apply configurations
      event.dispatcher.emit(event.test.before, test)

      // Step retries should be deferred to scenario retries
      console.log('autoRetries:', store.autoRetries)
      console.log('test retries:', test.retries())
      console.log('test.opts:', test.opts)

      expect(store.autoRetries).to.be.false
      expect(test.retries()).to.equal(3)

      // Should log the coordination decision
      const coordinationLogs = capturedLogs.filter(log => log.includes('[Step Retry] Deferred to scenario retries'))
      expect(coordinationLogs.length).to.be.greaterThan(0)
    })

    it('should work normally when no scenario retries are configured', function () {
      enhancedRetryFailedStep({ retries: 2, minTimeout: 1 })

      const test = createTest('Step retry test', () => {})

      event.dispatcher.emit(event.test.before, test)

      // Step retries should be active when no conflicts
      expect(store.autoRetries).to.be.true
      expect(test.opts.conditionalRetries).to.equal(2)

      const enabledLogs = capturedLogs.filter(log => log.includes('[Step Retry] Enabled'))
      expect(enabledLogs.length).to.be.greaterThan(0)
    })

    it('should be disabled per test as before', function () {
      enhancedRetryFailedStep({ retries: 2 })

      const test = createTest('Disabled test', () => {})
      test.opts.disableRetryFailedStep = true

      event.dispatcher.emit(event.test.before, test)

      expect(store.autoRetries).to.be.false

      const disabledLogs = capturedLogs.filter(log => log.includes('[Step Retry] Disabled'))
      expect(disabledLogs.length).to.be.greaterThan(0)
    })
  })

  describe('Retry Coordinator', function () {
    it('should detect retry configuration conflicts', function () {
      const config = {
        retry: {
          Scenario: 3,
        },
        plugins: {
          retryFailedStep: {
            enabled: true,
            retries: 2,
          },
        },
      }

      const warnings = retryCoordinator.validateConfig(config)
      expect(warnings.length).to.be.greaterThan(0)

      const conflictWarning = warnings.find(w => w.includes('Both global retries'))
      expect(conflictWarning).to.exist
      expect(conflictWarning).to.include('total executions could be 9') // 3 * (2 + 1)
    })

    it('should warn about excessive retry counts', function () {
      const config = {
        retry: {
          Scenario: 10, // Excessive
        },
      }

      const warnings = retryCoordinator.validateConfig(config)
      expect(warnings.length).to.be.greaterThan(0)

      const excessiveWarning = warnings.find(w => w.includes('High retry count'))
      expect(excessiveWarning).to.exist
    })

    it('should register and coordinate retry mechanisms', function () {
      const test = createTest('Coordinated test', () => {})

      // Register multiple retry mechanisms
      retryCoordinator.registerRetry(retryCoordinator.RETRY_TYPES.SCENARIO, { retries: 3 }, test, retryCoordinator.RETRY_PRIORITIES.SCENARIO_CONFIG)

      retryCoordinator.registerRetry(retryCoordinator.RETRY_TYPES.STEP_PLUGIN, { retries: 2 }, test, retryCoordinator.RETRY_PRIORITIES.STEP_PLUGIN)

      // Get effective configuration (highest priority should win)
      const effective = retryCoordinator.getEffectiveRetryConfig(test)
      expect(effective.type).to.equal(retryCoordinator.RETRY_TYPES.STEP_PLUGIN)
      expect(effective.retries).to.equal(2)
    })

    it('should generate useful retry summaries', function () {
      const test = createTest('Summary test', () => {})

      retryCoordinator.registerRetry(retryCoordinator.RETRY_TYPES.SCENARIO, { retries: 3 }, test, retryCoordinator.RETRY_PRIORITIES.SCENARIO_CONFIG)

      const summary = retryCoordinator.generateRetrySummary()

      expect(summary.totalRetryMechanisms).to.equal(1)
      expect(summary.byType[retryCoordinator.RETRY_TYPES.SCENARIO]).to.equal(1)
      expect(summary.recommendations).to.be.an('array')
    })
  })

  describe('Integration: Enhanced Mechanisms Working Together', function () {
    it('should provide clear coordination with both mechanisms active', function () {
      Config.create({
        retry: {
          Scenario: 2,
          Feature: 1,
        },
      })

      enhancedGlobalRetry()
      enhancedRetryFailedStep({
        retries: 3,
        minTimeout: 1,
        deferToScenarioRetries: false, // Allow both to be active for this test
      })

      const rootSuite = new MochaSuite('', null, true)
      const suite = createSuite(rootSuite, 'Integration Suite')
      const test = createTest('Integration test', () => {})

      // Apply all configurations
      event.dispatcher.emit(event.suite.before, suite)
      event.dispatcher.emit(event.test.before, test)

      // Check that both mechanisms are configured
      expect(suite.retries()).to.equal(1) // Feature retry
      expect(test.retries()).to.equal(2) // Scenario retry
      expect(test.opts.conditionalRetries).to.equal(3) // Step retry

      // Should have coordination logging
      const allLogs = capturedLogs.join(' ')
      expect(allLogs).to.include('[Global Retry]')
      expect(allLogs).to.include('[Step Retry]')
    })
  })
})
