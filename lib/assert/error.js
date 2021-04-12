const subs = require('../utils').template;

/**
 * Assertion errors, can provide a detailed error messages.
 *
 * inspect() and cliMessage() added to display errors with params.
 */
function AssertionFailedError(params, template) {
  this.params = params;
  this.template = template;
  // this.message = "AssertionFailedError";
  // this.showDiff = true;

  // @todo cut assert things nicer
  this.showDiff = true;

  this.actual = this.params.actual;
  this.expected = this.params.expected;

  this.inspect = () => {
    const params = this.params || {};
    const msg = params.customMessage || '';
    return msg + subs(this.template, params);
  };

  this.cliMessage = () => this.inspect();
}

AssertionFailedError.prototype = Object.create(Error.prototype);
AssertionFailedError.constructor = AssertionFailedError;

module.exports = AssertionFailedError;
