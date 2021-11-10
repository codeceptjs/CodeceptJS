const debug = require('debug')('codeceptjs:recorder');
const promiseRetry = require('promise-retry');

const { log } = require('./output');

const MAX_TASKS = 100;

let promise;
let running = false;
let errFn;
let queueId = 0;
let sessionId = null;
let asyncErr = null;

let tasks = [];
let oldPromises = [];

const defaultRetryOptions = {
  retries: 0,
  minTimeout: 150,
  maxTimeout: 10000,
};

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
    running = true;
    asyncErr = null;
    errFn = null;
    this.reset();
  },

  /**
   * @return {boolean}
   * @inner
   */
  isRunning() {
    return running;
  },

  /**
   * @return {void}
   * @inner
   */
  startUnlessRunning() {
    if (!this.isRunning()) {
      this.start();
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
    errFn = fn;
  },

  /**
   * Stops current promise chain, calls `catch`.
   * Resets recorder to initial state.
   *
   * @api
   * @inner
   */
  reset() {
    if (promise && running) this.catch();
    queueId++;
    sessionId = null;
    asyncErr = null;
    log(`${currentQueue()} Starting recording promises`);
    promise = Promise.resolve();
    oldPromises = [];
    tasks = [];
    this.session.running = false;
    this.retries = [];
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
      debug(`${currentQueue()}Starting <${name}> session`);
      tasks.push('--->');
      oldPromises.push(promise);
      this.running = true;
      sessionId = name;
      promise = Promise.resolve();
    },

    /**
     * @param {string} name
     * @inner
     */
    restore(name) {
      tasks.push('<---');
      debug(`${currentQueue()}Finalize <${name}> session`);
      this.running = false;
      sessionId = null;
      this.catch(errFn);
      promise = promise.then(() => oldPromises.pop());
    },

    /**
     * @param {function} fn
     * @inner
     */
    catch(fn) {
      promise = promise.catch(fn);
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
   * @return {Promise<*> | undefined}
   * @inner
   */
  add(taskName, fn = undefined, force = false, retry = undefined, timeout = undefined) {
    if (typeof taskName === 'function') {
      fn = taskName;
      taskName = fn.toString();
      if (retry === undefined) retry = false;
    }
    if (retry === undefined) retry = true;
    if (!running && !force) {
      return;
    }
    tasks.push(taskName);
    if (process.env.DEBUG) debug(`${currentQueue()}Queued | ${taskName}`);

    return promise = Promise.resolve(promise).then((res) => {
      const retryOpts = this.retries.slice(-1).pop();
      // no retries or unnamed tasks
      if (!retryOpts || !taskName || !retry) {
        const [promise, timer] = getTimeoutPromise(timeout, taskName);
        return Promise.race([promise, Promise.resolve(res).then(fn)]).finally(() => clearTimeout(timer));
      }

      const retryRules = this.retries.slice().reverse();
      return promiseRetry(Object.assign(defaultRetryOptions, retryOpts), (retry, number) => {
        if (number > 1) log(`${currentQueue()}Retrying... Attempt #${number}`);
        const [promise, timer] = getTimeoutPromise(timeout, taskName);
        return Promise.race([promise, Promise.resolve(res).then(fn)]).finally(() => clearTimeout(timer)).catch((err) => {
          for (const retryObj of retryRules) {
            if (!retryObj.when) return retry(err);
            if (retryObj.when && retryObj.when(err)) return retry(err);
          }
          throw err;
        });
      });
    });
  },

  /**
   * @param {*} opts
   * @return {*}
   * @inner
   */
  retry(opts) {
    if (!promise) return;

    if (opts === null) {
      opts = {};
    }
    if (Number.isInteger(opts)) {
      opts = { retries: opts };
    }
    return this.add(() => this.retries.push(opts));
  },

  /**
   * @param {function} [customErrFn]
   * @return {Promise<*>}
   * @inner
   */
  catch(customErrFn) {
    return promise = promise.catch((err) => {
      log(`${currentQueue()}Error | ${err}`);
      if (!(err instanceof Error)) { // strange things may happen
        err = new Error(`[Wrapped Error] ${JSON.stringify(err)}`); // we should be prepared for them
      }
      if (customErrFn) {
        customErrFn(err);
      } else if (errFn) {
        errFn(err);
      }
      this.stop();
    });
  },

  /**
   * @param {function} customErrFn
   * @return {Promise<*>}
   * @inner
   */
  catchWithoutStop(customErrFn) {
    return promise = promise.catch((err) => {
      log(`${currentQueue()}Error | ${err}`);
      if (!(err instanceof Error)) { // strange things may happen
        err = new Error(`[Wrapped Error] ${JSON.stringify(err)}`); // we should be prepared for them
      }
      if (customErrFn) {
        customErrFn(err);
      } else if (errFn) {
        errFn(err);
      }
    });
  },

  /**
   * Adds a promise which throws an error into a chain
   *
   * @api
   * @param {*} err
   * @inner
   */
  throw(err) {
    return this.add(`throw error ${err}`, () => {
      throw err;
    });
  },

  /**
   * @param {*} err
   * @inner
   */
  saveFirstAsyncError(err) {
    if (asyncErr === null) {
      asyncErr = err;
    }
  },

  /**
   * @return {*}
   * @inner
   */
  getAsyncErr() {
    return asyncErr;
  },

  /**
   * @return {void}
   * @inner
   */
  cleanAsyncErr() {
    asyncErr = null;
  },

  /**
   * Stops recording promises
   * @api
   * @inner
   */
  stop() {
    if (process.env.DEBUG) debug(this.toString());
    log(`${currentQueue()}Stopping recording promises`);
    running = false;
  },

  /**
   * Get latest promise in chain.
   *
   * @api
   * @return {Promise<*>}
   * @inner
   */
  promise() {
    return promise;
  },

  /**
   * Get a list of all chained tasks
   * @return {string}
   * @inner
   */
  scheduled() {
    return tasks.slice(-MAX_TASKS).join('\n');
  },

  /**
   * Get the queue id
   * @return {number}
   * @inner
   */
  getQueueId() {
    return queueId;
  },

  /**
   * Get a state of current queue and tasks
   * @return {string}
   * @inner
   */
  toString() {
    return `Queue: ${currentQueue()}\n\nTasks: ${this.scheduled()}`;
  },

};

function getTimeoutPromise(timeoutMs, taskName) {
  let timer;
  if (timeoutMs) debug(`Timing out in ${timeoutMs}ms`);
  return [new Promise((done, reject) => {
    timer = setTimeout(() => { reject(new Error(`Action ${taskName} was interrupted on step timeout ${timeoutMs}ms`)); }, timeoutMs || 2e9);
  }), timer];
}

function currentQueue() {
  let session = '';
  if (sessionId) session = `<${sessionId}> `;
  return `[${queueId}] ${session}`;
}
