const expect = require('expect');

const { Assertion } = require('../../../lib/assert/equal');
const AssertionError = require('../../../lib/assert/error');

let equal;

describe('equal assertion', () => {
  beforeEach(() => {
    equal = new Assertion({ jar: 'contents of webpage' });
  });

  it('should check for equality', () => {
    equal.assert('hello', 'hello');
    expect(() => equal.negate('hello', 'hello')).toThrow(AssertionError);
  });

  it('should check for something not to be equal', () => {
    equal.negate('hello', 'hi');
    expect(() => equal.assert('hello', 'hi')).toThrow(AssertionError);
  });

  it('should provide nice assert error message', () => {
    equal.params.expected = 'hello';
    equal.params.actual = 'hi';
    const err = equal.getFailedAssertion();
    expect(err.inspect()).toEqual('expected contents of webpage "hello" to equal "hi"');
  });

  it('should provide nice negate error message', () => {
    equal.params.expected = 'hello';
    equal.params.actual = 'hello';
    const err = equal.getFailedNegation();
    expect(err.inspect()).toEqual('expected contents of webpage "hello" not to equal "hello"');
  });
});
