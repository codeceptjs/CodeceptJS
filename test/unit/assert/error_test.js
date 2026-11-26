import { expect } from 'chai'

import AssertionFailedError from '../../../lib/assert/error.js'

describe('AssertionFailedError', () => {
  it('should print a custom message once when the template includes it', () => {
    const err = new AssertionFailedError({ subject: 'web page', customMessage: 'Order never reached paid\n\n' }, '{{customMessage}}expected {{subject}} to include "Paid"')
    expect(err.inspect()).to.equal('Order never reached paid\n\nexpected web page to include "Paid"')
  })

  it('should put a custom message first when the template does not include it', () => {
    const err = new AssertionFailedError({ customMessage: 'Scrolled to the end and element was not found' }, '')
    expect(err.inspect()).to.equal('Scrolled to the end and element was not found')
  })
})
