import { readFileSync } from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
let cached

export default function xpathPolyfillSource() {
  if (cached) return cached
  const engine = readFileSync(require.resolve('xpath/xpath.js'), 'utf8')
  cached = `(function(){
  if (window.__codeceptXPathPolyfill) return
  window.__codeceptXPathPolyfill = true
  var module = { exports: {} }
  var exports = module.exports
  ${engine}
  var parse = module.exports.parse
  document.evaluate = function(expr, ctx, resolver, type, res) {
    var nodes = parse(expr).select({ node: ctx || document, isHtml: true })
    var i = 0
    return {
      resultType: type,
      snapshotLength: nodes.length,
      snapshotItem: function(idx) { return idx < nodes.length ? nodes[idx] : null },
      iterateNext: function() { return i < nodes.length ? nodes[i++] : null },
      singleNodeValue: nodes.length ? nodes[0] : null,
      booleanValue: nodes.length > 0,
    }
  }
})()`
  return cached
}
