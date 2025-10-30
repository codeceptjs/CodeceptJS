const output = require('./output')

/**
 * Retry Coordinator - Central coordination for all retry mechanisms
 *
 * This module provides:
 * 1. Priority-based retry coordination
 * 2. Unified configuration validation
 * 3. Consolidated retry reporting
 * 4. Conflict detection and resolution
 */

/**
 * Priority levels for retry mechanisms (higher number = higher priority)
 */
const RETRY_PRIORITIES = {
  MANUAL_STEP: 100, // I.retry() or step.retry() - highest priority
  STEP_PLUGIN: 50, // retryFailedStep plugin
  SCENARIO_CONFIG: 30, // Global scenario retry config
  FEATURE_CONFIG: 20, // Global feature retry config
  HOOK_CONFIG: 10, // Hook retry config - lowest priority
}

/**
 * Retry mechanism types
 */
const RETRY_TYPES = {
  MANUAL_STEP: 'manual-step',
  STEP_PLUGIN: 'step-plugin',
  SCENARIO: 'scenario',
  FEATURE: 'feature',
  HOOK: 'hook',
}

/**
 * Global retry coordination state
 */
let retryState = {
  activeTest: null,
  activeSuite: null,
  retryHistory: [],
  conflicts: [],
}

/**
 * Registers a retry mechanism for coordination
 * @param {string} type - Type of retry mechanism
 * @param {Object} config - Retry configuration
 * @param {Object} target - Target object (test, suite, etc.)
 * @param {number} priority - Priority level
 */
function registerRetry(type, config, target, priority = 0) {
  const retryInfo = {
    type,
    config,
    target,
    priority,
    timestamp: Date.now(),
  }

  // Detect conflicts
  const existingRetries = retryState.retryHistory.filter(r => r.target === target && r.type !== type && r.priority !== priority)

  if (existingRetries.length > 0) {
    const conflict = {
      newRetry: retryInfo,
      existingRetries: existingRetries,
      resolved: false,
    }
    retryState.conflicts.push(conflict)
    handleRetryConflict(conflict)
  }

  retryState.retryHistory.push(retryInfo)

  output.log(`[Retry Coordinator] Registered ${type} retry (priority: ${priority})`)
}

/**
 * Handles conflicts between retry mechanisms
 * @param {Object} conflict - Conflict information
 */
function handleRetryConflict(conflict) {
  const { newRetry, existingRetries } = conflict

  // Find highest priority retry
  const allRetries = [newRetry, ...existingRetries]
  const highestPriority = Math.max(...allRetries.map(r => r.priority))
  const winningRetry = allRetries.find(r => r.priority === highestPriority)

  // Log the conflict resolution
  output.log(`[Retry Coordinator] Conflict detected:`)
  allRetries.forEach(retry => {
    const status = retry === winningRetry ? 'ACTIVE' : 'DEFERRED'
    output.log(`  - ${retry.type} (priority: ${retry.priority}) [${status}]`)
  })

  conflict.resolved = true
  conflict.winner = winningRetry
}

/**
 * Gets the effective retry configuration for a target
 * @param {Object} target - Target object (test, suite, etc.)
 * @returns {Object} Effective retry configuration
 */
function getEffectiveRetryConfig(target) {
  const targetRetries = retryState.retryHistory.filter(r => r.target === target)

  if (targetRetries.length === 0) {
    return { type: 'none', retries: 0 }
  }

  // Find highest priority retry
  const highestPriority = Math.max(...targetRetries.map(r => r.priority))
  const effectiveRetry = targetRetries.find(r => r.priority === highestPriority)

  return {
    type: effectiveRetry.type,
    retries: effectiveRetry.config.retries || effectiveRetry.config,
    config: effectiveRetry.config,
  }
}

/**
 * Generates a retry summary report
 * @returns {Object} Retry summary
 */
function generateRetrySummary() {
  const summary = {
    totalRetryMechanisms: retryState.retryHistory.length,
    conflicts: retryState.conflicts.length,
    byType: {},
    recommendations: [],
  }

  // Count by type
  retryState.retryHistory.forEach(retry => {
    summary.byType[retry.type] = (summary.byType[retry.type] || 0) + 1
  })

  // Generate recommendations
  if (summary.conflicts > 0) {
    summary.recommendations.push('Consider consolidating retry configurations to avoid conflicts')
  }

  if (summary.byType[RETRY_TYPES.STEP_PLUGIN] && summary.byType[RETRY_TYPES.SCENARIO]) {
    summary.recommendations.push('Step-level and scenario-level retries are both active - consider using only one approach')
  }

  return summary
}

/**
 * Resets the retry coordination state (useful for testing)
 */
function reset() {
  retryState = {
    activeTest: null,
    activeSuite: null,
    retryHistory: [],
    conflicts: [],
  }
}

/**
 * Validates retry configuration for common issues
 * @param {Object} config - Configuration object
 * @returns {Array} Array of validation warnings
 */
function validateConfig(config) {
  const warnings = []

  if (!config) return warnings

  // Check for potential configuration conflicts
  if (config.retry && config.plugins && config.plugins.retryFailedStep) {
    const globalRetries = typeof config.retry === 'number' ? config.retry : config.retry.Scenario || config.retry.Feature
    const stepRetries = config.plugins.retryFailedStep.retries || 3

    if (globalRetries && stepRetries) {
      warnings.push(`Both global retries (${globalRetries}) and step retries (${stepRetries}) are configured - total executions could be ${globalRetries * (stepRetries + 1)}`)
    }
  }

  // Check for excessive retry counts
  if (config.retry) {
    const retryValues = typeof config.retry === 'number' ? [config.retry] : Object.values(config.retry)
    const maxRetries = Math.max(...retryValues.filter(v => typeof v === 'number'))

    if (maxRetries > 5) {
      warnings.push(`High retry count detected (${maxRetries}) - consider investigating test stability instead`)
    }
  }

  return warnings
}

module.exports = {
  RETRY_PRIORITIES,
  RETRY_TYPES,
  registerRetry,
  getEffectiveRetryConfig,
  generateRetrySummary,
  validateConfig,
  reset,
}
