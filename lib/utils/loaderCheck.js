/**
 * Utilities for checking TypeScript loader availability
 */

/**
 * Check if a TypeScript loader is available for test files
 * Note: This checks if loaders are in the require array, not if packages are installed
 * Package installation is checked when actually requiring modules
 * @param {string[]} requiredModules - Array of required modules from config
 * @returns {boolean}
 */
export function checkTypeScriptLoader(requiredModules = []) {
  // Check if a loader is configured in the require array
  return (
    requiredModules.includes('tsx/esm') ||
    requiredModules.includes('tsx/cjs') ||
    requiredModules.includes('tsx') ||
    requiredModules.includes('ts-node/esm') ||
    requiredModules.includes('ts-node/register') ||
    requiredModules.includes('ts-node')
  )
}

/**
 * Generate helpful error message if .ts tests found but no loader configured
 * @param {string[]} testFiles - Array of test file paths
 * @returns {string|null} Error message or null if no TypeScript files
 */
export function getTypeScriptLoaderError(testFiles) {
  const tsFiles = testFiles.filter(f => f.endsWith('.ts'))

  if (tsFiles.length === 0) return null

  return `
╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║  ⚠️  TypeScript Test Files Detected but No Loader Configured                ║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝

Found ${tsFiles.length} TypeScript test file(s) but no TypeScript loader is configured.

CodeceptJS 4.x uses ES Modules (ESM) and requires a loader to run TypeScript tests.

┌─────────────────────────────────────────────────────────────────────────────┐
│ Option 1: tsx (Recommended - Fast, Zero Config)                            │
└─────────────────────────────────────────────────────────────────────────────┘

  Installation:
    npm install --save-dev tsx

  Configuration:
    Add to your codecept.conf.ts or codecept.conf.js:

    export const config = {
      tests: './**/*_test.ts',
      require: ['tsx/cjs'],  // ← Add this line
      helpers: { /* ... */ }
    }

  Why tsx?
    ⚡ Fast: Built on esbuild
    🎯 Zero config: No tsconfig.json required
    ✅ Works with Mocha: Uses CommonJS hooks
    ✅ Complete: Handles all TypeScript features

┌─────────────────────────────────────────────────────────────────────────────┐
│ Option 2: ts-node/esm (Not Recommended - Has Module Resolution Issues)     │
└─────────────────────────────────────────────────────────────────────────────┘

  ⚠️  ts-node/esm has significant limitations and is not recommended:
      - Doesn't work with "type": "module" in package.json
      - Module resolution doesn't work like standard TypeScript ESM
      - Import statements must use explicit file paths
  
  We strongly recommend using tsx/cjs instead.
  
  If you still want to use ts-node/esm:

  Installation:
    npm install --save-dev ts-node

  Configuration:
    1. Add to your codecept.conf.ts:
       require: ['ts-node/esm']

    2. Create tsconfig.json:
       {
         "compilerOptions": {
           "module": "ESNext",
           "target": "ES2022",
           "moduleResolution": "node",
           "esModuleInterop": true
         },
         "ts-node": {
           "esm": true
         }
       }

    3. Do NOT use "type": "module" in package.json

📚 Documentation: https://codecept.io/typescript

Note: TypeScript config files (codecept.conf.ts) and helpers are automatically
      transpiled. Only test files require a loader to be configured.
`
}

/**
 * Get warning message if ts-node/esm is being used
 * @param {string[]} requiredModules - Array of required modules from config
 * @returns {string|null} Warning message or null
 */
export function getTSNodeESMWarning(requiredModules = []) {
  if (!requiredModules.includes('ts-node/esm')) {
    return null
  }

  return `
⚠️  Warning: ts-node/esm with "module": "esnext" requires explicit file extensions in all imports.

This is a known limitation. Use tsx/cjs instead to write imports without extensions.

Examples:

  ❌ Incorrect (will fail):
     import loginPage from "./pages/Login";

  ✅ Correct (must include .ts extension):
     import loginPage from "./pages/Login.ts";

📚 Documentation: https://codecept.io/typescript

`
}

/**
 * Check if user is trying to run TypeScript tests without proper loader
 * @param {string[]} testFiles - Array of test file paths
 * @param {string[]} requiredModules - Array of required modules from config
 * @returns {{hasError: boolean, message: string|null}}
 */
export function validateTypeScriptSetup(testFiles, requiredModules = []) {
  const tsFiles = testFiles.filter(f => f.endsWith('.ts'))

  if (tsFiles.length === 0) {
    // No TypeScript test files, all good
    return { hasError: false, message: null }
  }

  // Check if a loader is configured in the require array
  const hasLoader = checkTypeScriptLoader(requiredModules)

  if (hasLoader) {
    // Loader configured, all good (package will be checked when requireModules runs)
    return { hasError: false, message: null }
  }

  // No loader configured and TypeScript tests exist
  const message = getTypeScriptLoaderError(testFiles)
  return { hasError: true, message }
}
