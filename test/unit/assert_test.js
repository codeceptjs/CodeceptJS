const { expect } = require('chai');

const Assertion = require('../../lib/assert');
const AssertionError = require('../../lib/assert/error');

const comparator = (a, b) => a === b;

let assertion;

describe('Assertion', () => {
  beforeEach(() => {
    assertion = new Assertion(comparator);
  });

  it('should handle asserts', () => {
    assertion.assert(1, 1);
    expect(() => assertion.assert(1, 2)).to.throw(AssertionError);
  });

  it('should handle negative asserts', () => {
    assertion.negate(1, 2);
    expect(() => assertion.negate(1, 1)).to.throw(AssertionError);
  });
});
