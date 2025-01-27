const assert = require('assert')
const { expect } = require('chai')
const els = require('../../lib/els')
const recorder = require('../../lib/recorder')
const Container = require('../../lib/container')
const Helper = require('../../lib/helper')
const StepConfig = require('../../lib/step/config')

class TestHelper extends Helper {
  constructor() {
    super()
    this.elements = []
  }

  async _locate(locator) {
    return this.elements
  }
}

describe('els', function () {
  let helper

  beforeEach(() => {
    helper = new TestHelper()
    Container.clear()
    Container.append({
      helpers: {
        test: helper,
      },
    })
    recorder.reset()
    recorder.startUnlessRunning()
  })

  describe('#element', () => {
    it('should execute function on first found element', async () => {
      helper.elements = ['el1', 'el2', 'el3']
      let elementUsed

      await els.element('my test', '.selector', async el => {
        elementUsed = el
      })

      await recorder.promise()

      assert.equal(elementUsed, 'el1')
    })

    it('should work without purpose parameter', async () => {
      helper.elements = ['el1', 'el2']
      let elementUsed

      await els.element('.selector', async el => {
        elementUsed = el
      })

      assert.equal(elementUsed, 'el1')
    })

    it('should throw error when no helper with _locate available', async () => {
      Container.clear()
      try {
        await els.element('.selector', async () => {})
        throw new Error('should have thrown error')
      } catch (e) {
        expect(e.message).to.include('No helper enabled with _locate method')
      }
    })

    it('should fail on timeout if timeout is set', async () => {
      helper.elements = ['el1', 'el2']
      try {
        await els.element(
          '.selector',
          async () => {
            await new Promise(resolve => setTimeout(resolve, 1000))
          },
          new StepConfig().timeout(0.01),
        )
        await recorder.promise()
        throw new Error('should have thrown error')
      } catch (e) {
        recorder.catch()
        expect(e.message).to.include('was interrupted on timeout 10ms')
      }
    })

    it('should retry until timeout when retries are set', async () => {
      helper.elements = ['el1', 'el2']
      let attempts = 0
      await els.element(
        '.selector',
        async els => {
          attempts++
          if (attempts < 2) {
            throw new Error('keep retrying')
          }
          return els.slice(0, attempts)
        },
        new StepConfig().retry(2),
      )

      await recorder.promise()
      expect(attempts).to.be.at.least(2)
      expect(helper.elements).to.deep.equal(['el1', 'el2'])
    })
  })

  describe('#eachElement', () => {
    it('should execute function on each element', async () => {
      helper.elements = ['el1', 'el2', 'el3']
      const usedElements = []

      await els.eachElement('.selector', async el => {
        usedElements.push(el)
      })

      assert.deepEqual(usedElements, ['el1', 'el2', 'el3'])
    })

    it('should provide index as second parameter', async () => {
      helper.elements = ['el1', 'el2']
      const indices = []

      await els.eachElement('.selector', async (el, i) => {
        indices.push(i)
      })

      assert.deepEqual(indices, [0, 1])
    })

    it('should work without purpose parameter', async () => {
      helper.elements = ['el1', 'el2']
      const usedElements = []

      await els.eachElement('.selector', async el => {
        usedElements.push(el)
      })

      assert.deepEqual(usedElements, ['el1', 'el2'])
    })

    it('should throw first error if operation fails', async () => {
      helper.elements = ['el1', 'el2']

      try {
        await els.eachElement('.selector', async el => {
          throw new Error(`failed on ${el}`)
        })
        await recorder.promise()
        throw new Error('should have thrown error')
      } catch (e) {
        expect(e.message).to.equal('failed on el1')
      }
    })
  })

  describe('#expectElement', () => {
    it('should pass when condition is true', async () => {
      helper.elements = ['el1']

      await els.expectElement('.selector', async () => true)
    })

    it('should fail when condition is false', async () => {
      helper.elements = ['el1']

      try {
        await els.expectElement('.selector', async () => false)
        await recorder.promise()
        throw new Error('should have thrown error')
      } catch (e) {
        expect(e.cliMessage()).to.include('element (.selector)')
      }
    })
  })

  describe('#expectAnyElement', () => {
    it('should pass when any element matches condition', async () => {
      helper.elements = ['el1', 'el2', 'el3']

      await els.expectAnyElement('.selector', async el => el === 'el2')
    })

    it('should fail when no element matches condition', async () => {
      helper.elements = ['el1', 'el2']

      try {
        await els.expectAnyElement('.selector', async () => false)
        await recorder.promise()
        throw new Error('should have thrown error')
      } catch (e) {
        expect(e.cliMessage()).to.include('any element of (.selector)')
      }
    })
  })

  describe('#expectAllElements', () => {
    it('should pass when all elements match condition', async () => {
      helper.elements = ['el1', 'el2']

      await els.expectAllElements('.selector', async () => true)
    })

    it('should fail when any element does not match condition', async () => {
      helper.elements = ['el1', 'el2', 'el3']

      try {
        await els.expectAllElements('.selector', async el => el !== 'el2')
        await recorder.promise()
        throw new Error('should have thrown error')
      } catch (e) {
        expect(e.cliMessage()).to.include('element #2 of (.selector)')
      }
    })
  })
})
