'use strict';
let subs = require('../utils').template;

/**
 * Assertion errors, can provide a detailed error messages.
 *
 * inspect() and cliMessage() added to display errors with params.
 */
function AssertionFailedError(params, template) {
  this.params = params;
  this.template = template;
  // this.message = "AssertionFailedError";
  let stack = new Error().stack;
  // this.showDiff = true;
  stack = stack.split("\n").filter((line) => {
    // @todo cut assert things nicer
    return line.indexOf('lib/assert') < 0;
  });
  this.stack = stack.join("\n");
  this.showDiff = true;

  this.actual = this.params.actual;
  this.expected = this.params.expected;

  this.inspect = () => {
    let params = this.params || {};
    let msg = params.customMessage || '';
    return msg + subs(this.template, params);
  };

  this.cliMessage = () => {
    return this.inspect();
  };
}

AssertionFailedError.prototype = Object.create(Error.prototype);

module.exports = AssertionFailedError;
