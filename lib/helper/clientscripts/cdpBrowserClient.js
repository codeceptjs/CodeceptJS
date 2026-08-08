export default function installCodeceptClient() {
  if (window.__codecept) return
  const strategies = {
    css: (value, root) => Array.from((root || document).querySelectorAll(value)),
    xpath: (value, root) => {
      const out = []
      const res = document.evaluate(value, root || document.body || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      for (let i = 0; i < res.snapshotLength; i++) out.push(res.snapshotItem(i))
      return out
    },
  }
  const find = (candidates, root) => {
    for (const c of candidates) {
      let els = []
      try {
        els = strategies[c.type](c.value, root)
      } catch (e) {
        els = []
      }
      if (els.length) return els
    }
    return []
  }
  const SKIP_TEXT_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1 }
  const BLOCK_TEXT_TAGS = { DIV: 1, P: 1, BR: 1, LI: 1, TR: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, SECTION: 1, ARTICLE: 1, UL: 1, OL: 1, TABLE: 1, FORM: 1 }
  const visibleText = root => {
    const out = []
    const walk = node => {
      if (node.nodeType === 3) {
        out.push(node.nodeValue)
        return
      }
      if (node.nodeType !== 1 || SKIP_TEXT_TAGS[node.tagName]) return
      const style = getComputedStyle(node)
      if (style.display === 'none' || style.visibility === 'hidden') return
      for (const child of node.childNodes) walk(child)
      if (BLOCK_TEXT_TAGS[node.tagName]) out.push('\n')
    }
    walk(root || document.body)
    return out.join('')
  }
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }))
  const isEditable = el => el.isContentEditable === true || el.getAttribute('contenteditable') === 'true'
  const getVal = el => (isEditable(el) ? el.textContent : el.value)
  const setVal = (el, v) => {
    if (isEditable(el)) el.textContent = v
    else el.value = v
  }
  const actions = {
    count: els => els.length,
    texts: els => els.map(el => el.innerText !== undefined ? String(el.innerText) : String(el.textContent)),
    values: els => els.map(el => String(getVal(el))),
    attrs: (els, p) => els.map(el => el.getAttribute(p.name)),
    html: els => els.map(el => el.outerHTML),
    innerHtml: els => els.map(el => el.innerHTML),
    attrsMap: (els, p) => els.map(el => {
      const out = {}
      for (const attr of p.attrs) out[attr] = el[attr] || el.getAttribute(attr)
      return out
    }),
    cssProps: (els, p) => els.map(el => {
      const cs = getComputedStyle(el)
      const o = {}
      for (const k of p.props) o[k] = cs[k]
      return o
    }),
    dblclick: els => {
      els[0].dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }))
      return true
    },
    rightclick: els => {
      els[0].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }))
      return true
    },
    focus: els => {
      els[0].focus()
      return true
    },
    blur: els => {
      els[0].blur()
      return true
    },
    rect: els => {
      if (els[0].scrollIntoView) els[0].scrollIntoView({ block: 'center', inline: 'center' })
      const r = els[0].getBoundingClientRect()
      return { x: r.x, y: r.y, width: r.width, height: r.height }
    },
    click: els => {
      els[0].click()
      return true
    },
    fill: (els, p) => {
      const el = els[0]
      if (el.focus) el.focus()
      setVal(el, p.value)
      fire(el, 'input')
      fire(el, 'change')
      return true
    },
    append: (els, p) => {
      const el = els[0]
      setVal(el, String(getVal(el) || '') + p.value)
      fire(el, 'input')
      fire(el, 'change')
      return true
    },
    clear: els => {
      const el = els[0]
      setVal(el, '')
      fire(el, 'input')
      fire(el, 'change')
      return true
    },
    check: els => {
      const el = els[0]
      if (!el.checked) el.click()
      if (!el.checked) {
        el.checked = true
        fire(el, 'change')
      }
      return el.checked === true
    },
    uncheck: els => {
      const el = els[0]
      if (el.checked) el.click()
      if (el.checked) {
        el.checked = false
        fire(el, 'change')
      }
      return el.checked === false
    },
    select: (els, p) => {
      const el = els[0]
      const values = Array.isArray(p.value) ? p.value : [p.value]
      const matches = (val, text) => values.includes(val) || values.includes(text)

      if (el.tagName === 'SELECT') {
        const opts = Array.from(el.options || [])
        let found = false
        if (el.multiple || el.hasAttribute('multiple')) {
          opts.forEach(o => {
            const match = matches(o.value, o.textContent.trim())
            o.selected = match
            if (match) found = true
          })
        } else {
          const opt = opts.find(o => matches(o.value, o.textContent.trim()))
          if (opt) {
            el.value = opt.value
            found = true
          }
        }
        if (!found) return false
        opts.forEach(o => (o.selected ? o.setAttribute('selected', 'selected') : o.removeAttribute('selected')))
        fire(el, 'input')
        fire(el, 'change')
        return true
      }

      // ARIA combobox/listbox widgets: click the trigger (if any) to reveal the
      // listbox, then click each matching [role="option"].
      let container = el
      if (el.getAttribute && el.getAttribute('role') === 'combobox') {
        el.click()
        container = (el.parentElement && el.parentElement.querySelector('[role="listbox"]')) || el.parentElement
      }
      if (!container) return false
      const options = Array.from(container.querySelectorAll('[role="option"]'))
      let found = false
      values.forEach(v => {
        const opt = options.find(o => (o.dataset && o.dataset.value === v) || o.textContent.trim() === v)
        if (opt) {
          opt.click()
          found = true
        }
      })
      return found
    },
    checked: els => els[0].checked === true,
    visibleCount: els => els.filter(el => {
      const r = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }).length,
  }
  window.__codecept = {
    run(candidates, action, payload, within, selection) {
      let root
      if (within) {
        const withinEls = find(within, document)
        if (!withinEls.length) return { found: 0, withinMissing: true }
        root = withinEls[0]
      }
      let els = candidates === null ? [root] : find(candidates, root)
      if (selection && els.length > 1) {
        if (selection.index != null) {
          const idx = selection.index > 0 ? selection.index - 1 : els.length + selection.index
          if (idx < 0 || idx >= els.length) return { found: els.length, outOfBounds: true, requestedIndex: selection.index }
          els = [els[idx]]
        } else if (selection.strict) {
          return { found: els.length, strictViolation: true }
        }
      }
      if (!els.length && action !== 'count' && action !== 'visibleCount') return { found: 0 }
      return { found: els.length, result: actions[action](els, payload || {}) }
    },
    visibleText,
  }
}
