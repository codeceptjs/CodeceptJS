# Retry Mechanisms

This document describes the retry coordination system in CodeceptJS.

## Problem Statement

CodeceptJS has multiple retry mechanisms at different levels:

1. **Global Retry Configuration** - Feature and Scenario level retries
2. **RetryFailedStep Plugin** - Individual step retries
3. **Manual Step Retries** - `I.retry()` calls
4. **Hook Retries** - Before/After hook retries

These mechanisms could result in:

- Exponential retry counts (e.g., 3 scenario retries × 2 step retries = 6 total executions per step)
- Conflicting configurations with no clear precedence

## Solution Overview

CodeceptJS now includes a priority-based coordination system to prevent conflicts.

### Priority System

```javascript
const RETRY_PRIORITIES = {
  MANUAL_STEP: 100,      // I.retry() or step.retry() - highest priority
  STEP_PLUGIN: 50,       // retryFailedStep plugin
  SCENARIO_CONFIG: 30,   // Global scenario retry config
  FEATURE_CONFIG: 20,    // Global feature retry config
  HOOK_CONFIG: 10,       // Hook retry config - lowest priority
}
```

Higher priority retries will not be overwritten by lower priority ones.

## Configuration Examples

### Scenario Retries Only

```javascript
module.exports = {
  retry: 3, // scenario retries
}
```

### Step Retries Only

```javascript
module.exports = {
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 2,
      ignoredSteps: ['amOnPage', 'wait*'],
    },
  },
}
```

### Mixed - With Auto Coordination

```javascript
module.exports = {
  retry: {
    Scenario: 2, // scenario retries
  },
  plugins: {
    retryFailedStep: {
      enabled: true,
      retries: 1,
      deferToScenarioRetries: true, // auto-coordinate (default)
    },
  },
}
```

**Important:** When `deferToScenarioRetries` is true (default), step retries are automatically disabled if scenario retries are configured to avoid excessive total retries (2 scenario × 3 step = 6 executions per step).

## New Configuration Options

### retryFailedStep Plugin

- `deferToScenarioRetries` (boolean, default: true) - When true, step retries are disabled if scenario retries are configured

## Best Practices

1. **Choose One Primary Retry Strategy** - Either scenario-level OR step-level retries
2. **Use Auto Coordination** - Enable `deferToScenarioRetries` to avoid conflicts
3. **Monitor Retry Behavior** - Use `DEBUG_RETRY_PLUGIN=1` to see retry details
4. **Avoid Excessive Retries** - High retry counts often indicate test stability issues
