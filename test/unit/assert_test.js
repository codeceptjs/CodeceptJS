const chai = require('chai');

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
    chai.expect(() => assertion.assert(1, 2)).to.throw(AssertionError);
  });

  it('should handle negative asserts', () => {
    assertion.negate(1, 2);
    chai.expect(() => assertion.negate(1, 1)).to.throw(AssertionError);
  });
});
