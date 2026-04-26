import { expect } from 'chai'
import { safeStringify, truncateString } from '../../lib/utils.js'
import { createTest } from '../../lib/mocha/test.js'
import { createSuite } from '../../lib/mocha/suite.js'
import MochaSuite from 'mocha/lib/suite.js'

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

  describe('safeStringify type coercions', function () {
    it('coerces functions to "[Function: name]"', function () {
      const obj = { fn: function namedFn() {}, anon: () => {} }
      const parsed = JSON.parse(safeStringify(obj))
      expect(parsed.fn).to.equal('[Function: namedFn]')
      expect(parsed.anon).to.match(/^\[Function: .*\]$/)
    })

    it('coerces BigInt values (which JSON.stringify cannot natively handle)', function () {
      const result = safeStringify({ big: 12345678901234567890n })
      expect(result).to.contain('12345678901234567890n')
      // Verify the legacy fallback path is NOT triggered
      expect(result).to.not.contain('Failed to serialize')
    })

    it('coerces Symbol to its toString()', function () {
      const obj = { s: Symbol('marker') }
      const parsed = JSON.parse(safeStringify(obj))
      expect(parsed.s).to.equal('Symbol(marker)')
    })

    it('coerces Error to {name, message, stack}', function () {
      const obj = { err: new Error('boom') }
      const parsed = JSON.parse(safeStringify(obj))
      expect(parsed.err).to.have.property('name', 'Error')
      expect(parsed.err).to.have.property('message', 'boom')
      expect(parsed.err).to.have.property('stack')
      expect(parsed.err.stack).to.be.a('string').and.include('boom')
    })

    it('coerces an Error at the top level', function () {
      const result = safeStringify(new TypeError('bad arg'))
      const parsed = JSON.parse(result)
      expect(parsed.name).to.equal('TypeError')
      expect(parsed.message).to.equal('bad arg')
    })

    it('handles nested mixed types together', function () {
      const obj = {
        regular: 1,
        fn: function n() {},
        big: 1n,
        sym: Symbol('s'),
        err: new RangeError('range'),
        nested: { again: { fn: () => {} } },
      }
      const parsed = JSON.parse(safeStringify(obj))
      expect(parsed.regular).to.equal(1)
      expect(parsed.fn).to.equal('[Function: n]')
      expect(parsed.big).to.equal('1n')
      expect(parsed.sym).to.equal('Symbol(s)')
      expect(parsed.err.name).to.equal('RangeError')
      expect(parsed.nested.again.fn).to.match(/^\[Function:/)
    })

    it('preserves indentation when space arg is provided', function () {
      const result = safeStringify({ a: 1 }, [], 2)
      expect(result).to.contain('\n  "a": 1')
    })
  })

  describe('truncateString', function () {
    it('returns input as-is when under maxBytes', function () {
      const result = truncateString('hello', 100)
      expect(result.value).to.equal('hello')
      expect(result.truncated).to.be.false
      expect(result.fullLength).to.equal(5)
    })

    it('returns input as-is when exactly equal to maxBytes', function () {
      const result = truncateString('xxxxx', 5)
      expect(result.truncated).to.be.false
      expect(result.value).to.equal('xxxxx')
    })

    it('truncates and appends marker when over maxBytes', function () {
      const result = truncateString('x'.repeat(50), 10)
      expect(result.truncated).to.be.true
      expect(result.fullLength).to.equal(50)
      expect(result.value.startsWith('xxxxxxxxxx')).to.be.true
      expect(result.value).to.contain('truncated 40 more chars')
    })

    it('coerces non-string inputs via String()', function () {
      const result = truncateString(12345, 100)
      expect(result.value).to.equal('12345')
      expect(result.truncated).to.be.false
    })

    it('handles empty string', function () {
      const result = truncateString('', 10)
      expect(result.value).to.equal('')
      expect(result.truncated).to.be.false
      expect(result.fullLength).to.equal(0)
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
