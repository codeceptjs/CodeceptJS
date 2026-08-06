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
  const actions = {
    count: els => els.length,
    texts: els => els.map(el => el.innerText !== undefined ? String(el.innerText) : String(el.textContent)),
    values: els => els.map(el => String(el.value)),
    attrs: (els, p) => els.map(el => el.getAttribute(p.name)),
    html: els => els.map(el => el.outerHTML),
    rect: els => {
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
      el.value = p.value
      fire(el, 'input')
      fire(el, 'change')
      return true
    },
    append: (els, p) => {
      const el = els[0]
      el.value = String(el.value) + p.value
      fire(el, 'input')
      fire(el, 'change')
      return true
    },
    clear: els => {
      const el = els[0]
      el.value = ''
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
      const opts = Array.from(el.options || [])
      const opt = opts.find(o => o.value === p.value || o.textContent.trim() === p.value)
      if (!opt) return false
      el.value = opt.value
      fire(el, 'input')
      fire(el, 'change')
      return true
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
      if (!els.length && action !== 'count') return { found: 0 }
      return { found: els.length, result: actions[action](els, payload || {}) }
    },
  }
}
