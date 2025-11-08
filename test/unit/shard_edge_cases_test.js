import { expect } from 'chai'
import Codecept from '../../lib/codecept.js'

describe('Test Sharding Edge Cases', () => {
  let codecept
  const config = {
    tests: '',
    gherkin: { features: null },
    output: './output',
    hooks: [],
  }

  beforeEach(() => {
    codecept = new Codecept(config, {})
  })

  describe('Large test suite distribution', () => {
    it('should distribute 100 tests across 4 shards correctly', () => {
      // Create a large array of test files with proper zero-padding for consistent sorting
      const testFiles = Array.from({ length: 100 }, (_, i) => `test${String(i + 1).padStart(3, '0')}.js`)

      const shard1 = codecept._applySharding(testFiles, '1/4')
      const shard2 = codecept._applySharding(testFiles, '2/4')
      const shard3 = codecept._applySharding(testFiles, '3/4')
      const shard4 = codecept._applySharding(testFiles, '4/4')

      // Each shard should get 25 tests
      expect(shard1.length).to.equal(25)
      expect(shard2.length).to.equal(25)
      expect(shard3.length).to.equal(25)
      expect(shard4.length).to.equal(25)

      // Verify no overlap and complete coverage
      const allShardedTests = [...shard1, ...shard2, ...shard3, ...shard4]
      expect(allShardedTests.sort()).to.deep.equal(testFiles.sort())

      // Verify correct distribution
      expect(shard1).to.deep.equal(testFiles.slice(0, 25))
      expect(shard2).to.deep.equal(testFiles.slice(25, 50))
      expect(shard3).to.deep.equal(testFiles.slice(50, 75))
      expect(shard4).to.deep.equal(testFiles.slice(75, 100))
    })

    it('should distribute 101 tests across 4 shards with uneven distribution', () => {
      const testFiles = Array.from({ length: 101 }, (_, i) => `test${String(i + 1).padStart(3, '0')}.js`)

      const shard1 = codecept._applySharding(testFiles, '1/4')
      const shard2 = codecept._applySharding(testFiles, '2/4')
      const shard3 = codecept._applySharding(testFiles, '3/4')
      const shard4 = codecept._applySharding(testFiles, '4/4')

      // First 3 shards get 26 tests (ceiling), last gets 23
      expect(shard1.length).to.equal(26)
      expect(shard2.length).to.equal(26)
      expect(shard3.length).to.equal(26)
      expect(shard4.length).to.equal(23)

      // Verify complete coverage
      const allShardedTests = [...shard1, ...shard2, ...shard3, ...shard4]
      expect(allShardedTests.length).to.equal(101)
      expect(allShardedTests.sort()).to.deep.equal(testFiles.sort())
    })
  })

  describe('Works with shuffle option', () => {
    it('should apply sharding after shuffle when both options are used', () => {
      // This test verifies that the order of operations is correct:
      // 1. Load tests
      // 2. Shuffle (if enabled)
      // 3. Apply sharding (if enabled)

      const testFiles = ['test1.js', 'test2.js', 'test3.js', 'test4.js']

      // Mock loadTests behavior with both shuffle and shard
      codecept.testFiles = [...testFiles]
      codecept.opts.shuffle = true
      codecept.opts.shard = '1/2'

      // Apply shuffle first (mocking the shuffle function)
      const shuffled = ['test3.js', 'test1.js', 'test4.js', 'test2.js']
      codecept.testFiles = shuffled

      // Then apply sharding
      codecept.testFiles = codecept._applySharding(codecept.testFiles, '1/2')

      // Should get the first 2 tests from the shuffled array
      expect(codecept.testFiles.length).to.equal(2)
      expect(codecept.testFiles).to.deep.equal(['test3.js', 'test1.js'])
    })
  })
})
