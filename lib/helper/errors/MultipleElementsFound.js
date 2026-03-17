import Locator from '../../locator.js'

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
      const items = []
      const maxToShow = Math.min(this.count, 10)

      for (let i = 0; i < maxToShow; i++) {
        const webEl = this.webElements[i]
        try {
          const xpath = await webEl.toAbsoluteXPath()
          const html = await webEl.toSimplifiedHTML()
          items.push(`  ${i + 1}. > ${xpath}\n     ${html}`)
        } catch (err) {
          items.push(`  ${i + 1}. [Unable to get element info: ${err.message}]`)
        }
      }

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
