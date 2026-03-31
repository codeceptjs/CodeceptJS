import store from '../../store.js'
import NonFocusedType from '../errors/NonFocusedType.js'

const MODIFIER_PATTERN = /^(control|ctrl|meta|cmd|command|commandorcontrol|ctrlorcommand)/i
const EDITING_KEYS = new Set(['a', 'c', 'x', 'v', 'z', 'y'])

async function isNoElementFocused(helper) {
  return helper.executeScript(() => {
    const ae = document.activeElement
    return !ae || ae === document.documentElement || (ae === document.body && !ae.isContentEditable)
  })
}

export async function checkFocusBeforeType(helper) {
  if (!helper.options.strict && !store.debugMode) return
  if (!await isNoElementFocused(helper)) return

  const message = 'No element is in focus. Use I.click() or I.focus() to activate an element before typing.'
  if (helper.options.strict) throw new NonFocusedType(message)
  helper.debugSection('Warning', message)
}

export async function checkFocusBeforePressKey(helper, originalKey) {
  if (!helper.options.strict && !store.debugMode) return
  if (!Array.isArray(originalKey)) return

  let hasCtrlOrMeta = false
  let actionKey = null
  for (const k of originalKey) {
    if (MODIFIER_PATTERN.test(k)) {
      hasCtrlOrMeta = true
    } else {
      actionKey = k
    }
  }
  if (!hasCtrlOrMeta || !actionKey || !EDITING_KEYS.has(actionKey.toLowerCase())) return

  if (!await isNoElementFocused(helper)) return

  const message = `No element is in focus. Key combination with "${originalKey.join('+')}" may not work as expected. Use I.click() or I.focus() first.`
  if (helper.options.strict) throw new NonFocusedType(message)
  helper.debugSection('Warning', message)
}
