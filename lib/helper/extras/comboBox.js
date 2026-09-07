import WebElement from '../../element/WebElement.js'

const MARKER = 'data-codeceptjs-combobox-target'
const PREVIOUS = 'data-codeceptjs-combobox-previous'
const OPEN_TIMEOUT = 1000
const POLL_INTERVAL = 50

function locateInput(el, opts) {
  const marker = opts.marker
  const previous = opts.previous
  const doc = el.ownerDocument
  const NON_TEXT = ['checkbox', 'radio', 'button', 'submit', 'reset', 'image', 'file', 'range', 'color', 'hidden']
  const SELECTOR = 'input, textarea, [contenteditable="true"], [contenteditable=""]'

  function isEditable(node) {
    if (!node || node.nodeType !== 1) return false
    if (node.isContentEditable) return true
    const t = node.tagName
    if (t !== 'INPUT' && t !== 'TEXTAREA') return false
    if (node.disabled || node.readOnly) return false
    return t !== 'INPUT' || NON_TEXT.indexOf((node.type || 'text').toLowerCase()) === -1
  }

  function isVisible(node) {
    return node.getClientRects().length > 0
  }

  function mark(node) {
    doc.querySelectorAll('[' + marker + ']').forEach(n => n.removeAttribute(marker))
    node.setAttribute(marker, '1')
    let name = node.tagName.toLowerCase()
    if (node.id) name += '#' + node.id
    if (node.placeholder) name += '[placeholder="' + node.placeholder + '"]'
    return name
  }

  function pick(root) {
    const active = doc.activeElement
    if (active && active !== el && !active.hasAttribute(previous) && root.contains(active) && isEditable(active)) return active
    const nodes = root.querySelectorAll(SELECTOR)
    for (let i = 0; i < nodes.length; i++) {
      if (isEditable(nodes[i]) && isVisible(nodes[i])) return nodes[i]
    }
    return null
  }

  if (opts.tagActive) {
    doc.querySelectorAll('[' + previous + ']').forEach(n => n.removeAttribute(previous))
    if (doc.activeElement && doc.activeElement.nodeType === 1) doc.activeElement.setAttribute(previous, '1')
  }

  if (isEditable(el)) return mark(el)

  const inner = pick(el)
  if (inner) return mark(inner)

  const roots = []
  const controlled = el.getAttribute('aria-controls') || el.getAttribute('aria-owns')
  if (controlled && doc.getElementById(controlled)) roots.push(doc.getElementById(controlled))
  doc.querySelectorAll('[role="dialog"], [role="listbox"]').forEach(n => {
    if (isVisible(n)) roots.push(n)
  })

  for (let i = 0; i < roots.length; i++) {
    const found = pick(roots[i])
    if (found) return mark(found)
  }

  if (!opts.allowActive) return null

  let active = doc.activeElement
  while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement
  if (active && active !== el && !active.hasAttribute(previous) && isEditable(active) && isVisible(active)) return mark(active)

  return null
}

function readValue(el) {
  return el.value === undefined ? el.textContent : el.value
}

function isActive(el) {
  return el.ownerDocument.activeElement === el
}

function unmarkAll(markers) {
  markers.forEach(marker => document.querySelectorAll('[' + marker + ']').forEach(n => n.removeAttribute(marker)))
}

async function findMarked(helper) {
  const root = helper.page || helper.browser
  const raw = await root.$('[' + MARKER + ']')
  return new WebElement(raw, helper)
}

async function clearMarker(helper) {
  if (helper.page) return helper.page.evaluate(unmarkAll, [MARKER, PREVIOUS])
  return helper.executeScript(unmarkAll, [MARKER, PREVIOUS])
}

export async function fillComboBox(helper, el, value) {
  const trigger = el instanceof WebElement ? el : new WebElement(el, helper)
  const options = { marker: MARKER, previous: PREVIOUS }
  let found = await trigger.evaluate(locateInput, { ...options, tagActive: true })

  if (!found) {
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
      helper.debugSection('ComboBox', 'Expanding combobox')
      await trigger.click()
    }
    const deadline = Date.now() + OPEN_TIMEOUT
    while (!found && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
      found = await trigger.evaluate(locateInput, { ...options, allowActive: true })
    }
  }

  if (!found) {
    await clearMarker(helper)
    throw new Error('fillField: combobox exposes no text input to type into. Use I.selectOption() to pick one of its options.')
  }

  const target = await findMarked(helper)
  helper.debugSection('ComboBox', `Typing into ${found}`)

  await target.focus()
  if (!(await target.evaluate(isActive))) await target.click()
  if (!(await target.evaluate(isActive))) {
    throw new Error(`fillField: combobox input ${found} did not accept focus.`)
  }

  if (await target.evaluate(readValue)) await target.selectAllAndDelete()
  await target.typeText(value, { delay: helper.options.pressKeyDelay })

  await clearMarker(helper)
}
