# CodeceptJS ESM Example

This directory contains a working example of CodeceptJS using ECMAScript Modules (ESM) format.

## Setup

This project demonstrates the ESM format with:

- `"type": "module"` in package.json
- ESM import/export syntax in configuration
- ESM-compatible test execution

## Running Tests

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run with debug output
npm run test:debug

# Run with verbose output
npm run test:verbose
```

## Key ESM Features Demonstrated

### 1. Package Configuration

```json
{
  "type": "module",
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### 2. Configuration Export

The `codecept.conf.js` uses ESM default export:

```js
export default {
  tests: './*_test.js',
  // ... configuration
}
```

### 3. Test Files

Test files can use modern JavaScript features including async/await:

```js
Feature('Basic ESM Test')

Scenario('demonstrates ESM capabilities', ({ I }) => {
  // Basic functionality test
  const message = 'Hello ESM World!'
  const result = message.includes('ESM')

  if (!result) {
    throw new Error('ESM test failed')
  }
})

Scenario('demonstrates async/await', async ({ I }) => {
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
  await delay(10)
  // Test passes if async/await works correctly
})
```

## Migration from CommonJS

If migrating from CommonJS format, see the [ESM Migration Guide](../docs/esm-migration.md) for detailed instructions and important behavioral changes.

## Node.js Version

ESM support requires Node.js 16.0.0 or higher. This is specified in the `engines` field of package.json.
