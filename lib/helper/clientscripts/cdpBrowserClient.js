export default function installCodeceptClient() {
  if (window.__codecept) return
  const strategies = {
    css: value => Array.from(document.querySelectorAll(value)),
    xpath: value => {
      const out = []
      const res = document.evaluate(value, document.body || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      for (let i = 0; i < res.snapshotLength; i++) out.push(res.snapshotItem(i))
      return out
    },
  }
  const find = candidates => {
    for (const c of candidates) {
      let els = []
      try {
        els = strategies[c.type](c.value)
      } catch (e) {
        els = []
      }
      if (els.length) return els
    }
    return []
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
        if (el.multiple) {
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
    run(candidates, action, payload) {
      const els = find(candidates)
      if (!els.length && action !== 'count' && action !== 'visibleCount') return { found: 0 }
      return { found: els.length, result: actions[action](els, payload || {}) }
    },
  }
}
