'use strict';
let Assertion = require('../assert');
let AssertionFailedError = require('./error');
let template = require('../utils').template;
let output = require('../output');

class TruthAssertion extends Assertion {

  constructor(params) {
    super(function (value) {
      if (Array.isArray(value)) {
        return value.filter((val) => !!val).length > 0;
      }
      return !!value;
    }, params);
    this.params.type = this.params.type || 'to be true';
  }

  getException() {
    let err = new AssertionFailedError(this.params, "{{customMessage}}expected {{subject}} {{type}}");
    err.cliMessage = () => {
      let msg = err.template
        .replace('{{subject}}', output.colors.bold('{{subject}}'));
      return template(msg, this.params);
    };
    return err;
  }

  addAssertParams() {
    this.params.value = this.params.actual = arguments[0];
    this.params.expected = true;
    this.params.customMessage = arguments[1] ? arguments[1] + "\n\n" : '';
  }
}

module.exports = {
  Assertion: TruthAssertion,
  truth: (subject, type) => {
    return new TruthAssertion({subject, type});
  }
};
