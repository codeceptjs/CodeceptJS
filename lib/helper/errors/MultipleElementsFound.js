import Locator from '../../locator.js'

/**
 * Error thrown when strict mode is enabled and multiple elements are found
 * for a single-element locator operation (click, fillField, etc.)
 */
class MultipleElementsFound extends Error {
  /**
   * @param {Locator|string|object} locator - The locator used
   * @param {Array<HTMLElement>} elements - Array of Playwright element handles found
   */
  constructor(locator, elements) {
    super(`Multiple elements (${elements.length}) found for "${locator}". Call fetchDetails() for full information.`)
    this.name = 'MultipleElementsFound'
    this.locator = locator
    this.elements = elements
    this.count = elements.length
    this._detailsFetched = false
  }

  /**
   * Fetch detailed information about the found elements asynchronously
   * This updates the error message with XPath and element previews
   */
  async fetchDetails() {
    if (this._detailsFetched) return

    try {
      if (typeof this.locator === 'object' && !(this.locator instanceof Locator)) {
        this.locator = JSON.stringify(this.locator)
      }

      const locatorObj = new Locator(this.locator)
      const elementList = await this._generateElementList(this.elements, this.count)

      this.message = `Multiple elements (${this.count}) found for "${locatorObj.toString()}" in strict mode.\n` +
        elementList +
        `\nUse a more specific locator or use grabWebElements() to handle multiple elements.`
    } catch (err) {
      this.message = `Multiple elements (${this.count}) found. Failed to fetch details: ${err.message}`
    }

    this._detailsFetched = true
  }

  /**
   * Generate a formatted list of found elements with their XPath and preview
   * @param {Array<HTMLElement>} elements
   * @param {number} count
   * @returns {Promise<string>}
   */
  async _generateElementList(elements, count) {
    const items = []
    const maxToShow = Math.min(count, 10)

    for (let i = 0; i < maxToShow; i++) {
      const el = elements[i]
      try {
        const info = await this._getElementInfo(el)
        items.push(`  ${i + 1}. ${info.xpath} (${info.preview})`)
      } catch (err) {
        // Element might be detached or inaccessible
        items.push(`  ${i + 1}. [Unable to get element info: ${err.message}]`)
      }
    }

    if (count > 10) {
      items.push(`  ... and ${count - 10} more`)
    }

    return items.join('\n')
  }

  /**
   * Get XPath and preview for an element by running JavaScript in browser context
   * @param {HTMLElement} element
   * @returns {Promise<{xpath: string, preview: string}>}
   */
  async _getElementInfo(element) {
    return element.evaluate((el) => {
      // Generate a unique XPath for this element
      const getUniqueXPath = (element) => {
        if (element.id) {
          return `//*[@id="${element.id}"]`
        }

        const parts = []
        let current = element

        while (current && current.nodeType === Node.ELEMENT_NODE) {
          let index = 0
          let sibling = current.previousSibling

          while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
              index++
            }
            sibling = sibling.previousSibling
          }

          const tagName = current.tagName.toLowerCase()
          const pathIndex = index > 0 ? `[${index + 1}]` : ''
          parts.unshift(`${tagName}${pathIndex}`)

          current = current.parentElement

          // Stop at body to keep XPath reasonable
          if (current && current.tagName === 'BODY') {
            parts.unshift('body')
            break
          }
        }

        return '/' + parts.join('/')
      }

      // Get a preview of the element (tag, classes, id)
      const getPreview = (element) => {
        const tag = element.tagName.toLowerCase()
        const id = element.id ? `#${element.id}` : ''
        const classes = element.className
          ? '.' + element.className.split(' ').filter(c => c).join('.')
          : ''
        return `${tag}${id}${classes || ''}`
      }

      return {
        xpath: getUniqueXPath(el),
        preview: getPreview(el),
      }
    })
  }
}

export default MultipleElementsFound
