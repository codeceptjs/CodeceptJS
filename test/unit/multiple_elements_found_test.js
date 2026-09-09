import { expect } from 'chai'
import MultipleElementsFound, {
  computeDepths,
  formatTree,
  isAncestorXPath,
  splitXPath,
} from '../../lib/helper/errors/MultipleElementsFound.js'

function stubWebElement(xpath, html, shouldThrow) {
  return {
    toAbsoluteXPath: async () => {
      if (shouldThrow) throw new Error('detached')
      return xpath
    },
    toSimplifiedHTML: async () => {
      if (shouldThrow) throw new Error('detached')
      return html
    },
  }
}

describe('MultipleElementsFound tree formatting', () => {
  it('splits xpath into segments', () => {
    expect(splitXPath('//html/body/div[1]/span')).to.deep.equal(['html', 'body', 'div[1]', 'span'])
    expect(splitXPath('')).to.deep.equal([])
    expect(splitXPath(null)).to.deep.equal([])
  })

  it('detects ancestor by segments, not string prefix', () => {
    expect(isAncestorXPath('//html/body/div[1]', '//html/body/div[1]/span')).to.equal(true)
    expect(isAncestorXPath('//html/body/div[1]', '//html/body/div[10]')).to.equal(false)
    expect(isAncestorXPath('//html/body/div[1]', '//html/body/div[1]')).to.equal(false)
    expect(isAncestorXPath('//html/body/div[1]/span', '//html/body/div[1]')).to.equal(false)
    expect(isAncestorXPath(null, '//html/body')).to.equal(false)
  })

  it('keeps siblings at depth 0', () => {
    const entries = [
      { index: 1, xpath: '//html/body/button[1]', html: '<button>1</button>' },
      { index: 2, xpath: '//html/body/button[2]', html: '<button>2</button>' },
    ]
    expect(computeDepths(entries)).to.deep.equal([0, 0])
  })

  it('indents children of a matched parent', () => {
    const entries = [
      { index: 1, xpath: '//html/body/div[1]', html: '<div class="item">' },
      { index: 2, xpath: '//html/body/div[1]/div[1]', html: '<div class="item">' },
      { index: 3, xpath: '//html/body/div[1]/div[2]', html: '<div class="item">' },
    ]
    expect(computeDepths(entries)).to.deep.equal([0, 1, 1])
    const items = formatTree(entries, [0, 1, 1])
    expect(items[0]).to.equal('  1. > //html/body/div[1]\n     <div class="item">')
    expect(items[1]).to.equal('    2. > //html/body/div[1]/div[1]\n       <div class="item">')
    expect(items[2]).to.equal('    3. > //html/body/div[1]/div[2]\n       <div class="item">')
  })

  it('supports deeper nesting and returns to root level', () => {
    const entries = [
      { index: 1, xpath: '//html/body/div[1]', html: '<div>' },
      { index: 2, xpath: '//html/body/div[1]/ul', html: '<ul>' },
      { index: 3, xpath: '//html/body/div[1]/ul/li', html: '<li>' },
      { index: 4, xpath: '//html/body/div[2]', html: '<div>' },
    ]
    expect(computeDepths(entries)).to.deep.equal([0, 1, 2, 0])
  })

  it('renders failed lookups as roots and keeps global numbering', async () => {
    const err = new MultipleElementsFound('.item', [
      stubWebElement('//html/body/div[1]', '<div class="item">'),
      stubWebElement(null, null, true),
      stubWebElement('//html/body/div[1]/div[1]', '<div class="item">'),
    ])
    await err.fetchDetails()
    expect(err.message).to.include('  1. > //html/body/div[1]')
    expect(err.message).to.include('  2. [Unable to get element info: detached]')
    expect(err.message).to.include('  3. > //html/body/div[1]/div[1]')
  })

  it('renders nested fetchDetails output with indentation', async () => {
    const err = new MultipleElementsFound('.item', [
      stubWebElement('//html/body/div[1]', '<div class="item">'),
      stubWebElement('//html/body/div[1]/div[1]', '<div class="item">'),
      stubWebElement('//html/body/div[1]/div[2]', '<div class="item">'),
    ])
    await err.fetchDetails()
    const lines = err.message.split('\n')
    expect(lines[1]).to.equal('  1. > //html/body/div[1]')
    expect(lines[3]).to.equal('    2. > //html/body/div[1]/div[1]')
    expect(lines[5]).to.equal('    3. > //html/body/div[1]/div[2]')
    expect(err.message).to.include('Use a more specific locator')
  })
})
