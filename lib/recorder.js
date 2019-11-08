const promiseRetry = require('promise-retry');
const log = require('./output').log;
const debug = require('debug')('codeceptjs');

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
   */
  start() {
    running = true;
    asyncErr = null;
    errFn = null;
    this.reset();
  },

  /** @return {boolean} */
  isRunning() {
    return running;
  },

  /** @return {void} */
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
   */
  errHandler(fn) {
    errFn = fn;
  },

  /**
   * Stops current promise chain, calls `catch`.
   * Resets recorder to initial state.
   *
   * @api
   */
  reset() {
    if (promise && running) this.catch();
    queueId++;
    sessionId = null;
    asyncErr = null;
    log(`${currentQueue()}Starting recording promises`);
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

    /** @param {string} name */
    start(name) {
      log(`${currentQueue()}Starting <${name}> session`);
      tasks.push('--->');
      oldPromises.push(promise);
      this.running = true;
      sessionId = name;
      promise = Promise.resolve();
    },

    /** @param {string} name */
    restore(name) {
      tasks.push('<---');
      log(`${currentQueue()}Finalize <${name}> session`);
      this.running = false;
      sessionId = null;
      this.catch(errFn);
      promise = promise.then(() => oldPromises.pop());
    },

    /** @param {function} fn */
    catch(fn) {
      promise = promise.catch(fn);
    },

  },

  /**
   * Adds a promise to a chain.
   * Promise description should be passed as first parameter.
   *
   * @param {string} taskName
   * @param {function} [fn]
   * @param {boolean} [force=false]
   * @param {boolean} [retry=true] -
   *     true: it will retries if `retryOpts` set.
   *     false: ignore `retryOpts` and won't retry.
   * @return {Promise<*> | undefined}
   */
  add(taskName, fn = undefined, force = false, retry = true) {
    if (typeof taskName === 'function') {
      fn = taskName;
      taskName = fn.toString();
    }
    if (!running && !force) {
      return;
    }
    tasks.push(taskName);
    debug(`${currentQueue()}Queued | ${taskName}`);


    return promise = Promise.resolve(promise).then((res) => {
      const retryOpts = this.retries.slice(-1).pop();
      // no retries or unnamed tasks
      if (!retryOpts || !taskName || !retry) {
        return Promise.resolve(res).then(fn);
      }

      return promiseRetry(Object.assign(defaultRetryOptions, retryOpts), (retry, number) => {
        if (number > 1) log(`${currentQueue()}Retrying... Attempt #${number}`);

        const retryRules = this.retries.reverse();

        return Promise.resolve(res).then(fn).catch((err) => {
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
   */
  throw(err) {
    return this.add(`throw error ${err}`, () => {
      throw err;
    });
  },

  /** @param {*} err */
  saveFirstAsyncError(err) {
    if (asyncErr === null) {
      asyncErr = err;
    }
  },

  /** @return {*} */
  getAsyncErr() {
    return asyncErr;
  },

  /** @return {void} */
  cleanAsyncErr() {
    asyncErr = null;
  },

  /**
   * Stops recording promises
   * @api
   */
  stop() {
    debug(this.toString());
    log(`${currentQueue()}Stopping recording promises`);
    const err = new Error();
    running = false;
  },

  /**
   * Get latest promise in chain.
   *
   * @api
   * @return {Promise<*>}
   */
  promise() {
    return promise;
  },

  /**
   * Get a list of all chained tasks
   * @return {string}
   */
  scheduled() {
    return tasks.join('\n');
  },

  /**
   * Get a state of current queue and tasks
   * @return {string}
   */
  toString() {
    return `Queue: ${currentQueue()}\n\nTasks: ${this.scheduled()}`;
  },

};

function currentQueue() {
  let session = '';
  if (sessionId) session = `<${sessionId}> `;
  return `[${queueId}] ${session}`;
}
