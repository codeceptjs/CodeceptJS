# TypeScript Support in ESM Architecture - Comprehensive Analysis

## Executive Summary

CodeceptJS 4.x has migrated to ESM but the TypeScript test file support needs architectural changes. This document provides a comprehensive analysis and recommended solution path.

---

## Current State Analysis

### What Works ✅

1. **Config Files** (`codecept.conf.ts`)
   - Location: `lib/config.js` lines 154-180
   - Uses custom transpiler: `lib/utils/typescript.js`
   - Recursively transpiles imported `.ts` files
   - Has fallback to `ts-node/register` (CommonJS legacy)

2. **Helper Files** (custom helpers)
   - Location: `lib/container.js`
   - Uses same transpiler utility
   - Full CommonJS shim support

3. **Steps Files** (`steps_file.ts`)
   - Location: `lib/container.js`
   - Uses transpiler with top-level await support
   - Works with require() and imports

4. **Files Imported by Config**
   - Example: `environments.ts` imported by `codecept.conf.ts`
   - Recursive transpilation chain
   - Extension probing (.js, .cjs, .json, .node)

### What Doesn't Work ❌

1. **Test Files** (`.ts` test files)
   - Location: `lib/codecept.js` line 259: `mocha.files = this.testFiles`
   - Problem: File paths passed directly to Mocha without transpilation
   - Impact: Mocha cannot parse TypeScript syntax
   - Error: "Unexpected token ':'" when encountering TS syntax

2. **Modules Imported by Test Files**
   - Example: Test imports from `types.ts` with enums
   - Not in transpilation chain
   - Node.js ESM loader fails on TS syntax

---

## Root Cause

The test loading flow bypasses transpilation:

```javascript
// lib/codecept.js lines 152-200
loadTests(pattern) {
  // 1. Glob collects test file paths
  globSync(pattern).forEach(file => {
    this.testFiles.push(resolve(file))  // Just stores paths
  })
}

// lib/codecept.js line 259
async run(test) {
  mocha.files = this.testFiles  // ❌ Passes raw .ts paths to Mocha
  // Mocha will try to load these with Node.js ESM loader
  // Node.js ESM loader doesn't understand TypeScript
}
```

**Historical Context:**
- In CommonJS era: Users added `ts-node/register` to `config.require` array
- `ts-node/register` patched `require()` to transpile `.ts` files on-the-fly
- In ESM: `require()` hooks don't work, need different mechanism

---

## Architecture Options

### Option 1: Use Node.js Loaders with tsx/ts-node ⭐ **RECOMMENDED**

**Concept:** Use the existing `config.require` mechanism to register a TypeScript loader that works in ESM.

**How it Works:**
1. User adds loader to `config.require` in `codecept.conf.ts` or `codecept.conf.js`
2. CodeceptJS imports the loader before loading tests (already implemented!)
3. Loader registers with Node.js ESM loader system
4. When Mocha loads `.ts` test files, loader transpiles on-the-fly

**Implementation Status:**
- ✅ `lib/codecept.js` lines 52-74: `requireModules()` already exists
- ✅ Supports both npm packages and local files
- ✅ Called before test loading (line 87: `await this.requireModules()`)
- ✅ Uses dynamic `import()` for ESM compatibility

**Recommended Loaders:**

#### Option 1A: tsx (Modern, Fast) ⭐⭐

```typescript
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['tsx/esm'],  // ← Modern ESM loader
  helpers: {
    Playwright: {
      url: 'http://localhost',
      browser: 'chromium'
    }
  }
}
```

**Pros:**
- ✅ Fast (uses esbuild)
- ✅ Zero config
- ✅ Active maintenance
- ✅ Native ESM support
- ✅ No need for tsconfig.json
- ✅ Handles all TS features (enums, decorators, etc.)

**Cons:**
- ⚠️ Requires Node.js 18.19+ (current: 20.19.5 ✓)
- ⚠️ New dependency to add

**Installation:**
```bash
npm install --save-dev tsx
```

#### Option 1B: ts-node/esm (Established)

```typescript
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['ts-node/esm'],  // ← ESM loader for ts-node
  helpers: { /* ... */ }
}
```

**Pros:**
- ✅ Already in dependencies (v10.9.2)
- ✅ Well established
- ✅ Respects tsconfig.json
- ✅ Users may already have it

**Cons:**
- ⚠️ Slower than tsx (uses TypeScript compiler)
- ⚠️ Requires tsconfig.json configuration
- ⚠️ More complex setup

**Configuration Required:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

### Option 2: Pre-Transpilation Step

**Concept:** Transpile all test files before running, similar to how we handle config files.

**Implementation Approach:**
```javascript
// In lib/codecept.js
async loadTests(pattern) {
  // ... existing glob logic ...
  
  // After collecting test files
  const transpiledFiles = []
  for (const file of this.testFiles) {
    if (file.endsWith('.ts')) {
      const { transpileTypeScript } = await import('./utils/typescript.js')
      const tempFile = await transpileTypeScript(file)
      transpiledFiles.push(tempFile)
    } else {
      transpiledFiles.push(file)
    }
  }
  this.testFiles = transpiledFiles
}
```

**Pros:**
- ✅ No external dependencies needed
- ✅ Reuses existing transpiler
- ✅ Full control over transpilation
- ✅ Works with current infrastructure

**Cons:**
- ⚠️ Slower startup (transpile all tests upfront)
- ⚠️ Must manage temp file cleanup
- ⚠️ Source maps more complex
- ⚠️ Debugging points to .temp.mjs files
- ⚠️ More maintenance burden
- ⚠️ Doesn't handle dynamic imports in test files

### Option 3: Mocha Custom Loader Integration

**Concept:** Integrate transpiler directly with Mocha's file loading mechanism.

**Implementation:**
```javascript
// Would need to modify Mocha's file loading
mocha.addFile = (file) => {
  if (file.endsWith('.ts')) {
    file = transpileTypeScript(file)
  }
  originalAddFile(file)
}
```

**Pros:**
- ✅ Clean integration point
- ✅ Transpile only when needed

**Cons:**
- ⚠️ Modifying Mocha internals
- ⚠️ May break on Mocha updates
- ⚠️ Complex to implement correctly
- ⚠️ Doesn't solve ESM loader issue for imports

### Option 4: Keep Tests in JS, Configs/Helpers in TS

**Concept:** Document that TypeScript is only for configs/helpers, tests should be `.js`.

**Pros:**
- ✅ No changes needed
- ✅ Already works

**Cons:**
- ❌ Users lose TypeScript benefits in tests
- ❌ Inconsistent DX
- ❌ Breaking change for existing TS test users
- ❌ Doesn't match documentation promises

---

## Recommended Solution: Option 1A (tsx)

### Why tsx?

1. **Modern & Fast:** Built on esbuild, much faster than ts-node
2. **Zero Config:** Works out of the box, no tsconfig.json required
3. **Full TS Support:** Handles all TypeScript features including enums, decorators
4. **ESM Native:** Built for ESM from ground up
5. **Active Development:** Well maintained, growing adoption
6. **Simple:** One line in config

### Implementation Plan

#### Phase 1: Update Documentation ✍️

**File: `docs/typescript.md`**

Add new section after line 43:

```markdown
## TypeScript Tests in ESM (CodeceptJS 4.x)

CodeceptJS 4.x uses ES Modules (ESM) which requires a different approach for TypeScript tests.

### Using tsx (Recommended)

[tsx](https://tsx.is) is a modern, fast TypeScript loader built on esbuild.

**Installation:**
```bash
npm install --save-dev tsx
```

**Configuration:**
```typescript
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['tsx/esm'],  // ← Enable TypeScript for tests
  helpers: {
    Playwright: {
      url: 'http://localhost',
      browser: 'chromium'
    }
  }
}
```

That's it! Now you can write tests in TypeScript:

```typescript
// login_test.ts
Feature('Login')

Scenario('successful login', ({ I }) => {
  I.amOnPage('/login')
  I.fillField('email', 'user@example.com')
  I.fillField('password', 'password123')
  I.click('Login')
  I.see('Welcome')
})
```

### Using ts-node/esm (Alternative)

If you prefer ts-node:

**Installation:**
```bash
npm install --save-dev ts-node
```

**Configuration:**
```typescript
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['ts-node/esm'],
  helpers: { /* ... */ }
}
```

**Required tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true
  },
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

### TypeScript Features in Tests

With tsx or ts-node/esm, you can use full TypeScript in tests:

```typescript
// types.ts
export enum Environment {
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export interface User {
  email: string
  password: string
}

// login_test.ts
import { Environment, User } from './types'

const testUser: User = {
  email: 'test@example.com',
  password: 'password123'
}

Feature('Login')

Scenario(`Login on ${Environment.TEST}`, ({ I }) => {
  I.amOnPage('/login')
  I.fillField('email', testUser.email)
  I.fillField('password', testUser.password)
  I.click('Login')
  I.see('Welcome')
})
```

### Troubleshooting

**Issue: "Cannot find module"**
- Ensure `tsx/esm` or `ts-node/esm` is in `config.require` array
- Check that the loader package is installed

**Issue: "Unexpected token"**
- This means the loader isn't registered
- Verify `require` config is before running tests
```

**File: `docs/configuration.md`**

Update the require section (around line 34) to include ESM example:

```markdown
## Require

Requires described module before run. This is useful for:
- Assertion libraries: `--require should`
- TypeScript loaders: `tsx/esm` or `ts-node/esm` for ESM projects
- TypeScript register: `ts-node/register` for CommonJS projects

### ESM Projects (CodeceptJS 4.x)

For TypeScript tests in ESM projects, use modern loaders:

```typescript
// codecept.conf.ts
export const config = {
  tests: './**/*_test.ts',
  require: ['tsx/esm'],  // Modern, fast TypeScript loader
  helpers: {},
  include: {},
}
```

### CommonJS Projects (CodeceptJS 3.x)

For TypeScript tests in CommonJS projects:

```javascript
// codecept.conf.js
module.exports = {
  tests: './*_test.ts',
  require: ['ts-node/register'],
  helpers: {},
  include: {},
}
```
```

#### Phase 2: Update Initialization ⚙️

**File: `lib/command/init.js`**

Update TypeScript initialization to include tsx:

```javascript
// Around line 18-50
if (typescript) {
  packages.push('tsx')  // Add tsx for ESM TypeScript support
  defaultConfig.tests = './*_test.ts'
  defaultConfig.require = ['tsx/esm']  // Add to config template
  
  // Generate tsconfig.json for better IDE support (optional)
  // But note: tsx works without it!
}
```

#### Phase 3: Update Package.json 📦

Add tsx as optional peer dependency:

```json
{
  "peerDependencies": {
    "tsx": "^4.0.0"
  },
  "peerDependenciesMeta": {
    "tsx": {
      "optional": true
    }
  },
  "devDependencies": {
    "tsx": "^4.19.2"
  }
}
```

#### Phase 4: Add Helper Utilities 🛠️

**File: `lib/utils/loaderCheck.js`** (new file)

```javascript
/**
 * Check if TypeScript loader is available for test files
 */
export async function checkTypeScriptLoader() {
  // Check if tsx or ts-node/esm is available
  const loaders = ['tsx', 'ts-node']
  
  for (const loader of loaders) {
    try {
      await import(loader)
      return { available: true, loader }
    } catch (e) {
      // Loader not available
    }
  }
  
  return { available: false, loader: null }
}

/**
 * Provide helpful error message if .ts tests found but no loader
 */
export function getTypeScriptLoaderError(testFiles) {
  const tsFiles = testFiles.filter(f => f.endsWith('.ts'))
  
  if (tsFiles.length === 0) return null
  
  return `
Found ${tsFiles.length} TypeScript test file(s) but no TypeScript loader configured.

To run TypeScript tests in CodeceptJS 4.x (ESM), you need to install a loader:

Option 1: tsx (recommended - fast, zero config)
  npm install --save-dev tsx

  Then add to codecept.conf.ts:
  require: ['tsx/esm']

Option 2: ts-node/esm (established, requires tsconfig)
  npm install --save-dev ts-node

  Then add to codecept.conf.ts:
  require: ['ts-node/esm']

  And create tsconfig.json with:
  {
    "compilerOptions": {
      "module": "ESNext",
      "target": "ES2022"
    },
    "ts-node": {
      "esm": true
    }
  }

See docs: https://codecept.io/typescript
`
}
```

**Update `lib/codecept.js`:**

```javascript
// Add at top
import { checkTypeScriptLoader, getTypeScriptLoaderError } from './utils/loaderCheck.js'

// In run() method, before mocha.files assignment:
async run(test) {
  await container.started()
  
  // Check TypeScript loader if .ts test files exist
  const loaderCheck = await checkTypeScriptLoader()
  const tsError = getTypeScriptLoaderError(this.testFiles)
  
  if (tsError && !loaderCheck.available) {
    console.error(tsError)
    process.exit(1)
  }
  
  // ... rest of run method
}
```

---

## Migration Guide for Users

### For New Projects

When running `npx codeceptjs init` and selecting TypeScript:

1. Install tsx: `npm install --save-dev tsx`
2. Config is auto-generated with `require: ['tsx/esm']`
3. Write tests in TypeScript immediately

### For Existing TypeScript Projects (CommonJS → ESM)

**Current setup (3.x):**
```javascript
// codecept.conf.js
module.exports = {
  tests: './*_test.ts',
  require: ['ts-node/register'],  // CommonJS loader
  helpers: {}
}
```

**New setup (4.x):**
```typescript
// codecept.conf.ts
export const config = {
  tests: './*_test.ts',
  require: ['tsx/esm'],  // ESM loader
  helpers: {}
}
```

**Steps:**
1. Install tsx: `npm install --save-dev tsx`
2. Convert config to `.ts` if not already
3. Change `require: ['ts-node/register']` to `require: ['tsx/esm']`
4. Remove ts-node from package.json if not used elsewhere (optional)
5. Run tests: `npx codeceptjs run`

---

## Alternative: Keep ts-node/esm

If you prefer not to add tsx:

**Pros:**
- ts-node already in dependencies
- Some users may prefer it
- Respects tsconfig.json strictly

**Cons:**
- Requires tsconfig.json setup
- Slower than tsx
- More complex configuration

**Implementation:**
- Same as tsx approach
- Just document ts-node/esm instead
- Update init command to use ts-node/esm
- Provide tsconfig.json template

---

## Testing Strategy

### Test Cases to Verify

1. **Basic TS Test:**
```typescript
Feature('Basic')
Scenario('test', ({ I }) => {
  I.amOnPage('/')
})
```

2. **TS with Imports:**
```typescript
import { Environment } from './types'
Feature('With Imports')
Scenario('test', ({ I }) => {
  console.log(Environment.TEST)
})
```

3. **TS with Enums:**
```typescript
enum Status {
  Active = 'active',
  Inactive = 'inactive'
}
```

4. **TS with Interfaces:**
```typescript
interface User {
  name: string
  email: string
}
```

5. **TS with Decorators (if enabled):**
```typescript
@suite
class LoginTests {
  @test
  async login() {}
}
```

### Compatibility Matrix

| Feature | tsx | ts-node/esm | Pre-transpile | Current |
|---------|-----|-------------|---------------|---------|
| Basic TS syntax | ✅ | ✅ | ✅ | ❌ |
| Imports from .ts | ✅ | ✅ | ⚠️ | ❌ |
| Enums | ✅ | ✅ | ✅ | ❌ |
| Interfaces | ✅ | ✅ | ✅ | ❌ |
| Decorators | ✅ | ✅ | ✅ | ❌ |
| Source maps | ✅ | ✅ | ⚠️ | N/A |
| Fast startup | ✅ | ⚠️ | ⚠️ | N/A |
| Zero config | ✅ | ❌ | ✅ | N/A |
| Config files | ✅ | ✅ | ✅ | ✅ |
| Helper files | ✅ | ✅ | ✅ | ✅ |

---

## Decision Factors

### Choose tsx if:
- ✅ You want fast test startup
- ✅ You prefer zero configuration
- ✅ You're starting a new project
- ✅ You want modern tooling

### Choose ts-node/esm if:
- ✅ You need strict tsconfig.json compliance
- ✅ You already use ts-node elsewhere
- ✅ You prefer established tools
- ✅ You need TypeScript compiler API hooks

### Choose Pre-transpilation if:
- ✅ You can't add external dependencies
- ✅ You need full control
- ✅ Startup time doesn't matter

---

## Implementation Effort

### Option 1A (tsx) - RECOMMENDED
- **Effort:** 4-6 hours
- **Files to change:** 3 (init.js, docs)
- **New files:** 1 (loaderCheck.js)
- **Risk:** Low
- **Testing:** 2-3 hours

### Option 1B (ts-node/esm)
- **Effort:** 3-4 hours
- **Files to change:** 3 (init.js, docs)
- **New files:** 1 (loaderCheck.js)
- **Risk:** Low
- **Testing:** 2-3 hours

### Option 2 (Pre-transpilation)
- **Effort:** 12-16 hours
- **Files to change:** 5+ (codecept.js, transpiler, cleanup logic)
- **New files:** 2-3
- **Risk:** Medium-High
- **Testing:** 6-8 hours

---

## Conclusion

**Recommended Path:**

1. **Short term (v4.0.0-beta.19):**
   - Update documentation to show tsx/esm approach
   - Add helpful error message when .ts tests found without loader
   - Add tsx to peerDependencies (optional)

2. **Medium term (v4.0.0-rc.1):**
   - Update init command to include tsx for TypeScript projects
   - Add tsx to devDependencies
   - Comprehensive testing across different TS features

3. **Long term (v4.1.0):**
   - Consider building tsx integration tighter
   - Maybe auto-detect and suggest loader if missing
   - Performance optimizations

**Key Insight:**
The `config.require` mechanism already exists and works perfectly. We just need to:
1. Document the ESM approach (tsx/esm or ts-node/esm)
2. Update init command to set it up automatically
3. Provide helpful errors when misconfigured

This is a documentation and guidance problem, not an architecture problem. The infrastructure is already there! 🎉

---

## Questions for Consideration

1. **Should tsx be a regular dependency or dev dependency?**
   - Recommend: devDependency (users control version)

2. **Should we support both tsx and ts-node equally?**
   - Recommend: Yes, document both but recommend tsx

3. **What about users who can't add dependencies?**
   - The pre-transpilation option exists as fallback

4. **Should config files continue using custom transpiler?**
   - Yes, keeps it working even without tsx installed
   - Config transpilation is fast enough (only 1-2 files)

5. **Deprecation path for ts-node/register?**
   - Keep docs showing it still works for CommonJS projects
   - Don't deprecate, just document ESM alternative

---

## Next Steps

Let me know which option you prefer, and I can:
1. Implement the changes
2. Update all documentation
3. Create example projects
4. Write migration guide

My recommendation: **Option 1A with tsx** - it's the modern, fast, simple solution that provides the best developer experience.
