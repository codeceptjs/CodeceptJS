import store from '../../store.js'
import InvalidSelector from '../errors/InvalidSelector.js'

const CSS_CHARS = ['.', '#', '[', ']', '=', ':', '>', '+', '~', '*', ',', '|', '^', '$']
const XPATH_CHARS = ['/', '(', ')', '@', '"', "'"]
const TAG_NAME = /^[a-z][a-z0-9-]*$/

const SUGGESTIONS = [
  [/^waitFor|^waitTo|^waitNumber/, 'Use I.waitForText() to wait for a text on page.'],
  [/^see|^dontSee/, 'Use I.see() or I.dontSee() to assert a text on page.'],
  [/^grab/, 'Locate the element by CSS or XPath, or use I.grabTextFrom() on its container.'],
]

export function looksLikeSelector(value) {
  if (CSS_CHARS.some(char => value.includes(char))) return true
  if (XPATH_CHARS.some(char => value.includes(char))) return true

  const words = value.trim().split(/\s+/)
  if (words.length === 1) return true
  if (words.every(word => TAG_NAME.test(word))) return true

  return false
}

export function checkSelectorIsNotText(helper, locator) {
  if (!helper.options.strict && !store.debugMode) return
  if (typeof locator !== 'string' || !locator.trim()) return
  if (looksLikeSelector(locator)) return

  const step = store.currentStep
  const method = step?.title || ''
  const suggestion = SUGGESTIONS.find(([pattern]) => pattern.test(method))?.[1] || ''
  const action = method ? `I.${method}()` : 'This step'

  const message = `"${locator}" doesn't look like a CSS or XPath selector. ${action} expects an element locator, so this text is matched as CSS and finds nothing. ${suggestion}`.trim()

  if (helper.options.strict) throw new InvalidSelector(message)

  if (step) {
    const reported = step.__selectorChecks || (step.__selectorChecks = new Set())
    if (reported.has(locator)) return
    reported.add(locator)
  }

  helper.debugSection('Warning', message)
}
