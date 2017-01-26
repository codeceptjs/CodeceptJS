'use strict';

let promise, oldPromise;
let running = false;
let errFn;
let next;
let queueId = 0;
let sessionId = null;

let log = require('./output').log;
let tasks = [];

/**
 * Singleton object to record all test steps as promises and run them in chain.
 */
module.exports = {

  start() {
    running = true;
    errFn = null;
    this.reset();
  },

  errHandler(fn) {
    errFn = fn;
  },

  reset() {
    if (promise && running) this.catch();
    queueId++;
    sessionId = null;
    log(currentQueue() + `Starting recording promises`);
    promise = Promise.resolve();
    oldPromise = null;
    tasks = [];
    this.session.running = false;
  },

  session: {
    running: false,

    start(name) {
      log(currentQueue() + `Starting <${name}> session`);
      tasks.push('--->');
      oldPromise = promise;
      this.running = true;
      sessionId = name;
      promise = Promise.resolve();
    },

    restore() {
      tasks.push('<---');
      log(currentQueue() + `Starting <${this.name}> session`);
      this.running = false;
      sessionId = null;
      promise = promise.then(() => oldPromise);
    },

    catch(errFn) {
      promise = promise.catch(errFn);
    }

  },

  add(taskName, fn, force) {
    if (typeof taskName === "function") {
      fn = taskName;
      taskName = fn.toString();
    }
    if (!running && !force) {
      return;
    }
    tasks.push(taskName);
    log(currentQueue() + `Queued | ${taskName}`);
    return promise = promise.then(fn);
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

  throw(err) {
    return this.add('throw error ' + err, function () {
      throw err;
    });
  },

  stop() {
    log(currentQueue() + `Stopping recording promises`);
    var err = new Error();
    running = false;
  },

  promise() {
    return promise;
  },

  scheduled() {
    return tasks.join("\n");
  },

  toString() {
    return `Queue: ${currentQueue()}\n\nTasks: ${this.scheduled()}`;
  }

};

function currentQueue() {
  let session = '';
  if (sessionId) session = `<${sessionId}> `;
  return `[${queueId}] ${session}`;
}

