# Test Suite for Issue #5066 Fix

This directory contains tests that validate the fix for **Issue #5066: Unable to inject data between workers because of proxy object**.

## Test Files

### `proxy_test.js`
Basic tests that verify the core functionality of `share()` and `inject()` functions:
- Basic data sharing with primitive types (strings, numbers)
- Complex nested data structures (objects, arrays)
- Property access patterns that should work after the fix

### `final_test.js`
Comprehensive end-to-end validation test that covers:
- Multiple data types and structures
- Data overriding scenarios
- Deep nested property access
- Key enumeration functionality
- Real-world usage patterns

## Running the Tests

### Single-threaded execution:
```bash
npx codeceptjs run proxy_test.js
npx codeceptjs run final_test.js
```

### Multi-worker execution (tests worker communication):
```bash
npx codeceptjs run-workers 2 proxy_test.js
npx codeceptjs run-workers 2 final_test.js
```

## What the Fix Addresses

1. **Circular Dependency Error**: Fixed "Support object undefined is not defined" error in `workerStorage.js`
2. **Proxy System Enhancement**: Updated container proxy system to handle dynamically shared data
3. **Worker Communication**: Ensured data sharing works correctly between worker threads
4. **Key Enumeration**: Made sure `Object.keys(inject())` shows shared properties

## Expected Results

All tests should pass in both single-threaded and multi-worker modes, demonstrating that:
- `share({ data })` correctly shares data between workers
- `inject()` returns a proxy object with proper access to shared data
- Both direct property access and nested object traversal work correctly
- Key enumeration shows all shared properties
