const expect = require('chai').expect
const Codecept = require('../../lib/codecept')

describe('Test Sharding', () => {
  let codecept
  const config = {
    tests: './test/data/sandbox/*_test.js',
    gherkin: { features: null },
    output: './output',
    hooks: [],
  }

  beforeEach(() => {
    codecept = new Codecept(config, {})
    codecept.init('/home/runner/work/CodeceptJS/CodeceptJS/test/data/sandbox')
  })

  describe('_applySharding', () => {
    it('should validate shard format', () => {
      const testFiles = ['test1.js', 'test2.js', 'test3.js', 'test4.js']

      expect(() => codecept._applySharding(testFiles, 'invalid')).to.throw('Invalid shard format')
      expect(() => codecept._applySharding(testFiles, '1/0')).to.throw('Shard total must be at least 1')
      expect(() => codecept._applySharding(testFiles, '0/4')).to.throw('Shard index 0 must be between 1 and 4')
      expect(() => codecept._applySharding(testFiles, '5/4')).to.throw('Shard index 5 must be between 1 and 4')
    })

    it('should split tests evenly across shards', () => {
      const testFiles = ['test1.js', 'test2.js', 'test3.js', 'test4.js']

      const shard1 = codecept._applySharding(testFiles, '1/4')
      const shard2 = codecept._applySharding(testFiles, '2/4')
      const shard3 = codecept._applySharding(testFiles, '3/4')
      const shard4 = codecept._applySharding(testFiles, '4/4')

      expect(shard1).to.deep.equal(['test1.js'])
      expect(shard2).to.deep.equal(['test2.js'])
      expect(shard3).to.deep.equal(['test3.js'])
      expect(shard4).to.deep.equal(['test4.js'])
    })

    it('should handle uneven distribution', () => {
      const testFiles = ['test1.js', 'test2.js', 'test3.js', 'test4.js', 'test5.js']

      const shard1 = codecept._applySharding(testFiles, '1/3')
      const shard2 = codecept._applySharding(testFiles, '2/3')
      const shard3 = codecept._applySharding(testFiles, '3/3')

      expect(shard1).to.deep.equal(['test1.js', 'test2.js'])
      expect(shard2).to.deep.equal(['test3.js', 'test4.js'])
      expect(shard3).to.deep.equal(['test5.js'])

      // All tests should be covered exactly once
      const allShardedTests = [...shard1, ...shard2, ...shard3]
      expect(allShardedTests.sort()).to.deep.equal(testFiles.sort())
    })

    it('should handle empty test files array', () => {
      const result = codecept._applySharding([], '1/4')
      expect(result).to.deep.equal([])
    })

    it('should handle more shards than tests', () => {
      const testFiles = ['test1.js', 'test2.js']

      const shard1 = codecept._applySharding(testFiles, '1/4')
      const shard2 = codecept._applySharding(testFiles, '2/4')
      const shard3 = codecept._applySharding(testFiles, '3/4')
      const shard4 = codecept._applySharding(testFiles, '4/4')

      expect(shard1).to.deep.equal(['test1.js'])
      expect(shard2).to.deep.equal(['test2.js'])
      expect(shard3).to.deep.equal([])
      expect(shard4).to.deep.equal([])
    })
  })

  describe('Integration with loadTests', () => {
    it('should apply sharding when shard option is provided', () => {
      // First load all tests without sharding
      const codeceptAll = new Codecept(config, {})
      codeceptAll.init('/home/runner/work/CodeceptJS/CodeceptJS/test/data/sandbox')
      codeceptAll.loadTests()

      // If there are no tests, skip this test
      if (codeceptAll.testFiles.length === 0) {
        return
      }

      // Now test sharding
      codecept.opts.shard = '1/2'
      codecept.loadTests()

      // We expect some tests to be loaded and sharded
      expect(codecept.testFiles.length).to.be.greaterThan(0)

      // Sharded should be less than or equal to total
      expect(codecept.testFiles.length).to.be.lessThanOrEqual(codeceptAll.testFiles.length)

      // For 2 shards, we expect roughly half the tests (or at most ceil(total/2))
      const expectedMax = Math.ceil(codeceptAll.testFiles.length / 2)
      expect(codecept.testFiles.length).to.be.lessThanOrEqual(expectedMax)
    })
  })
})
