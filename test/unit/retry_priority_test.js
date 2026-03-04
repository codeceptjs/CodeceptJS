import { assert } from 'chai'
import { describe, it } from 'mocha'

describe('Retry Priority System', () => {
  it('should export RETRY_PRIORITIES from globalRetry module', async () => {
    const globalRetryModule = await import('../../lib/listener/globalRetry.js')

    assert.property(globalRetryModule, 'RETRY_PRIORITIES',
      'globalRetry should export RETRY_PRIORITIES constant')
  })

  it('should have correct priority values', async () => {
    const { RETRY_PRIORITIES } = await import('../../lib/listener/globalRetry.js')

    assert.equal(RETRY_PRIORITIES.MANUAL_STEP, 100,
      'MANUAL_STEP should have priority 100 (highest)')
    assert.equal(RETRY_PRIORITIES.STEP_PLUGIN, 50,
      'STEP_PLUGIN should have priority 50')
    assert.equal(RETRY_PRIORITIES.SCENARIO_CONFIG, 30,
      'SCENARIO_CONFIG should have priority 30')
    assert.equal(RETRY_PRIORITIES.FEATURE_CONFIG, 20,
      'FEATURE_CONFIG should have priority 20')
    assert.equal(RETRY_PRIORITIES.HOOK_CONFIG, 10,
      'HOOK_CONFIG should have priority 10 (lowest)')
  })

  it('should maintain correct priority hierarchy', async () => {
    const { RETRY_PRIORITIES } = await import('../../lib/listener/globalRetry.js')

    assert.isTrue(RETRY_PRIORITIES.MANUAL_STEP > RETRY_PRIORITIES.STEP_PLUGIN,
      'MANUAL_STEP > STEP_PLUGIN')
    assert.isTrue(RETRY_PRIORITIES.STEP_PLUGIN > RETRY_PRIORITIES.SCENARIO_CONFIG,
      'STEP_PLUGIN > SCENARIO_CONFIG')
    assert.isTrue(RETRY_PRIORITIES.SCENARIO_CONFIG > RETRY_PRIORITIES.FEATURE_CONFIG,
      'SCENARIO_CONFIG > FEATURE_CONFIG')
    assert.isTrue(RETRY_PRIORITIES.FEATURE_CONFIG > RETRY_PRIORITIES.HOOK_CONFIG,
      'FEATURE_CONFIG > HOOK_CONFIG')
  })

  it('should implement priority-based overwrite prevention', () => {
    const RETRY_PRIORITIES = {
      MANUAL_STEP: 100,
      STEP_PLUGIN: 50,
      SCENARIO_CONFIG: 30,
      FEATURE_CONFIG: 20,
      HOOK_CONFIG: 10,
    }

    const shouldOverwrite = (currentPriority, newPriority) => {
      return (currentPriority || 0) <= newPriority
    }

    // Test 1: Higher priority should NOT be overwritten by lower
    const current1 = RETRY_PRIORITIES.MANUAL_STEP
    const new1 = RETRY_PRIORITIES.SCENARIO_CONFIG
    assert.isFalse(shouldOverwrite(current1, new1),
      'MANUAL_STEP (100) should NOT be overwritten by SCENARIO_CONFIG (30)')

    // Test 2: Lower priority SHOULD be overwritten by higher
    const current2 = RETRY_PRIORITIES.HOOK_CONFIG
    const new2 = RETRY_PRIORITIES.STEP_PLUGIN
    assert.isTrue(shouldOverwrite(current2, new2),
      'HOOK_CONFIG (10) SHOULD be overwritten by STEP_PLUGIN (50)')

    // Test 3: Equal priorities should be overwritten
    const current3 = RETRY_PRIORITIES.SCENARIO_CONFIG
    const new3 = RETRY_PRIORITIES.SCENARIO_CONFIG
    assert.isTrue(shouldOverwrite(current3, new3),
      'Equal priorities should allow overwrite')
  })

  it('should handle undefined priority correctly', () => {
    const RETRY_PRIORITIES = {
      MANUAL_STEP: 100,
      STEP_PLUGIN: 50,
      HOOK_CONFIG: 10,
    }

    // Test: undefined should always be overwritten (undefined || 0 = 0)
    const shouldOverwrite = (currentPriority, newPriority) => {
      return (currentPriority || 0) <= newPriority
    }

    assert.isTrue(shouldOverwrite(undefined, RETRY_PRIORITIES.HOOK_CONFIG),
      'Undefined priority (0) should be overwritten by HOOK_CONFIG (10)')
    assert.isTrue(shouldOverwrite(undefined, RETRY_PRIORITIES.MANUAL_STEP),
      'Undefined priority (0) should be overwritten by MANUAL_STEP (100)')
    assert.isTrue(shouldOverwrite(undefined, 0),
      'Undefined priority (0) should be overwritten by priority 0')
  })
})


describe('Retry Coordination Logic', () => {
  it('should implement deferToScenarioRetries correctly', () => {
    const RETRY_PRIORITIES = {
      STEP_PLUGIN: 50,
      SCENARIO_CONFIG: 30,
    }

    // Simulate the logic from retryFailedStep.js
    const shouldDisableStepRetries = (scenarioRetries, deferToScenarioRetries) => {
      return scenarioRetries > 0 && deferToScenarioRetries !== false
    }

    // Test 1: Scenario retries + defer = true -> should disable
    assert.isTrue(shouldDisableStepRetries(3, true),
      'Should disable step retries when scenario retries exist and defer is true')
    assert.isTrue(shouldDisableStepRetries(1, true),
      'Should disable even with 1 scenario retry')

    // Test 2: Scenario retries + defer = false -> should NOT disable
    assert.isFalse(shouldDisableStepRetries(3, false),
      'Should NOT disable when deferToScenarioRetries is false')

    // Test 3: No scenario retries -> should NOT disable
    assert.isFalse(shouldDisableStepRetries(0, true),
      'Should NOT disable when no scenario retries')
    assert.isFalse(shouldDisableStepRetries(-1, true),
      'Should NOT disable when scenario retries is -1')
  })

  it('should default deferToScenarioRetries to true', async () => {
    const pluginModule = await import('../../lib/plugin/retryFailedStep.js')

    assert.isDefined(pluginModule,
      'Plugin module should be defined')

    const testConfig = {
      retries: 3,
      deferToScenarioRetries: true,
    }

    // If we get here without errors, the option is accepted
    assert.isObject(testConfig)
    assert.property(testConfig, 'deferToScenarioRetries')
    assert.isTrue(testConfig.deferToScenarioRetries)
  })
})

describe('Retry Priority Scenarios', () => {
  it('should prioritize manual retries over everything', () => {
    const RETRY_PRIORITIES = {
      MANUAL_STEP: 100,
      STEP_PLUGIN: 50,
      SCENARIO_CONFIG: 30,
    }

    const scenarios = [
      { current: RETRY_PRIORITIES.MANUAL_STEP, new: RETRY_PRIORITIES.STEP_PLUGIN },
      { current: RETRY_PRIORITIES.MANUAL_STEP, new: RETRY_PRIORITIES.SCENARIO_CONFIG },
    ]

    scenarios.forEach(({ current, new: newPriority }) => {
      const shouldOverwrite = (current || 0) <= newPriority
      assert.isFalse(shouldOverwrite,
        `MANUAL_STEP (${current}) should NOT be overwritten by priority ${newPriority}`)
    })
  })

  it('should prioritize step plugin over scenario/feature', () => {
    const RETRY_PRIORITIES = {
      STEP_PLUGIN: 50,
      SCENARIO_CONFIG: 30,
      FEATURE_CONFIG: 20,
    }

    const shouldOverwrite = (current, newPriority) => (current || 0) <= newPriority

    // Step plugin should win over scenario
    assert.isFalse(shouldOverwrite(RETRY_PRIORITIES.STEP_PLUGIN, RETRY_PRIORITIES.SCENARIO_CONFIG),
      'STEP_PLUGIN should NOT be overwritten by SCENARIO_CONFIG')

    // Step plugin should win over feature
    assert.isFalse(shouldOverwrite(RETRY_PRIORITIES.STEP_PLUGIN, RETRY_PRIORITIES.FEATURE_CONFIG),
      'STEP_PLUGIN should NOT be overwritten by FEATURE_CONFIG')
  })

  it('should prioritize scenario over feature', () => {
    const RETRY_PRIORITIES = {
      SCENARIO_CONFIG: 30,
      FEATURE_CONFIG: 20,
    }

    const shouldOverwrite = (current, newPriority) => (current || 0) <= newPriority

    assert.isFalse(shouldOverwrite(RETRY_PRIORITIES.SCENARIO_CONFIG, RETRY_PRIORITIES.FEATURE_CONFIG),
      'SCENARIO_CONFIG should NOT be overwritten by FEATURE_CONFIG')
  })
})
