import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let expect
import('chai').then(chai => {
  expect = chai.expect
})
import containerModule from '../../../lib/container.js'
const container = containerModule.default || containerModule
import eachElementModule from '../../../lib/plugin/eachElement.js'
const eachElement = (eachElementModule.default || eachElementModule)()
import recorderModule from '../../../lib/recorder.js'
const recorder = recorderModule.default || recorderModule

describe('eachElement plugin', () => {
  beforeEach(async () => {
    global.codecept_dir = path.join(__dirname, '/../..')
    recorder.start()
    await container.create({
      helpers: {
        MyHelper: {
          require: './data/helper',
        },
      },
    })
    await container.started()
  })

  afterEach(() => {
    container.clear()
  })

  it('should iterate for each elements', async () => {
    let counter = 0
    const promise = eachElement('some action', 'some locator', async el => {
      expect(el).is.not.null
      counter++
    })
    await recorder.promise()
    await promise
    expect(counter).to.equal(2)
  })

  it('should not allow non async function', async () => {
    let errorCaught = false
    try {
      await eachElement('some action', 'some locator', el => {})
      await recorder.promise()
    } catch (err) {
      errorCaught = true
      expect(err.message).to.include('Async')
    }
    expect(errorCaught).is.true
  })
})
