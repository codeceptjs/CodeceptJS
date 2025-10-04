# ESM Migration Guide

This guide covers the migration to ECMAScript Modules (ESM) format in CodeceptJS v4.x, including important changes in execution behavior and how to adapt your tests.

## Overview

CodeceptJS v4.x introduces support for ECMAScript Modules (ESM), which brings modern JavaScript module syntax and better compatibility with the Node.js ecosystem. While most tests will continue working without changes, there are some behavioral differences to be aware of.

## Quick Migration

For most users, migrating to ESM is straightforward:

1. **Add `"type": "module"` to your `package.json`:**

```json
{
  "name": "your-project",
  "type": "module",
  "dependencies": {
    "codeceptjs": "^4.0.0"
  }
}
```

2. **Update import syntax in configuration files:**

```js
// Before (CommonJS)
const { setHeadlessWhen, setCommonPlugins } = require('@codeceptjs/configure')

// After (ESM)
import { setHeadlessWhen, setCommonPlugins } from '@codeceptjs/configure'
```

3. **Update helper imports:**

```js
// Before (CommonJS)
const Helper = require('@codeceptjs/helper')

// After (ESM)
import Helper from '@codeceptjs/helper'
```

## Known Changes

### Session and Within Block Execution Order

**⚠️ Important:** ESM migration has changed the execution timing of `session()` and `within()` blocks.

#### What Changed

In CommonJS, session and within blocks executed synchronously, interleaved with main test steps:

```js
// CommonJS execution order
Scenario('test', ({ I }) => {
  I.do('step1') // ← Executes first
  session('user', () => {
    I.do('session-step') // ← Executes second
  })
  I.do('step2') // ← Executes third
})
```

In ESM, session and within blocks execute after the main flow completes:

```js
// ESM execution order
Scenario('test', ({ I }) => {
  I.do('step1') // ← Executes first
  session('user', () => {
    I.do('session-step') // ← Executes third (after step2)
  })
  I.do('step2') // ← Executes second
})
```

#### Impact on Your Tests

**✅ No Impact (99% of cases):** Most tests will continue working correctly because:

- All steps still execute completely
- Browser interactions work as expected
- Session isolation is maintained
- Test assertions pass/fail correctly
- Final test state is identical

**⚠️ Potential Issues (rare edge cases):**

1. **Cross-session dependencies on immediate state:**

```js
// POTENTIALLY PROBLEMATIC
I.createUser('alice')
session('alice', () => {
  I.login('alice') // May execute before user creation completes
})
```

2. **Within blocks depending on immediate DOM changes:**

```js
// POTENTIALLY PROBLEMATIC
I.click('Show Advanced Form')
within('.advanced-form', () => {
  I.fillField('setting', 'value') // May execute before form appears
})
```

#### Migration Solutions

If you encounter timing-related issues in edge cases:

1. **Use explicit waits for dependent operations:**

```js
// RECOMMENDED FIX
I.createUser('alice')
session('alice', () => {
  I.waitForElement('.login-form') // Ensure UI is ready
  I.login('alice')
})
```

2. **Add explicit synchronization:**

```js
// RECOMMENDED FIX
I.click('Show Advanced Form')
I.waitForElement('.advanced-form') // Wait for form to appear
within('.advanced-form', () => {
  I.fillField('setting', 'value')
})
```

3. **Use async/await for complex flows:**

```js
// RECOMMENDED FIX
await I.createUser('alice')
await session('alice', async () => {
  await I.login('alice')
})
```

## Best Practices for ESM

### 1. File Extensions

Use `.js` extension for ESM files (not `.mjs` unless specifically needed):

```js
// codecept.conf.js (ESM format)
export default {
  tests: './*_test.js',
  // ...
}
```

### 2. Dynamic Imports

For conditional imports, use dynamic import syntax:

```js
// Instead of require() conditions
let helper
if (condition) {
  helper = await import('./CustomHelper.js')
}
```

### 3. Configuration Export

Use default export for configuration:

```js
// codecept.conf.js
export default {
  tests: './*_test.js',
  output: './output',
  helpers: {
    Playwright: {
      url: 'http://localhost',
    },
  },
}
```

### 4. Helper Classes

Export helper classes as default:

```js
// CustomHelper.js
import { Helper } from 'codeceptjs'

class CustomHelper extends Helper {
  // helper methods
}

export default CustomHelper
```

## Troubleshooting

### Common Issues

1. **Module not found errors:**
   - Ensure `"type": "module"` is in package.json
   - Use complete file paths with extensions: `import './helper.js'`

2. **Configuration not loading:**
   - Check that config uses `export default {}`
   - Verify all imports use ESM syntax

3. **Timing issues in sessions/within:**
   - Add explicit waits as shown in the migration solutions above
   - Consider using async/await for complex flows

4. **Plugin compatibility:**
   - Ensure all plugins support ESM
   - Update plugin imports to use ESM syntax

### Getting Help

If you encounter issues during ESM migration:

1. Check the [example-esm](../example-esm/) directory for working examples
2. Review error messages for import/export syntax issues
3. Consider the execution order changes for session/within blocks
4. Join the [CodeceptJS community](https://codecept.io/community/) for support

## Conclusion

ESM migration brings CodeceptJS into alignment with modern JavaScript standards while maintaining backward compatibility for most use cases. The execution order changes in sessions and within blocks represent internal timing adjustments that rarely affect real-world test functionality.

The vast majority of CodeceptJS users will experience seamless migration with no functional differences in their tests.
