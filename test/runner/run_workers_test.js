const { expect } = require('expect')
const path = require('path')
const exec = require('child_process').exec
const semver = require('semver')

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox')
const codecept_run = `${runner} run-workers --config ${codecept_dir}/codecept.workers.conf.js `
const codecept_run_glob = config => `${runner} run-workers --config ${codecept_dir}/${config} `

describe('CodeceptJS Workers Runner', function () {
  this.timeout(40000)

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data/sandbox')
  })

  it('should run tests in 3 workers', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    console.log(`${codecept_run} 3 --debug`)
    exec(`${codecept_run} 3 --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS') // feature
      expect(stdout).toContain('glob current dir')
      expect(stdout).toContain('From worker @1_grep print message 1')
      expect(stdout).toContain('From worker @2_grep print message 2')
      expect(stdout).toContain('Running tests in 3 workers')
      expect(stdout).not.toContain('this is running inside worker')
      expect(stdout).toContain('failed')
      expect(stdout).toContain('File notafile not found')
      expect(stdout).toContain('Scenario Steps:')
      expect(err.code).toEqual(1)
      done()
    })
  })

  it('should print correct FAILURES in 3 workers without --debug', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 3`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS') // feature
      expect(stdout).toContain('glob current dir')
      expect(stdout).toContain('From worker @1_grep print message 1')
      expect(stdout).toContain('From worker @2_grep print message 2')
      expect(stdout).toContain('Running tests in')
      expect(stdout).not.toContain('this is running inside worker')
      expect(stdout).toContain('failed')
      expect(stdout).toContain('File notafile not found')
      expect(stdout).toContain('Scenario Steps:')
      expect(stdout).toContain('5 passed, 2 failed, 1 failedHooks')
      // We are not testing order in logs, because it depends on race condition between workers
      expect(stdout).toContain(') Workers Failing\n') // first fail log
      expect(stdout).toContain(') Workers\n') // second fail log
      // We just should be sure numbers are correct
      expect(stdout).toContain('1) ') // first fail log
      expect(stdout).toContain('2) ') // second fail log
      expect(err.code).toEqual(1)
      done()
    })
  })

  it('should print positive or zero failures with same name tests', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run_glob('configs/workers/codecept.workers-negative.conf.js')} 2`, (err, stdout) => {
      expect(stdout).toContain('Running tests in 2 workers...')
      // check negative number without checking specified negative number
      expect(stdout).not.toContain('FAIL  | 2 passed, -')
      // check we have positive failures
      // TODO: "10 failed" - probably bug, but not in logs.
      //  CodeceptJS starts 12 tests in this case, but now we can see this executions in logs.
      expect(stdout).toContain('FAIL  | 2 passed, 10 failed')
      expect(err).not.toBe(null)
      done()
    })
  })

  it('should use grep', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --grep "grep"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS') // feature
      expect(stdout).not.toContain('glob current dir')
      expect(stdout).toContain('From worker @1_grep print message 1')
      expect(stdout).toContain('From worker @2_grep print message 2')
      expect(stdout).toContain('Running tests in 2 workers')
      expect(stdout).not.toContain('this is running inside worker')
      expect(stdout).not.toContain('failed')
      expect(stdout).not.toContain('File notafile not found')
      expect(err).toEqual(null)
      done()
    })
  })

  it('should use suites', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --suites`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS') // feature
      expect(stdout).toContain('Running tests in 2 workers') // feature
      expect(stdout).toContain('glob current dir')
      expect(stdout).toContain('From worker @1_grep print message 1')
      expect(stdout).toContain('From worker @2_grep print message 2')
      expect(stdout).not.toContain('this is running inside worker')
      expect(err.code).toEqual(1)
      done()
    })
  })

  it('should show failures when suite is failing', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --grep "Workers Failing"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS') // feature
      expect(stdout).toContain('Running tests in 2 workers')
      expect(stdout).toContain('"before each" hook: Before for "should not be executed"')
      expect(stdout).not.toContain('this is running inside worker')
      expect(stdout).toContain('failed')
      expect(stdout).toContain('FAILURES')
      expect(stdout).toContain('Workers Failing')
      // Only 1 test is executed - Before hook in Workers Failing
      expect(stdout).toContain('✖ should not be executed')
      expect(stdout).toContain('FAIL  | 0 passed, 1 failed')
      expect(err.code).toEqual(1)
      done()
    })
  })

  it('should print stdout in debug mode and load bootstrap', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 1 --grep "grep" --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS') // feature
      expect(stdout).toContain('Running tests in 1 workers')
      expect(stdout).toContain('bootstrap b1+b2')
      expect(stdout).toContain('message 1')
      expect(stdout).toContain('message 2')
      expect(stdout).toContain('see this is worker')
      expect(err).toEqual(null)
      done()
    })
  })

  it('should run tests with glob pattern', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run_glob('codecept.workers-glob.conf.js')} 1 --grep "grep" --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS') // feature
      expect(stdout).toContain('Running tests in 1 workers')
      expect(stdout).toContain('bootstrap b1+b2')
      expect(stdout).toContain('message 1')
      expect(stdout).toContain('message 2')
      expect(stdout).toContain('see this is worker')
      expect(err).toEqual(null)
      done()
    })
  })

  it('should print empty results with incorrect glob pattern', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run_glob('codecept.workers-incorrect-glob.conf.js')} 1 --grep "grep" --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS') // feature
      expect(stdout).toContain('Running tests in 1 workers')
      expect(stdout).toContain('OK  | 0 passed')
      expect(err).toEqual(null)
      done()
    })
  })

  it('should retry test', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --grep "retry"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS') // feature
      expect(stdout).toContain('OK  | 1 passed')
      done()
    })
  })

  it('should create output folder with custom name', function (done) {
    const fs = require('fs')
    const customName = 'thisIsCustomOutputFolderName'
    const outputDir = `${codecept_dir}/${customName}`
    let createdOutput = false

    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true })
    }

    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    const configFileName = 'codecept.workers-custom-output-folder-name.conf.js'
    exec(`${codecept_run_glob(configFileName)} 2 --grep "grep" --debug`, (err, stdout) => {
      expect(stdout).toContain(customName)
      if (fs.existsSync(outputDir)) {
        createdOutput = true
      }
      expect(createdOutput).toEqual(true)
      expect(err).toEqual(null)
      done()
    })
  })

  it('should exit code 1 when error in config', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run_glob('configs/codecept-invalid.config.js')} 2`, (err, stdout, stderr) => {
      expect(stdout).not.toContain('UnhandledPromiseRejectionWarning')
      expect(stderr).not.toContain('UnhandledPromiseRejectionWarning')
      expect(stdout).toContain('badFn is not defined')
      expect(err).not.toBe(null)

      done()
    })
  })

  it('should run tests with pool mode', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --by pool`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 2 workers')
      expect(stdout).toContain('glob current dir')
      expect(stdout).toContain('From worker @1_grep print message 1')
      expect(stdout).toContain('From worker @2_grep print message 2')
      expect(stdout).not.toContain('this is running inside worker')
      expect(stdout).toContain('failed')
      expect(stdout).toContain('File notafile not found')
      expect(stdout).toContain('Scenario Steps:')
      expect(err.code).toEqual(1)
      done()
    })
  })

  it('should run tests with pool mode and grep', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --by pool --grep "grep"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).not.toContain('glob current dir')
      expect(stdout).toContain('From worker @1_grep print message 1')
      expect(stdout).toContain('From worker @2_grep print message 2')
      expect(stdout).toContain('Running tests in 2 workers')
      expect(stdout).not.toContain('this is running inside worker')
      expect(stdout).not.toContain('failed')
      expect(stdout).not.toContain('File notafile not found')
      expect(err).toEqual(null)
      done()
    })
  })

  it('should run tests with pool mode in debug mode', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 1 --by pool --grep "grep" --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 1 workers')
      expect(stdout).toContain('bootstrap b1+b2')
      expect(stdout).toContain('message 1')
      expect(stdout).toContain('message 2')
      expect(stdout).toContain('see this is worker')
      expect(err).toEqual(null)
      done()
    })
  })

  it('should handle pool mode with single worker', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 1 --by pool`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 1 workers')
      expect(stdout).toContain('glob current dir')
      expect(stdout).toContain('failed')
      expect(stdout).toContain('File notafile not found')
      expect(err.code).toEqual(1)
      done()
    })
  })

  it('should handle pool mode with multiple workers', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 3 --by pool`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 3 workers')
      expect(stdout).toContain('glob current dir')
      expect(stdout).toContain('failed')
      expect(stdout).toContain('File notafile not found')
      // Pool mode may have slightly different counts due to test reloading
      expect(stdout).toContain('passed')
      expect(stdout).toContain('failed')
      expect(err.code).toEqual(1)
      done()
    })
  })

  it('should handle pool mode with hooks correctly', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --by pool --grep "say something" --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 2 workers')
      expect(stdout).toContain('say something')
      expect(stdout).toContain('bootstrap b1+b2') // Verify bootstrap ran
      expect(err).toEqual(null)
      done()
    })
  })

  it('should handle pool mode with retries correctly', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --by pool --grep "retry"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 2 workers')
      expect(stdout).toContain('retry a test')
      expect(stdout).toContain('✔') // Should eventually pass after retry
      expect(err).toEqual(null)
      done()
    })
  })

  it('should distribute tests efficiently in pool mode', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 4 --by pool --debug`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 4 workers')
      // Verify multiple workers are being used for test execution
      expect(stdout).toMatch(/\[[0-4]+\].*✔/) // At least one worker executed passing tests
      expect(stdout).toContain('From worker @1_grep print message 1')
      expect(stdout).toContain('From worker @2_grep print message 2')
      // Verify that tests are distributed across workers (not all in one worker)
      const workerMatches = stdout.match(/\[[0-4]+\].*✔/g) || []
      expect(workerMatches.length).toBeGreaterThan(1) // Multiple workers should have passing tests
      expect(err.code).toEqual(1) // Some tests should fail
      done()
    })
  })

  it('should handle pool mode with no available tests', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --by pool --grep "nonexistent"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 2 workers')
      expect(stdout).toContain('OK  | 0 passed')
      expect(err).toEqual(null)
      done()
    })
  })

  it('should report accurate test statistics in pool mode', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    // Run regular workers mode first to get baseline counts
    exec(`${codecept_run} 2`, (err, stdout) => {
      const regularStats = stdout.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?(?:,\s+(\d+) failedHooks)?/)
      if (!regularStats) return done(new Error('Could not parse regular mode statistics'))

      const expectedPassed = parseInt(regularStats[2])
      const expectedFailed = parseInt(regularStats[3] || '0')
      const expectedFailedHooks = parseInt(regularStats[4] || '0')

      // Now run pool mode and compare
      exec(`${codecept_run} 2 --by pool`, (err2, stdout2) => {
        expect(stdout2).toContain('CodeceptJS')
        expect(stdout2).toContain('Running tests in 2 workers')

        // Extract pool mode statistics
        const poolStats = stdout2.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?(?:,\s+(\d+) failedHooks)?/)
        expect(poolStats).toBeTruthy()

        const actualPassed = parseInt(poolStats[2])
        const actualFailed = parseInt(poolStats[3] || '0')
        const actualFailedHooks = parseInt(poolStats[4] || '0')

        // Pool mode should report exactly the same statistics as regular mode
        expect(actualPassed).toEqual(expectedPassed)
        expect(actualFailed).toEqual(expectedFailed)
        expect(actualFailedHooks).toEqual(expectedFailedHooks)

        // Both should have same exit code
        expect(err?.code || 0).toEqual(err2?.code || 0)
        done()
      })
    })
  })

  it('should report correct test counts with grep filtering in pool mode', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    // Run regular workers mode with grep first
    exec(`${codecept_run} 2 --grep "grep"`, (err, stdout) => {
      const regularStats = stdout.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?/)
      if (!regularStats) return done(new Error('Could not parse regular mode grep statistics'))

      const expectedPassed = parseInt(regularStats[2])
      const expectedFailed = parseInt(regularStats[3] || '0')

      // Now run pool mode with grep and compare
      exec(`${codecept_run} 2 --by pool --grep "grep"`, (err2, stdout2) => {
        const poolStats = stdout2.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?/)
        expect(poolStats).toBeTruthy()

        const actualPassed = parseInt(poolStats[2])
        const actualFailed = parseInt(poolStats[3] || '0')

        // Should match exactly
        expect(actualPassed).toEqual(expectedPassed)
        expect(actualFailed).toEqual(expectedFailed)
        expect(err?.code || 0).toEqual(err2?.code || 0)
        done()
      })
    })
  })

  it('should handle single vs multiple workers statistics consistently in pool mode', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    // Run pool mode with 1 worker
    exec(`${codecept_run} 1 --by pool --grep "grep"`, (err, stdout) => {
      const singleStats = stdout.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?/)
      if (!singleStats) return done(new Error('Could not parse single worker statistics'))

      const singlePassed = parseInt(singleStats[2])
      const singleFailed = parseInt(singleStats[3] || '0')

      // Run pool mode with multiple workers
      exec(`${codecept_run} 3 --by pool --grep "grep"`, (err2, stdout2) => {
        const multiStats = stdout2.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?/)
        expect(multiStats).toBeTruthy()

        const multiPassed = parseInt(multiStats[2])
        const multiFailed = parseInt(multiStats[3] || '0')

        // Statistics should be identical regardless of worker count
        expect(multiPassed).toEqual(singlePassed)
        expect(multiFailed).toEqual(singleFailed)
        expect(err?.code || 0).toEqual(err2?.code || 0)
        done()
      })
    })
  })

  it('should exit with correct code in pool mode for failing tests', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --by pool --grep "Workers Failing"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 2 workers')
      expect(stdout).toContain('FAILURES')
      expect(stdout).toContain('worker has failed')
      expect(stdout).toContain('FAIL  | 0 passed, 1 failed')
      expect(err.code).toEqual(1) // Should exit with failure code
      done()
    })
  })

  it('should exit with correct code in pool mode for passing tests', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    exec(`${codecept_run} 2 --by pool --grep "grep"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 2 workers')
      expect(stdout).toContain('OK  | 2 passed')
      expect(err).toEqual(null) // Should exit with success code (0)
      done()
    })
  })

  it('should accurately count tests with mixed results in pool mode', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    // Use a specific test that has mixed results
    exec(`${codecept_run} 2 --by pool --grep "Workers|retry"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 2 workers')

      // Should have some passing and some failing tests
      const stats = stdout.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?(?:,\s+(\d+) failedHooks)?/)
      expect(stats).toBeTruthy()

      const passed = parseInt(stats[2])
      const failed = parseInt(stats[3] || '0')
      const failedHooks = parseInt(stats[4] || '0')

      // Should have at least some passing and failing
      expect(passed).toBeGreaterThan(0)
      expect(failed + failedHooks).toBeGreaterThan(0)
      expect(err.code).toEqual(1) // Should fail due to failures
      done()
    })
  })

  it('should maintain consistency across multiple pool mode runs', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    // Run pool mode first time
    exec(`${codecept_run} 2 --by pool --grep "grep"`, (err, stdout) => {
      const firstStats = stdout.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?/)
      if (!firstStats) return done(new Error('Could not parse first run statistics'))

      const firstPassed = parseInt(firstStats[2])
      const firstFailed = parseInt(firstStats[3] || '0')

      // Run pool mode second time
      exec(`${codecept_run} 2 --by pool --grep "grep"`, (err2, stdout2) => {
        const secondStats = stdout2.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?/)
        expect(secondStats).toBeTruthy()

        const secondPassed = parseInt(secondStats[2])
        const secondFailed = parseInt(secondStats[3] || '0')

        // Results should be consistent across runs
        expect(secondPassed).toEqual(firstPassed)
        expect(secondFailed).toEqual(firstFailed)
        expect(err?.code || 0).toEqual(err2?.code || 0)
        done()
      })
    })
  })

  it('should handle large worker count without inflating statistics', function (done) {
    if (!semver.satisfies(process.version, '>=11.7.0')) this.skip('not for node version')
    // Test with more workers than tests to ensure no inflation
    exec(`${codecept_run} 8 --by pool --grep "grep"`, (err, stdout) => {
      expect(stdout).toContain('CodeceptJS')
      expect(stdout).toContain('Running tests in 8 workers')

      const stats = stdout.match(/(FAIL|OK)\s+\|\s+(\d+) passed(?:,\s+(\d+) failed)?/)
      expect(stats).toBeTruthy()

      const passed = parseInt(stats[2])
      // Should only be 2 tests matching "grep", not more due to worker count
      expect(passed).toEqual(2)
      expect(err).toEqual(null)
      done()
    })
  })
})
