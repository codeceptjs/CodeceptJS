'use strict';
let event = require('./event');
let container = require('./container');
let recorder = require('./recorder');
let getParamNames = require('./utils').getParamNames;

global.pause = require('./pause');

let scenario = (test) => {
  let testArguments = [];
  let testFn = test.fn;  
  if (!testFn) {
    return test;
  }
  let params = getParamNames(testFn) || [];
  let objects = container.support();
  for (var key in params) {
    let obj = params[key];
    // @todo rebuild support container per test
    if (!objects[obj]) {
      throw new Error(`Object of type ${obj} is not defined in container`);
    }
    testArguments.push(container.support(obj));
  }
  test.steps = [];
  test.fn = function(done) {    
    
    function errTest(err){
      event.dispatcher.emit(event.test.failed, test, err);
    }
   
    function finishTest(err) {
      event.dispatcher.emit(event.test.after, test);        
      done(err);
    }
   
    recorder.start(errTest, finishTest);
    try {      
      event.dispatcher.emit(event.test.before, test);
      let res = testFn.apply(test, testArguments);
    
      if (isGenerator(testFn)) {
        res.next(); // running test 
        recorder.catch(); // catching possible errors in promises
        let resumeTest = function() {
          recorder.add(function(data) {              
            recorder.reset(); // creating a new promise chain
            try {              
              let resume = res.next(data);              
              resume.done ? recorder.finalize() : resumeTest();
            } catch (err) {
              recorder.throw(err);
            }
          });
        };        
        resumeTest();
      } 
    } catch (err) {
      recorder.throw(err);
    } finally {
      if (!isGenerator(testFn)) {
        recorder.finalize();        
      }
    }
  }
  return test;
}



function isGenerator(fn) {
  return fn.constructor.name == 'GeneratorFunction';
}

module.exports = scenario;