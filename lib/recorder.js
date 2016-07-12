'use strict';

let promise, oldpromise;
let running = false;
let errFn;
let next;
let queueId = 0;

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
    log(`[${queueId}] Starting recording promises`);
    promise = Promise.resolve();
    oldpromise = null;
    tasks = [];
    this.session.running = false;
    this.session.name = null;
  },

  session: {
    running: false,
    name: null,

    start(name) {
      log(`[${queueId}] Starting <${name}> session`);
      tasks.push('--->');
      oldpromise = promise;
      this.running = true;
      this.name = name;
      promise = Promise.resolve();
    },

    restore() {
      tasks.push('<---');
      log(`[${queueId}] Starting <${this.name}> session`);
      this.running = false;
      this.name = null;
      promise = promise.then(() => oldpromise);
    },

    catch(errFn) {
      promise = promise.catch(errFn);
    }

  },

  add(taskName, fn, force) {
    if (!running && !force) {
      return;
    }
    tasks.push(taskName);
    log(`[${queueId}] Queued | ${taskName}`);
    return promise = promise.then(fn);
  },

  addStep(step, args) {
    step.status = 'queued';
    let task = `${step.name}: ${Object.keys(args).map(key => args[key]).join(', ')}`;
    this.add(task, () => step.run.apply(step, args));
  },

  catch() {
    return promise = promise.catch((err) => {
      log(`[${queueId}] Error | ${err}`);1
      if (errFn) errFn(err);
      this.stop();
    });
  },

  throw(err) {
    return this.add('throw error ' + err,function () {
      throw err;
    });
  },

  stop() {
    log(`[${queueId}] Stopping recording promises`);
    var err = new Error();
    running = false;
  },

  promise() {
    return promise;
  },

  toString() {
    return tasks.join("\n");
  }
};
