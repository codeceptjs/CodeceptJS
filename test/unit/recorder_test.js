import { expect } from 'chai'
import recorder from '../../lib/recorder.js'

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
})
