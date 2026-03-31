import store from '../../store.js'
import NonFocusedType from '../errors/NonFocusedType.js'

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

export async function checkFocusBeforePressKey(helper, modifiers, key) {
  if (!helper.options.strict && !store.debugMode) return

  const hasCtrlOrMeta = modifiers.some(m => m === 'Control' || m === 'Meta'
    || m === 'ControlLeft' || m === 'ControlRight' || m === 'MetaLeft' || m === 'MetaRight')
  if (!hasCtrlOrMeta || !EDITING_KEYS.has(key.toLowerCase())) return

  if (!await isNoElementFocused(helper)) return

  const message = `No element is in focus. Key combination with "${key}" may not work as expected. Use I.click() or I.focus() first.`
  if (helper.options.strict) throw new NonFocusedType(message)
  helper.debugSection('Warning', message)
}
