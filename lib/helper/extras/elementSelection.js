import store from '../../store.js'
import output from '../../output.js'
import WebElement from '../../element/WebElement.js'
import MultipleElementsFound from '../errors/MultipleElementsFound.js'

function resolveElementIndex(value) {
  if (value === 'first') return 1
  if (value === 'last') return -1
  return value
}

function isStrictStep(opts, helper) {
  if (opts?.exact === true || opts?.strictMode === true) return true
  if (opts?.exact === false || opts?.strictMode === false) return false
  return helper.options.strict
}

function selectElement(els, locator, helper) {
  const opts = store.currentStep?.opts
  const rawIndex = opts?.elementIndex
  const elementIndex = resolveElementIndex(rawIndex)

  if (elementIndex != null) {
    if (els.length === 1) return els[0]

    if (!Number.isInteger(elementIndex) || elementIndex === 0) {
      throw new Error(`elementIndex must be a non-zero integer or 'first'/'last', got: ${rawIndex}`)
    }

    let idx
    if (elementIndex > 0) {
      idx = elementIndex - 1
      if (idx >= els.length) {
        throw new Error(`elementIndex ${elementIndex} exceeds the number of elements found (${els.length}) for "${locator}"`)
      }
    } else {
      idx = els.length + elementIndex
      if (idx < 0) {
        throw new Error(`elementIndex ${elementIndex} exceeds the number of elements found (${els.length}) for "${locator}"`)
      }
    }

    output.debug(`[Elements] Using element #${elementIndex} out of ${els.length}`)
    return els[idx]
  }

  if (isStrictStep(opts, helper)) {
    if (els.length > 1) {
      const webElements = Array.from(els).map(el => new WebElement(el, helper))
      throw new MultipleElementsFound(locator, webElements)
    }
  }

  if (els.length > 1) output.debug(`[Elements] Using first element out of ${els.length}`)
  return els[0]
}

export { selectElement }
