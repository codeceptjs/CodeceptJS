const Assertion = require('../assert');
const AssertionFailedError = require('./error');
const template = require('../utils').template;
const output = require('../output');

class TruthAssertion extends Assertion {
  constructor(params) {
    super((value) => {
      if (Array.isArray(value)) {
        return value.filter(val => !!val).length > 0;
      }
      return !!value;
    }, params);
    this.params.type = this.params.type || 'to be true';
  }

  getException() {
    const err = new AssertionFailedError(this.params, '{{customMessage}}expected {{subject}} {{type}}');
    err.cliMessage = () => {
      const msg = err.template
        .replace('{{subject}}', output.colors.bold('{{subject}}'));
      return template(msg, this.params);
    };
    return err;
  }

  addAssertParams() {
    this.params.value = this.params.actual = arguments[0];
    this.params.expected = true;
    this.params.customMessage = arguments[1] ? `${arguments[1]}\n\n` : '';
  }
}

module.exports = {
  Assertion: TruthAssertion,
  truth: (subject, type) => new TruthAssertion({ subject, type }),
};
