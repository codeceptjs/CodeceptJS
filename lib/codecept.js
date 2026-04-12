import { existsSync, readFileSync } from 'fs'
import { globSync } from 'glob'
import shuffle from 'lodash.shuffle'
import fsPath from 'path'
import { resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname } from 'path'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import Helper from '@codeceptjs/helper'
import Runner from './runner.js'
import container from './container.js'
import Config from './config.js'
import runHook from './hooks.js'
import ActorFactory from './actor.js'
import { emptyFolder } from './utils.js'
import { initCodeceptGlobals } from './globals.js'
import store from './store.js'

import storeListener from './listener/store.js'
import stepsListener from './listener/steps.js'
import configListener from './listener/config.js'
import resultListener from './listener/result.js'
import helpersListener from './listener/helpers.js'
import globalTimeoutListener from './listener/globalTimeout.js'
import globalRetryListener from './listener/globalRetry.js'
import exitListener from './listener/exit.js'
import emptyRunListener from './listener/emptyRun.js'

/**
 * CodeceptJS runner
 */
class Codecept {
  /**
   * Create CodeceptJS runner.
   * Config and options should be passed
   *
   * @param {*} config
   * @param {*} opts
   */
  constructor(config, opts) {
    this.config = Config.create(config)
    this.opts = opts
    this.testFiles = new Array(0)
    this.requiringModules = config.require
  }

  /**
   * Require modules before codeceptjs running
   *
   * @param {string[]} requiringModules
   */
  async requireModules(requiringModules) {
    if (requiringModules) {
      for (const requiredModule of requiringModules) {
        let modulePath = requiredModule
        const isLocalFile = existsSync(modulePath) || existsSync(`${modulePath}.js`)
        if (isLocalFile) {
          modulePath = resolve(modulePath)
          // For ESM, ensure .js extension for local files
          if (!modulePath.endsWith('.js') && !modulePath.endsWith('.mjs') && !modulePath.endsWith('.cjs')) {
            if (existsSync(`${modulePath}.js`)) {
              modulePath = `${modulePath}.js`
            }
          }
        } else {
          // For npm packages, resolve from the user's directory
          // This ensures packages like tsx are found in user's node_modules
          const userDir = store.codeceptDir || process.cwd()
          
          try {
            // Use createRequire to resolve from user's directory
            const userRequire = createRequire(pathToFileURL(resolve(userDir, 'package.json')).href)
            const resolvedPath = userRequire.resolve(requiredModule)
            modulePath = pathToFileURL(resolvedPath).href
          } catch (resolveError) {
            // If resolution fails, try direct import (will check from CodeceptJS node_modules)
            // This is the fallback for globally installed packages
            modulePath = requiredModule
          }
        }
        // Use dynamic import for ESM
        await import(modulePath)
      }
    }
  }

  /**
   * Initialize CodeceptJS at specific dir.
   * Loads config, requires factory methods
   *
   * @param {string} dir
   */
  async init(dir) {
    await this.initGlobals(dir)
    // Require modules before initializing
    await this.requireModules(this.requiringModules)
    // initializing listeners
    await container.create(this.config, this.opts)
    this.runner = new Runner(this)
    await this.runHooks()
  }

  /**
   * Creates global variables
   *
   * @param {string} dir
   */
  async initGlobals(dir) {
    await initCodeceptGlobals(dir, this.config, container)
  }

  /**
   * Executes hooks.
   */
  async runHooks() {
    // For workers parent process we only need plugins/hooks.
    // Core listeners are executed inside worker threads.
    if (!this.opts?.skipDefaultListeners) {
      const listenerModules = [
        './listener/store.js',
        './listener/steps.js',
        './listener/config.js',
        './listener/result.js',
        './listener/helpers.js',
        './listener/globalTimeout.js',
        './listener/globalRetry.js',
        './listener/retryEnhancer.js',
        './listener/exit.js',
        './listener/emptyRun.js',
      ]

      for (const modulePath of listenerModules) {
        const module = await import(modulePath)
        runHook(module.default || module)
      }
    }

    // custom hooks (previous iteration of plugins)
    this.config.hooks.forEach(hook => runHook(hook))
  }

  /**
   * Executes bootstrap.
   *
   * @returns {Promise<void>}
   */
  async bootstrap() {
    return runHook(this.config.bootstrap, 'bootstrap')
  }

  /**
   * Executes teardown.
   *
   * @returns {Promise<void>}
   */
  async teardown() {
    return runHook(this.config.teardown, 'teardown')
  }

  /**
   * Loads tests by pattern or by config.tests
   *
   * @param {string} [pattern]
   */
  loadTests(pattern) {
    const options = {
      cwd: store.codeceptDir,
    }

    let patterns = [pattern]
    if (!pattern) {
      patterns = []

      // If the user wants to test a specific set of test files as an array or string.
      if (this.config.tests && !this.opts.features) {
        if (Array.isArray(this.config.tests)) {
          patterns.push(...this.config.tests)
        } else {
          patterns.push(this.config.tests)
        }
      }

      if (this.config.gherkin && this.config.gherkin.features && !this.opts.tests) {
        if (Array.isArray(this.config.gherkin.features)) {
          this.config.gherkin.features.forEach(feature => {
            patterns.push(feature)
          })
        } else {
          patterns.push(this.config.gherkin.features)
        }
      }
    }

    for (pattern of patterns) {
      if (pattern) {
        globSync(pattern, options).forEach(file => {
          if (file.includes('node_modules')) return
          if (!fsPath.isAbsolute(file)) {
            file = fsPath.join(store.codeceptDir, file)
          }
          if (!this.testFiles.includes(fsPath.resolve(file))) {
            this.testFiles.push(fsPath.resolve(file))
          }
        })
      }
    }

    if (this.opts.shuffle) {
      this.testFiles = shuffle(this.testFiles)
    }

    if (this.opts.shard) {
      this.testFiles = this._applySharding(this.testFiles, this.opts.shard)
    }
  }

  /**
   * Apply sharding to test files based on shard configuration
   *
   * @param {Array<string>} testFiles - Array of test file paths
   * @param {string} shardConfig - Shard configuration in format "index/total" (e.g., "1/4")
   * @returns {Array<string>} - Filtered array of test files for this shard
   */
  _applySharding(testFiles, shardConfig) {
    const shardMatch = shardConfig.match(/^(\d+)\/(\d+)$/)
    if (!shardMatch) {
      throw new Error('Invalid shard format. Expected format: "index/total" (e.g., "1/4")')
    }

    const shardIndex = parseInt(shardMatch[1], 10)
    const shardTotal = parseInt(shardMatch[2], 10)

    if (shardTotal < 1) {
      throw new Error('Shard total must be at least 1')
    }

    if (shardIndex < 1 || shardIndex > shardTotal) {
      throw new Error(`Shard index ${shardIndex} must be between 1 and ${shardTotal}`)
    }

    if (testFiles.length === 0) {
      return testFiles
    }

    // Calculate which tests belong to this shard
    const shardSize = Math.ceil(testFiles.length / shardTotal)
    const startIndex = (shardIndex - 1) * shardSize
    const endIndex = Math.min(startIndex + shardSize, testFiles.length)

    return testFiles.slice(startIndex, endIndex)
  }

  /**
   * Returns parsed suites with their tests.
   * Creates a temporary Mocha instance to avoid polluting container state.
   * Must be called after init(). Calls loadTests() internally if testFiles is empty.
   *
   * @param {string} [pattern] - glob pattern for test files
   * @returns {Array<{title: string, file: string, tags: string[], tests: Array<{title: string, uid: string, tags: string[], fullTitle: string}>}>}
   */
  getSuites(pattern) {
    return this.runner.getSuites(pattern)
  }

  /**
   * Run all tests in a suite.
   * Must be called after init() and bootstrap().
   *
   * @param {{file: string}} suite - suite object returned by getSuites()
   * @returns {Promise<void>}
   */
  async runSuite(suite) {
    return this.runner.runSuite(suite)
  }

  /**
   * Run a single test by its fullTitle.
   * Must be called after init() and bootstrap().
   *
   * @param {{fullTitle: string}} test - test object returned by getSuites()
   * @returns {Promise<void>}
   */
  async runTest(test) {
    return this.runner.runTest(test)
  }

  /**
   * Run a specific test or all loaded tests.
   *
   * @param {string} [test]
   * @returns {Promise<void>}
   */
  async run(test) {
    return this.runner.run(test)
  }

  /**
   * Returns the version string of CodeceptJS.
   *
   * @returns {string} The version string.
   */
  static version() {
    return JSON.parse(readFileSync(`${__dirname}/../package.json`, 'utf8')).version
  }
}

export default Codecept
