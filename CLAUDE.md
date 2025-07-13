# CodeceptJS ESM Migration Plan

## Executive Summary

Migrating CodeceptJS to ESM will require a phased approach due to:

- **900+ require() statements** across the codebase
- Complex dynamic module loading system in `container.js`
- Extensive plugin architecture with runtime module resolution
- Heavy use of conditional requires and try-catch patterns

## Analysis Results

### Total Count of require() Statements

- **850 require() statements** found in the `/lib` directory alone
- Additional requires in `/bin`, `/translations`, and root files
- **Total estimated across codebase: ~900+ require() statements**

### Files with Most require() Statements

1. `/lib/codecept.js` - 30 requires
2. `/lib/helper/Playwright.js` - 28 requires
3. `/lib/helper/Puppeteer.js` - 26 requires
4. `/lib/helper/WebDriver.js` - 24 requires
5. `/lib/helper/Protractor.js` - 22 requires
6. `/lib/workers.js` - 20 requires
7. `/lib/index.js` - 19 requires
8. `/lib/container.js` - 19 requires
9. `/lib/command/init.js` - 19 requires
10. `/lib/helper/TestCafe.js` - 17 requires

### Problematic Patterns Requiring Special Handling

#### 1. Dynamic require() Statements (Most Critical)

- **Template-based requires**: `/lib/command/generate.js` line 158: `actor = require('${actorPath}')`
- **Conditional module loading**: `/lib/command/init.js` line 287: `require(\`../helper/\${helperName}\`)`
- **Plugin loading**: Multiple files use `require(module)` where module is a variable

#### 2. Conditional require() Statements (High Impact)

Found **75+ files** with conditional requires using `if` statements:

- `/lib/container.js`: Module loading with fallback logic
- `/lib/config.js`: TypeScript support with `require('ts-node/register')`
- `/lib/codecept.js`: Global object loading based on configuration
- Helper files: Conditional loading of browser automation libraries

#### 3. Try-catch require() Patterns (High Impact)

Found **57+ files** with try-catch require patterns:

- `/lib/utils.js`: `requireWithFallback()` function for graceful fallbacks
- `/lib/plugin/wdio.js`: `safeRequire()` function
- `/lib/helper/REST.js`: Dependency checking
- `/lib/container.js`: Module loading with error handling

#### 4. require.resolve() Usage (Medium Impact)

Found **5 files** using `require.resolve()`:

- `/lib/utils.js`: Package existence checking in `requireWithFallback()`
- `/lib/helper/Puppeteer.js`: Module resolution
- `/lib/helper/extras/React.js`: Path resolution
- `/lib/helper/ApiDataFactory.js` and `/lib/helper/GraphQLDataFactory.js`: Dependency checking

#### 5. \_\_dirname Usage (Medium Impact)

Found **9 files** using `__dirname`:

- `/lib/codecept.js`: Package.json path resolution
- `/lib/utils.js`: Local installation detection
- `/lib/workers.js`: Worker script path resolution
- `/lib/command/generate.js`: Template file paths
- `/lib/command/run-multiple.js`: Executable paths
- `/lib/helper/Nightmare.js`: Client script injection
- `/lib/helper/REST.js`: Certificate file paths (in documentation)
- `/lib/mocha/factory.js`: UI module paths
- `/lib/helper/testcafe/testcafe-utils.js`: Directory resolution

## Migration Plan

### Phase 1: Foundation (Estimated 2-3 weeks)

#### 1.1 Update package.json

```json
{
  "type": "module",
  "exports": {
    ".": "./lib/index.js",
    "./lib/*": "./lib/*.js"
  },
  "engines": {
    "node": ">=14.13.1"
  }
}
```

#### 1.2 Create ESM compatibility layer

- Create `lib/compat/moduleLoader.js` for dynamic imports
- Convert `__dirname`/`__filename` to `import.meta.url`
- Replace `require.resolve()` with `import.meta.resolve()`

#### 1.3 Convert bin/ entry points

- `bin/codecept.js` → ESM imports
- Update shebang and command structure

### Phase 2: Core Infrastructure (Estimated 3-4 weeks)

#### 2.1 Convert container.js (CRITICAL)

Key changes needed in `lib/container.js:285-305`:

```javascript
// Current problematic code:
const mod = require(moduleName)
HelperClass = mod.default || mod

// ESM replacement:
const mod = await import(moduleName)
HelperClass = mod.default || mod
```

#### 2.2 Update dynamic loading functions

- `requireHelperFromModule()` → `importHelperFromModule()`
- `loadSupportObject()` → async with dynamic imports
- `createPlugins()` → async plugin loading

#### 2.3 Convert core files

Priority order:

1. `lib/utils.js` (19 requires)
2. `lib/index.js` (19 requires)
3. `lib/codecept.js` (30 requires)
4. `lib/config.js` (13 requires)

### Phase 3: Helper System (Estimated 4-5 weeks)

#### 3.1 Convert browser automation helpers

High-impact files:

- `lib/helper/Playwright.js` (28 requires)
- `lib/helper/Puppeteer.js` (26 requires)
- `lib/helper/WebDriver.js` (24 requires)
- `lib/helper/TestCafe.js` (17 requires)

#### 3.2 Handle conditional dependencies

Convert try-catch patterns:

```javascript
// Current:
try {
  const puppeteer = require('puppeteer')
} catch (e) {
  // fallback
}

// ESM:
let puppeteer
try {
  puppeteer = await import('puppeteer')
} catch (e) {
  // fallback
}
```

### Phase 4: Commands & Plugins (Estimated 2-3 weeks)

#### 4.1 Convert command files

- `lib/command/init.js` (19 requires)
- `lib/command/generate.js` (template loading)
- `lib/command/run*.js` files

#### 4.2 Update plugin system

- Support both CJS and ESM plugins
- Async plugin initialization
- Plugin discovery mechanism

### Phase 5: Testing & Validation (Estimated 2-3 weeks)

#### 5.1 Test compatibility

- All existing tests must pass
- Plugin ecosystem compatibility
- Helper loading in various configurations

#### 5.2 Documentation updates

- Migration guide for users
- Plugin development guidelines
- Breaking changes documentation

## Critical Migration Challenges

### 1. Dynamic Module Loading

The biggest challenge is in `container.js` where modules are loaded dynamically based on configuration. This requires converting synchronous `require()` to asynchronous `import()`.

**Solution**: Make container creation async and update all callers.

### 2. Plugin Ecosystem

Many plugins may still use CommonJS.

**Solution**: Support both formats during transition period.

### 3. Global Object Injection

`codecept.js` conditionally adds globals based on config.

**Solution**: Maintain compatibility layer for existing configurations.

### 4. File Path Resolution

Extensive use of `__dirname` for path resolution.

**Solution**: Create utility functions using `import.meta.url`.

## Compatibility Strategy

### Dual Package Approach (Recommended)

1. Maintain CommonJS build for compatibility
2. Provide ESM build for modern usage
3. Use `package.json` exports field to serve appropriate version

### Breaking Changes

- Drop Node.js < 14.13.1 support
- Async container initialization
- Some plugin APIs may need updates

## Timeline Summary

- **Total estimated time**: 13-18 weeks
- **Critical path**: Container.js and dynamic loading
- **Risk areas**: Plugin compatibility, helper loading

## Next Steps

1. Start with Phase 1 foundation work
2. Create comprehensive test suite for migration validation
3. Engage with plugin maintainers early
4. Consider feature freeze during migration
5. Plan gradual rollout strategy

## Testing Commands

To test the project:

- `npm run lint` - Run linting
- `npm run test:unit` - Run unit tests
- `npm run test:runner` - Run runner tests
- `npm run test` - Run both unit and runner tests

## Current Migration Status

Starting with creating example-esm project for iterative testing and validation.
