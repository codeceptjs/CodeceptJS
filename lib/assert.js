'use strict';

let output = require('./output');
let AssertionFailedError = require('./assert/error');
let subs = require('./utils').template;

/**
 * Abstract assertion class introduced for more verbose and customizable messages.
 *
 * Should be easy to extend and use in custom helper classes.
 *
 * Both positive and negative assertions can be used with `assert` and `negate`.
 *
 * Should be used as:
 *
 * ```js
 * let comparator = (a, b) => a === b;
 * let assertion = new Assertion(compare);
 * assertion.assert(1,1);
 * assertion.negate(1,2);
 * ```
 *
 * Additional parameters can be passed to constructor or to assert/negate methods
 * to get more customizable exception messages.
 *
 */
class Assertion {

  constructor(comparator, params) {
    this.comparator = comparator;
    this.params = params || {};
    this.params.customMessage = '';
  }

  /**
   * Performs positive assertion.
   * Fails if comparator function with provided arguments returns false
   */
  assert() {
    this.addAssertParams.apply(this, arguments);
    let result = this.comparator.apply(this.params, arguments);
    if (result) return; // should increase global assetion counter
    throw this.getFailedAssertion();
  }

  /**
   * Performs negative assertion.
   * Fails if comparator function with provided arguments returns true
   */
  negate() {
    this.addAssertParams.apply(this, arguments);
    let result = this.comparator.apply(this.params, arguments);
    if (!result) return; // should increase global assetion counter
    throw this.getFailedNegation();
  }

  /**
   * Used to save additional parameters passed to assert/negate
   */
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
