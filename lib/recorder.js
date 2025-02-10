const debug = require('debug')('codeceptjs:recorder')
const promiseRetry = require('promise-retry')
const chalk = require('chalk')
const { printObjectProperties } = require('./utils')
const { log } = require('./output')
const { TimeoutError } = require('./timeout')
const MAX_TASKS = 100

let promise
let running = false
let errFn
let queueId = 0
let sessionId = null
let asyncErr = null
let ignoredErrs = []

let tasks = []
let oldPromises = []

const defaultRetryOptions = {
  retries: 0,
  minTimeout: 150,
  maxTimeout: 10000,
}

/**
 * Singleton object to record all test steps as promises and run them in chain.
 * @alias recorder
 * @interface
 */
module.exports = {
  /**
   * @type {Array<Object<string, *>>}
   * @inner
   */
  retries: [],

  /**
   * Start recording promises
   *
   * @api
   * @inner
   */
  start() {
    debug('Starting recording promises')
    running = true
    asyncErr = null
    errFn = null
    this.reset()
  },

  /**
   * @return {boolean}
   * @inner
   */
  isRunning() {
    return running
  },

  /**
   * @return {void}
   * @inner
   */
  startUnlessRunning() {
    if (!this.isRunning()) {
      this.start()
    }
  },

  /**
   * Add error handler to catch rejected promises
   *
   * @api
   * @param {function} fn
   * @inner
   */
  errHandler(fn) {
    errFn = fn
  },

  /**
   * Stops current promise chain, calls `catch`.
   * Resets recorder to initial state.
   *
   * @api
   * @inner
   */
  reset() {
    if (promise && running) this.catch()
    queueId++
    sessionId = null
    asyncErr = null
    log(`${currentQueue()} Starting recording promises`)
    promise = Promise.resolve()
    oldPromises = []
    tasks = []
    ignoredErrs = []
    this.session.running = false
    // reset this retries makes the retryFailedStep plugin won't work if there is Before/BeforeSuit block due to retries is undefined on Scenario
    // this.retries = [];
  },

  /**
   * @name CodeceptJS.recorder~session
   * @type {CodeceptJS.RecorderSession}
   * @inner
   */

  /**
   * @alias RecorderSession
   * @interface
   */
  session: {
    /**
     * @type {boolean}
     * @inner
     */
    running: false,

    /**
     * @param {string} name
     * @inner
     */
    start(name) {
      if (sessionId) {
        debug(`${currentQueue()}Session already started as ${sessionId}`)
        this.restore(sessionId)
      }
      debug(`${currentQueue()}Starting <${name}> session`)
      tasks.push('--->')
      oldPromises.push(promise)
      this.running = true
      sessionId = name
      promise = Promise.resolve()
    },

    /**
     * @param {string} [name]
     * @inner
     */
    restore(name) {
      tasks.push('<---')
      debug(`${currentQueue()}Finalize <${name}> session`)
      this.running = false
      sessionId = null
      this.catch(errFn)
      promise = promise.then(() => oldPromises.pop())
    },

    /**
     * @param {function} fn
     * @inner
     */
    catch(fn) {
      promise = promise.catch(fn)
    },
  },

  /**
   * Adds a promise to a chain.
   * Promise description should be passed as first parameter.
   *
   * @param {string|function} taskName
   * @param {function} [fn]
   * @param {boolean} [force=false]
   * @param {boolean} [retry]
   *     undefined: `add(fn)` -> `false` and `add('step',fn)` -> `true`
   *     true: it will retries if `retryOpts` set.
   *     false: ignore `retryOpts` and won't retry.
   * @param {number} [timeout]
   * @return {Promise<*>}
   * @inner
   */
  add(taskName, fn = undefined, force = false, retry = undefined, timeout = undefined) {
    if (typeof taskName === 'function') {
      fn = taskName
      taskName = fn.toString()
      if (retry === undefined) retry = false
    }
    if (retry === undefined) retry = true
    if (!running && !force) {
      return Promise.resolve()
    }
    tasks.push(taskName)
    debug(chalk.gray(`${currentQueue()} Queued | ${taskName}`))

    return (promise = Promise.resolve(promise).then(res => {
      // prefer options for non-conditional retries
      const retryOpts = this.retries
        .sort((r1, r2) => r1.when && !r2.when)
        .slice(-1)
        .pop()
      // no retries or unnamed tasks
      debug(`${currentQueue()} Running | ${taskName} | Timeout: ${timeout || 'None'}`)
      if (retryOpts) debug(`${currentQueue()} Retry opts`, JSON.stringify(retryOpts))

      if (!retryOpts || !taskName || !retry) {
        const [promise, timer] = getTimeoutPromise(timeout, taskName)
        return Promise.race([promise, Promise.resolve(res).then(fn)]).finally(() => clearTimeout(timer))
      }

      const retryRules = this.retries.slice().reverse()
      return promiseRetry(Object.assign(defaultRetryOptions, retryOpts), (retry, number) => {
        if (number > 1) log(`${currentQueue()}Retrying... Attempt #${number}`)
        const [promise, timer] = getTimeoutPromise(timeout, taskName)
        return Promise.race([promise, Promise.resolve(res).then(fn)])
          .finally(() => clearTimeout(timer))
          .catch(err => {
            if (ignoredErrs.includes(err)) return
            for (const retryObj of retryRules) {
              if (!retryObj.when) return retry(err)
              if (retryObj.when && retryObj.when(err)) return retry(err)
            }
            throw err
          })
      })
    }))
  },

  /**
   * @param {*} opts
   * @return {*}
   * @inner
   */
  retry(opts) {
    if (!promise) return

    if (opts === null) {
      opts = {}
    }
    if (Number.isInteger(opts)) {
      opts = { retries: opts }
    }
    return this.add(() => this.retries.push(opts))
  },

  /**
   * @param {function} [customErrFn]
   * @return {Promise<*>}
   * @inner
   */
  catch(customErrFn) {
    const fnDescription = customErrFn
      ?.toString()
      ?.replace(/\s{2,}/g, ' ')
      .replace(/\n/g, ' ')
      ?.slice(0, 50)
    debug(chalk.gray(`${currentQueue()} Queued | catch with error handler ${fnDescription || ''}`))
    return (promise = promise.catch(err => {
      log(`${currentQueue()}Error | ${err} ${fnDescription}...`)
      if (!(err instanceof Error)) {
        // strange things may happen
        err = new Error(`[Wrapped Error] ${printObjectProperties(err)}`) // we should be prepared for them
      }
      if (customErrFn) {
        customErrFn(err)
      } else if (errFn) {
        errFn(err)
      }
      this.stop()
    }))
  },

  /**
   * @param {function} customErrFn
   * @return {Promise<*>}
   * @inner
   */
  catchWithoutStop(customErrFn) {
    const fnDescription = customErrFn
      ?.toString()
      ?.replace(/\s{2,}/g, ' ')
      .replace(/\n/g, ' ')
      ?.slice(0, 50)
    return (promise = promise.catch(err => {
      if (ignoredErrs.includes(err)) return // already caught
      log(`${currentQueue()} Error (Non-Terminated) | ${err} | ${fnDescription || ''}...`)
      if (!(err instanceof Error)) {
        // strange things may happen
        err = new Error(`[Wrapped Error] ${JSON.stringify(err)}`) // we should be prepared for them
      }
      if (customErrFn) {
        return customErrFn(err)
      }
    }))
  },

  /**
   * Adds a promise which throws an error into a chain
   *
   * @api
   * @param {*} err
   * @inner
   */

  throw(err) {
    if (ignoredErrs.includes(err)) return promise // already caught
    return this.add(`throw error: ${err.message}`, () => {
      if (ignoredErrs.includes(err)) return // already caught
      throw err
    })
  },

  ignoreErr(err) {
    ignoredErrs.push(err)
  },

  /**
   * @param {*} err
   * @inner
   */
  saveFirstAsyncError(err) {
    if (asyncErr === null) {
      asyncErr = err
    }
  },

  /**
   * @return {*}
   * @inner
   */
  getAsyncErr() {
    return asyncErr
  },

  /**
   * @return {void}
   * @inner
   */
  cleanAsyncErr() {
    asyncErr = null
  },

  /**
   * Stops recording promises
   * @api
   * @inner
   */
  stop() {
    debug(this.toString())
    log(`${currentQueue()} Stopping recording promises`)
    running = false
  },

  /**
   * Get latest promise in chain.
   *
   * @api
   * @return {Promise<*>}
   * @inner
   */
  promise() {
    return promise
  },

  /**
   * Get a list of all chained tasks
   * @return {string}
   * @inner
   */
  scheduled() {
    return tasks.slice(-MAX_TASKS).join('\n')
  },

  /**
   * Get the queue id
   * @return {number}
   * @inner
   */
  getQueueId() {
    return queueId
  },

  /**
   * Get a state of current queue and tasks
   * @return {string}
   * @inner
   */
  toString() {
    return `Queue: ${currentQueue()}\n\nTasks: ${this.scheduled()}`
  },
}

function getTimeoutPromise(timeoutMs, taskName) {
  let timer
  if (timeoutMs) debug(`Timing out in ${timeoutMs}ms`)
  return [
    new Promise((done, reject) => {
      timer = setTimeout(() => {
        reject(new TimeoutError(`Action ${taskName} was interrupted on timeout ${timeoutMs}ms`))
      }, timeoutMs || 2e9)
    }),
    timer,
  ]
}

function currentQueue() {
  let session = ''
  if (sessionId) session = `<${sessionId}> `
  return `[${queueId}] ${session}`
}
