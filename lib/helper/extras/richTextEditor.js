import WebElement from '../../element/WebElement.js'

const MARKER = 'data-codeceptjs-rte-target'

const EDITOR = {
  STANDARD: 'standard',
  IFRAME: 'iframe',
  CONTENTEDITABLE: 'contenteditable',
  HIDDEN_TEXTAREA: 'hidden-textarea',
}

function detectAndMark(el, opts) {
  const marker = opts.marker
  const kinds = opts.kinds
  const CE = '[contenteditable="true"], [contenteditable=""]'

  function mark(kind, target) {
    document.querySelectorAll('[' + marker + ']').forEach(n => n.removeAttribute(marker))
    if (target && target.nodeType === 1) target.setAttribute(marker, '1')
    return kind
  }

  if (!el || el.nodeType !== 1) return mark(kinds.STANDARD, el)

  const tag = el.tagName
  if (tag === 'IFRAME') return mark(kinds.IFRAME, el)
  if (el.isContentEditable) return mark(kinds.CONTENTEDITABLE, el)

  if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
    const iframe = el.querySelector('iframe')
    if (iframe) return mark(kinds.IFRAME, iframe)
    const ce = el.querySelector(CE)
    if (ce) return mark(kinds.CONTENTEDITABLE, ce)
    const textarea = el.querySelector('textarea')
    if (textarea) return mark(kinds.HIDDEN_TEXTAREA, textarea)
  }

  const style = window.getComputedStyle(el)
  const hidden =
    el.offsetParent === null ||
    (el.offsetWidth === 0 && el.offsetHeight === 0) ||
    style.display === 'none' ||
    style.visibility === 'hidden'

  if (hidden) {
    let scope = el.parentElement
    while (scope) {
      const iframeNear = scope.querySelector('iframe')
      if (iframeNear) return mark(kinds.IFRAME, iframeNear)
      const ceNear = scope.querySelector(CE)
      if (ceNear) return mark(kinds.CONTENTEDITABLE, ceNear)
      for (const t of scope.querySelectorAll('textarea')) {
        if (t !== el) return mark(kinds.HIDDEN_TEXTAREA, t)
      }
      if (scope === document.body) break
      scope = scope.parentElement
    }
  }

  return mark(kinds.STANDARD, el)
}

function selectAllInEditable(el) {
  const doc = el.ownerDocument
  const win = doc.defaultView
  el.focus()
  const range = doc.createRange()
  range.selectNodeContents(el)
  const sel = win.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

function unmarkAll(marker) {
  document.querySelectorAll('[' + marker + ']').forEach(n => n.removeAttribute(marker))
}

async function findMarked(helper) {
  const root = helper.page || helper.browser
  const raw = await root.$('[' + MARKER + ']')
  return new WebElement(raw, helper)
}

async function clearMarker(helper) {
  if (helper.page) return helper.page.evaluate(unmarkAll, MARKER)
  return helper.executeScript(unmarkAll, MARKER)
}

export async function fillRichEditor(helper, el, value) {
  const source = el instanceof WebElement ? el : new WebElement(el, helper)
  const kind = await source.evaluate(detectAndMark, { marker: MARKER, kinds: EDITOR })
  if (kind === EDITOR.STANDARD) return false

  const target = await findMarked(helper)
  const delay = helper.options.pressKeyDelay

  if (kind === EDITOR.IFRAME) {
    await target.inIframe(async body => {
      await body.click({ force: true })
      await body.evaluate(selectAllInEditable)
      await body.typeText(value, { delay })
    })
  } else if (kind === EDITOR.HIDDEN_TEXTAREA) {
    await target.focus()
    await target.selectAllAndDelete()
    await target.typeText(value, { delay })
  } else if (kind === EDITOR.CONTENTEDITABLE) {
    await target.click()
    await target.evaluate(selectAllInEditable)
    await target.typeText(value, { delay })
  }

  await clearMarker(helper)
  return true
}
