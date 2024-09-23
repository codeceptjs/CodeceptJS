import Assertion from '../assert.js';
import AssertionFailedError from './error.js';
import { template } from '../utils.js';
import * as output from '../output.js';

class EqualityAssertion extends Assertion {
  constructor(params) {
    const comparator = function (a, b) {
      if (b.length === 0) {
        b = '';
      }
      return a === b;
    };
    super(comparator, params);
    this.params.type = 'to equal';
  }

  getException() {
    const params = this.params;
    params.jar = template(params.jar, params);
    const err = new AssertionFailedError(params, '{{customMessage}}expected {{jar}} "{{expected}}" {{type}} "{{actual}}"');
    err.showDiff = false;
    if (typeof err.cliMessage === 'function') {
      err.message = err.cliMessage();
    }
    err.cliMessage = () => {
      const msg = err.template
        .replace('{{jar}}', output.colors.bold('{{jar}}'));
      return template(msg, this.params);
    };
    return err;
  }

  addAssertParams() {
    this.params.expected = arguments[0];
    this.params.actual = arguments[1];
    this.params.customMessage = arguments[2] ? `${arguments[2]}\n\n` : '';
  }
}

export function fileEquals(file) {
  return new EqualityAssertion({ file, jar: 'contents of {{file}}' });
}

export { EqualityAssertion as Assertion };
export function equals(jar) {
  return new EqualityAssertion({ jar });
}

export function urlEquals(baseUrl) {
  const assert = new EqualityAssertion({ jar: 'url of current page' });
  assert.comparator = function (expected, actual) {
    if (expected.indexOf('http') !== 0) {
      actual = actual.slice(actual.indexOf(baseUrl) + baseUrl.length);
    }
    return actual === expected;
  };
  return assert;
}
