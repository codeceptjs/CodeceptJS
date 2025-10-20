const { expect } = require('chai')
const { hopeThat, retryTo, tryTo } = require('../../lib/effects')
const recorder = require('../../lib/recorder')

describe('effects', () => {
  describe('hopeThat', () => {
    beforeEach(() => {
      recorder.reset()
      recorder.start()
    })

    it('should execute command on success', async () => {
      const ok = await hopeThat(() => recorder.add(() => 5))
      expect(true).is.equal(ok)
      return recorder.promise()
    })

    it('should execute command on fail', async () => {
      const notOk = await hopeThat(() =>
        recorder.add(() => {
          throw new Error('Ups')
        }),
      )
      expect(false).is.equal(notOk)
      return recorder.promise()
    })
  })

  describe('tryTo', () => {
    beforeEach(() => {
      recorder.reset()
      recorder.start()
    })

    it('should execute command on success', async () => {
      const ok = await tryTo(() => recorder.add(() => 5))
      expect(ok).to.be.equal(true)
      return recorder.promise()
    })

    it('should execute command on fail', async () => {
      const notOk = await tryTo(() =>
        recorder.add(() => {
          throw new Error('Ups')
        }),
      )
      expect(false).is.equal(notOk)
      return recorder.promise()
    })
  })

  describe('retryTo', () => {
    beforeEach(() => {
      recorder.reset()
      recorder.start()
    })

    it('should execute command on success', async () => {
      let counter = 0
      await retryTo(
        () =>
          recorder.add(() => {
            counter++
          }),
        5,
      )
      expect(counter).is.equal(1)
      return recorder.promise()
    })

    it('should execute few times command on fail', async () => {
      let counter = 0
      let errorCaught = false
      try {
        await retryTo(
          () => {
            recorder.add(() => counter++)
            recorder.add(() => {
              throw new Error('Ups')
            })
          },
          5,
          10,
        )
        await recorder.promise()
      } catch (err) {
        errorCaught = true
        expect(err.message).to.eql('Ups')
      }
      expect(counter).to.equal(5)
      expect(errorCaught).is.true
    })
  })
})
