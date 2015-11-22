'use strict';

let promise, oldpromise;
let running = false;
let finishFn, errFn;
let next;

module.exports = {
  start(err, finish) {
    finishFn = finish;
    errFn = err;
    running = true;
    this.reset();       
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
 
  
  reset() {
    if (promise) this.catch();
    promise = Promise.resolve();
  },
   
  add(fn) {
    if (!running) {
      return promise = Promise.resolve().then(fn).then(() => promise);
    } 
    return promise = promise.then(fn);
  },
  
  addStep(step, args) {
    this.add(() => step.run.apply(step, args));
  },
  
  catch() {
    return promise = promise.catch((err) => {
      errFn(err);
      finishFn(err);
      this.stop();
    })
  },
  
  finalize() {
    if (!running) return;
    this.catch();
    this.add(() => { if (running) finishFn(); });
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