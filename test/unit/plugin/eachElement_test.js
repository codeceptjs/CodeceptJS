import path from 'path'
import chai from 'chai'
import { fileURLToPath } from 'url'
import container from '../../../lib/container.js'
import eachElement from '../../../lib/plugin/eachElement.js'
import recorder from '../../../lib/recorder.js'

const { expect } = chai
const __dirname = path.dirname(fileURLToPath(import.meta.url))
global.codecept_dir = path.join(__dirname, '/..')
describe('eachElement plugin', () => {
  beforeEach(async () => {
    recorder.start()
    console.log('Creating container with helper path:', path.resolve(__dirname, '../data/helper.js'))
    try {
      container.create({
        helpers: {
          MyHelper: {
            require: path.resolve(__dirname, '../data/helper.js'),
          },
        },
      })
      console.log('Container created successfully')
      // Initialize the container to load helpers
      await container.started()
      console.log('Container started successfully')
    } catch (err) {
      console.error('Error during container setup:', err)
    }
  })

  afterEach(() => {
    container.clear()
  })

  it('should iterate for each elements', async () => {
    let counter = 0
    console.log('Starting eachElement test')
    const helpers = container.helpers()
    console.log('Available helpers:', Object.keys(helpers))
    const helper = Object.values(helpers).find(h => h._locate)
    console.log('Helper with _locate:', helper ? 'found' : 'not found')
    if (helper && helper._locate) {
      console.log('Direct _locate result:', await helper._locate('some locator'))
    }
    
    await eachElement('some action', 'some locator', async el => {
      console.log('Processing element:', el)
      expect(el).is.not.null
      counter++
    })
    console.log('About to await recorder promise')
    await recorder.promise()
    console.log('Counter value:', counter)
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
