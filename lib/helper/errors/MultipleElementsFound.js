import Locator from '../../locator.js'

export function splitXPath(xpath) {
  if (typeof xpath !== 'string' || xpath.length === 0) return []
  const withoutRoot = xpath.startsWith('//') ? xpath.slice(1) : xpath
  return withoutRoot.split('/').filter(Boolean)
}

export function isAncestorXPath(ancestor, descendant) {
  if (!ancestor || !descendant || ancestor === descendant) return false
  const ancestorSegments = splitXPath(ancestor)
  const descendantSegments = splitXPath(descendant)
  if (ancestorSegments.length === 0 || ancestorSegments.length >= descendantSegments.length) return false
  return ancestorSegments.every((segment, index) => segment === descendantSegments[index])
}

export function computeDepths(entries) {
  const depths = new Array(entries.length).fill(0)
  const stack = []
  for (let i = 0; i < entries.length; i++) {
    const xpath = entries[i].xpath
    if (!xpath) continue
    while (stack.length > 0 && !isAncestorXPath(entries[stack[stack.length - 1]].xpath, xpath)) {
      stack.pop()
    }
    depths[i] = stack.length
    stack.push(i)
  }
  return depths
}

export function formatTree(entries, depths) {
  return entries.map((entry, i) => {
    const pad = '  '.repeat(depths[i] || 0)
    if (entry.error) {
      return `${pad}  ${entry.index}. [Unable to get element info: ${entry.error}]`
    }
    return `${pad}  ${entry.index}. > ${entry.xpath}\n${pad}     ${entry.html}`
  })
}

class MultipleElementsFound extends Error {
  constructor(locator, webElements) {
    const locatorStr = (typeof locator === 'object' && !(locator instanceof Locator))
      ? new Locator(locator).toString()
      : String(locator)
    super(`Multiple elements (${webElements.length}) found for "${locatorStr}" in strict mode. Call fetchDetails() for full information.`)
    this.name = 'MultipleElementsFound'
    this.locator = locator
    this.webElements = webElements
    this.count = webElements.length
    this._detailsFetched = false
  }

  async fetchDetails() {
    if (this._detailsFetched) return

    try {
      const entries = []
      const maxToShow = Math.min(this.count, 10)

      for (let i = 0; i < maxToShow; i++) {
        const webEl = this.webElements[i]
        try {
          const xpath = await webEl.toAbsoluteXPath()
          const html = await webEl.toSimplifiedHTML()
          entries.push({ index: i + 1, xpath, html })
        } catch (err) {
          entries.push({ index: i + 1, error: err.message })
        }
      }

      const items = formatTree(entries, computeDepths(entries))

      if (this.count > 10) {
        items.push(`  ... and ${this.count - 10} more`)
      }

      const locatorStr = (typeof this.locator === 'object' && !(this.locator instanceof Locator))
        ? new Locator(this.locator).toString()
        : String(this.locator)
      this.message = `Multiple elements (${this.count}) found for "${locatorStr}" in strict mode.\n` +
        items.join('\n') +
        `\nUse a more specific locator or use grabWebElements() to handle multiple elements.`
    } catch (err) {
      this.message = `Multiple elements (${this.count}) found. Failed to fetch details: ${err.message}`
    }

    this._detailsFetched = true
  }
}

export default MultipleElementsFound
