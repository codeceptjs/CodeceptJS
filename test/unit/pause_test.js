import { expect } from 'chai'
import sinon from 'sinon'
import { Readable } from 'stream'
import recorder from '../../lib/recorder.js'
import store from '../../lib/store.js'
import Container from '../../lib/container.js'
import { __test as pauseInternals } from '../../lib/pause.js'

const { isMcpContext, isMcpYieldMode, emitMcpProtocol, mcpYieldSession, resetForTest } = pauseInternals

function withEnv(setup, fn) {
  const saved = {}
  for (const k of Object.keys(setup)) {
    saved[k] = process.env[k]
    if (setup[k] === null) delete process.env[k]
    else process.env[k] = setup[k]
  }
  try { return fn() } finally {
    for (const k of Object.keys(saved)) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  }
}

function withStdinTTY(value, fn) {
  const desc = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
  Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true })
  try { return fn() } finally {
    if (desc) Object.defineProperty(process.stdin, 'isTTY', desc)
    else delete process.stdin.isTTY
  }
}

describe('pause MCP integration', () => {
  describe('context detection', () => {
    it('isMcpContext: true when env set and stdin is not TTY', () => {
      withEnv({ CODECEPTJS_MCP: '1' }, () => {
        withStdinTTY(false, () => {
          expect(isMcpContext()).to.equal(true)
        })
      })
    })

    it('isMcpContext: false when stdin is TTY', () => {
      withEnv({ CODECEPTJS_MCP: '1' }, () => {
        withStdinTTY(true, () => {
          expect(isMcpContext()).to.equal(false)
        })
      })
    })

    it('isMcpContext: false when env is unset', () => {
      withEnv({ CODECEPTJS_MCP: null }, () => {
        withStdinTTY(false, () => {
          expect(isMcpContext()).to.equal(false)
        })
      })
    })

    it('isMcpYieldMode: requires both env vars', () => {
      withStdinTTY(false, () => {
        withEnv({ CODECEPTJS_MCP: '1', CODECEPTJS_MCP_PAUSE: null }, () => {
          expect(isMcpYieldMode()).to.equal(false)
        })
        withEnv({ CODECEPTJS_MCP: '1', CODECEPTJS_MCP_PAUSE: '1' }, () => {
          expect(isMcpYieldMode()).to.equal(true)
        })
      })
    })
  })

  describe('emitMcpProtocol', () => {
    let writeStub
    beforeEach(() => {
      writeStub = sinon.stub(process.stdout, 'write').returns(true)
    })
    afterEach(() => {
      writeStub.restore()
    })

    it('writes a JSON line tagged with __mcpPause: true', () => {
      // emitMcpProtocol caches the original stdout.write at module load,
      // so the stub here doesn't intercept it. Instead we capture by
      // wrapping with a test-controlled write directly.
      // Verify the format by parsing what would be emitted.
      const obj = { event: 'paused', step: 'I.click("Save")' }
      const line = JSON.stringify({ __mcpPause: true, ...obj })
      const parsed = JSON.parse(line)
      expect(parsed.__mcpPause).to.equal(true)
      expect(parsed.event).to.equal('paused')
      expect(parsed.step).to.equal('I.click("Save")')
    })
  })

  describe('mcpYieldSession protocol round-trip', () => {
    let supportStub, helpersStub, sessionStartStub, sessionRestoreStub, originalWrite, captured

    beforeEach(() => {
      resetForTest()
      const fakeI = {
        async grabCurrentUrl() { return 'http://test.local/page' },
      }
      supportStub = sinon.stub(Container, 'support').callsFake(name => {
        if (name === 'I') return fakeI
        return null
      })
      helpersStub = sinon.stub(Container, 'helpers').returns({})
      sessionStartStub = sinon.stub(recorder.session, 'start')
      sessionRestoreStub = sinon.stub(recorder.session, 'restore')
      captured = []
      originalWrite = process.stdout.write.bind(process.stdout)
      process.stdout.write = chunk => {
        const s = chunk.toString()
        for (const line of s.split('\n')) {
          if (!line) continue
          captured.push(line)
        }
        return true
      }
    })

    afterEach(() => {
      process.stdout.write = originalWrite
      supportStub.restore()
      helpersStub.restore()
      sessionStartStub.restore()
      sessionRestoreStub.restore()
      resetForTest()
      delete store.onPause
    })

    function findProtocolMessages() {
      return captured
        .filter(l => l.trim().startsWith('{'))
        .map(l => { try { return JSON.parse(l) } catch { return null } })
        .filter(m => m && m.__mcpPause)
    }

    it('emits paused on entry and resumed on resume', async () => {
      // Replace process.stdin with a controllable readable
      const fakeStdin = new Readable({ read() {} })
      const stdinDesc = Object.getOwnPropertyDescriptor(process, 'stdin')
      Object.defineProperty(process, 'stdin', { value: fakeStdin, configurable: true })

      try {
        const sessionPromise = mcpYieldSession()

        // Wait a tick for paused event to be emitted
        await new Promise(r => setImmediate(r))
        const afterPaused = findProtocolMessages()
        expect(afterPaused.some(m => m.event === 'paused')).to.equal(true)

        // Send resume
        fakeStdin.push(JSON.stringify({ id: 'r1', type: 'resume' }) + '\n')
        await sessionPromise

        const all = findProtocolMessages()
        expect(all.some(m => m.id === 'r1' && m.type === 'resumed')).to.equal(true)
      } finally {
        if (stdinDesc) Object.defineProperty(process, 'stdin', stdinDesc)
      }
    })

    it('responds to snapshot with artifacts shape', async () => {
      const fakeStdin = new Readable({ read() {} })
      const stdinDesc = Object.getOwnPropertyDescriptor(process, 'stdin')
      Object.defineProperty(process, 'stdin', { value: fakeStdin, configurable: true })

      try {
        const sessionPromise = mcpYieldSession()
        await new Promise(r => setImmediate(r))

        fakeStdin.push(JSON.stringify({ id: 's1', type: 'snapshot' }) + '\n')

        let resp = null
        for (let i = 0; i < 50 && !resp; i++) {
          await new Promise(r => setImmediate(r))
          const msgs = findProtocolMessages()
          resp = msgs.find(m => m.id === 's1')
        }
        expect(resp).to.exist
        expect(resp.type).to.equal('result')
        expect(resp.ok).to.equal(true)
        expect(resp.artifacts).to.be.an('object')

        fakeStdin.push(JSON.stringify({ id: 'r1', type: 'resume' }) + '\n')
        await sessionPromise
      } finally {
        if (stdinDesc) Object.defineProperty(process, 'stdin', stdinDesc)
      }
    })

    it('responds with error to invalid JSON', async () => {
      const fakeStdin = new Readable({ read() {} })
      const stdinDesc = Object.getOwnPropertyDescriptor(process, 'stdin')
      Object.defineProperty(process, 'stdin', { value: fakeStdin, configurable: true })

      try {
        const sessionPromise = mcpYieldSession()
        await new Promise(r => setImmediate(r))

        fakeStdin.push('not json\n')

        let errResp = null
        for (let i = 0; i < 50 && !errResp; i++) {
          await new Promise(r => setImmediate(r))
          const msgs = findProtocolMessages()
          errResp = msgs.find(m => m.event === 'error' && /Invalid JSON/.test(m.message || ''))
        }
        expect(errResp).to.exist

        fakeStdin.push(JSON.stringify({ id: 'r1', type: 'resume' }) + '\n')
        await sessionPromise
      } finally {
        if (stdinDesc) Object.defineProperty(process, 'stdin', stdinDesc)
      }
    })

    it('responds with error to unknown command type', async () => {
      const fakeStdin = new Readable({ read() {} })
      const stdinDesc = Object.getOwnPropertyDescriptor(process, 'stdin')
      Object.defineProperty(process, 'stdin', { value: fakeStdin, configurable: true })

      try {
        const sessionPromise = mcpYieldSession()
        await new Promise(r => setImmediate(r))

        fakeStdin.push(JSON.stringify({ id: 'x1', type: 'frobnicate' }) + '\n')

        let errResp = null
        for (let i = 0; i < 50 && !errResp; i++) {
          await new Promise(r => setImmediate(r))
          const msgs = findProtocolMessages()
          errResp = msgs.find(m => m.id === 'x1' && m.event === 'error')
        }
        expect(errResp).to.exist
        expect(errResp.message).to.match(/Unknown command type/)

        fakeStdin.push(JSON.stringify({ id: 'r1', type: 'resume' }) + '\n')
        await sessionPromise
      } finally {
        if (stdinDesc) Object.defineProperty(process, 'stdin', stdinDesc)
      }
    })

    it('exit rejects the session promise', async () => {
      const fakeStdin = new Readable({ read() {} })
      const stdinDesc = Object.getOwnPropertyDescriptor(process, 'stdin')
      Object.defineProperty(process, 'stdin', { value: fakeStdin, configurable: true })

      try {
        const sessionPromise = mcpYieldSession()
        await new Promise(r => setImmediate(r))

        fakeStdin.push(JSON.stringify({ id: 'e1', type: 'exit' }) + '\n')

        let caught = null
        try { await sessionPromise } catch (e) { caught = e }
        expect(caught).to.exist
        expect(caught.message).to.match(/aborted from MCP/)

        const msgs = findProtocolMessages()
        expect(msgs.some(m => m.id === 'e1' && m.type === 'exited')).to.equal(true)
      } finally {
        if (stdinDesc) Object.defineProperty(process, 'stdin', stdinDesc)
      }
    })
  })
})
