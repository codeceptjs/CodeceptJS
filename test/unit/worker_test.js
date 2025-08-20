const path = require('path')
const expect = require('chai').expect

const { Workers, event, recorder } = require('../../lib/index')

describe('Workers', function () {
  this.timeout(40000)

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox')
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
      const files = [[path.join(codecept_dir, '/custom-worker/base_test.worker.js')], [path.join(codecept_dir, '/custom-worker/custom_test.worker.js')]]

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
      expect(passedCount).equal(3)
      expect(failedCount).equal(2)
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
    workerOne.addTestFiles([path.join(codecept_dir, '/custom-worker/base_test.worker.js')])

    const workerTwo = workers.spawn()
    workerTwo.addTestFiles([path.join(codecept_dir, '/custom-worker/custom_test.worker.js')])

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

  it('should handle stepByStep reporter directory resolution with workers', () => {
    const path = require('path')

    // Mock the stepByStep directory resolution logic
    function getStepByStepReportDir(config, isWorker, globalCodeceptDir) {
      let reportDir
      if (isWorker && globalCodeceptDir) {
        const currentOutputDir = config.output ? path.resolve(globalCodeceptDir, config.output) : '/default-output'
        const workerDirPattern = /[/\\][^/\\]+$/
        const baseOutputDir = currentOutputDir.replace(workerDirPattern, '')
        reportDir = path.join(baseOutputDir, 'stepByStepReport')
      } else {
        reportDir = config.output ? path.resolve(globalCodeceptDir, config.output) : '/default-output'
      }
      return reportDir
    }

    const globalCodeceptDir = '/tmp/test'

    // Test regular (non-worker) mode
    const regularConfig = { output: './output' }
    const regularDir = getStepByStepReportDir(regularConfig, false, globalCodeceptDir)
    expect(regularDir).equal('/tmp/test/output')

    // Test worker mode
    const workerConfig = { output: './output/worker1' }
    const workerDir = getStepByStepReportDir(workerConfig, true, globalCodeceptDir)
    expect(workerDir).equal('/tmp/test/output/stepByStepReport')
  })
})
