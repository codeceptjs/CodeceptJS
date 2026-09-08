import WebElement from '../../element/WebElement.js'

const MARKER = 'data-codeceptjs-combobox-input'
const EXPAND_TIMEOUT = 1000
const POLL_INTERVAL = 50

const EDITABLE = [
  'input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=reset]):not([type=image]):not([type=file]):not([type=range]):not([type=color]):not([type=hidden])',
  'textarea',
  '[contenteditable="true"]',
  '[contenteditable=""]',
]
  .map(selector => `${selector}:not([readonly]):not([disabled])`)
  .join(', ')

function markInput(el, opts) {
  const doc = el.ownerDocument
  const controlled = doc.getElementById(el.getAttribute('aria-controls') || el.getAttribute('aria-owns') || '')
  const popups = doc.querySelectorAll('[role="dialog"], [role="listbox"]')

  for (const container of [el, controlled, controlled && controlled.closest('[role="dialog"]'), ...popups]) {
    if (!container || !container.getClientRects().length) continue

    const input = container.matches(opts.editable) ? container : container.querySelector(opts.editable)
    if (!input || !input.getClientRects().length) continue

    doc.querySelectorAll('[' + opts.marker + ']').forEach(marked => marked.removeAttribute(opts.marker))
    input.setAttribute(opts.marker, '1')

    return input.tagName.toLowerCase() + (input.placeholder ? `[placeholder="${input.placeholder}"]` : '')
  }

  return null
}

function isFocused(el) {
  return el.ownerDocument.activeElement === el
}

function currentValue(el) {
  return el.value === undefined ? el.textContent : el.value
}

function removeMarker(marker) {
  document.querySelectorAll('[' + marker + ']').forEach(el => el.removeAttribute(marker))
}

async function findMarked(helper) {
  const root = helper.page || helper.browser
  return new WebElement(await root.$(`[${MARKER}]`), helper)
}

async function clearMarker(helper) {
  if (helper.page) return helper.page.evaluate(removeMarker, MARKER)
  return helper.executeScript(removeMarker, MARKER)
}

async function expand(helper, trigger) {
  if ((await trigger.getAttribute('aria-expanded')) === 'true') return
  helper.debugSection('ComboBox', 'Expanding combobox')
  return trigger.click()
}

async function pollFor(search) {
  const deadline = Date.now() + EXPAND_TIMEOUT
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
    const found = await search()
    if (found) return found
  }
  return null
}

async function findInput(helper, trigger) {
  const search = () => trigger.evaluate(markInput, { marker: MARKER, editable: EDITABLE })

  let name = await search()
  if (!name) {
    await expand(helper, trigger)
    name = await pollFor(search)
  }
  if (!name) {
    throw new Error('fillField: combobox exposes no text input to type into. Use I.selectOption() to pick one of its options.')
  }

  return { name, element: await findMarked(helper) }
}

async function focusInput(input, name) {
  await input.focus()
  if (await input.evaluate(isFocused)) return

  await input.click()
  if (await input.evaluate(isFocused)) return

  throw new Error(`fillField: combobox input ${name} did not accept focus.`)
}

export async function fillComboBox(helper, el, value) {
  const trigger = el instanceof WebElement ? el : new WebElement(el, helper)
  const { name, element } = await findInput(helper, trigger)

  helper.debugSection('ComboBox', `Typing into ${name}`)

  await focusInput(element, name)
  if (await element.evaluate(currentValue)) await element.selectAllAndDelete()
  await element.typeText(value, { delay: helper.options.pressKeyDelay })

  return clearMarker(helper)
}
