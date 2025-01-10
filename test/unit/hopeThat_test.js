const { expect } = require('chai')
const { hopeThat } = require('../../lib/effects')
const recorder = require('../../lib/recorder')

describe('effects', () => {
  describe('hopeThat', () => {
    beforeEach(() => {
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
})
