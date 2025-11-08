# Retry Mechanisms Enhancement

This document describes the improvements made to CodeceptJS retry mechanisms to eliminate overlaps and provide better coordination.

## Problem Statement

CodeceptJS previously had multiple retry mechanisms that could overlap and conflict:

1. **Global Retry Configuration** - Feature and Scenario level retries
2. **RetryFailedStep Plugin** - Individual step retries
3. **Manual Step Retries** - `I.retry()` calls
4. **Hook Retries** - Before/After hook retries
5. **Helper Retries** - Helper-specific retry mechanisms

These mechanisms could result in:

- Exponential retry counts (e.g., 3 scenario retries × 2 step retries = 6 total executions per step)
- Conflicting configurations with no clear precedence
- Confusing logging and unclear behavior
- Difficult debugging when multiple retry levels were active

## Solution Overview

### 1. Enhanced Global Retry (`lib/listener/enhancedGlobalRetry.js`)

**New Features:**

- Priority-based retry coordination
- Clear precedence system
- Enhanced logging with mechanism identification
- Backward compatibility with existing configurations

**Priority System:**

```javascript
const RETRY_PRIORITIES = {
  MANUAL_STEP: 100, // I.retry() or step.retry() - highest priority
  STEP_PLUGIN: 50, // retryFailedStep plugin
  SCENARIO_CONFIG: 30, // Global scenario retry config
  FEATURE_CONFIG: 20, // Global feature retry config
  HOOK_CONFIG: 10, // Hook retry config - lowest priority
}
```

### 2. Enhanced RetryFailedStep Plugin (`lib/plugin/enhancedRetryFailedStep.js`)

**New Features:**

- Automatic coordination with scenario-level retries
- Smart deferral when scenario retries are configured
- Priority-aware retry registration
- Improved logging and debugging information

**Coordination Logic:**

- When scenario retries are configured, step retries are automatically deferred to avoid excessive retry counts
- Users can override this with `deferToScenarioRetries: false`
- Clear logging explains coordination decisions

### 3. Retry Coordinator (`lib/retryCoordinator.js`)

**New Features:**

- Central coordination service for all retry mechanisms
- Configuration validation with warnings for potential conflicts
- Retry registration and priority management
- Summary reporting for debugging

**Key Functions:**

- `validateConfig()` - Detects configuration conflicts and excessive retry counts
- `registerRetry()` - Registers retry mechanisms with priority coordination
- `getEffectiveRetryConfig()` - Returns the active retry configuration for a target
- `generateRetrySummary()` - Provides debugging information about active retry mechanisms

## Migration Guide

### Immediate Benefits (No Changes Needed)

The enhanced retry mechanisms are **backward compatible**. Existing configurations will continue to work with these improvements:

- Better coordination between retry mechanisms
- Enhanced logging for debugging
- Automatic conflict detection and resolution

### Recommended Configuration Updates

#### 1. For Simple Cases - Use Scenario Retries Only

**Old Configuration (potentially conflicting):**

```javascript
module.exports = {
  retry: 3, // scenario retries
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 2, // step retries - could result in 3 * 3 = 9 executions
    },
  },
}
```

**Recommended Configuration:**

```javascript
module.exports = {
  retry: 3, // scenario retries only
  plugins: {
    retryFailedStep: {
      enabled: false, // disable to avoid conflicts
    },
  },
}
```

#### 2. For Step-Level Control - Use Step Retries Only

**Recommended Configuration:**

```javascript
module.exports = {
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 2,
      ignoredSteps: ['amOnPage', 'wait*'], // customize as needed
    },
  },
  // No global retry configuration
}
```

#### 3. For Mixed Scenarios - Use Enhanced Coordination

```javascript
module.exports = {
  retry: {
    Scenario: 2, // scenario retries for most tests
  },
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 1,
      deferToScenarioRetries: true, // automatically coordinate (default)
    },
  },
}
```

### Testing Your Configuration

Use the new retry coordinator to validate your configuration:

```javascript
const retryCoordinator = require('codeceptjs/lib/retryCoordinator')

// Validate your configuration
const warnings = retryCoordinator.validateConfig(yourConfig)
if (warnings.length > 0) {
  console.log('Retry configuration warnings:')
  warnings.forEach(warning => console.log('  -', warning))
}
```

## Enhanced Logging

The new retry mechanisms provide clearer logging:

```
[Global Retry] Scenario retries: 3
[Step Retry] Deferred to scenario retries (3 retries)
[Retry Coordinator] Registered scenario retry (priority: 30)
```

## Breaking Changes

**None.** All existing configurations continue to work.

## New Configuration Options

### Enhanced RetryFailedStep Plugin

```javascript
plugins: {
  retryFailedStep: {
    enabled: true,
    retries: 2,
    deferToScenarioRetries: true, // NEW: automatically coordinate with scenario retries
    minTimeout: 1000,
    maxTimeout: 10000,
    factor: 1.5,
    ignoredSteps: ['wait*', 'amOnPage']
  }
}
```

### New Options:

- `deferToScenarioRetries` (boolean, default: true) - When true, step retries are disabled if scenario retries are configured

## Debugging Retry Issues

### 1. Check Configuration Validation

```javascript
const retryCoordinator = require('codeceptjs/lib/retryCoordinator')
const warnings = retryCoordinator.validateConfig(Config.get())
console.log('Configuration warnings:', warnings)
```

### 2. Monitor Enhanced Logging

Run tests with `--verbose` to see detailed retry coordination logs.

### 3. Generate Retry Summary

```javascript
// In your test hooks
const summary = retryCoordinator.generateRetrySummary()
console.log('Retry mechanisms active:', summary)
```

## Best Practices

1. **Choose One Primary Retry Strategy** - Either scenario-level OR step-level retries, not both
2. **Use Configuration Validation** - Check for conflicts before running tests
3. **Monitor Retry Logs** - Use enhanced logging to understand retry behavior
4. **Test Retry Behavior** - Verify your retry configuration works as expected
5. **Avoid Excessive Retries** - High retry counts often indicate test stability issues

## Future Enhancements

- Integration with retry coordinator for all retry mechanisms
- Runtime retry strategy adjustment
- Retry analytics and reporting
- Advanced retry patterns (exponential backoff, conditional retries)
