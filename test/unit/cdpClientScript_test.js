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

  it('run() returns numeric result for count and visibleCount on zero matches', () => {
    const sandbox = {
      window: {},
      document: { querySelectorAll: () => [] },
      getComputedStyle: () => ({}),
      Array,
      String,
      Event: class {},
    }
    const fn = new Function('window', 'document', 'getComputedStyle', 'Event', `(${installCodeceptClient.toString()})()`)
    fn(sandbox.window, sandbox.document, sandbox.getComputedStyle, sandbox.Event)
    const count = sandbox.window.__codecept.run([{ type: 'css', value: '#nope' }], 'count')
    const visible = sandbox.window.__codecept.run([{ type: 'css', value: '#nope' }], 'visibleCount')
    expect(count).to.deep.equal({ found: 0, result: 0 })
    expect(visible).to.deep.equal({ found: 0, result: 0 })
  })
})
