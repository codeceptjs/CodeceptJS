const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const assert = require('assert')

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
      assert(err, 'Expected tests to fail')
      assert(stdout.match(/Failed tests saved to/), 'Expected failed tests message in stdout')

      // Check if failed tests file was created
      assert(fs.existsSync(failedTestsFile), 'Expected failed tests file to be created')

      const failedTests = JSON.parse(fs.readFileSync(failedTestsFile, 'utf8'))
      assert(failedTests.hasOwnProperty('timestamp'), 'Expected timestamp property')
      assert(failedTests.hasOwnProperty('count'), 'Expected count property')
      assert(failedTests.hasOwnProperty('tests'), 'Expected tests property')
      assert(Array.isArray(failedTests.tests), 'Expected tests to be an array')
      assert(failedTests.tests.length > 0, 'Expected at least one failed test')

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
      assert(err, 'Expected test to fail')
      assert(stdout.match(/should fail test 1/), 'Expected specific failed test to run')
      assert(!stdout.match(/should pass test/), 'Should not run passing tests')

      // Clean up
      fs.unlinkSync(failedTestsFile)
      done()
    })
  })

  it('should work with run-workers command', done => {
    exec(`${runner} run-workers 2 --config ${codecept_dir}/codecept.conf.js --save-failed-tests`, (err, stdout) => {
      const failedTestsFile = `${codecept_dir}/failed-tests.json`

      // Should have failed tests
      assert(err, 'Expected tests to fail')
      assert(stdout.match(/Failed tests saved to/), 'Expected failed tests message in stdout')

      // Check if failed tests file was created
      assert(fs.existsSync(failedTestsFile), 'Expected failed tests file to be created')

      const failedTests = JSON.parse(fs.readFileSync(failedTestsFile, 'utf8'))
      assert(Array.isArray(failedTests.tests), 'Expected tests to be an array')
      assert(failedTests.tests.length > 0, 'Expected at least one failed test')

      done()
    })
  })
})
