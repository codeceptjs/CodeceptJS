import store from '../../store.js'
import output from '../../output.js'
import WebElement from '../../element/WebElement.js'
import MultipleElementsFound from '../errors/MultipleElementsFound.js'

function resolveElementIndex(value) {
  if (value === 'first') return 1
  if (value === 'last') return -1
  return value
}

function selectElement(els, locator, helper) {
  const rawIndex = store.currentStep?.opts?.elementIndex
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

  if (helper.options.strict) {
    if (els.length > 1) {
      const webElements = els.map(el => new WebElement(el, helper))
      throw new MultipleElementsFound(locator, webElements)
    }
  }

  if (els.length > 1) output.debug(`[Elements] Using first element out of ${els.length}`)
  return els[0]
}

export { selectElement }
