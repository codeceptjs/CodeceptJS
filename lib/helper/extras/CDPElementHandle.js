/**
 * Lightweight element handle for `CDPBrowser`. Unlike Puppeteer/WebDriver, `CDPBrowser` never
 * keeps a persistent handle to a DOM node on the Node side — every action re-resolves candidates
 * in-page via `_run`/`_runSelected`. This class stores the candidates and the 1-based index of one
 * specific element within that candidate set, and re-resolves it on demand. It exists to give
 * `grabWebElement(s)` and `MultipleElementsFound.fetchDetails()` something to call
 * `toAbsoluteXPath()`/`toOuterHTML()` on, wrapped by `lib/element/WebElement.js`.
 */
class CDPElementHandle {
  constructor(helper, candidates, index) {
    this.helper = helper
    this.candidates = candidates
    this.index = index
  }

  async outerHTML() {
    const res = await this.helper._runSelected(this.candidates, 'outerHTML', null, { index: this.index })
    return res.result
  }

  async absoluteXPath() {
    const res = await this.helper._runSelected(this.candidates, 'absoluteXPath', null, { index: this.index })
    return res.result
  }
}

export default CDPElementHandle
