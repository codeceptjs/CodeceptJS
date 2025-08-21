import path from 'path'
import chai from 'chai'
import { fileURLToPath } from 'url'
import container from '../../../lib/container.js'
import eachElement from '../../../lib/plugin/eachElement.js'
import recorder from '../../../lib/recorder.js'
import store from '../../../lib/store.js'

const { expect } = chai
const __dirname = path.dirname(fileURLToPath(import.meta.url))
global.codecept_dir = path.join(__dirname, '/..')
describe('eachElement plugin', () => {
  beforeEach(async () => {
    recorder.start()
    try {
      await container.create({
        helpers: {
          MyHelper: {
            require: path.resolve(__dirname, '../../data/helper.js'),
          },
        },
      })
      // Initialize the container to load helpers
      await container.started()
      
      // Properly initialize the plugin
      const eachElementPlugin = eachElement({})
      global.eachElement = eachElementPlugin
    } catch (err) {
      console.error('Error during container setup:', err)
    }
  })

  afterEach(() => {
    container.clear()
  })

  it('should iterate for each elements', async () => {
    let counter = 0
    
    global.eachElement('some action', 'some locator', async el => {
      expect(el).is.not.null
      counter++
    })
    await recorder.promise()
    expect(counter).to.equal(2)
  })

  it('should not allow non async function', async () => {
    let errorCaught = false
    try {
      global.eachElement('some action', 'some locator', el => {})
      await recorder.promise()
    } catch (err) {
      errorCaught = true
      expect(err.message).to.include('Async')
    }
    expect(errorCaught).is.true
  })
})
