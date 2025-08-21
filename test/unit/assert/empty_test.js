import chai from 'chai'
const { expect } = chai

import { Assertion, empty } from '../../../lib/assert/empty.js'
import AssertionError from '../../../lib/assert/error.js'

let emptyAssertion

describe('empty assertion', () => {
  beforeEach(() => {
    emptyAssertion = new Assertion({ subject: 'web page' })
  })

  it('should check for something to be empty', () => {
    emptyAssertion.assert(null)
    expect(() => emptyAssertion.negate(null)).to.throw(AssertionError)
  })

  it('should check for something not to be empty', () => {
    emptyAssertion.negate('something')
    expect(() => emptyAssertion.assert('something')).to.throw(AssertionError)
  })

  it('should provide nice assert error message', () => {
    emptyAssertion.params.value = '/nothing'
    const err = emptyAssertion.getFailedAssertion()
    expect(err.inspect()).to.equal("expected web page '/nothing' to be empty")
  })

  it('should provide nice negate error message', () => {
    empty.params.value = '/nothing'
    const err = empty.getFailedNegation()
    expect(err.inspect()).to.equal("expected web page '/nothing' not to be empty")
  })
})
