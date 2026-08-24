import { expect } from 'chai'
import recorder from '../../lib/recorder.js'
import { TimeoutError } from '../../lib/timeout.js'

describe('Recorder', () => {
  beforeEach(() => recorder.start())

  it('should create a promise', () => {
    expect(recorder.promise()).to.be.instanceof(Promise)
  })

  it('should execute error handler on error', done => {
    recorder.errHandler(() => done())
    recorder.throw(new Error('err'))
    recorder.catch()
  })

  describe('#session', () => {
    it('can be started saving previous promise chain', () => {
      let order = ''
      recorder.add(() => (order += 'a'))
      recorder.add(() => {
        recorder.session.start()
        recorder.add(() => (order += 'c'))
        recorder.add(() => (order += 'd'))
      })
      recorder.add(() => recorder.session.restore())
      recorder.add(() => (order += 'b'))
      return recorder.promise().then(() => expect(order).is.equal('acdb'))
    })
  })

  describe('#add', () => {
    it('should add steps to promise', () => {
      let counter = 0
      recorder.add(() => counter++)
      recorder.add(() => counter++)
      recorder.add(() => expect(counter).eql(2))
      return recorder.promise()
    })

    it('should not add steps when stopped', () => {
      let counter = 0
      recorder.add(() => counter++)
      recorder.stop()
      recorder.add(() => counter++)
      return recorder.promise().then(() => expect(counter).eql(1))
    })
  })

  describe('#retry', () => {
    it('should retry failed steps when asked', () => {
      let counter = 0
      recorder.retry(2)
      recorder.add(
        () => {
          counter++
          if (counter < 3) {
            throw new Error('ups')
          }
        },
        undefined,
        undefined,
        true,
      )
      return recorder.promise()
    })

    it('should create a chain of retries', () => {
      let counter = 0
      const errorText = 'noerror'
      recorder.retry({
        retries: 2,
        when: err => {
          return err.message === errorText
        },
      })
      recorder.retry({
        retries: 2,
        when: err => {
          return err.message === 'othererror'
        },
      })

      recorder.add(
        () => {
          counter++
          if (counter < 3) {
            throw new Error(errorText)
          }
        },
        undefined,
        undefined,
        true,
      )
      return recorder.promise()
    })

    it('should not leak custom minTimeout to subsequent recorder runs', async function () {
      // Regression: Object.assign(defaultRetryOptions, retryOpts) mutated the
      // module-level defaultRetryOptions object. A custom minTimeout in one run
      // leaked into the defaults for every later run.
      this.timeout(5000)

      let attempts = []
      recorder.retry({ retries: 1, minTimeout: 800, factor: 1, maxTimeout: 1000 })
      recorder.add(
        () => {
          attempts.push(Date.now())
          if (attempts.length < 2) throw new Error('first run')
        },
        undefined,
        undefined,
        true,
      )
      try {
        await recorder.promise()
      } catch (e) {
        await recorder.catchWithoutStop(err => err)
      }

      expect(attempts[1] - attempts[0]).to.be.greaterThan(700, 'first retry should honor minTimeout=800')

      // Fresh recorder, do not pass minTimeout — should fall back to default (150ms),
      // not 800 leaked from the previous run.
      recorder.start()
      attempts = []
      recorder.retry({ retries: 1, factor: 1, maxTimeout: 1000 })
      recorder.add(
        () => {
          attempts.push(Date.now())
          if (attempts.length < 2) throw new Error('second run')
        },
        undefined,
        undefined,
        true,
      )
      try {
        await recorder.promise()
      } catch (e) {
        await recorder.catchWithoutStop(err => err)
      }

      expect(attempts[1] - attempts[0]).to.be.lessThan(500, 'second retry must use default minTimeout, not leaked 800ms')
    })

    it('should prefer opts for non-when retry when possible', () => {
      let counter = 0
      const errorText = 'noerror'
      recorder.retry({ retries: 2 })
      recorder.retry({
        retries: 100,
        when: err => {
          return err.message === errorText
        },
      })

      recorder.add(
        () => {
          counter++
          if (counter < 3) {
            throw new Error(errorText)
          }
        },
        undefined,
        undefined,
        true,
      )
      return recorder.promise()
    })
  })

  describe('#error paths (characterization)', () => {
    it('routes a task error to errFn and stops when catch() has no args', async () => {
      let caught
      recorder.errHandler(err => (caught = err))
      recorder.add(() => {
        throw new Error('boom')
      })
      recorder.catch()
      await recorder.promise()
      expect(caught).to.be.instanceof(Error)
      expect(caught.message).to.equal('boom')
      expect(recorder.isRunning()).to.equal(false)
    })

    it('catchWithoutStop runs fn for a normal error and the chain continues', async () => {
      let handled
      let after = false
      recorder.add(() => {
        throw new Error('soft')
      })
      recorder.catchWithoutStop(err => (handled = err.message))
      recorder.add(() => (after = true))
      await recorder.promise()
      expect(handled).to.equal('soft')
      expect(after).to.equal(true)
    })

    it('catchWithoutStop re-throws a terminal error past fn', async () => {
      let fnCalled = false
      const err = new Error('terminal')
      err.isTerminal = true
      recorder.add(() => {
        throw err
      })
      recorder.catchWithoutStop(() => (fnCalled = true))
      let rejected
      await recorder.promise().catch(e => (rejected = e))
      expect(fnCalled).to.equal(false)
      expect(rejected).to.equal(err)
    })

    it('throw() after ignoreErr() does not reject the chain', async () => {
      const err = new Error('ignored')
      recorder.ignoreErr(err)
      recorder.throw(err)
      recorder.add(() => 'ok')
      let rejected = false
      await recorder.promise().catch(() => (rejected = true))
      expect(rejected).to.equal(false)
    })

    it('two levels of nested sessions restore the session id to parent then null', () => {
      const ids = []
      recorder.add(() => {
        recorder.session.start('outer')
        ids.push(recorder.getCurrentSessionId())
        recorder.session.start('inner')
        ids.push(recorder.getCurrentSessionId())
        recorder.session.restore('inner')
        ids.push(recorder.getCurrentSessionId())
        recorder.session.restore('outer')
        ids.push(recorder.getCurrentSessionId())
      })
      return recorder.promise().then(() => {
        expect(ids).to.deep.equal(['outer', 'inner', 'outer', null])
      })
    })

    it('characterizes an unbalanced session start (no matching restore)', async () => {
      recorder.add(() => {
        recorder.session.start('orphan')
      })
      recorder.add(() => 'x')
      await recorder.promise()
      expect(recorder.getCurrentSessionId()).to.equal('orphan')
      recorder.reset()
      expect(recorder.getCurrentSessionId()).to.equal(null)
    })

    it('rejects with TimeoutError when a task exceeds its timeout', async () => {
      recorder.retries = []
      recorder.add('slow', () => new Promise(r => setTimeout(r, 200)), false, false, 50)
      let err
      await recorder.promise().catch(e => (err = e))
      expect(err).to.be.instanceof(TimeoutError)
    })

    it('does not reject later when a fast task finishes within its timeout', async () => {
      recorder.retries = []
      const unhandled = []
      const onUnhandled = e => unhandled.push(e)
      process.on('unhandledRejection', onUnhandled)
      try {
        recorder.add('fast', () => new Promise(r => setTimeout(r, 10)), false, false, 50)
        await recorder.promise()
        await new Promise(r => setTimeout(r, 120))
        expect(unhandled).to.have.length(0)
      } finally {
        process.removeListener('unhandledRejection', onUnhandled)
      }
    })
  })
})
