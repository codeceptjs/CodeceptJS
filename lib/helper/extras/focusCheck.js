import store from '../../store.js'
import NonFocusedType from '../errors/NonFocusedType.js'

export async function checkFocusBeforeType(helper) {
  const isStrict = helper.options.strict
  if (!isStrict && !store.debugMode) return

  const noFocus = await helper.executeScript(() => {
    const ae = document.activeElement
    return !ae || ae === document.documentElement || (ae === document.body && !ae.isContentEditable)
  })

  if (!noFocus) return

  if (isStrict) {
    throw new NonFocusedType()
  }

  helper.debugSection('Warning', 'No element is in focus. Use I.click() or I.focus() to activate an element before typing.')
}
