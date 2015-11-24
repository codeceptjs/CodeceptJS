'use strict';

let promise, oldpromise;
let running = false;
let finishFn, errFn;
let next;

/**
 * Singlton object to record all test steps as promises and run them in chain. 
 */
module.exports = {
  start() {
    running = true;
    finishFn = errFn = null;    
    this.reset();       
  },
  
  errHandler(fn) {
    errFn = fn;
  },
  
  finishHandler(fn) {
    finishFn = fn;
  },
  
  reset() {
    if (promise) this.catch();
    promise = Promise.resolve();
  },  
  
  session: {
    start(errFn) {
      oldpromise = promise;
      promise = Promise.resolve();
    },
    
    restore() {
      promise = promise.then(() => oldpromise);    
    },
    
    catch(errFn) {
      promise = promise.catch(errFn);
    }

  },
     
  add(fn, force) {
    if (!running && !force) {
      return;
    } 
    return promise = promise.then(fn);
  },
  
  addStep(step, args) {
    this.add(() => step.run.apply(step, args));
  },
  
  catch() {
    return promise = promise.catch((err) => {
      if (errFn) errFn(err);
      if (finishFn) finishFn(err);
      this.stop();
    })
  },
  
  finalize() {
    if (!running) return;
    this.catch();
    if (finishFn) this.add(() => { if (running) finishFn(); });
    this.add(() => this.stop());
  },
     
  throw(err) {
    return this.add(function() {
      throw err;
    });
  },
  
  stop() {
    running = false;   
  },
  
  promise
}