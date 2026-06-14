/**
 * Cross-realm singleton sharing.
 *
 * CodeceptJS 4.x runs as native ESM, but test files, page objects and fragments are
 * loaded through Mocha's synchronous require() (the CommonJS realm) under a CJS loader
 * such as tsx/cjs (the setup the official Quickstart generates). So when user code does
 * `import { recorder } from "codeceptjs"`, Node materializes a SECOND, disconnected CJS
 * copy of the lib modules and their singletons — a copy the runner never populates, so
 * the internal API silently reads empty/never-started state. Helpers don't hit this
 * because they're loaded via import() (the ESM realm) and share the live singletons.
 *
 * Resolving the instance from globalThis (a single object shared across realms) makes
 * every realm use the very object the runner operates on. The runner (ESM) always loads
 * these modules first during bootstrap, so it wins the `key`; later CJS copies reuse it.
 * Under pure ESM the module loads once, so there is no behavior change.
 *
 * @template T
 * @param {string} key
 * @param {() => T} factory
 * @returns {T}
 */
export function realmSingleton(key, factory) {
  if (globalThis[key] === undefined) globalThis[key] = factory()
  return globalThis[key]
}
