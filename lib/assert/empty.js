import Assertion from '../assert.js';
import AssertionFailedError from './error.js';
import { template } from '../utils.js';
import * as output from '../output.js';

class EmptinessAssertion extends Assertion {
  constructor(params) {
    super((value) => {
      if (Array.isArray(value)) {
        return value.length === 0;
      }
      return !value;
    }, params);
    this.params.type = 'to be empty';
  }

  getException() {
    if (Array.isArray(this.params.value)) {
      this.params.value = `[${this.params.value.join(', ')}]`;
    }

    const err = new AssertionFailedError(this.params, "{{customMessage}}expected {{subject}} '{{value}}' {{type}}");

    err.cliMessage = () => {
      const msg = err.template
        .replace('{{value}}', output.colors.bold('{{value}}'))
        .replace('{{subject}}', output.colors.bold('{{subject}}'));
      return template(msg, this.params);
    };
    return err;
  }

  addAssertParams() {
    this.params.value = this.params.actual = arguments[0];
    this.params.expected = [];
    this.params.customMessage = arguments[1] ? `${arguments[1]}\n\n` : '';
  }
}

export { EmptinessAssertion as Assertion };

export function empty(subject) {
  return new EmptinessAssertion({ subject });
}
