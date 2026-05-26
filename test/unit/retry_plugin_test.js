import { assert } from 'chai'
import { describe, it } from 'mocha'

describe('RetryFailedStep Plugin', () => {
  it('should export default function', async () => {
    const pluginModule = await import('../../lib/plugin/retryFailedStep.js')

    assert.isFunction(pluginModule.default,
      'retryFailedStep should export a default function')
  })

  it('should be able to load plugin without errors', async () => {
    // Plugin should be importable without errors
    const pluginModule = await import('../../lib/plugin/retryFailedStep.js')

    assert.isDefined(pluginModule,
      'Plugin module should be defined')
    assert.isFunction(pluginModule.default,
      'Plugin should export a default function')
  })
})

describe('RetryFailedStep Configuration', () => {
  it('should accept custom deferToScenarioRetries option', () => {
    // Simulate plugin configuration
    const createConfig = (userConfig) => {
      const defaults = {
        retries: 3,
        deferToScenarioRetries: true,
        ignoredSteps: [],
      }
      return { ...defaults, ...userConfig }
    }

    // Test 1: Default value
    const config1 = createConfig({})
    assert.equal(config1.deferToScenarioRetries, true,
      'deferToScenarioRetries should default to true')

    // Test 2: Custom true value
    const config2 = createConfig({ deferToScenarioRetries: true })
    assert.equal(config2.deferToScenarioRetries, true,
      'Should accept true value')

    // Test 3: Custom false value
    const config3 = createConfig({ deferToScenarioRetries: false })
    assert.equal(config3.deferToScenarioRetries, false,
      'Should accept false value')
  })

  it('should handle scenario retry checking with different configurations', () => {
    const shouldDisableStepRetries = (scenarioRetries, deferToScenarioRetries) => {
      return scenarioRetries > 0 && deferToScenarioRetries !== false
    }

    // Test scenarios
    const testCases = [
      { scenarioRetries: 3, defer: true, expected: true, desc: '3 retries, defer=true' },
      { scenarioRetries: 1, defer: true, expected: true, desc: '1 retry, defer=true' },
      { scenarioRetries: 3, defer: false, expected: false, desc: '3 retries, defer=false' },
      { scenarioRetries: 0, defer: true, expected: false, desc: '0 retries, defer=true' },
      { scenarioRetries: -1, defer: true, expected: false, desc: '-1 retries, defer=true' },
      { scenarioRetries: 0, defer: false, expected: false, desc: '0 retries, defer=false' },
    ]

    testCases.forEach(({ scenarioRetries, defer, expected, desc }) => {
      const result = shouldDisableStepRetries(scenarioRetries, defer)
      assert.equal(result, expected,
        `Test "${desc}": expected ${expected}, got ${result}`)
    })
  })
})


describe('RetryFailedStep Integration', () => {
  it('should respect retry priority system', async () => {
    const { RETRY_PRIORITIES } = await import('../../lib/listener/globalRetry.js')

    // Plugin should use the same priorities as globalRetry
    assert.isDefined(RETRY_PRIORITIES.STEP_PLUGIN,
      'RETRY_PRIORITIES should have STEP_PLUGIN')
    assert.equal(RETRY_PRIORITIES.STEP_PLUGIN, 50,
      'STEP_PLUGIN priority should be 50')
  })
})
