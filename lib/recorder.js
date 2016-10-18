'use strict';

let promise, oldpromise;
let running = false;
let errFn;
let next;
let queueId = 0;
let sessionId = null;

let log = require('./output').log;
let tasks = [];

/**
 * Singlton object to record all test steps as promises and run them in chain.
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
    oldpromise = null;
    tasks = [];
    this.session.running = false;
  },

  session: {
    running: false,

    start(name) {
      log(currentQueue() + `Starting <${name}> session`);
      tasks.push('--->');
      oldpromise = promise;
      this.running = true;
      sessionId = name;
      promise = Promise.resolve();
    },

    restore() {
      tasks.push('<---');
      log(currentQueue() + `Starting <${this.name}> session`);
      this.running = false;
      sessionId = null;
      promise = promise.then(() => oldpromise);
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

  addStep(step, args) {
    step.status = 'queued';
    let task = `${step.name}: ${Object.keys(args).map(key => args[key]).join(', ')}`;
    this.add(task, () => step.run.apply(step, args));
  },

  catch(customErrFn) {
    return promise = promise.catch((err) => {
      log(currentQueue() + `Error | ${err}`);
      if (!(err instanceof Error)) { // strange things may happen
        err = new Error('[Wrapped Error] '+err.toString()); // we should be prepared for them
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
    return this.add('throw error ' + err,function () {
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

