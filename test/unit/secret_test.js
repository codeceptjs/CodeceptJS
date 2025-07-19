let expect
import('chai').then(chai => {
  expect = chai.expect
})
const secretModule = require('../../lib/secret')
const Secret = secretModule.default || secretModule

describe('Secret tests', () => {
  it('should be the Secret instance', () => {
    const string = Secret.secret('hello')
    expect(string).to.be.instanceOf(Secret)
  })

  it('should be the Secret instance when using as object', () => {
    const obj = Secret.secret({ password: 'world' }, 'password')
    expect(obj.password).to.be.instanceOf(Secret)
  })

  it('should mask the field when provided', () => {
    const obj = Secret.secret({ password: 'world' }, 'password')
    expect(obj.password.getMasked()).to.equal('*****')
  })
})
