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

function detectInsideFrame(body, opts) {
  const marker = opts.marker
  const kinds = opts.kinds
  const CE = '[contenteditable="true"], [contenteditable=""]'
  body.ownerDocument.querySelectorAll('[' + marker + ']').forEach(n => n.removeAttribute(marker))

  if (body.isContentEditable) return kinds.CONTENTEDITABLE

  const ce = body.querySelector(CE)
  if (ce) {
    ce.setAttribute(marker, '1')
    return kinds.CONTENTEDITABLE
  }

  const textareas = [...body.querySelectorAll('textarea')]
  const focusable = textareas.find(t => body.ownerDocument.defaultView.getComputedStyle(t).display !== 'none')
  const textarea = focusable || textareas[0]
  if (textarea) {
    textarea.setAttribute(marker, '1')
    return kinds.HIDDEN_TEXTAREA
  }

  return kinds.CONTENTEDITABLE
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

  const target = await findMarked(helper)
  const delay = helper.options.pressKeyDelay

  if (kind === EDITOR.IFRAME) {
    await target.inIframe(async body => {
      const innerKind = await body.evaluate(detectInsideFrame, { marker: MARKER, kinds: EDITOR })
      const marked = await body.$('[' + MARKER + ']')
      const innerTarget = marked || body
      if (innerKind === EDITOR.HIDDEN_TEXTAREA) {
        await innerTarget.focus()
        await assertFocused(innerTarget)
        await innerTarget.selectAllAndDelete()
        await innerTarget.typeText(value, { delay })
      } else {
        await innerTarget.evaluate(selectAllInEditable)
        await assertFocused(innerTarget)
        await innerTarget.typeText(value, { delay })
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
