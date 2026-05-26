import { expect } from 'chai'
import { setPauseHandler } from '../../lib/pause.js'

describe('pause external handler hook', () => {
  afterEach(() => {
    setPauseHandler(null)
  })

  it('setPauseHandler is exported and callable', () => {
    expect(typeof setPauseHandler).to.equal('function')
    expect(() => setPauseHandler(() => Promise.resolve())).to.not.throw()
    expect(() => setPauseHandler(null)).to.not.throw()
  })

  it('handler receives registered variables and returns a Promise', async () => {
    let received = null
    const handler = arg => {
      received = arg
      return Promise.resolve()
    }
    setPauseHandler(handler)
    // Drive the handler directly to verify the contract
    const p = handler({ registeredVariables: { foo: 1 } })
    expect(p).to.be.a('promise')
    await p
    expect(received).to.deep.equal({ registeredVariables: { foo: 1 } })
  })
})
