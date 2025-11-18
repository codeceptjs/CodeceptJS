# TypeScript Type Definitions

This directory contains TypeScript type definitions (`.d.ts` files) generated from JSDoc comments in the JavaScript source files.

## Migration from tsd-jsdoc to TypeScript Compiler

As of version 4.x, CodeceptJS has migrated from using `tsd-jsdoc` to using the TypeScript compiler (`tsc`) directly for generating type definitions. This change was necessary because:

1. **tsd-jsdoc is no longer maintained** - The last update was over 2 years ago
2. **Peer dependency conflict** - tsd-jsdoc requires JSDoc 3.x, but we need JSDoc 4.x
3. **TypeScript compiler is the modern standard** - Using `tsc --declaration --allowJs` is the recommended approach by Microsoft

## How It Works

The type generation process consists of:

1. **tsconfig.typings.json** - TypeScript configuration for declaration generation
2. **generate-dts.mjs** - Post-processing script that:
   - Wraps all types in the `CodeceptJS` namespace (replaces `jsdoc.namespace.cjs`)
   - Transforms helper methods to return `Promise<any>` for promise-based helpers (replaces `jsdoc.promiseBased.cjs`)

## Generating Type Definitions

To generate type definitions, run:

```bash
npm run def
```

Or manually:

```bash
# Generate regular type definitions
node typings/generate-dts.mjs tsconfig.typings.json

# Generate promise-based type definitions
node typings/generate-dts.mjs tsconfig.typings.json --promise-based
```

## Files

- **index.d.ts** - Main type definitions file (hand-written)
- **Mocha.d.ts** - Mocha interface extensions (hand-written)
- **utils.d.ts** - Utility type definitions (hand-written)
- **promiseBasedTypes.d.ts** - Generated promise-based helper type definitions
- **types.d.ts** - Generated regular type definitions
- All other `.d.ts` files are generated from JavaScript source files

## Custom JSDoc Plugins (Deprecated)

The following JSDoc plugins are no longer used but kept for reference:

- **jsdoc.namespace.cjs** - Wrapped types in CodeceptJS namespace (functionality moved to generate-dts.mjs)
- **jsdoc.promiseBased.cjs** - Made helper methods return Promise<any> (functionality moved to generate-dts.mjs)

These plugins only work with tsd-jsdoc template and are not compatible with JSDoc 4.x.

## Benefits of the New Approach

1. **No abandoned dependencies** - TypeScript is actively maintained by Microsoft
2. **Better JSDoc support** - TypeScript has excellent JSDoc parsing
3. **No peer dependency conflicts** - Works with JSDoc 4.x
4. **Simpler toolchain** - One less tool to manage
5. **More accurate types** - TypeScript's inference is superior to tsd-jsdoc
