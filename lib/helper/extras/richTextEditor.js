import WebElement from '../../element/WebElement.js'

const MARKER = 'data-codeceptjs-rte-target'

const EDITOR = {
  STANDARD: 'standard',
  IFRAME: 'iframe',
  CONTENTEDITABLE: 'contenteditable',
  HIDDEN_TEXTAREA: 'hidden-textarea',
  UNREACHABLE: 'unreachable',
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

  const isFormHidden = tag === 'INPUT' && el.type === 'hidden'
  if ((tag === 'INPUT' || tag === 'TEXTAREA') && !isFormHidden) {
    const style = window.getComputedStyle(el)
    if (style.display === 'none') return mark(kinds.UNREACHABLE, el)
  }

  const canSearchDescendants = tag !== 'INPUT' && tag !== 'TEXTAREA'
  if (canSearchDescendants) {
    const iframe = el.querySelector('iframe')
    if (iframe) return mark(kinds.IFRAME, iframe)
    const ce = el.querySelector(CE)
    if (ce) return mark(kinds.CONTENTEDITABLE, ce)
    const textareas = [...el.querySelectorAll('textarea')]
    const focusable = textareas.find(t => window.getComputedStyle(t).display !== 'none')
    const textarea = focusable || textareas[0]
    if (textarea) return mark(kinds.HIDDEN_TEXTAREA, textarea)
  }

  return mark(kinds.STANDARD, el)
}

function detectInsideFrame() {
  const MARKER = 'data-codeceptjs-rte-target'
  const CE = '[contenteditable="true"], [contenteditable=""]'
  const CONTENTEDITABLE = 'contenteditable'
  const HIDDEN_TEXTAREA = 'hidden-textarea'
  const body = document.body
  document.querySelectorAll('[' + MARKER + ']').forEach(n => n.removeAttribute(MARKER))

  if (body.isContentEditable) return CONTENTEDITABLE

  const ce = body.querySelector(CE)
  if (ce) {
    ce.setAttribute(MARKER, '1')
    return CONTENTEDITABLE
  }

  const textareas = [...body.querySelectorAll('textarea')]
  const focusable = textareas.find(t => window.getComputedStyle(t).display !== 'none')
  const textarea = focusable || textareas[0]
  if (textarea) {
    textarea.setAttribute(MARKER, '1')
    return HIDDEN_TEXTAREA
  }

  return CONTENTEDITABLE
}

async function evaluateInFrame(helper, body, fn) {
  if (body.helperType === 'webdriver') {
    return helper.executeScript(fn)
  }
  return body.element.evaluate(fn)
}

function focusMarkedInFrameScript() {
  const el = document.querySelector('[data-codeceptjs-rte-target]') || document.body
  el.focus()
  return document.activeElement === el
}

function selectAllInFrameScript() {
  const el = document.querySelector('[data-codeceptjs-rte-target]') || document.body
  el.focus()
  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  return document.activeElement === el
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

function isActive(el) {
  return el.ownerDocument.activeElement === el
}

async function assertFocused(target) {
  const focused = await target.evaluate(isActive)
  if (!focused) {
    throw new Error('fillField: rich editor target did not accept focus. Locator must point at the visible editor surface (a wrapper, iframe, or contenteditable) — not a hidden backing element.')
  }
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
  if (kind === EDITOR.UNREACHABLE) {
    throw new Error('fillField: cannot fill a display:none form control. Locator must point at the visible editor surface (a wrapper, iframe, or contenteditable).')
  }

  const target = await findMarked(helper)
  const delay = helper.options.pressKeyDelay

  if (kind === EDITOR.IFRAME) {
    await target.inIframe(async body => {
      const innerKind = await evaluateInFrame(helper, body, detectInsideFrame)
      if (innerKind === EDITOR.HIDDEN_TEXTAREA) {
        const focused = await evaluateInFrame(helper, body, focusMarkedInFrameScript)
        if (!focused) throw new Error('fillField: rich editor target inside iframe did not accept focus.')
        await body.selectAllAndDelete()
        await body.typeText(value, { delay })
      } else {
        const focused = await evaluateInFrame(helper, body, selectAllInFrameScript)
        if (!focused) throw new Error('fillField: rich editor target inside iframe did not accept focus.')
        await body.typeText(value, { delay })
      }
    })
  } else if (kind === EDITOR.HIDDEN_TEXTAREA) {
    await target.focus()
    await assertFocused(target)
    await target.selectAllAndDelete()
    await target.typeText(value, { delay })
  } else if (kind === EDITOR.CONTENTEDITABLE) {
    await target.click()
    await target.evaluate(selectAllInEditable)
    await assertFocused(target)
    await target.typeText(value, { delay })
  }

  await clearMarker(helper)
  return true
}
