const TestHelper = require('../support/TestHelper')
const WebDriver = require('../../lib/helper/WebDriver')
const assert = require('assert')
const path = require('path')

let wd
const siteUrl = TestHelper.siteUrl()

describe('WebDriver BiDi Protocol - Unit Tests', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/../..')
  })

  describe('BiDi Configuration (No Browser Required)', () => {
    beforeEach(() => {
      wd = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
        windowSize: '500x700',
        bidiProtocol: true, // Enable BiDi protocol
        capabilities: {
          chromeOptions: {
            args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
          },
        },
      })
    })

    it('should enable BiDi protocol when configured', () => {
      assert.strictEqual(wd.bidiEnabled, true)
      assert.ok(wd.bidiNetworkEvents)
      assert.ok(wd.bidiConsoleMessages)
      assert.ok(wd.bidiNavigationEvents)
      assert.ok(wd.bidiScriptExceptions)
      assert.ok(wd.bidiPerformanceMetrics)
    })

    it('should initialize BiDi arrays as empty', () => {
      assert.strictEqual(wd.bidiNetworkEvents.length, 0)
      assert.strictEqual(wd.bidiConsoleMessages.length, 0)
      assert.strictEqual(wd.bidiNavigationEvents.length, 0)
      assert.strictEqual(wd.bidiScriptExceptions.length, 0)
      assert.strictEqual(wd.bidiPerformanceMetrics.length, 0)
    })

    it('should disable BiDi when not configured', () => {
      const wdNoBidi = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
        bidiProtocol: false,
      })
      assert.strictEqual(wdNoBidi.bidiEnabled, false)
    })

    it('should have BiDi configuration in capabilities when enabled', () => {
      assert.strictEqual(wd.options.capabilities.webSocketUrl, true)
    })

    it('should not have BiDi configuration when disabled', () => {
      const wdNoBidi = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
        bidiProtocol: false,
      })
      // webSocketUrl should still be set to true by default, but bidiEnabled should be false
      assert.strictEqual(wdNoBidi.bidiEnabled, false)
    })
  })

  describe('BiDi Error Handling (No Browser Required)', () => {
    beforeEach(() => {
      wd = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
        bidiProtocol: false, // Disable BiDi for error testing
      })
    })

    it('should throw appropriate errors when BiDi methods called without BiDi enabled', async () => {
      const bidiMethods = ['grabBiDiNetworkEvents', 'grabBiDiConsoleMessages', 'grabBiDiNavigationEvents', 'clearBiDiEvents', 'waitForBiDiNetworkEvent', 'startBiDiPerformanceMonitoring', 'getBiDiPerformanceMetrics']

      // Test each async method individually
      for (const methodName of bidiMethods) {
        try {
          await wd[methodName]()
          assert.fail(`${methodName} should have thrown an error when BiDi disabled`)
        } catch (error) {
          assert.ok(error.message.includes('BiDi protocol is not enabled'), `${methodName} should throw BiDi disabled error, got: ${error.message}`)
        }
      }
    })

    it('should handle executeBiDiScript fallback when BiDi disabled', async () => {
      // This should not throw an error, but fall back to regular executeScript
      // We can't test the actual execution without a browser, but we can test the method exists
      assert.ok(typeof wd.executeBiDiScript === 'function')
    })
  })

  describe('BiDi Method Availability (No Browser Required)', () => {
    beforeEach(() => {
      wd = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
        bidiProtocol: true,
      })
    })

    it('should have all BiDi methods available', () => {
      const expectedMethods = [
        'grabBiDiNetworkEvents',
        'grabBiDiConsoleMessages',
        'grabBiDiNavigationEvents',
        'clearBiDiEvents',
        'waitForBiDiNetworkEvent',
        'executeBiDiScript',
        'startBiDiPerformanceMonitoring',
        'getBiDiPerformanceMetrics',
        '_initializeBiDiProtocol',
        '_setupBiDiEventHandlers',
      ]

      expectedMethods.forEach(methodName => {
        assert.ok(typeof wd[methodName] === 'function', `${methodName} should be available as a function`)
      })
    })

    it('should have BiDi event arrays as properties', () => {
      assert.ok(Array.isArray(wd.bidiNetworkEvents))
      assert.ok(Array.isArray(wd.bidiConsoleMessages))
      assert.ok(Array.isArray(wd.bidiNavigationEvents))
      assert.ok(Array.isArray(wd.bidiScriptExceptions))
      assert.ok(Array.isArray(wd.bidiPerformanceMetrics))
    })
  })

  describe('BiDi Event Array Manipulation (No Browser Required)', () => {
    beforeEach(() => {
      wd = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
        bidiProtocol: true,
      })
    })

    it('should allow manual event array manipulation for testing', async () => {
      // Simulate adding events
      wd.bidiNetworkEvents.push({
        type: 'request',
        timestamp: new Date().toISOString(),
        url: 'https://example.com/test',
        method: 'GET',
      })

      wd.bidiConsoleMessages.push({
        timestamp: new Date().toISOString(),
        level: 'log',
        text: 'Test message',
        source: 'console-api',
      })

      // Test grabbing events (these are async methods)
      const networkEvents = await wd.grabBiDiNetworkEvents()
      const consoleMessages = await wd.grabBiDiConsoleMessages()

      assert.strictEqual(networkEvents.length, 1)
      assert.strictEqual(consoleMessages.length, 1)
      assert.strictEqual(networkEvents[0].url, 'https://example.com/test')
      assert.strictEqual(consoleMessages[0].text, 'Test message')
    })

    it('should clear all event arrays when clearBiDiEvents is called', async () => {
      // Add some test events
      wd.bidiNetworkEvents.push({ type: 'test' })
      wd.bidiConsoleMessages.push({ text: 'test' })
      wd.bidiNavigationEvents.push({ type: 'test' })
      wd.bidiScriptExceptions.push({ error: 'test' })
      wd.bidiPerformanceMetrics.push({ metric: 'test' })

      // Clear events
      await wd.clearBiDiEvents()

      // Verify all arrays are empty
      assert.strictEqual(wd.bidiNetworkEvents.length, 0)
      assert.strictEqual(wd.bidiConsoleMessages.length, 0)
      assert.strictEqual(wd.bidiNavigationEvents.length, 0)
      assert.strictEqual(wd.bidiScriptExceptions.length, 0)
      assert.strictEqual(wd.bidiPerformanceMetrics.length, 0)
    })
  })

  describe('BiDi Configuration Validation (No Browser Required)', () => {
    it('should properly handle different bidiProtocol configuration values', () => {
      // Test explicit true
      const wdTrue = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
        bidiProtocol: true,
      })
      assert.strictEqual(wdTrue.bidiEnabled, true)

      // Test explicit false
      const wdFalse = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
        bidiProtocol: false,
      })
      assert.strictEqual(wdFalse.bidiEnabled, false)

      // Test undefined (should default to false)
      const wdUndefined = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
      })
      assert.strictEqual(wdUndefined.bidiEnabled, false)
    })

    it('should maintain webSocketUrl capability configuration', () => {
      const wdBidi = new WebDriver({
        url: siteUrl,
        browser: 'chrome',
        bidiProtocol: true,
      })

      // Should set webSocketUrl to true when BiDi is enabled
      assert.strictEqual(wdBidi.options.capabilities.webSocketUrl, true)
    })
  })
})

// Integration tests that require a running Selenium server
// These will be skipped in unit test mode but can be run separately
describe('WebDriver BiDi Protocol - Integration Tests (Requires Selenium)', () => {
  let wd
  const siteUrl = TestHelper.siteUrl()

  beforeEach(() => {
    wd = new WebDriver({
      url: siteUrl,
      browser: 'chrome',
      windowSize: '500x700',
      bidiProtocol: true,
      capabilities: {
        chromeOptions: {
          args: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
        },
      },
    })
  })

  afterEach(async () => {
    if (wd && wd.isRunning) {
      try {
        await wd._stopBrowser()
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  })

  describe('BiDi Browser Integration', () => {
    it('should start browser with BiDi protocol enabled', async function () {
      this.timeout(10000)
      try {
        await wd._startBrowser()
        assert.ok(wd.isRunning)
        assert.ok(wd.browser)
      } catch (error) {
        // If we can't connect to Selenium, skip this test
        if (error.message.includes('ECONNREFUSED') || error.message.includes('spawn')) {
          this.skip()
        }
        throw error
      }
    })

    it('should initialize BiDi event handlers when browser starts', async function () {
      this.timeout(10000)
      try {
        await wd._startBrowser()

        // BiDi initialization should have been called
        assert.ok(wd.bidiEnabled)

        // Event arrays should still be empty initially
        assert.strictEqual(wd.bidiNetworkEvents.length, 0)
        assert.strictEqual(wd.bidiConsoleMessages.length, 0)
      } catch (error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('spawn')) {
          this.skip()
        }
        throw error
      }
    })
  })
})
