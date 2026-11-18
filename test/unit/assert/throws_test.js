import { expect } from 'chai'

import errorThrown from '../../../lib/assert/throws.js'

class CustomError extends Error {}

describe('errorThrown', () => {
  it('should accept the expected error class', () => {
    expect(errorThrown(new Error('boom'), new Error())).to.equal(null)
  })

  it('should accept a subclass of the expected error class', () => {
    expect(errorThrown(new CustomError('boom'), new Error())).to.equal(null)
  })

  it('should reject a different error class', () => {
    expect(() => errorThrown(new Error('boom'), new TypeError())).to.throw('Expected TypeError error to be thrown')
  })

  it('should compare messages', () => {
    expect(errorThrown(new Error('boom'), /boom/)).to.equal(null)
    expect(() => errorThrown(new Error('boom'), /bang/)).to.throw('matching /bang/')
  })
})
