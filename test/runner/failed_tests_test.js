const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec

const runner = path.join(__dirname, '../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox/failed-tests')

describe('Failed Tests Feature', function () {
  this.timeout(40000)

  afterEach(() => {
    try {
      fs.unlinkSync(`${codecept_dir}/failed-tests.json`)
    } catch (e) {
      // continue regardless of error
    }
  })

  it('should save failed tests to JSON file', done => {
    exec(`${runner} run --config ${codecept_dir}/codecept.conf.js --save-failed-tests`, (err, stdout) => {
      const failedTestsFile = `${codecept_dir}/failed-tests.json`

      // Should have failed tests
      expect(err).toBeTruthy()
      expect(stdout).toMatch(/Failed tests saved to/)

      // Check if failed tests file was created
      expect(fs.existsSync(failedTestsFile)).toBeTruthy()

      const failedTests = JSON.parse(fs.readFileSync(failedTestsFile, 'utf8'))
      expect(failedTests).toHaveProperty('timestamp')
      expect(failedTests).toHaveProperty('count')
      expect(failedTests).toHaveProperty('tests')
      expect(failedTests.tests).toBeInstanceOf(Array)
      expect(failedTests.tests.length).toBeGreaterThan(0)

      done()
    })
  })

  it('should run only failed tests from JSON file', done => {
    // First create a simple failed tests file
    const failedTestsFile = `${codecept_dir}/test-failed-tests.json`
    const failedTestsData = {
      timestamp: new Date().toISOString(),
      count: 1,
      tests: [
        {
          uid: 'should fail test 1',
          title: 'should fail test 1',
          fullTitle: 'Failed Tests should fail test 1',
          file: `${codecept_dir}/failed_test.js`,
          parent: { title: 'Failed Tests' },
        },
      ],
    }

    fs.writeFileSync(failedTestsFile, JSON.stringify(failedTestsData, null, 2))

    exec(`${runner} run --config ${codecept_dir}/codecept.conf.js --failed-tests ${failedTestsFile}`, (err, stdout) => {
      // Should still fail but only run the specific failed test
      expect(err).toBeTruthy()
      expect(stdout).toMatch(/should fail test 1/)
      expect(stdout).not.toMatch(/should pass test/)

      // Clean up
      fs.unlinkSync(failedTestsFile)
      done()
    })
  })

  it('should work with run-workers command', done => {
    exec(`${runner} run-workers 2 --config ${codecept_dir}/codecept.conf.js --save-failed-tests`, (err, stdout) => {
      const failedTestsFile = `${codecept_dir}/failed-tests.json`

      // Should have failed tests
      expect(err).toBeTruthy()
      expect(stdout).toMatch(/Failed tests saved to/)

      // Check if failed tests file was created
      expect(fs.existsSync(failedTestsFile)).toBeTruthy()

      const failedTests = JSON.parse(fs.readFileSync(failedTestsFile, 'utf8'))
      expect(failedTests.tests).toBeInstanceOf(Array)
      expect(failedTests.tests.length).toBeGreaterThan(0)

      done()
    })
  })
})
