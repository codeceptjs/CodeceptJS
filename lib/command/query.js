import fs from 'fs'
import * as parse5 from 'parse5'
import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom'
import xpath from 'xpath'
import Locator from '../locator.js'
import { xpathLocator } from '../utils.js'

export default async function query(locator, context, options = {}) {
  const html = options.file ? fs.readFileSync(options.file, 'utf8') : await readStdin()

  if (!html || !html.trim()) {
    console.error('codeceptq: no HTML input. Pipe HTML via stdin or use --file <path>.')
    process.exitCode = 2
    return
  }

  let xpathExpr
  let contextExpr = null
  try {
    xpathExpr = buildXPath(locator, options)
    if (context) contextExpr = buildXPath(context, {})
  } catch (err) {
    console.error(`codeceptq: cannot build XPath: ${err.message}`)
    process.exitCode = 2
    return
  }

  const { doc, source } = htmlToDoc(html)

  let nodes
  try {
    if (contextExpr) {
      const ctxNodes = toArray(xpath.select(contextExpr, doc))
      const seen = new Set()
      nodes = []
      for (const ctx of ctxNodes) {
        for (const m of toArray(xpath.select(xpathExpr, ctx))) {
          if (!seen.has(m)) {
            seen.add(m)
            nodes.push(m)
          }
        }
      }
    } else {
      nodes = toArray(xpath.select(xpathExpr, doc))
    }
  } catch (err) {
    console.error(`codeceptq: XPath evaluation failed for "${xpathExpr}": ${err.message}`)
    process.exitCode = 2
    return
  }

  const limit = parseInt(options.limit, 10) || 20
  const snippetLen = parseInt(options.snippet, 10) || 500
  const truncated = nodes.slice(0, limit)
  const where = options.file || 'stdin'

  if (options.json) {
    process.stdout.write(
      JSON.stringify(
        {
          locator,
          context: context || null,
          xpath: xpathExpr,
          contextXPath: contextExpr,
          source: where,
          total: nodes.length,
          shown: truncated.length,
          matches: truncated.map(n => ({
            line: n.__line ?? null,
            snippet: renderSnippet(n, source, snippetLen, options.full),
          })),
        },
        null,
        2,
      ) + '\n',
    )
  } else {
    if (nodes.length === 0) {
      console.log(`No matches for ${quote(locator)}${context ? ` within ${quote(context)}` : ''} in ${where}`)
      console.log(`(xpath: ${xpathExpr})`)
    } else {
      const noun = nodes.length === 1 ? 'match' : 'matches'
      const more = nodes.length > truncated.length ? ` (showing first ${truncated.length})` : ''
      console.log(`${nodes.length} ${noun} for ${quote(locator)}${context ? ` within ${quote(context)}` : ''} in ${where}${more}`)
      console.log()
      truncated.forEach((node, i) => {
        const line = node.__line ?? '?'
        console.log(`${i + 1}. Line ${line}`)
        const snippet = renderSnippet(node, source, snippetLen, options.full)
        snippet.split('\n').forEach(l => console.log('   ' + l))
        console.log()
      })
    }
  }

  if (nodes.length === 0) process.exitCode = 1
}

function buildXPath(input, options) {
  const literal = xpathLocator.literal(input)
  if (options.field) return Locator.field.byText(literal)
  if (options.click || options.clickable) return Locator.clickable.wide(literal)
  if (options.checkable) return Locator.checkable.byText(literal)
  if (options.select) {
    return Locator.select.byVisibleText(literal).replace(/\.\/(option|optgroup)/g, './/$1')
  }

  if (options.xpath) return new Locator({ xpath: input }).toXPath()
  if (options.css) return new Locator({ css: input }).toXPath()

  const loc = new Locator(input)
  if (loc.type === 'fuzzy') {
    return xpathLocator.combine([Locator.clickable.wide(literal), Locator.field.byText(literal)])
  }
  return loc.toXPath()
}

function htmlToDoc(html) {
  const p5doc = parse5.parse(html, { sourceCodeLocationInfo: true })
  const impl = new DOMImplementation()
  const doc = impl.createDocument(null, null, null)
  walkParse5(p5doc, doc, doc)
  return { doc, source: html }
}

function walkParse5(p5node, xmlParent, xmlDoc) {
  for (const child of p5node.childNodes || []) {
    const name = child.nodeName
    if (name === '#text') {
      if (child.value != null) {
        const t = xmlDoc.createTextNode(child.value)
        if (child.sourceCodeLocation) t.__line = child.sourceCodeLocation.startLine
        xmlParent.appendChild(t)
      }
    } else if (name === '#comment') {
      try {
        xmlParent.appendChild(xmlDoc.createComment(child.data || ''))
      } catch {
        // ignore comments xmldom rejects
      }
    } else if (name === '#documentType') {
      // skip doctype
    } else {
      const tagName = child.tagName || name
      let el
      try {
        el = xmlDoc.createElement(tagName)
      } catch {
        continue
      }
      for (const attr of child.attrs || []) {
        try {
          el.setAttribute(attr.name, attr.value)
        } catch {
          // ignore attrs xmldom rejects (namespaces, invalid names)
        }
      }
      const loc = child.sourceCodeLocation
      if (loc) {
        el.__line = loc.startLine
        el.__startOffset = loc.startOffset
        el.__endOffset = loc.endOffset
        el.__startTagEndOffset = loc.startTag ? loc.startTag.endOffset : loc.endOffset
      }
      xmlParent.appendChild(el)
      walkParse5(child, el, xmlDoc)
    }
  }
}

function renderSnippet(node, source, snippetLen, full) {
  if (typeof node.__startOffset !== 'number') {
    try {
      return new XMLSerializer().serializeToString(node)
    } catch {
      return `<${node.nodeName || '?'}>`
    }
  }
  const start = node.__startOffset
  const end = node.__endOffset ?? start
  if (full) return source.slice(start, end)

  const tagEnd = node.__startTagEndOffset ?? end
  const openingTag = source.slice(start, tagEnd)
  if (end <= tagEnd) return openingTag

  const totalLen = end - start
  if (totalLen <= snippetLen) return source.slice(start, end)

  const remaining = Math.max(0, snippetLen - openingTag.length)
  if (remaining < 20) return openingTag + ' …'
  return openingTag + source.slice(tagEnd, tagEnd + remaining) + ' …'
}

function readStdin() {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      resolve('')
      return
    }
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

function toArray(v) {
  if (Array.isArray(v)) return v
  if (v == null || v === '' || typeof v === 'boolean' || typeof v === 'number') return []
  return [v]
}

function quote(s) {
  return `'${String(s).replace(/'/g, "\\'")}'`
}
