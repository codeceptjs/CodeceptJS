import { expect } from 'chai'
import Locator from '../../../lib/locator.js'
import { buildLocatorString } from '../../../lib/helper/Playwright.js'

describe('buildLocatorString', () => {
  it('should make plain XPath relative', () => {
    const locator = new Locator({ xpath: '//div' })
    expect(buildLocatorString(locator)).to.equal('xpath=.//div')
  })

  it('should make XPath with parentheses (from at()) relative', () => {
    const locator = new Locator('.item').at(1)
    const result = buildLocatorString(locator)
    expect(result).to.match(/^xpath=\(\.\/\//)
  })

  it('should make XPath from at().find() relative', () => {
    const locator = new Locator('.item').at(1).find('.label')
    const result = buildLocatorString(locator)
    expect(result).to.match(/^xpath=\(\.\/\//)
  })

  it('should make XPath from first() relative', () => {
    const locator = new Locator('.item').first()
    const result = buildLocatorString(locator)
    expect(result).to.match(/^xpath=\(\.\/\//)
  })

  it('should make XPath from last() relative', () => {
    const locator = new Locator('.item').last()
    const result = buildLocatorString(locator)
    expect(result).to.match(/^xpath=\(\.\/\//)
  })

  it('should not double-prefix already relative XPath', () => {
    const locator = new Locator({ xpath: './/div' })
    expect(buildLocatorString(locator)).to.equal('xpath=.//div')
  })

  it('should handle XPath that was already relative inside parentheses', () => {
    const locator = new Locator({ xpath: '(.//div)[1]' })
    expect(buildLocatorString(locator)).to.equal('xpath=(.//div)[1]')
  })

  it('should return CSS locators unchanged', () => {
    const locator = new Locator('.my-class')
    expect(buildLocatorString(locator)).to.equal('.my-class')
  })
})
