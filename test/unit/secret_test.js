const expect = require('expect');
const Secret = require('../../lib/secret');

describe('Secret tests', () => {
  it('should be the Secret instance', () => {
    const string = Secret.secret('hello');
    expect(string).toBeInstanceOf(Secret);
  });

  it('should be the Secret instance when using as object', () => {
    const obj = Secret.secret({ password: 'world' }, 'password');
    expect(obj.password).toBeInstanceOf(Secret);
  });

  it('should mask the field when provided', () => {
    const obj = Secret.secret({ password: 'world' }, 'password');
    expect(obj.password.getMasked()).toBe('*****');
  });
});
