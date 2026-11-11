import { expect } from 'chai'
import { ariaSnapshotFromAXNodes, ariaSnapshotFromTree, compactAriaSnapshot, diffAriaSnapshots } from '../../lib/aria.js'

const axNode = (nodeId, role, name, childIds = []) => ({ nodeId, backendDOMNodeId: Number(nodeId), role: { value: role }, name: name === undefined ? undefined : { value: name }, childIds })

const axNodes = [
  axNode('1', 'generic', undefined, ['2', '4', '6']),
  axNode('2', 'heading', 'Checkout', ['3']),
  axNode('3', 'StaticText', 'Checkout'),
  axNode('4', 'form', '', ['5', '7']),
  axNode('5', 'textbox', 'Promo code'),
  axNode('6', 'StaticText', 'Total: $20'),
  axNode('7', 'button', undefined, ['8']),
  axNode('8', 'StaticText', 'Redeem'),
]

describe('aria', () => {
  it('renders a CDP accessibility tree from a DOM node', () => {
    expect(ariaSnapshotFromAXNodes(axNodes, 1)).to.equal(
      ['- heading "Checkout"', '- form:', '  - textbox "Promo code"', '  - button:', '    - text: "Redeem"', '- text: "Total: $20"'].join('\n'),
    )
    expect(ariaSnapshotFromAXNodes(axNodes, 4)).to.equal(['- form:', '  - textbox "Promo code"', '  - button:', '    - text: "Redeem"'].join('\n'))
    expect(ariaSnapshotFromAXNodes(axNodes, 999)).to.equal('')
  })

  it('renders a Puppeteer accessibility tree', () => {
    const tree = { role: 'RootWebArea', children: [{ role: 'button', name: 'Submit', children: [{ role: 'StaticText', name: 'Submit' }] }] }
    expect(ariaSnapshotFromTree(tree)).to.equal('- button "Submit"')
    expect(ariaSnapshotFromTree(null)).to.equal('')
  })

  it('produces snapshots that compact and diff', () => {
    const before = ariaSnapshotFromAXNodes(axNodes, 1)
    const after = ariaSnapshotFromAXNodes(axNodes.filter(node => node.nodeId !== '5'), 1)
    expect(compactAriaSnapshot(before)).to.include('textbox "Promo code"')
    expect(diffAriaSnapshots(before, after)).to.include('removed: 1 interactive elements')
  })

  it('keeps plain text nodes when compacting', () => {
    const snapshot = ['- list:', '  - listitem:', '    - checkbox', '    - text: buy milk', '- text: 1 item left!'].join('\n')
    const compacted = compactAriaSnapshot(snapshot)
    expect(compacted).to.include('text: buy milk')
    expect(compacted).to.include('text: 1 item left!')
  })
})
