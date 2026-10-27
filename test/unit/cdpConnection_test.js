import { expect } from 'chai'
import { WebSocketServer } from 'ws'
import CDPConnection from '../../lib/helper/extras/CDPConnection.js'

describe('CDPConnection', () => {
  let server
  let port

  before(done => {
    server = new WebSocketServer({ port: 0 }, () => {
      port = server.address().port
      done()
    })
    server.on('connection', ws => {
      ws.on('message', raw => {
        const msg = JSON.parse(raw.toString())
        if (msg.method === 'Test.echo') {
          ws.send(JSON.stringify({ id: msg.id, result: { echo: msg.params.value }, sessionId: msg.sessionId }))
        }
        if (msg.method === 'Test.fail') {
          ws.send(JSON.stringify({ id: msg.id, error: { message: 'boom' } }))
        }
        if (msg.method === 'Test.event') {
          ws.send(JSON.stringify({ method: 'Custom.fired', params: { ok: true }, sessionId: 's1' }))
          ws.send(JSON.stringify({ id: msg.id, result: {} }))
        }
      })
    })
  })

  after(() => server.close())

  it('sends a command and resolves with result', async () => {
    const cdp = await new CDPConnection(`ws://127.0.0.1:${port}`).connect()
    const res = await cdp.send('Test.echo', { value: 42 }, 'sess-1')
    expect(res.echo).to.equal(42)
    await cdp.close()
  })

  it('rejects on CDP error response', async () => {
    const cdp = await new CDPConnection(`ws://127.0.0.1:${port}`).connect()
    try {
      await cdp.send('Test.fail')
      throw new Error('should have rejected')
    } catch (err) {
      expect(err.message).to.equal('boom')
    }
    await cdp.close()
  })

  it('dispatches events to listeners with sessionId', async () => {
    const cdp = await new CDPConnection(`ws://127.0.0.1:${port}`).connect()
    const fired = new Promise(resolve => cdp.on('Custom.fired', (params, sessionId) => resolve({ params, sessionId })))
    await cdp.send('Test.event')
    const ev = await fired
    expect(ev.params.ok).to.equal(true)
    expect(ev.sessionId).to.equal('s1')
    await cdp.close()
  })

  it('rejects pending commands when connection closes', async () => {
    const cdp = await new CDPConnection(`ws://127.0.0.1:${port}`).connect()
    const pending = cdp.send('Test.never')
    await cdp.close()
    try {
      await pending
      throw new Error('should have rejected')
    } catch (err) {
      expect(err.message).to.match(/closed/)
    }
  })

  it('reports isConnected correctly', async () => {
    const cdp = new CDPConnection(`ws://127.0.0.1:${port}`)
    expect(cdp.isConnected).to.equal(false)
    await cdp.connect()
    expect(cdp.isConnected).to.equal(true)
    await cdp.close()
    expect(cdp.isConnected).to.equal(false)
  })

  it('throwing listener does not prevent other listeners from firing', async () => {
    const cdp = await new CDPConnection(`ws://127.0.0.1:${port}`).connect()
    const secondListenerFired = new Promise(resolve => {
      cdp.on('Custom.fired', () => {
        throw new Error('listener error')
      })
      cdp.on('Custom.fired', (params) => {
        resolve(params)
      })
    })
    await cdp.send('Test.event')
    const params = await secondListenerFired
    expect(params.ok).to.equal(true)
    const res = await cdp.send('Test.echo', { value: 99 })
    expect(res.echo).to.equal(99)
    await cdp.close()
  })

  it('send on never-connected instance rejects immediately', async () => {
    const cdp = new CDPConnection(`ws://127.0.0.1:${port}`)
    try {
      await cdp.send('Test.echo', { value: 42 })
      throw new Error('should have rejected')
    } catch (err) {
      expect(err.message).to.match(/not open/)
    }
  })
})
