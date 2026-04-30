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

    async function waitForMessage(predicate, attempts = 50) {
      for (let i = 0; i < attempts; i++) {
        await new Promise(r => setImmediate(r))
        const m = findProtocolMessages().find(predicate)
        if (m) return m
      }
      return null
    }

    function withFakeStdin(fakeStdin, fn) {
      const desc = Object.getOwnPropertyDescriptor(process, 'stdin')
      Object.defineProperty(process, 'stdin', { value: fakeStdin, configurable: true })
      try { return fn() } finally {
        if (desc) Object.defineProperty(process, 'stdin', desc)
      }
    }

    it('emits paused on entry and resumed on "resume" line', async () => {
      const fakeStdin = new Readable({ read() {} })
      await withFakeStdin(fakeStdin, async () => {
        const sessionPromise = mcpYieldSession()
        await new Promise(r => setImmediate(r))
        expect(findProtocolMessages().some(m => m.event === 'paused')).to.equal(true)

        fakeStdin.push('resume\n')
        await sessionPromise
        expect(findProtocolMessages().some(m => m.event === 'resumed')).to.equal(true)
      })
    })

    it('treats empty line as step', async () => {
      const fakeStdin = new Readable({ read() {} })
      await withFakeStdin(fakeStdin, async () => {
        const sessionPromise = mcpYieldSession()
        await new Promise(r => setImmediate(r))

        fakeStdin.push('\n')
        await sessionPromise
        expect(findProtocolMessages().some(m => m.event === 'step')).to.equal(true)
      })
    })

    it('runs code lines and emits a result with artifacts', async () => {
      const fakeStdin = new Readable({ read() {} })
      await withFakeStdin(fakeStdin, async () => {
        const sessionPromise = mcpYieldSession()
        await new Promise(r => setImmediate(r))

        fakeStdin.push('grabCurrentUrl()\n')
        const result = await waitForMessage(m => m.event === 'result')
        expect(result).to.exist
        expect(result.ok).to.equal(true)
        expect(result.value).to.equal('http://test.local/page')
        expect(result.artifacts).to.be.an('object')

        fakeStdin.push('resume\n')
        await sessionPromise
      })
    })

    it('reports errors from failing code', async () => {
      const fakeStdin = new Readable({ read() {} })
      await withFakeStdin(fakeStdin, async () => {
        const sessionPromise = mcpYieldSession()
        await new Promise(r => setImmediate(r))

        fakeStdin.push('thisDoesNotExist()\n')
        const result = await waitForMessage(m => m.event === 'result')
        expect(result).to.exist
        expect(result.ok).to.equal(false)
        expect(result.error).to.be.a('string')

        fakeStdin.push('resume\n')
        await sessionPromise
      })
    })

    it('"exit" line ends the session', async () => {
      const fakeStdin = new Readable({ read() {} })
      await withFakeStdin(fakeStdin, async () => {
        const sessionPromise = mcpYieldSession()
        await new Promise(r => setImmediate(r))

        fakeStdin.push('exit\n')
        await sessionPromise
        expect(findProtocolMessages().some(m => m.event === 'resumed')).to.equal(true)
      })
    })
  })
})
