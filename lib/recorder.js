'use strict';

let promise, oldpromise;
let running = false;
let errFn;
let next;

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
    log('Starting recording promises');
    promise = Promise.resolve();
    tasks = [];
    this.session.running = false;
    this.session.name = null;
  },

  session: {
    running: false,
    name: null,

    start(name) {
      log(`Starting <${name}> session`);
      tasks.push('--->');
      oldpromise = promise;
      this.running = true;
      this.name = name;
      promise = Promise.resolve();
    },

    restore() {
      tasks.push('<---');
      log(`Starting <${this.name}> session`);
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
    log('Queued | ' + taskName);
    return promise = promise.then(fn);
  },

  addStep(step, args) {
    step.status = 'queued';
    let task = `${step.name}: ${Object.keys(args).map(key => args[key]).join(', ')}`;
    this.add(task, () => step.run.apply(step, args));
  },

  catch() {
    return promise = promise.catch((err) => {
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
    log('Stopping recording promises');
    running = false;
  },

  promise() {
    return promise;
  },

  toString() {
    return tasks.join("\n");
  }
};
