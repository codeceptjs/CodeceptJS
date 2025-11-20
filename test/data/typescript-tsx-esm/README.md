# TypeScript tsx ESM Test

This test demonstrates the recommended way to use TypeScript with CodeceptJS 4.x when you have `"type": "module"` in your package.json.

## Key Features

- Uses `tsx/cjs` as the TypeScript loader (recommended over ts-node/esm)
- Has `"type": "module"` in package.json
- Imports page objects without file extensions
- Everything works seamlessly

## Configuration

- **Loader**: `tsx/cjs` in `require` array
- **Package type**: `"module"`
- **TypeScript module**: `"esnext"` with `"node"` module resolution
- **Imports**: No file extensions needed (tsx handles resolution)

## Why tsx?

tsx is the recommended TypeScript loader for CodeceptJS 4.x because:
- ✅ Works with `"type": "module"`
- ✅ Handles extensionless imports
- ✅ Fast (built on esbuild)
- ✅ Zero config needed
- ✅ Compatible with Mocha's loading system

## Why Not ts-node/esm?

ts-node/esm has significant limitations:
- ❌ Doesn't work with `"type": "module"`
- ❌ Doesn't resolve extensionless imports to .ts files
- ❌ Requires complex configuration
- ❌ Module resolution doesn't work like standard TypeScript ESM

## Running This Test

```bash
cd test/data/typescript-tsx-esm
../../../bin/codecept.js run --verbose
```

You should see both scenarios pass successfully.
