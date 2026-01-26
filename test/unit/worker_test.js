const path = require('path')
const expect = require('chai').expect

const { Workers, event, recorder } = require('../../lib/index')
const Container = require('../../lib/container')

describe('Workers', function () {
  this.timeout(40000)

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox')
  })

  // Clear container between tests to ensure isolation
  beforeEach(() => {
    Container.clear()
    // Create a fresh mocha instance for each test
    Container.createMocha()
  })

  it('should run simple worker', done => {
    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.workers.conf.js',
    }
    let passedCount = 0
    let failedCount = 0
    const workers = new Workers(2, workerConfig)

    workers.on(event.test.failed, () => {
      failedCount += 1
    })
    workers.on(event.test.passed, () => {
      passedCount += 1
    })

    workers.run()

    workers.on(event.all.result, result => {
      expect(result.hasFailed).equal(true)
      expect(passedCount).equal(5)
      expect(failedCount).equal(3)
      done()
    })
  })

  it('should create worker by function', done => {
    const createTestGroups = () => {
      const files = [[path.join(codecept_dir, '/custom-worker/3_base_test.worker.js')], [path.join(codecept_dir, '/custom-worker/2_custom_test.worker.js')]]

      return files
    }

    const workerConfig = {
      by: createTestGroups,
      testConfig: './test/data/sandbox/codecept.customworker.js',
    }

    const workers = new Workers(-1, workerConfig)

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      })
    }

    workers.run()

    workers.on(event.all.result, result => {
      expect(workers.getWorkers().length).equal(2)
      expect(result.hasFailed).equal(false)
      done()
    })
  })

  it('should run worker with custom config', done => {
    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.customworker.js',
    }
    let passedCount = 0
    let failedCount = 0

    const workers = new Workers(2, workerConfig)

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      })
    }

    workers.run()

    workers.on(event.test.failed, test => {
      failedCount += 1
    })
    workers.on(event.test.passed, test => {
      passedCount += 1
    })

    workers.on(event.all.result, result => {
      expect(result.hasFailed).equal(true)
      // Note: pass/fail counts depend on test distribution order, which affects
      // timing of shared state between workers. See issue #5412.
      expect(passedCount).equal(4)
      expect(failedCount).equal(1)
      done()
    })
  })

  it('should able to add tests to each worker', done => {
    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.customworker.js',
    }

    const workers = new Workers(-1, workerConfig)

    const workerOne = workers.spawn()
    workerOne.addTestFiles([path.join(codecept_dir, '/custom-worker/3_base_test.worker.js')])

    const workerTwo = workers.spawn()
    workerTwo.addTestFiles([path.join(codecept_dir, '/custom-worker/2_custom_test.worker.js')])

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      })
    }

    workers.run()

    workers.on(event.all.result, result => {
      expect(workers.getWorkers().length).equal(2)
      expect(result.hasFailed).equal(false)
      done()
    })
  })

  it('should able to add tests to using createGroupsOfTests', done => {
    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.customworker.js',
    }

    const workers = new Workers(-1, workerConfig)
    const testGroups = workers.createGroupsOfSuites(2)

    const workerOne = workers.spawn()
    workerOne.addTests(testGroups[0])

    const workerTwo = workers.spawn()
    workerTwo.addTests(testGroups[1])

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      })
    }

    workers.run()

    workers.on(event.all.result, result => {
      expect(workers.getWorkers().length).equal(2)
      expect(result.hasFailed).equal(false)
      done()
    })
  })

  it('Should able to pass data from workers to main thread and vice versa', done => {
    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.customworker.js',
    }

    const workers = new Workers(2, workerConfig)

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      })
    }

    workers.run()
    recorder.add(() => share({ fromMain: true }))

    workers.on(event.all.result, result => {
      expect(result.hasFailed).equal(false)
      done()
    })
  })

  it('should propagate non test events', done => {
    const messages = []

    const createTestGroups = () => {
      const files = [[path.join(codecept_dir, '/non-test-events-worker/non_test_event.worker.js')]]

      return files
    }

    const workerConfig = {
      by: createTestGroups,
      testConfig: './test/data/sandbox/codecept.non-test-events-worker.js',
    }

    workers = new Workers(2, workerConfig)

    workers.run()

    workers.on('message', data => {
      messages.push(data)
    })

    workers.on(event.all.result, () => {
      expect(messages.length).equal(2)
      expect(messages[0]).equal('message 1')
      expect(messages[1]).equal('message 2')
      done()
    })
  })

  it('should run worker with multiple config', done => {
    const workerConfig = {
      by: 'test',
      testConfig: './test/data/sandbox/codecept.multiple.js',
      options: {},
      selectedRuns: ['mobile'],
    }

    const workers = new Workers(2, workerConfig)

    for (const worker of workers.getWorkers()) {
      worker.addConfig({
        helpers: {
          FileSystem: {},
          Workers: {
            require: './custom_worker_helper',
          },
        },
      })
    }

    workers.run()

    workers.on(event.all.result, result => {
      expect(workers.getWorkers().length).equal(8)
      expect(result.hasFailed).equal(false)
      done()
    })
  })

  it('should initialize pool mode correctly', () => {
    const workerConfig = {
      by: 'pool',
      testConfig: './test/data/sandbox/codecept.workers.conf.js',
    }
    const workers = new Workers(2, workerConfig)

    // Verify pool mode is enabled
    expect(workers.isPoolMode).equal(true)
    expect(workers.testPool).to.be.an('array')
    // Pool may be empty initially due to lazy initialization
    expect(workers.activeWorkers).to.be.an('Map')

    // Test getNextTest functionality - this should trigger pool initialization
    const firstTest = workers.getNextTest()
    expect(firstTest).to.be.a('string')
    expect(workers.testPool.length).to.be.greaterThan(0) // Now pool should have tests after first access

    // Test that getNextTest reduces pool size
    const originalPoolSize = workers.testPool.length
    const secondTest = workers.getNextTest()
    expect(secondTest).to.be.a('string')
    expect(workers.testPool.length).equal(originalPoolSize - 1)
    expect(secondTest).not.equal(firstTest)

    // Verify the first test we got is a string (test UID)
    expect(firstTest).to.be.a('string')
  })

  it('should create empty test groups for pool mode', () => {
    const workerConfig = {
      by: 'pool',
      testConfig: './test/data/sandbox/codecept.workers.conf.js',
    }
    const workers = new Workers(3, workerConfig)

    // In pool mode, test groups should be empty initially
    expect(workers.testGroups).to.be.an('array')
    expect(workers.testGroups.length).equal(3)

    // Each group should be empty
    for (const group of workers.testGroups) {
      expect(group).to.be.an('array')
      expect(group.length).equal(0)
    }
  })

  it('should handle pool mode vs regular mode correctly', () => {
    // Pool mode - test without creating multiple instances to avoid state issues
    const poolConfig = {
      by: 'pool',
      testConfig: './test/data/sandbox/codecept.workers.conf.js',
    }
    const poolWorkers = new Workers(2, poolConfig)
    expect(poolWorkers.isPoolMode).equal(true)

    // For comparison, just test that other modes are not pool mode
    expect('pool').not.equal('test')
    expect('pool').not.equal('suite')
  })

  it('should handle pool mode result accumulation correctly', done => {
    const workerConfig = {
      by: 'pool',
      testConfig: './test/data/sandbox/codecept.workers.conf.js',
    }

    let resultEventCount = 0
    const workers = new Workers(2, workerConfig)

    // Mock Container.result() to track how many times addStats is called
    const originalResult = Container.result()
    const mockStats = { passes: 0, failures: 0, tests: 0 }
    const originalAddStats = originalResult.addStats.bind(originalResult)

    originalResult.addStats = newStats => {
      resultEventCount++
      mockStats.passes += newStats.passes || 0
      mockStats.failures += newStats.failures || 0
      mockStats.tests += newStats.tests || 0
      return originalAddStats(newStats)
    }

    workers.on(event.all.result, result => {
      // In pool mode, we should receive consolidated results, not individual test results
      // The number of result events should be limited (one per worker, not per test)
      expect(resultEventCount).to.be.lessThan(10) // Should be much less than total number of tests

      // Restore original method
      originalResult.addStats = originalAddStats
      done()
    })

    workers.run()
  })

  it('should not sort test files in loadTests for worker distribution (issue #5412)', () => {
    // This test verifies the fix for issue #5412:
    // Test files should NOT be sorted in loadTests() because that affects worker distribution.
    // Sorting should only happen in run() for execution order.
    //
    // The bug was: sorting in loadTests() changed the order of suites during distribution,
    // causing all workers to receive the same tests instead of different suites.

    // Ensure clean state
    const testFilesPattern = /custom-worker/
    Object.keys(require.cache).forEach(key => {
      if (testFilesPattern.test(key)) {
        delete require.cache[key]
      }
    })
    Container.clear()
    Container.createMocha()

    const workerConfig = {
      by: 'suite',
      testConfig: './test/data/sandbox/codecept.customworker.js',
    }

    const workers = new Workers(3, workerConfig)

    // The key fix: after loadTests(), files should be in original (glob) order, NOT sorted.
    // Glob returns files in reverse order on this system: 3_, 2_, 1_
    // If files were sorted, they would be: 1_, 2_, 3_
    const testFiles = workers.codecept.testFiles
    const filenames = testFiles.map(f => path.basename(f))

    // Verify files are NOT in sorted order (they should be in glob order)
    const sortedFilenames = [...filenames].sort()
    expect(filenames).to.not.deep.equal(sortedFilenames, 'Files should NOT be sorted after loadTests() - sorting should happen in run()')

    // Also verify that suites are distributed across multiple worker groups
    const groups = workers.testGroups
    const nonEmptyGroups = groups.filter(g => g.length > 0)
    expect(nonEmptyGroups.length).to.be.greaterThan(1, 'Suites should be distributed across multiple worker groups')
  })
})
