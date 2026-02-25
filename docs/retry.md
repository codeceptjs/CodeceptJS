# Retry Mechanisms

CodeceptJS provides flexible retry mechanisms to handle flaky tests at different levels.

## Overview

CodeceptJS supports retries at **four levels** with a **priority system** to prevent conflicts:

| Priority | Level | Value | Description |
|----------|-------|-------|-------------|
| **Highest** | Manual Step (`I.retry()`) | 100 | Explicit retries in test code |
| | Step Plugin (`retryFailedStep`) | 50 | Automatic step-level retries |
| | Scenario Config | 30 | Retry entire scenarios |
| | Feature Config | 20 | Retry all scenarios in feature |
| **Lowest** | Hook Config | 10 | Retry failed hooks |

**Rule:** Higher priority retries cannot be overwritten by lower priority ones.

## Step-Level Retries

### Manual Retry: `I.retry()`

Retry specific steps in your tests:

```js
// Retry up to 5 times
I.retry().click('Submit')

// Custom options
I.retry({
  retries: 3,
  minTimeout: 1000,  // 1 second
  maxTimeout: 5000,  // 5 seconds
}).see('Welcome')

// Infinite retries
I.retry(0).waitForElement('Dashboard')
```

### Automatic Retry: `retryFailedStep` Plugin

Automatically retry all failed steps without modifying test code.

**Basic configuration:**

```js
// codecept.conf.js
plugins: {
  retryFailedStep: {
    enabled: true,
    retries: 3,
  }
}
```

**Advanced options:**

```js
plugins: {
  retryFailedStep: {
    enabled: true,
    retries: 3,
    factor: 1.5,              // exponential backoff factor
    minTimeout: 1000,         // 1 second before first retry
    maxTimeout: 5000,         // 5 seconds max between retries

    // Steps to ignore (never retry these)
    ignoredSteps: [
      'scroll*',   // ignore all scroll steps
      /Cookie/,    // ignore by regexp
    ],

    // Defer to scenario retries to prevent excessive retries (default: true)
    deferToScenarioRetries: true,
  }
}
```

**Ignored steps by default:** `amOnPage`, `wait*`, `send*`, `execute*`, `run*`, `have*`

**Disable per test:**

```js
Scenario('test', { disableRetryFailedStep: true }, () => {
  I.retry(5).click('Button')  // Use manual retries instead
})
```

## Scenario-Level Retries

Configure retries for individual test scenarios.

```js
// Simple: All scenarios retry 3 times
{
  retry: 3
}

// Advanced: By pattern
{
  retry: [
    {
      Scenario: 2,
      grep: 'Login',  // Only scenarios containing "Login"
    },
    {
      Scenario: 5,
      grep: 'API',
    },
  ]
}

// In-code
Scenario('my test', { retries: 3 }, () => {
  I.amOnPage('/')
  I.click('Login')
})
```

## Feature-Level Retries

Retry all scenarios within a feature file:

```js
{
  retry: [
    {
      Feature: 3,
      grep: 'Authentication',  // Only features containing "Authentication"
    },
  ]
}
```

## Hook-Level Retries

Configure retries for failed hooks:

```js
{
  retry: [
    {
      BeforeSuite: 2,  // Retry setup hook
      Before: 1,       // Retry test setup
      After: 1,        // Retry teardown
    },
  ]
}
```

## Retry Coordination

### How Different Retries Work Together

When multiple retry mechanisms are configured, they work together based on priorities:

**Example 1: Step Plugin + Scenario Retries (default behavior)**

```js
plugins: {
  retryFailedStep: {
    enabled: true,
    retries: 3,
    deferToScenarioRetries: true,  // default
  }
}

Scenario('API test', { retries: 2 }, () => {
  I.sendPostRequest('/api/users', { name: 'John' })
})
```

**Result:** Step retries are **disabled**. Only scenario retries run (2 times).
**Total attempts:** 1 initial + 2 retries = **3 attempts**

**Example 2: Step Plugin without Defer**

```js
plugins: {
  retryFailedStep: {
    enabled: true,
    retries: 3,
    deferToScenarioRetries: false,
  }
}

Scenario('API test', { retries: 2 }, () => {
  I.sendPostRequest('/api/users', { name: 'John' })
  I.seeResponseCodeIs(200)
})
```

**Result:** Each step can retry 3 times, scenario can retry 2 times.
**⚠️ Warning:** Can lead to excessive execution time

**Example 3: Manual Retry + Plugin**

```js
plugins: {
  retryFailedStep: {
    enabled: true,
    retries: 3,
  }
}

Scenario('test', () => {
  I.retry(5).click('Button')  // Manual (priority 100)
  I.click('AnotherButton')     // Plugin (priority 50)
})
```

**Result:**
- First button: **5 retries** (manual takes precedence)
- Second button: **3 retries** (plugin)

## Common Patterns

### External API Flakiness

```js
{
  retry: [
    {
      Scenario: 3,
      grep: 'API',
    },
  ],
  plugins: {
    retryFailedStep: {
      enabled: true,
      deferToScenarioRetries: true,  // Let scenario retries handle it
    },
  },
}
```

### UI Element Intermittent Visibility

```js
Scenario('form submission', () => {
  I.amOnPage('/form')
  I.fillField('email', 'test@example.com')

  // This specific button is sometimes not immediately clickable
  I.retry(3).click('Submit')

  I.see('Success')
})
```

### Flaky Feature Suite

```js
{
  retry: [
    {
      Feature: 2,
      grep: 'ThirdPartyIntegration',
    },
  ],
}
```

## Best Practices

1. **Use `deferToScenarioRetries: true`** (default) to avoid excessive retries
2. **Prefer scenario retries** over step retries for general flakiness
3. **Use manual `I.retry()`** for specific problematic steps
4. **Avoid combining** step plugin with scenario retries unless necessary
5. **Don't over-retry** - it can mask real bugs and slow down tests

## Troubleshooting

### Tests Taking Too Long

**Solutions:**
- Enable `deferToScenarioRetries: true`
- Reduce retry counts
- Use more specific retry patterns (grep)
- Fix the root cause instead of retrying

### Retries Not Working

**Check:**
1. Verify configuration syntax
2. Check if higher priority retry is overriding
3. Ensure `disableRetryFailedStep: true` isn't set
4. Run with `DEBUG_RETRY_PLUGIN=1`:

```bash
DEBUG_RETRY_PLUGIN=1 npx codeceptjs run
```

### Too Many Retries

**Solutions:**
1. Set `deferToScenarioRetries: true`
2. Add problematic steps to `ignoredSteps`
3. Use scenario retries instead of step retries
4. Add `when` condition to filter errors:

```js
plugins: {
  retryFailedStep: {
    enabled: true,
    when: (err) => {
      // Only retry network errors
      return err.message.includes('ECONNREFUSED')
    },
  }
}
```

## Configuration Reference

### Global Retry Options

```js
// Simple
{
  retry: 3
}

// Advanced
{
  retry: [
    {
      Feature: 2,
      grep: 'Auth',
    },
    {
      Scenario: 5,
      grep: 'Payment',
    },
    {
      BeforeSuite: 3,
    },
  ]
}
```

### retryFailedStep Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `retries` | number | `3` | Number of retries per step |
| `factor` | number | `1.5` | Exponential backoff factor |
| `minTimeout` | number | `1000` | Min milliseconds before first retry |
| `maxTimeout` | number | `Infinity` | Max milliseconds between retries |
| `randomize` | boolean | `false` | Randomize timeouts |
| `ignoredSteps` | array | `[]` | Additional steps to ignore |
| `deferToScenarioRetries` | boolean | `true` | Disable step retries when scenario retries exist |
| `when` | function | - | Custom condition (receives error) |

### I.retry() Options

```js
I.retry({
  retries: 3,        // number of retries (0 = infinite)
  minTimeout: 1000,  // milliseconds
  maxTimeout: 5000,  // milliseconds
  factor: 1.5,       // exponential backoff
})
```

## Related

- [Plugins](plugins.md) - Plugin system overview
- [Configuration](configuration.md) - Full configuration reference
- [Hooks](hooks.md) - Test hooks and lifecycle
