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
    role: (value, root) => {
      let matches = Array.from((root || document).querySelectorAll('*')).filter(el => resolveRole(el) === value.role)
      if (value.text) {
        const matchFn = value.exact ? t => t === value.text : t => t.indexOf(value.text) !== -1
        matches = matches.filter(el => roleTextCandidates(el).some(matchFn))
      }
      return matches
    },
    shadow: (path, root) => {
      let scope = root || document
      for (let i = 0; i < path.length; i++) {
        if (i === path.length - 1) return Array.from(scope.querySelectorAll(path[i]))
        const host = scope.querySelector(path[i])
        if (!host || !host.shadowRoot) return []
        scope = host.shadowRoot
      }
      return []
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
    // Walk the root's children directly, rather than calling walk(root) itself: a block-level
    // root (e.g. an <h1> passed as the target element for grabTextFrom) must not get its own
    // trailing block-separator newline appended, since that's only meant to separate it from a
    // following sibling, which doesn't exist from the root's own point of view. The root's own
    // visibility is still honored first, matching walk()'s check for every other node.
    const start = root || document.body
    if (start.nodeType === 1) {
      const rootStyle = getComputedStyle(start)
      if (rootStyle.display === 'none' || rootStyle.visibility === 'hidden') return ''
    }
    for (const child of start.childNodes) walk(child)
    return out.join('')
  }
  const IMPLICIT_ROLES = {
    BUTTON: () => 'button',
    A: el => (el.hasAttribute('href') ? 'link' : null),
    AREA: el => (el.hasAttribute('href') ? 'link' : null),
    INPUT: el => {
      const type = (el.getAttribute('type') || 'text').toLowerCase()
      switch (type) {
        case 'checkbox':
          return 'checkbox'
        case 'radio':
          return 'radio'
        case 'button':
        case 'submit':
        case 'reset':
        case 'image':
          return 'button'
        case 'search':
          return 'searchbox'
        case 'number':
          return 'spinbutton'
        case 'range':
          return 'slider'
        case 'email':
        case 'tel':
        case 'text':
        case 'url':
        case '':
          return 'textbox'
        default:
          return null
      }
    },
    SELECT: el => (el.multiple || el.hasAttribute('multiple') || (el.size && el.size > 1) ? 'listbox' : 'combobox'),
    TEXTAREA: () => 'textbox',
    H1: () => 'heading',
    H2: () => 'heading',
    H3: () => 'heading',
    H4: () => 'heading',
    H5: () => 'heading',
    H6: () => 'heading',
    IMG: el => (el.hasAttribute('alt') ? 'img' : null),
    NAV: () => 'navigation',
    UL: () => 'list',
    OL: () => 'list',
    LI: () => 'listitem',
    TABLE: () => 'table',
    FORM: () => 'form',
    OPTION: () => 'option',
  }
  const resolveRole = el => {
    const explicit = el.getAttribute && el.getAttribute('role')
    if (explicit) return explicit.trim().split(/\s+/)[0]
    const fn = IMPLICIT_ROLES[el.tagName]
    return fn ? fn(el) : null
  }
  const roleTextCandidates = el => {
    const out = []
    const labelledBy = el.getAttribute && el.getAttribute('aria-labelledby')
    if (labelledBy) {
      labelledBy.split(/\s+/).forEach(id => {
        const ref = document.getElementById(id)
        if (ref) out.push(visibleText(ref))
      })
    }
    const ariaLabel = el.getAttribute && el.getAttribute('aria-label')
    if (ariaLabel) out.push(ariaLabel)
    if (el.id) {
      document.querySelectorAll('label[for]').forEach(l => {
        if (l.getAttribute('for') === el.id) out.push(visibleText(l))
      })
    }
    const wrappingLabel = el.closest && el.closest('label')
    if (wrappingLabel) out.push(visibleText(wrappingLabel))
    if ('value' in el && el.value) out.push(String(el.value))
    const placeholder = el.getAttribute && el.getAttribute('placeholder')
    if (placeholder) out.push(placeholder)
    out.push(visibleText(el))
    const alt = el.getAttribute && el.getAttribute('alt')
    if (alt) out.push(alt)
    const title = el.getAttribute && el.getAttribute('title')
    if (title) out.push(title)
    return out.map(t => (t || '').trim()).filter(Boolean)
  }
  const fire = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }))
  const isEditable = el => el.isContentEditable === true || el.getAttribute('contenteditable') === 'true'
  const getVal = el => (isEditable(el) ? el.textContent : el.value)
  const setVal = (el, v) => {
    if (isEditable(el)) el.textContent = v
    else el.value = v
  }
  const isAriaCheckable = el => el.getAttribute && el.getAttribute('aria-checked') != null
  const isChecked = el => (isAriaCheckable(el) ? el.getAttribute('aria-checked') === 'true' : el.checked === true)
  const focusLabelledControl = label => {
    let control = null
    if (label.htmlFor) control = document.getElementById(label.htmlFor)
    if (!control) control = label.querySelector('input, select, textarea, button, [contenteditable="true"]')
    if (control && !control.disabled && control.focus) control.focus()
  }
  const setChecked = (el, value) => {
    if (isAriaCheckable(el)) {
      if (isChecked(el) !== value) el.click()
      if (isChecked(el) !== value) el.setAttribute('aria-checked', String(value))
      return isChecked(el) === value
    }
    if (el.checked !== value) el.click()
    if (el.checked !== value) {
      el.checked = value
      fire(el, 'change')
    }
    return el.checked === value
  }
  const actions = {
    count: els => els.length,
    texts: (els, p) => els.map(el => (p && p.visible ? visibleText(el) : el.innerText !== undefined ? String(el.innerText) : String(el.textContent))),
    values: els => els.map(el => String(getVal(el))),
    attrs: (els, p) => els.map(el => el.getAttribute(p.name)),
    html: els => els.map(el => el.outerHTML),
    innerHtml: els => els.map(el => el.innerHTML),
    outerHTML: els => (els[0] ? els[0].outerHTML : null),
    absoluteXPath: els => {
      const el = els[0]
      if (!el) return null
      const parts = []
      let current = el
      while (current && current.nodeType === 1) {
        let index = 0
        let sibling = current.previousSibling
        while (sibling) {
          if (sibling.nodeType === 1 && sibling.tagName === current.tagName) index++
          sibling = sibling.previousSibling
        }
        const tagName = current.tagName.toLowerCase()
        parts.unshift(index > 0 ? `${tagName}[${index + 1}]` : tagName)
        current = current.parentElement
      }
      return `//${parts.join('/')}`
    },
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
      const el = els[0]
      el.click()
      if (el.tagName === 'LABEL') focusLabelledControl(el)
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
    check: els => setChecked(els[0], true),
    uncheck: els => setChecked(els[0], false),
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
    checked: els => isChecked(els[0]),
    mark: (els, p) => {
      const el = els[0]
      if (!el) return null
      el.setAttribute(p.attr, '1')
      return { isFileInput: el.tagName === 'INPUT' && (el.getAttribute('type') || '').toLowerCase() === 'file' }
    },
    unmark: (els, p) => {
      if (els[0]) els[0].removeAttribute(p.attr)
      return true
    },
    dropFile: (els, p) => {
      const el = els[0]
      if (!el) return false
      const binaryStr = atob(p.base64Content)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
      const fileObj = new File([bytes], p.fileName, { type: p.mimeType })
      // Duck-typed dataTransfer on a plain Event, rather than real DataTransfer/DragEvent
      // instances: dropzone handlers only ever read e.dataTransfer.files, and this avoids
      // depending on DragEvent/DataTransfer constructors some engines don't implement.
      const files = [fileObj]
      const dataTransfer = { files, items: { add() {} }, types: ['Files'], getData: () => '', setData: () => {} }
      const dispatch = type => {
        const ev = new Event(type, { bubbles: true, cancelable: true })
        Object.defineProperty(ev, 'dataTransfer', { value: dataTransfer })
        el.dispatchEvent(ev)
      }
      dispatch('dragenter')
      dispatch('dragover')
      dispatch('drop')
      return true
    },
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
        const layers = Array.isArray(within[0]) ? within : [within]
        for (const layer of layers) {
          const scopeEls = find(layer, root)
          if (!scopeEls.length) return { found: 0, withinMissing: true }
          root = scopeEls[0]
        }
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
