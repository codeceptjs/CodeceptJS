import { expect } from 'chai'
import installCodeceptClient from '../../lib/helper/clientscripts/cdpBrowserClient.js'
import xpathPolyfillSource from '../../lib/helper/clientscripts/xpathPolyfill.js'

describe('cdpBrowserClient', () => {
  it('is injectable as a stringified IIFE', () => {
    const src = `(${installCodeceptClient.toString()})()`
    expect(src).to.include('window.__codecept')
    expect(() => new Function(src)).to.not.throw()
  })

  it('xpath polyfill source is self-contained and parseable', () => {
    const src = xpathPolyfillSource()
    expect(src).to.include('isHtml: true')
    expect(src).to.include('document.evaluate =')
    expect(() => new Function(src)).to.not.throw()
    expect(xpathPolyfillSource()).to.equal(src)
  })
})
