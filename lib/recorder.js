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

    // ensure that the page is loaded and the code has been injected by nightmare
    var wait = function(){

      return new Promise(function(resolve) {

        // when the flag is set to true we can run the test
        if(global.nightmagePageIsReady){

          resolve();

        }
        else {

          // Check for the page to be loaded for n number of times.
          var checkTimes = 50;

          // poll every n ms to see if page has loaded
          var check = setInterval(() => {

            // the page is now ready
            if(global.nightmagePageIsReady){
              resolve();
              clearInterval(check);
            }

            checkTimes--;
            // If check times is below 0 then throw an error as the page is unable to load
            if(checkTimes < 0){
              clearInterval(check);
              throw new Error("Codecept failed to inject codecept.js");
            }

          }, 100);

        }

      });

    };

    return promise = promise.then(wait).then(fn);
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

