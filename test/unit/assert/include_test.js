const { expect } = require('chai');

const Assertion = require('../../../lib/assert/include').Assertion;
const AssertionError = require('../../../lib/assert/error');

let equal;

describe('equal assertion', () => {
  beforeEach(() => {
    equal = new Assertion({ jar: 'contents of webpage' });
  });

  it('should check for inclusion', () => {
    equal.assert('h', 'hello');
    expect(() => equal.negate('h', 'hello')).to.throw(AssertionError);
  });

  it('should check !include', () => {
    equal.negate('x', 'hello');
    expect(() => equal.assert('x', 'hello')).to.throw(AssertionError);
  });

  it('should provide nice assert error message', () => {
    equal.params.needle = 'hello';
    equal.params.haystack = 'x';
    const err = equal.getFailedAssertion();
    expect(err.inspect()).to.equal('expected contents of webpage to include "hello"');
  });

  it('should provide nice negate error message', () => {
    equal.params.needle = 'hello';
    equal.params.haystack = 'h';
    const err = equal.getFailedNegation();
    expect(err.inspect()).to.equal('expected contents of webpage not to include "hello"');
  });
});
