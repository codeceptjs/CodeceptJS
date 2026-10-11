import { expect } from 'chai'
import { ariaSnapshotFromAXNodes, ariaSnapshotFromTree, compactAriaSnapshot, diffAriaSnapshots } from '../../lib/aria.js'

const role = value => ({ type: 'role', value })
const name = value => ({ type: 'computedString', value })
const prop = (n, value) => ({ name: n, value: { type: 'token', value } })

const lightpandaNodes = [
  { nodeId: '1', backendDOMNodeId: 1, role: role('RootWebArea'), name: name('Checkout'), childIds: ['2'] },
  { nodeId: '2', backendDOMNodeId: 2, role: role('none'), childIds: ['3', '5', '7', '8'] },
  { nodeId: '3', backendDOMNodeId: 3, role: role('heading'), name: name('Checkout form'), properties: [{ name: 'level', value: { type: 'integer', value: 4 } }], childIds: ['4'] },
  { nodeId: '4', backendDOMNodeId: 4, role: role('StaticText'), name: name('Checkout form'), childIds: [] },
  { nodeId: '5', backendDOMNodeId: 5, role: role('form'), name: name(''), childIds: ['6', '9'] },
  { nodeId: '6', backendDOMNodeId: 6, role: role('textbox'), name: name('Promo code'), value: { type: 'string', value: 'SALE' }, properties: [prop('invalid', 'false')], childIds: [] },
  { nodeId: '7', backendDOMNodeId: 7, role: role('checkbox'), name: name('Same address'), value: { type: 'string', value: 'on' }, properties: [prop('checked', 'true')], childIds: [] },
  { nodeId: '8', backendDOMNodeId: 8, role: role('paragraph'), childIds: ['10'] },
  { nodeId: '9', backendDOMNodeId: 9, role: role('button'), name: name('Redeem'), childIds: ['11'] },
  { nodeId: '10', backendDOMNodeId: 10, role: role('StaticText'), name: name('Total: $20'), childIds: [] },
  { nodeId: '11', backendDOMNodeId: 11, role: role('StaticText'), name: name('Redeem'), childIds: [] },
]

const obscuraNodes = [
  { nodeId: '1', ignored: false, role: role('RootWebArea'), childIds: ['2'], backendDOMNodeId: 1 },
  { nodeId: '2', ignored: false, role: role('generic'), childIds: ['3', '5'], backendDOMNodeId: 2 },
  { nodeId: '3', ignored: false, role: role('button'), properties: [{ name: 'focusable', value: { type: 'boolean', value: true } }], childIds: ['4'], backendDOMNodeId: 3 },
  { nodeId: '4', ignored: false, role: role('StaticText'), name: { type: 'string', value: 'Redeem' }, backendDOMNodeId: 4 },
  { nodeId: '5', ignored: false, role: role('heading'), properties: [{ name: 'level', value: { type: 'integer', value: 2 } }], childIds: ['6'], backendDOMNodeId: 5 },
  { nodeId: '6', ignored: false, role: role('LabelText'), childIds: ['7'], backendDOMNodeId: 6 },
  { nodeId: '7', ignored: false, role: role('StaticText'), name: { type: 'string', value: 'Billing address' }, backendDOMNodeId: 7 },
]

describe('aria', () => {
  describe('#ariaSnapshotFromAXNodes', () => {
    it('renders a Lightpanda accessibility tree as an ARIA snapshot', () => {
      expect(ariaSnapshotFromAXNodes(lightpandaNodes)).to.equal(
        [
          '- heading "Checkout form" [level=4]',
          '- form:',
          '  - textbox "Promo code": SALE',
          '  - button "Redeem"',
          '- checkbox "Same address" [checked]',
          '- paragraph:',
          '  - text: "Total: $20"',
        ].join('\n'),
      )
    })

    it('names buttons and headings from their text when the engine leaves names empty', () => {
      expect(ariaSnapshotFromAXNodes(obscuraNodes)).to.equal(['- button "Redeem"', '- heading "Billing address" [level=2]'].join('\n'))
    })

    it('scopes the snapshot to an element by its backend node id', () => {
      expect(ariaSnapshotFromAXNodes(lightpandaNodes, 5)).to.equal(['- form:', '  - textbox "Promo code": SALE', '  - button "Redeem"'].join('\n'))
    })

    it('returns an empty snapshot when the element is not in the tree', () => {
      expect(ariaSnapshotFromAXNodes(lightpandaNodes, 999)).to.equal('')
    })

    it('produces snapshots that compact and diff like Playwright ones', () => {
      const before = ariaSnapshotFromAXNodes(lightpandaNodes)
      const after = ariaSnapshotFromAXNodes(lightpandaNodes.filter(node => node.nodeId !== '9'))
      expect(compactAriaSnapshot(before)).to.include('button "Redeem"')
      expect(diffAriaSnapshots(before, after)).to.include('removed: 1 interactive elements')
    })
  })

  describe('#ariaSnapshotFromTree', () => {
    it('renders a Puppeteer accessibility snapshot', () => {
      const tree = {
        role: 'RootWebArea',
        name: 'Login',
        children: [
          { role: 'heading', name: 'Sign "in"', level: 1, children: [{ role: 'StaticText', name: 'Sign "in"', children: [{ role: 'InlineTextBox', name: 'Sign "in"' }] }] },
          { role: 'textbox', name: 'Email', value: '' },
          { role: 'checkbox', name: 'Remember me', checked: 'mixed' },
          { role: 'button', name: 'Submit', disabled: true },
          { role: 'image', name: 'Logo' },
        ],
      }
      expect(ariaSnapshotFromTree(tree)).to.equal(
        ['- heading "Sign \\"in\\"" [level=1]', '- textbox "Email"', '- checkbox "Remember me" [checked=mixed]', '- button "Submit" [disabled]', '- img "Logo"'].join('\n'),
      )
    })

    it('returns an empty snapshot for an empty tree', () => {
      expect(ariaSnapshotFromTree(null)).to.equal('')
    })
  })
})
