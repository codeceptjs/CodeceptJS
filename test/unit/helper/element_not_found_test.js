import { expect } from 'chai'

import ElementNotFound from '../../../lib/helper/errors/ElementNotFound.js'
import Container from '../../../lib/container.js'

const locator = '#invalidSelector'

describe('ElementNotFound error', () => {
  afterEach(() => Container.clear())

  it('should be an error', () => {
    expect(new ElementNotFound(locator)).to.be.instanceOf(Error)
  })

  it('should provide default message', () => {
    expect(new ElementNotFound(locator).message).to.equal('Element "#invalidSelector" was not found by text|CSS|XPath')
  })

  it('should use prefix for message', () => {
    expect(new ElementNotFound(locator, 'Field').message).to.equal('Field "#invalidSelector" was not found by text|CSS|XPath')
  })

  it('should use postfix for message', () => {
    expect(new ElementNotFound(locator, 'Locator', 'cannot be found').message).to.equal('Locator "#invalidSelector" cannot be found')
  })

  it('should stringify locator object', () => {
    const objectLocator = { css: locator }
    expect(new ElementNotFound(objectLocator).message).to.equal(`Element "${JSON.stringify(objectLocator)}" was not found by text|CSS|XPath`)
  })

  it('should keep the message when no helper can run scripts', async () => {
    const err = new ElementNotFound('#emial', 'Field')
    await err.explain()
    expect(err.message).to.equal('Field "#emial" was not found by text|CSS|XPath')
  })

  it('should add hints from the page', async () => {
    const info = { count: 0, hidden: 0, frames: [{ selector: '[name="content"]', count: 1 }], names: [], tokens: ['email', 'password'] }
    Container.append({ helpers: { web: { executeScript: async () => info } } })
    const err = new ElementNotFound('#emial', 'Field')
    expect(err.message).to.equal('Field "#emial" was not found by text|CSS|XPath')
    await err.explain()
    expect(err.message.split('\n')).to.deep.equal([
      'Field "#emial" was not found by text|CSS|XPath',
      `  found 1 match inside iframe [name="content"], use within({ frame: '[name="content"]' })`,
      '  similar on page: #email',
    ])
    expect(err.stack).to.include('similar on page: #email')
  })

  it('should keep the message when the page script fails', async () => {
    Container.append({ helpers: { web: { executeScript: async () => { throw new Error('page closed') } } } })
    const err = new ElementNotFound('Sign in')
    await err.explain()
    expect(err.message).to.equal('Element "Sign in" was not found by text|CSS|XPath')
  })

  it('should give up on a page that does not answer', async () => {
    Container.append({ helpers: { web: { executeScript: () => new Promise(() => {}) } } })
    const err = new ElementNotFound('Sign in')
    const started = Date.now()
    await err.explain()
    expect(Date.now() - started).to.be.below(1000)
    expect(err.message).to.equal('Element "Sign in" was not found by text|CSS|XPath')
  })
})
