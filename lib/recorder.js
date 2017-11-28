'use strict';

let promise;
let running = false;
let errFn;
let next;
let queueId = 0;
let sessionId = null;
let asyncErr = null;
let log = require('./output').log;
let tasks = [];

let oldPromises = [];

/**
 * Singleton object to record all test steps as promises and run them in chain.
 */
module.exports = {

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

  isRunning() {
    return running;
  },

  startUnlessRunning() {
    if (!this.isRunning()) {
      this.start();
    }
  },

  /**
   * Add error handler to catch rejected promises
   *
   * @api
   * @param {*} fn
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
    log(currentQueue() + `Starting recording promises`);
    promise = Promise.resolve();
    oldPromises = [];
    tasks = [];
    this.session.running = false;
  },

  session: {
    running: false,

    start(name) {
      log(currentQueue() + `Starting <${name}> session`);
      tasks.push('--->');
      oldPromises.push(promise);
      this.running = true;
      sessionId = name;
      promise = Promise.resolve();
    },

    restore(name) {
      tasks.push('<---');
      log(currentQueue() + `Finalize <${name}> session`);
      this.running = false;
      sessionId = null;
      promise = promise.then(() => oldPromises.pop());
    },

    catch(errFn) {
      promise = promise.catch(errFn);
    }

  },

  /**
   * Adds a promise to a chain.
   * Promise description should be passed as first parameter.
   *
   * @param {*} taskName
   * @param {*} fn
   * @param {*} force
   */
  add(taskName, fn = undefined, force = false) {
    if (typeof taskName === "function") {
      fn = taskName;
      taskName = fn.toString();
    }
    if (!running && !force) {
      return;
    }
    tasks.push(taskName);
    log(currentQueue() + `Queued | ${taskName}`);
    // ensure a valid promise is always in chain
    return promise = Promise.resolve(promise).then(fn);
  },

  catch(customErrFn) {
    return promise = promise.catch((err) => {
      log(currentQueue() + `Error | ${err}`);
      if (!(err instanceof Error)) { // strange things may happen
        err = new Error('[Wrapped Error] ' + JSON.stringify(err)); // we should be prepared for them
      }
      if (customErrFn) {
        customErrFn(err);
      } else if (errFn) {
        errFn(err);
      }
      this.stop();
    });
  },

  catchWithoutStop(customErrFn) {
    return promise = promise.catch((err) => {
      log(currentQueue() + `Error | ${err}`);
      if (!(err instanceof Error)) { // strange things may happen
        err = new Error('[Wrapped Error] ' + JSON.stringify(err)); // we should be prepared for them
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
    return this.add('throw error ' + err, function () {
      throw err;
    });
  },

  saveFirstAsyncError(err) {
    if (asyncErr === null) {
      asyncErr = err;
    }
  },

  getAsyncErr() {
    return asyncErr;
  },

  cleanAsyncErr() {
    asyncErr = null;
  },

  /**
   * Stops recording promises
   * @api
   */
  stop() {
    log(currentQueue() + `Stopping recording promises`);
    var err = new Error();
    running = false;
  },

  /**
   * Get latest promise in chain.
   *
   * @api
   */
  promise() {
    return promise;
  },

  /**
   * Get a list of all chained tasks
   */
  scheduled() {
    return tasks.join("\n");
  },

  /**
   * Get a state of current queue and tasks
   */
  toString() {
    return `Queue: ${currentQueue()}\n\nTasks: ${this.scheduled()}`;
  }

};

function currentQueue() {
  let session = '';
  if (sessionId) session = `<${sessionId}> `;
  return `[${queueId}] ${session}`;
}
