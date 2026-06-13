import { expect } from 'chai'
import recorder from '../../lib/recorder.js'
import container from '../../lib/container.js'
import event from '../../lib/event.js'
import store from '../../lib/store.js'
import session from '../../lib/session.js'
import { within, retryTo, hopeThat } from '../../lib/effects.js'

const settles = (promise, ms = 2000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      const t = setTimeout(() => reject(new Error(`did not settle within ${ms}ms`)), ms)
      t.unref?.()
    }),
  ])

// Re-reads recorder.promise() repeatedly so errors attached to trailing tasks
// (added while the chain runs) are surfaced. Returns the last error seen, or
// undefined if the chain settled cleanly.
async function drain(times = 5, ms = 700) {
  let err
  for (let i = 0; i < times; i++) {
    try {
      await settles(Promise.resolve(recorder.promise()), ms)
    } catch (e) {
      err = e
    }
  }
  return err
}

function makeFakeHelper() {
  const calls = { start: 0, stop: 0, loadVars: 0, restoreVars: 0, withinBegin: 0, withinEnd: 0 }
  return {
    calls,
    _session() {
      return {
        start: async () => {
          calls.start++
          return { token: 'vars' }
        },
        stop: async () => {
          calls.stop++
        },
        loadVars: async () => {
          calls.loadVars++
        },
        restoreVars: async () => {
          calls.restoreVars++
        },
      }
    },
    async _withinBegin() {
      calls.withinBegin++
    },
    async _withinEnd() {
      calls.withinEnd++
    },
  }
}

describe('promise-core composition (characterization)', () => {
  let helper

  beforeEach(async () => {
    // Flush any trailing async work from a previous test against a stopped
    // recorder so stragglers cannot mutate this test's state mid-run.
    recorder.stop()
    await new Promise(r => setTimeout(r, 40))
    store.dryRun = false
    helper = makeFakeHelper()
    await container.clear({ Fake: helper })
    recorder.retries = []
    recorder.reset()
    recorder.start()
  })

  afterEach(async () => {
    event.cleanDispatcher()
    await container.clear({})
  })

  describe('session()', () => {
    it('happy path loads and restores vars and resumes the outer chain', async () => {
      let inside = false
      session('happy', async () => {
        recorder.add(() => (inside = true))
      })
      await settles(recorder.promise())
      expect(helper.calls.loadVars, 'loadVars').to.be.greaterThan(0)
      expect(helper.calls.restoreVars, 'restoreVars').to.be.greaterThan(0)
      expect(inside).to.equal(true)
      expect(recorder.getCurrentSessionId()).to.equal(null)
    })

    it('FINDING: async callback error leaks the session id and never calls recorder.session.restore', async () => {
      session('asyncerr', async () => {
        throw new Error('boom')
      })
      let rejected
      await settles(recorder.promise()).catch(e => (rejected = e))
      // characterized behavior, see plans/001-findings.md
      expect(rejected, 'outer chain rejects').to.be.instanceof(Error)
      expect(rejected.message).to.equal('boom')
      expect(recorder.getCurrentSessionId(), 'session id leaks').to.equal('session:asyncerr')
    })

    it('FINDING: sync callback whose queued task throws restores vars but leaks the session id', async () => {
      session('syncerr', () => {
        recorder.add(() => {
          throw new Error('boomsync')
        })
      })
      const err = await drain()
      // The finally recorder.catch re-throws before finalize() runs
      // recorder.session.restore, so the session id leaks. See plans/001-findings.md
      expect(err, 'error surfaces after draining').to.be.instanceof(Error)
      expect(err.message).to.equal('boomsync')
      expect(helper.calls.restoreVars, 'restoreVars called by the finally handler').to.equal(1)
      expect(recorder.getCurrentSessionId(), 'session id leaks').to.equal('session:syncerr')
    })
  })

  describe('within()', () => {
    it('happy path runs _withinBegin and _withinEnd around the callback', async () => {
      let inside = false
      within('ctx', async () => {
        recorder.add(() => (inside = true))
      })
      await settles(recorder.promise())
      expect(helper.calls.withinBegin, 'withinBegin').to.be.greaterThan(0)
      expect(helper.calls.withinEnd, 'withinEnd').to.be.greaterThan(0)
      expect(inside).to.equal(true)
    })

    it('FINDING: async callback error skips _withinEnd and detaches the error onto a trailing task', async () => {
      within('ctx', async () => {
        throw new Error('boomwithin')
      })
      const err = await drain()
      // The error is only visible after draining trailing tasks because within()'s
      // async catch omits `return recorder.promise()`. See plans/001-findings.md
      expect(err, 'error surfaces after draining').to.be.instanceof(Error)
      expect(err.message).to.equal('boomwithin')
      expect(helper.calls.withinBegin, '_withinBegin ran').to.be.greaterThan(0)
      expect(helper.calls.withinEnd, '_withinEnd skipped on error').to.equal(0)
    })
  })

  describe('retryTo()', () => {
    it('FINDING: a synchronously-throwing callback rejects but keeps retrying past the rejection', async () => {
      let firstTries
      let calls = 0
      let rejected
      await settles(
        retryTo(
          tries => {
            if (firstTries === undefined) firstTries = tries
            calls++
            throw new Error('always')
          },
          3,
          20,
        ),
        3000,
      ).catch(e => (rejected = e))
      await new Promise(r => setTimeout(r, 300))
      const finalCalls = calls
      await new Promise(r => setTimeout(r, 300))
      // characterized behavior, see plans/001-findings.md
      expect(rejected, 'retryTo rejects with the real error').to.be.instanceof(Error)
      expect(rejected.message).to.equal('always')
      expect(firstTries, 'first attempt receives tries === 2 (tries starts at 1, incremented before callback)').to.equal(2)
      expect(calls, 'retrying continues past the first rejection').to.be.greaterThan(1)
      expect(calls, 'retries stop once drained (no perpetual loop)').to.equal(finalCalls)
    })

    it('retries via recorder failures then resolves', async () => {
      let calls = 0
      await retryTo(
        () => {
          recorder.add(() => {
            calls++
            if (calls < 3) throw new Error('retry me')
          })
        },
        5,
        20,
      )
      await settles(recorder.promise())
      expect(calls, 'callback body ran until success').to.equal(3)
    })
  })

  describe('hopeThat()', () => {
    it('soft failure resolves false and the chain continues for the next hopeThat', async () => {
      const first = await hopeThat(() =>
        recorder.add(() => {
          throw new Error('soft')
        }),
      )
      const second = await hopeThat(() => recorder.add(() => true))
      await settles(recorder.promise())
      expect(first, 'first hopeThat is false').to.equal(false)
      expect(second, 'second hopeThat is true').to.equal(true)
    })
  })
})
