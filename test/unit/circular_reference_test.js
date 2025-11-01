import { expect } from 'chai'
import { safeStringify } from '../../lib/utils'
import { createTest } from '../../lib/mocha/test'
import { createSuite } from '../../lib/mocha/suite'
import MochaSuite from 'mocha/lib/suite'

describe('Circular Reference Handling', function () {
  describe('safeStringify utility', function () {
    it('should handle objects without circular references normally', function () {
      const obj = {
        name: 'test',
        value: 42,
        nested: { prop: 'value' },
      }

      const result = safeStringify(obj)
      const parsed = JSON.parse(result)

      expect(parsed.name).to.equal('test')
      expect(parsed.value).to.equal(42)
      expect(parsed.nested.prop).to.equal('value')
    })

    it('should handle simple circular references', function () {
      const obj = { name: 'test' }
      obj.self = obj

      const result = safeStringify(obj)
      expect(result).to.not.throw
      expect(result).to.contain('test')
      expect(result).to.contain('Circular Reference')
    })

    it('should skip default problematic keys', function () {
      const obj = {
        name: 'test',
        parent: { title: 'parent' },
        tests: [{ title: 'test1' }],
        suite: { title: 'suite' },
        root: { title: 'root' },
        ctx: { title: 'context' },
      }

      const result = safeStringify(obj)
      const parsed = JSON.parse(result)

      expect(parsed.name).to.equal('test')
      expect(parsed.parent).to.be.undefined
      expect(parsed.tests).to.be.undefined
      expect(parsed.suite).to.be.undefined
      expect(parsed.root).to.be.undefined
      expect(parsed.ctx).to.be.undefined
    })

    it('should skip custom keys when specified', function () {
      const obj = {
        name: 'test',
        customKey: 'should be skipped',
        keepThis: 'should be kept',
      }

      const result = safeStringify(obj, ['customKey'])
      const parsed = JSON.parse(result)

      expect(parsed.name).to.equal('test')
      expect(parsed.customKey).to.be.undefined
      expect(parsed.keepThis).to.equal('should be kept')
    })

    it('should handle complex nested circular references', function () {
      const parent = { name: 'parent', children: [] }
      const child1 = { name: 'child1', parent: parent }
      const child2 = { name: 'child2', parent: parent }

      parent.children.push(child1, child2)

      const result = safeStringify(parent)
      expect(result).to.not.throw
      expect(result).to.contain('parent')
      expect(result).to.contain('children')
    })
  })

  describe('CodeceptJS objects circular reference handling', function () {
    let rootSuite, suite, test

    beforeEach(function () {
      rootSuite = new MochaSuite('', null, true)
      suite = createSuite(rootSuite, 'Test Suite')
      test = createTest('Test 1', () => {})
      test.addToSuite(suite)
    })

    it('should handle Test objects with circular references', function () {
      // Before fix: JSON.stringify(test) would throw
      const result = safeStringify(test)
      expect(result).to.not.throw

      const parsed = JSON.parse(result)
      expect(parsed.title).to.equal('Test 1')
      expect(parsed.tags).to.be.an('array')
      expect(parsed.codeceptjs).to.be.true
      // parent should be skipped to break circular reference
      expect(parsed.parent).to.be.undefined
    })

    it('should handle Suite objects with circular references', function () {
      // Before fix: JSON.stringify(suite) would throw
      const result = safeStringify(suite)
      expect(result).to.not.throw

      const parsed = JSON.parse(result)
      expect(parsed.title).to.equal('Test Suite')
      expect(parsed.codeceptjs).to.be.true
      // tests should be skipped to break circular reference
      expect(parsed.tests).to.be.undefined
    })

    it('should preserve essential Test properties while avoiding circular references', function () {
      test.opts = { timeout: 5000 }
      test.tags = ['@smoke']
      test.meta = { feature: 'login' }
      test.notes = [{ type: 'info', text: 'test note' }]
      test.artifacts = ['screenshot.png']

      const result = safeStringify(test)
      const parsed = JSON.parse(result)

      expect(parsed.opts).to.deep.equal({ timeout: 5000 })
      expect(parsed.tags).to.deep.equal(['@smoke'])
      expect(parsed.meta).to.deep.equal({ feature: 'login' })
      expect(parsed.notes).to.deep.equal([{ type: 'info', text: 'test note' }])
      expect(parsed.artifacts).to.deep.equal(['screenshot.png'])
      expect(parsed.parent).to.be.undefined // Circular reference broken
    })

    it('should preserve essential Suite properties while avoiding circular references', function () {
      suite.opts = { retries: 3 }
      suite.tags = ['@feature']

      const result = safeStringify(suite)
      const parsed = JSON.parse(result)

      expect(parsed.opts).to.deep.equal({ retries: 3 })
      expect(parsed.tags).to.deep.equal(['@feature'])
      expect(parsed.tests).to.be.undefined // Circular reference broken
    })

    it('should handle deeply nested objects with multiple circular references', function () {
      // Create a more complex structure
      const childSuite = createSuite(suite, 'Child Suite')
      const childTest = createTest('Child Test', () => {})
      childTest.addToSuite(childSuite)

      const result = safeStringify(suite)
      expect(result).to.not.throw

      const parsed = JSON.parse(result)
      expect(parsed.title).to.equal('Test Suite')
    })
  })

  describe('Integration with existing serialization', function () {
    it('should work with serializeTest function', function () {
      const test = createTest('Integration Test', () => {})
      const suite = createSuite(new MochaSuite('', null, true), 'Integration Suite')
      test.addToSuite(suite)

      // The existing serializeTest should continue to work
      const serialized = test.simplify()
      expect(serialized).to.be.an('object')
      expect(serialized.title).to.equal('Integration Test')
      expect(serialized.parent).to.be.an('object')
      expect(serialized.parent.title).to.equal('Integration Suite')
    })

    it('should work with serializeSuite function', function () {
      const suite = createSuite(new MochaSuite('', null, true), 'Integration Suite')

      // The existing serializeSuite should continue to work
      const serialized = suite.simplify()
      expect(serialized).to.be.an('object')
      expect(serialized.title).to.equal('Integration Suite')
    })
  })
})
