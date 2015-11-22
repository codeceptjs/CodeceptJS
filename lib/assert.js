'use strict';

let output = require('./output');
let AssertionFailedError = require('./assert/error');
let subs = require('./utils').template;

class Assertion {

  constructor(comparator, params) {
    this.comparator = comparator;
    this.params = params || {};
  }

  assert() {
    this.addAssertParams.apply(this, arguments);
    let result = this.comparator.apply(this.params, arguments);
    if (result) return; // should increase global assetion counter
    throw this.getFailedAssertion();
  }

  negate() {
    this.addAssertParams.apply(this, arguments);
    let result = this.comparator.apply(this.params, arguments);
    if (!result) return; // should increase global assetion counter    
    throw this.getFailedNegation();
  }
  
  addAssertParams() {}
  
  getException() {
    return new AssertionFailedError(this.params, '');
  }
  
  getFailedNegation() {
    let err = this.getException();
    err.params.type = 'not ' + err.params.type;
    return err;
  }
  
  getFailedAssertion() {
    return this.getException();
  }
  
}

module.exports = Assertion;