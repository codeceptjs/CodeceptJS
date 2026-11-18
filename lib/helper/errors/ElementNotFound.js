import Locator from '../../locator.js'
import { searchWithFusejs } from '../../utils.js'

class ElementNotFound extends Error {
  constructor(locator, prefixMessage = 'Element', postfixMessage = 'was not found by text|CSS|XPath') {
    let locatorStr
    if (typeof locator === 'object') {
      locatorStr = JSON.stringify(locator)
    } else {
      locatorStr = new Locator(locator).toString()
    }
    super(`${prefixMessage} "${locatorStr}" ${postfixMessage}`)
    this.locator = locator
    Object.defineProperty(this, '_query', { value: this.query() })
    Object.defineProperty(this, '_explained', { value: this.collect().then(info => this.addHints(info)).catch(() => {}) })
  }

  query() {
    const loc = new Locator(this.locator)
    const query = { css: null, xpath: null, token: null, wanted: null }
    if (typeof loc.value !== 'string') return query
    if (loc.isCSS()) {
      query.css = loc.value
      const token = loc.value.match(/^([#.])([\w-]+)$/)
      if (token) query.token = { prefix: token[1], name: token[2] }
    }
    if (loc.isXPath()) {
      query.xpath = loc.value
      const quoted = loc.value.match(/'([^']+)'|"([^"]+)"/)
      if (quoted) query.wanted = quoted[1] || quoted[2]
    }
    if (loc.isFuzzy()) query.wanted = loc.value
    if (loc.isRole() && typeof loc.locator.name === 'string') query.wanted = loc.locator.name
    if (loc.isRole() && typeof loc.locator.text === 'string') query.wanted = loc.locator.text
    return query
  }

  async collect() {
    if (!this._query.css && !this._query.xpath && !this._query.wanted) return null
    let timer
    try {
      const { default: Container } = await import('../../container.js')
      const helper = Object.values(Container.helpers()).find(h => h && typeof h.executeScript === 'function')
      if (!helper) return null
      const timeout = new Promise(resolve => {
        timer = setTimeout(() => resolve(null), 500)
      })
      return await Promise.race([helper.executeScript(collectOnPage, this._query), timeout])
    } catch (err) {
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  explain() {
    return this._explained
  }

  addHints(info) {
    const hints = this.hints(info)
    if (!hints.length) return
    const original = this.message
    const stack = this.stack
    this.message = [original, ...hints.map(hint => `  ${hint}`)].join('\n')
    this.stack = stack.replace(original, this.message)
  }

  hints(info) {
    const hints = []
    if (!info) return hints

    const frame = info.frames.find(f => f.count > 0)
    if (frame) hints.push(`found ${plural(frame.count, 'match', 'matches')} inside iframe ${frame.selector}, use within({ frame: '${frame.selector}' })`)

    if (info.count && info.hidden === info.count) hints.push(`${plural(info.count, 'element matches', 'elements match')} but hidden`)
    if (info.count && info.hidden < info.count) hints.push(`${plural(info.count, 'element matches', 'elements match')} on the page: check the within() context or the element type`)

    const wanted = this._query.wanted
    if (wanted && info.names.length) {
      const found = similarTo(info.names, wanted, item => item.name)
      const similar = [...new Set(found.map(item => `${item.role} "${item.name}"`))].slice(0, 3)
      if (similar.length) hints.push(`similar on page: ${similar.join(', ')}`)
    }

    const token = this._query.token
    if (token && info.tokens.length) {
      const found = similarTo(info.tokens, token.name, item => item)
      const similar = found.slice(0, 3).map(item => token.prefix + item)
      if (similar.length) hints.push(`similar on page: ${similar.join(', ')}`)
    }

    return hints
  }
}

function similarTo(items, wanted, textOf) {
  const keys = []
  if (typeof items[0] === 'object') keys.push('name')
  const found = searchWithFusejs(items, wanted, { keys, threshold: 0.45, ignoreLocation: true, includeScore: true })
  const distance = r => Math.abs(textOf(r.item).length - wanted.length)
  found.sort((a, b) => a.score - b.score || distance(a) - distance(b))
  return found.map(r => r.item).filter(item => textOf(item) !== wanted)
}

function plural(count, one, many) {
  if (count === 1) return `1 ${one}`
  return `${count} ${many}`
}

function collectOnPage(first, second) {
  let query = first
  if (second) query = second

  const find = doc => {
    const found = []
    try {
      if (query.css) found.push(...doc.querySelectorAll(query.css))
      if (query.xpath) {
        const result = doc.evaluate(query.xpath, doc, null, 7, null)
        for (let i = 0; i < result.snapshotLength; i++) found.push(result.snapshotItem(i))
      }
    } catch (err) {
      return []
    }
    return found
  }

  const roleOf = el => {
    const tag = el.tagName.toLowerCase()
    const type = (el.getAttribute('type') || '').toLowerCase()
    if (el.getAttribute('role')) return el.getAttribute('role')
    if (tag === 'a') return 'link'
    if (tag === 'button') return 'button'
    if (tag === 'select') return 'combobox'
    if (tag === 'textarea') return 'textbox'
    if (tag !== 'input' || type === 'hidden') return null
    if (['submit', 'button', 'reset', 'image'].includes(type)) return 'button'
    if (type === 'checkbox' || type === 'radio') return type
    return 'textbox'
  }

  const nameOf = el => {
    let name = el.getAttribute('aria-label')
    if (!name && el.labels && el.labels.length) name = el.labels[0].textContent
    if (!name && el.tagName.toLowerCase() !== 'input') name = el.textContent
    if (!name) name = el.value || el.getAttribute('placeholder') || el.getAttribute('title')
    if (!name) return ''
    return name.replace(/\s+/g, ' ').trim().slice(0, 80)
  }

  const matches = find(document)
  const info = {
    count: matches.length,
    hidden: matches.filter(el => !el.getClientRects().length).length,
    frames: [],
    names: [],
    tokens: [],
  }

  if (query.css || query.xpath) {
    for (const frame of document.querySelectorAll('iframe, frame')) {
      let doc = null
      try {
        doc = frame.contentDocument
      } catch (err) {
        doc = null
      }
      if (!doc) continue
      let selector = `iframe[src="${frame.getAttribute('src')}"]`
      if (frame.id) selector = `#${frame.id}`
      if (frame.name) selector = `[name="${frame.name}"]`
      info.frames.push({ selector, count: find(doc).length })
    }
  }

  if (query.token) {
    const tokens = new Set()
    for (const el of document.querySelectorAll('[id], [class]')) {
      if (query.token.prefix === '#' && el.id) tokens.add(el.id)
      if (query.token.prefix === '.') el.classList.forEach(name => tokens.add(name))
    }
    info.tokens = [...tokens]
  }

  if (query.wanted) {
    const seen = new Set()
    for (const el of document.querySelectorAll('a, button, input, select, textarea, [role]')) {
      const role = roleOf(el)
      const name = nameOf(el)
      if (!role || !name || seen.has(role + name)) continue
      seen.add(role + name)
      info.names.push({ role, name })
      if (info.names.length >= 500) break
    }
  }

  return info
}

export default ElementNotFound
