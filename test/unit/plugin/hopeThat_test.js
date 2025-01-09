let expect
import('chai').then(chai => {
  expect = chai.expect
})
const hopeThat = require('../../../lib/plugin/hopeThat')()
const recorder = require('../../../lib/recorder')

describe('hopeThat plugin', () => {
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
