import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { mkdirp } from 'mkdirp'
import { Worker } from 'worker_threads'
import { EventEmitter } from 'events'
import ms from 'ms'
import merge from 'lodash.merge'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
import Codecept from './codecept.js'
import MochaFactory from './mocha/factory.js'
import Container from './container.js'
import { getTestRoot } from './command/utils.js'
import { isFunction, fileExists, replaceValueDeep, deepClone } from './utils.js'
import mainConfig from './config.js'
import output from './output.js'
import event from './event.js'
import { deserializeTest } from './mocha/test.js'
import { deserializeSuite } from './mocha/suite.js'
import recorder from './recorder.js'
import store from './store.js'
import runHook from './hooks.js'
import WorkerStorage from './workerStorage.js'
import { createRuns } from './command/run-multiple/collection.js'

const pathToWorker = path.join(__dirname, 'command', 'workers', 'runTests.js')

const initializeCodecept = async (configPath, options = {}) => {
  const config = await mainConfig.load(configPath || '.')
  const codecept = new Codecept(config, { ...options, skipDefaultListeners: true })
  await codecept.init(getTestRoot(configPath))
  codecept.loadTests()

  return codecept
}

const createOutputDir = async configPath => {
  const config = await mainConfig.load(configPath || '.')
  const testRoot = getTestRoot(configPath)
  const outputDir = path.isAbsolute(config.output) ? config.output : path.join(testRoot, config.output)

  if (!fileExists(outputDir)) {
    output.print(`creating output directory: ${outputDir}`)
    mkdirp.sync(outputDir)
  }
}

const populateGroups = numberOfWorkers => {
  const groups = []
  for (let i = 0; i < numberOfWorkers; i++) {
    groups[i] = []
  }

  return groups
}

const createWorker = (workerObject, isPoolMode = false) => {
  const worker = new Worker(pathToWorker, {
    workerData: {
      options: simplifyObject(workerObject.options),
      tests: workerObject.tests,
      testRoot: workerObject.testRoot,
      workerIndex: workerObject.workerIndex + 1,
      poolMode: isPoolMode,
    },
    stdout: true,
    stderr: true,
  })

  // Pipe worker stdout/stderr to main process
  if (worker.stdout) {
    worker.stdout.setEncoding('utf8')
    worker.stdout.on('data', data => {
      process.stdout.write(data)
    })
  }
  if (worker.stderr) {
    worker.stderr.setEncoding('utf8')
    worker.stderr.on('data', data => {
      process.stderr.write(data)
    })
  }

  worker.on('error', err => {
    console.error(`[Main] Worker Error:`, err)
    output.error(`Worker Error: ${err.stack}`)
  })

  WorkerStorage.addWorker(worker)
  return worker
}

const simplifyObject = object => {
  return Object.keys(object)
    .filter(k => k.indexOf('_') !== 0)
    .filter(k => typeof object[k] !== 'function')
    .filter(k => typeof object[k] !== 'object')
    .reduce((obj, key) => {
      obj[key] = object[key]
      return obj
    }, {})
}

const createWorkerObjects = (testGroups, config, testRoot, options, selectedRuns) => {
  selectedRuns = options && options.all && config.multiple ? Object.keys(config.multiple) : selectedRuns
  if (selectedRuns === undefined || !selectedRuns.length || config.multiple === undefined) {
    return testGroups.map((tests, index) => {
      const workerObj = new WorkerObject(index)
      workerObj.addConfig(config)
      workerObj.addTests(tests)
      workerObj.setTestRoot(testRoot)
      workerObj.addOptions(options)
      return workerObj
    })
  }
  const workersToExecute = []

  const currentOutputFolder = config.output
  let currentMochaJunitReporterFile

  if (config.mocha && config.mocha.reporterOptions) {
    currentMochaJunitReporterFile = config.mocha.reporterOptions['mocha-junit-reporter'].options.mochaFile
  }

  createRuns(selectedRuns, config).forEach(worker => {
    const separator = path.sep
    const _config = { ...config }
    let workerName = worker.name.replace(':', '_')
    _config.output = `${currentOutputFolder}${separator}${workerName}`
    if (config.mocha && config.mocha.reporterOptions) {
      const _tempArray = currentMochaJunitReporterFile.split(separator)
      _tempArray.splice(
        _tempArray.findIndex(item => item.includes('.xml')),
        0,
        workerName,
      )
      _config.mocha.reporterOptions['mocha-junit-reporter'].options.mochaFile = _tempArray.join(separator)
    }
    workerName = worker.getOriginalName() || worker.getName()
    const workerConfig = worker.getConfig()
    workersToExecute.push(getOverridenConfig(workerName, workerConfig, _config))
  })
  const workers = []
  let index = 0
  testGroups.forEach(tests => {
    const testWorkerArray = []
    workersToExecute.forEach(finalConfig => {
      const workerObj = new WorkerObject(index++)
      workerObj.addConfig(finalConfig)
      workerObj.addTests(tests)
      workerObj.setTestRoot(testRoot)
      workerObj.addOptions(options)
      testWorkerArray.push(workerObj)
    })
    workers.push(...testWorkerArray)
  })
  return workers
}

const indexOfSmallestElement = groups => {
  let i = 0
  for (let j = 1; j < groups.length; j++) {
    if (groups[j - 1].length > groups[j].length) {
      i = j
    }
  }
  return i
}

const convertToMochaTests = testGroup => {
  const group = []
  if (testGroup instanceof Array) {
    const mocha = MochaFactory.create({}, {})
    mocha.files = testGroup
    mocha.loadFiles()
    mocha.suite.eachTest(test => {
      group.push(test.uid)
    })
    mocha.unloadFiles()
  }

  return group
}

const getOverridenConfig = (workerName, workerConfig, config) => {
  // clone config
  const overriddenConfig = deepClone(config)

  // get configuration
  const browserConfig = workerConfig.browser

  for (const key in browserConfig) {
    overriddenConfig.helpers = replaceValueDeep(overriddenConfig.helpers, key, browserConfig[key])
  }

  // override tests configuration
  if (overriddenConfig.tests) {
    overriddenConfig.tests = workerConfig.tests
  }

  if (overriddenConfig.gherkin && workerConfig.gherkin && workerConfig.gherkin.features) {
    overriddenConfig.gherkin.features = workerConfig.gherkin.features
  }
  return overriddenConfig
}

class WorkerObject {
  /**
   * @param {Number} workerIndex - Unique ID for worker
   */
  constructor(workerIndex) {
    this.workerIndex = workerIndex
    this.options = {}
    this.tests = []
    this.testRoot = getTestRoot()
  }

  addConfig(config) {
    const oldConfig = JSON.parse(this.options.override || '{}')

    // Remove customLocatorStrategies from both old and new config before JSON serialization
    // since functions cannot be serialized and will be lost, causing workers to have empty strategies.
    // Note: Only WebDriver helper supports customLocatorStrategies
    const configWithoutFunctions = { ...config }

    // Clean both old and new config
    const cleanConfig = cfg => {
      if (cfg.helpers) {
        cfg.helpers = { ...cfg.helpers }
        Object.keys(cfg.helpers).forEach(helperName => {
          if (cfg.helpers[helperName] && cfg.helpers[helperName].customLocatorStrategies !== undefined) {
            cfg.helpers[helperName] = { ...cfg.helpers[helperName] }
            delete cfg.helpers[helperName].customLocatorStrategies
          }
        })
      }
      return cfg
    }

    const cleanedOldConfig = cleanConfig(oldConfig)
    const cleanedNewConfig = cleanConfig(configWithoutFunctions)

    // Deep merge configurations to preserve all helpers from base config
    const newConfig = merge({}, cleanedOldConfig, cleanedNewConfig)
    this.options.override = JSON.stringify(newConfig)
  }

  addTestFiles(testGroup) {
    this.addTests(convertToMochaTests(testGroup))
  }

  addTests(tests) {
    this.tests = this.tests.concat(tests)
  }

  setTestRoot(path) {
    this.testRoot = getTestRoot(path)
  }

  addOptions(opts) {
    this.options = {
      ...this.options,
      ...opts,
    }
  }
}

class Workers extends EventEmitter {
  /**
   * @param {Number} numberOfWorkers
   * @param {Object} config
   */
  constructor(numberOfWorkers, config = { by: 'test' }) {
    super()
    this.setMaxListeners(50)
    this.codeceptPromise = initializeCodecept(config.testConfig, config.options)
    this.codecept = null
    this.config = config // Save config
    this.numberOfWorkersRequested = numberOfWorkers // Save requested worker count
    this.options = config.options || {}
    this.errors = []
    this.numberOfWorkers = 0
    this.closedWorkers = 0
    this.workers = []
    this.testGroups = []
    this.testPool = []
    this.testPoolInitialized = false
    this.isPoolMode = config.by === 'pool'
    this.activeWorkers = new Map()
    this.maxWorkers = numberOfWorkers // Track original worker count for pool mode

    createOutputDir(config.testConfig)
    // Defer worker initialization until codecept is ready
  }

  async _ensureInitialized() {
    if (!this.codecept) {
      this.codecept = await this.codeceptPromise
      // Initialize workers in these cases:
      // 1. Positive number requested AND no manual workers pre-spawned
      // 2. Function-based grouping (indicated by negative number) AND no manual workers pre-spawned
      const shouldAutoInit = this.workers.length === 0 && ((Number.isInteger(this.numberOfWorkersRequested) && this.numberOfWorkersRequested > 0) || (this.numberOfWorkersRequested < 0 && isFunction(this.config.by)))

      if (shouldAutoInit) {
        this._initWorkers(this.numberOfWorkersRequested, this.config)
      }
    }
  }

  _initWorkers(numberOfWorkers, config) {
    this.splitTestsByGroups(numberOfWorkers, config)
    // For function-based grouping, use the actual number of test groups created
    const actualNumberOfWorkers = isFunction(config.by) ? this.testGroups.length : numberOfWorkers
    this.workers = createWorkerObjects(this.testGroups, this.codecept.config, getTestRoot(config.testConfig), config.options, config.selectedRuns)
    this.numberOfWorkers = this.workers.length
  }

  /**
   * This splits tests by groups.
   * Strategy for group split is taken from a constructor's config.by value:
   *
   * `config.by` can be:
   *
   * - `suite`
   * - `test`
   * - `pool`
   * - function(numberOfWorkers)
   *
   * This method can be overridden for a better split.
   */
  splitTestsByGroups(numberOfWorkers, config) {
    if (isFunction(config.by)) {
      const createTests = config.by
      const testGroups = createTests(numberOfWorkers)
      if (!(testGroups instanceof Array)) {
        throw new Error('Test group should be an array')
      }
      for (const testGroup of testGroups) {
        this.testGroups.push(convertToMochaTests(testGroup))
      }
    } else if (typeof numberOfWorkers === 'number' && numberOfWorkers > 0) {
      if (config.by === 'pool') {
        this.createTestPool(numberOfWorkers)
      } else {
        this.testGroups = config.by === 'suite' ? this.createGroupsOfSuites(numberOfWorkers) : this.createGroupsOfTests(numberOfWorkers)
      }
    }
  }

  /**
   * Creates a new worker
   *
   * @returns {WorkerObject}
   */
  spawn() {
    const worker = new WorkerObject(this.numberOfWorkers)
    this.workers.push(worker)
    this.numberOfWorkers += 1
    return worker
  }

  /**
   * @param {Number} numberOfWorkers
   */
  createGroupsOfTests(numberOfWorkers) {
    // If Codecept isn't initialized yet, return empty groups as a safe fallback
    if (!this.codecept) return populateGroups(numberOfWorkers)
    const files = this.codecept.testFiles
    
    // Create a fresh mocha instance to avoid state pollution
    Container.createMocha(this.codecept.config.mocha || {}, this.options)
    const mocha = Container.mocha()
    mocha.files = files
    mocha.loadFiles()

    const groups = populateGroups(numberOfWorkers)
    let groupCounter = 0

    mocha.suite.eachTest(test => {
      const i = groupCounter % groups.length
      if (test) {
        groups[i].push(test.uid)
        groupCounter++
      }
    })
    
    // Clean up after collecting test UIDs
    mocha.unloadFiles()
    
    return groups
  }

  /**
   * @param {Number} numberOfWorkers
   */
  createTestPool(numberOfWorkers) {
    // For pool mode, create empty groups for each worker and initialize empty pool
    // Test pool will be populated lazily when getNextTest() is first called
    this.testPool = []
    this.testPoolInitialized = false
    this.testGroups = populateGroups(numberOfWorkers)
  }

  /**
   * Initialize the test pool if not already done
   * This is called lazily to avoid state pollution issues during construction
   */
  _initializeTestPool() {
    if (this.testPoolInitialized) {
      return
    }

    // Ensure codecept is initialized
    if (!this.codecept) {
      output.log('Warning: codecept not initialized when initializing test pool')
      this.testPoolInitialized = true
      return
    }

    const files = this.codecept.testFiles
    if (!files || files.length === 0) {
      this.testPoolInitialized = true
      return
    }

    // In ESM, test UIDs are not stable across different mocha instances
    // So instead of using UIDs, we distribute test FILES
    // Each file may contain multiple tests
    for (const file of files) {
      this.testPool.push(file)
    }

    this.testPoolInitialized = true
  }

  /**
   * Gets the next test from the pool
   * @returns {String|null} test file path or null if no tests available
   */
  getNextTest() {
    // Lazy initialization of test pool on first call
    if (!this.testPoolInitialized) {
      this._initializeTestPool()
    }

    return this.testPool.shift()
  }

  /**
   * @param {Number} numberOfWorkers
   */
  createGroupsOfSuites(numberOfWorkers) {
    // If Codecept isn't initialized yet, return empty groups as a safe fallback
    if (!this.codecept) return populateGroups(numberOfWorkers)
    const files = this.codecept.testFiles
    const groups = populateGroups(numberOfWorkers)

    // Create a fresh mocha instance to avoid state pollution
    Container.createMocha(this.codecept.config.mocha || {}, this.options)
    const mocha = Container.mocha()
    mocha.files = files
    mocha.loadFiles()
    
    mocha.suite.suites.forEach(suite => {
      const i = indexOfSmallestElement(groups)
      suite.tests.forEach(test => {
        if (test) {
          groups[i].push(test.uid)
        }
      })
    })
    
    // Clean up after collecting test UIDs
    mocha.unloadFiles()
    
    return groups
  }

  /**
   * @param {Object} config
   */
  overrideConfig(config) {
    for (const worker of this.workers) {
      worker.addConfig(config)
    }
  }

  async bootstrapAll() {
    await this._ensureInitialized()
    return runHook(this.codecept.config.bootstrapAll, 'bootstrapAll')
  }

  async teardownAll() {
    await this._ensureInitialized()
    return runHook(this.codecept.config.teardownAll, 'teardownAll')
  }

  async run() {
    await this._ensureInitialized()
    recorder.startUnlessRunning()
    event.dispatcher.emit(event.workers.before)
    store.workerMode = true
    process.env.RUNS_WITH_WORKERS = 'true'

    // Create workers and set up message handlers immediately (not in recorder queue)
    // This prevents a race condition where workers start sending messages before handlers are attached
    const workerThreads = []
    for (const worker of this.workers) {
      const workerThread = createWorker(worker, this.isPoolMode)
      this._listenWorkerEvents(workerThread)
      workerThreads.push(workerThread)
    }

    recorder.add('workers started', () => {
      // Workers are already running, this is just a placeholder step
    })

    return new Promise(resolve => {
      this.on('end', () => {
        resolve()
      })
    })
  }

  /**
   * @returns {Array<WorkerObject>}
   */
  getWorkers() {
    return this.workers
  }

  /**
   * @returns {Boolean}
   */
  isFailed() {
    return (Container.result().failures.length || this.errors.length) > 0
  }

  _listenWorkerEvents(worker) {
    // Track worker thread for pool mode
    if (this.isPoolMode) {
      this.activeWorkers.set(worker, { available: true, workerIndex: null })
    }

    // Track last activity time to detect hanging workers
    let lastActivity = Date.now()
    let currentTest = null
    let autoTerminated = false
    const workerTimeout = process.env.CODECEPT_WORKER_TIMEOUT ? ms(process.env.CODECEPT_WORKER_TIMEOUT) : ms('5m')
    
    const timeoutChecker = setInterval(() => {
      const elapsed = Date.now() - lastActivity
      if (elapsed > workerTimeout) {
        console.error(`[Main] Worker appears to be hanging (no activity for ${Math.floor(elapsed/1000)}s). Terminating...`)
        if (currentTest) {
          console.error(`[Main] Last test: ${currentTest}`)
        }
        clearInterval(timeoutChecker)
        worker.terminate()
      }
    }, 30000) // Check every 30 seconds

    worker.on('message', message => {
      lastActivity = Date.now() // Update activity timestamp
      
      // Track current test
      if (message.event === event.test.started && message.data) {
        currentTest = message.data.title || message.data.fullTitle
      }
      
      output.process(message.workerIndex)

      // Handle test requests for pool mode
      if (message.type === 'REQUEST_TEST') {
        if (this.isPoolMode) {
          const nextTest = this.getNextTest()
          if (nextTest) {
            worker.postMessage({ type: 'TEST_ASSIGNED', test: nextTest })
          } else {
            worker.postMessage({ type: 'NO_MORE_TESTS' })
          }
        }
        return
      }

      // deal with events that are not test cycle related
      if (!message.event) {
        return this.emit('message', message)
      }

      switch (message.event) {
        case event.all.result:
          // we ensure consistency of result by adding tests in the very end
          // Check if message.data.stats is valid before adding
          if (message.data.stats) {
            Container.result().addStats(message.data.stats)
          }

          if (message.data.failures) {
            Container.result().addFailures(message.data.failures)
          }

          if (message.data.tests) {
            message.data.tests.forEach(test => {
              Container.result().addTest(deserializeTest(test))
            })
          }

          const exitTimeout = parseInt(process.env.CODECEPT_AUTO_EXIT_TIMEOUT, 10)
          if (exitTimeout === 0) break
          setTimeout(() => {
            autoTerminated = true
            worker.terminate()
          }, exitTimeout || 2000)

          break
        case event.suite.before:
          {
            const suite = deserializeSuite(message.data)
            this.emit(event.suite.before, suite)
            event.dispatcher.emit(event.suite.before, suite)
          }
          break
        case event.suite.after:
          {
            const suite = deserializeSuite(message.data)
            this.emit(event.suite.after, suite)
            event.dispatcher.emit(event.suite.after, suite)
          }
          break
        case event.test.before:
          {
            const test = deserializeTest(message.data)
            this.emit(event.test.before, test)
            event.dispatcher.emit(event.test.before, test)
          }
          break
        case event.test.started:
          {
            const test = deserializeTest(message.data)
            this.emit(event.test.started, test)
            event.dispatcher.emit(event.test.started, test)
          }
          break
        case event.test.failed:
          // For hook failures, emit immediately as there won't be a test.finished event
          // Regular test failures are handled via test.finished to support retries
          if (message.data?.hookName) {
            this.emit(event.test.failed, deserializeTest(message.data))
          }
          // Otherwise skip - we'll emit based on finished state
          break
        case event.test.passed:
          // Skip individual passed events - we'll emit based on finished state
          break
        case event.test.skipped:
          {
            const test = deserializeTest(message.data)
            this.emit(event.test.skipped, test)
            event.dispatcher.emit(event.test.skipped, test)
          }
          break
        case event.test.finished:
          // Handle different types of test completion properly
          {
            const data = message.data
            const uid = data?.uid
            const isFailed = !!data?.err || data?.state === 'failed'

            if (uid) {
              // Track states for each test UID
              if (!this._testStates) this._testStates = new Map()

              if (!this._testStates.has(uid)) {
                this._testStates.set(uid, { states: [], lastData: data, workerIndex: message.workerIndex })
              }

              const testState = this._testStates.get(uid)
              testState.states.push({ isFailed, data })
              testState.lastData = data
            } else {
              // For tests without UID, emit immediately
              if (isFailed) {
                this.emit(event.test.failed, deserializeTest(data))
              } else {
                this.emit(event.test.passed, deserializeTest(data))
              }
            }

            const test = deserializeTest(data)
            this.emit(event.test.finished, test)
            event.dispatcher.emit(event.test.finished, test)
          }
          break
        case event.test.after:
          {
            const test = deserializeTest(message.data)
            this.emit(event.test.after, test)
            event.dispatcher.emit(event.test.after, test)
          }
          break
        case event.step.finished:
          this.emit(event.step.finished, message.data)
          event.dispatcher.emit(event.step.finished, message.data)
          break
        case event.step.started:
          this.emit(event.step.started, message.data)
          event.dispatcher.emit(event.step.started, message.data)
          break
        case event.step.passed:
          this.emit(event.step.passed, message.data)
          event.dispatcher.emit(event.step.passed, message.data)
          break
        case event.step.failed:
          this.emit(event.step.failed, message.data, message.data.error)
          event.dispatcher.emit(event.step.failed, message.data, message.data.error)
          break
        case event.hook.failed:
          // Hook failures are already reported as test failures by the worker
          // Just emit the hook.failed event for listeners
          this.emit(event.hook.failed, message.data)
          event.dispatcher.emit(event.hook.failed, message.data)
          break
        case event.hook.passed:
          this.emit(event.hook.passed, message.data)
          event.dispatcher.emit(event.hook.passed, message.data)
          break
        case event.hook.finished:
          this.emit(event.hook.finished, message.data)
          event.dispatcher.emit(event.hook.finished, message.data)
          break
      }
    })

    worker.on('error', err => {
      console.error(`[Main] Worker error:`, err.message || err)
      if (currentTest) {
        console.error(`[Main] Failed during test: ${currentTest}`)
      }
      this.errors.push(err)
    })

    worker.on('exit', (code) => {
      clearInterval(timeoutChecker)
      this.closedWorkers += 1

      if (code !== 0 && !autoTerminated) {
        console.error(`[Main] Worker exited with code ${code}`)
        if (currentTest) {
          console.error(`[Main] Last test running: ${currentTest}`)
        }
        // Mark as failed
        process.exitCode = 1
      }

      if (this.isPoolMode) {
        // Pool mode: finish when all workers have exited and no more tests
        if (this.closedWorkers === this.numberOfWorkers) {
          this._finishRun()
        }
      } else if (this.closedWorkers === this.numberOfWorkers) {
        // Regular mode: finish when all original workers have exited
        this._finishRun()
      }
    })
  }

  _finishRun() {
    event.dispatcher.emit(event.workers.after, { tests: this.workers.map(worker => worker.tests) })
    if (Container.result().hasFailed || this.errors.length > 0) {
      process.exitCode = 1
    } else {
      process.exitCode = 0
    }

    // Emit states for all tracked tests before emitting results
    if (this._testStates) {
      for (const [uid, { states, lastData, workerIndex }] of this._testStates) {
        // Set correct worker index for output
        output.process(workerIndex)

        // For tests with retries configured, emit all failures + final success
        // For tests without retries, emit only final state
        const lastState = states[states.length - 1]

        // Check if this test had retries by looking for failure followed by success
        const hasRetryPattern = states.length > 1 && states.some((s, i) => s.isFailed && i < states.length - 1 && !states[i + 1].isFailed)

        if (hasRetryPattern) {
          // Emit all intermediate failures and final success for retries
          for (const state of states) {
            if (state.isFailed) {
              this.emit(event.test.failed, deserializeTest(state.data))
            } else {
              this.emit(event.test.passed, deserializeTest(state.data))
            }
          }
        } else {
          // For non-retries (like step failures), emit only the final state
          if (lastState.isFailed) {
            this.emit(event.test.failed, deserializeTest(lastState.data))
          } else {
            this.emit(event.test.passed, deserializeTest(lastState.data))
          }
        }
      }
      this._testStates.clear()
    }

    this.emit(event.all.result, Container.result())
    event.dispatcher.emit(event.workers.result, Container.result())
    this.emit('end') // internal event
  }

  printResults() {
    const result = Container.result()
    result.finish()

    // Reset process for logs in main thread
    output.process(null)
    output.print()

    this.failuresLog = result.failures
      .filter(log => log.length && typeof log[1] === 'number')
      // mocha/lib/reporters/base.js
      .map(([format, num, title, message, stack], i) => [format, i + 1, title, message, stack])

    if (this.failuresLog.length) {
      output.print()
      output.print('-- FAILURES:')
      this.failuresLog.forEach(log => output.print(...log))
    }

    output.result(result.stats?.passes || 0, result.stats?.failures || 0, result.stats?.pending || 0, ms(result.duration), result.stats?.failedHooks || 0)

    process.env.RUNS_WITH_WORKERS = 'false'
  }
}

export default Workers
