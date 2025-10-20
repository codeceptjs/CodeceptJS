exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    FileSystem: {},
  },
  include: {},
  bootstrap: false,
  plugins: {
    customReporter: {
      enabled: true,
      onHookFinished: hook => {
        console.log(`Hook Finished: ${hook.title}`)
      },
      onTestBefore: test => {
        console.log(`Test Started: ${test.title}`)
      },
      onTestPassed: test => {
        console.log(`Test Passed: ${test.title}`)
      },
      onTestFailed: (test, err) => {
        console.log(`Test Failed: ${test.title}`)
        console.log(`Error: ${err.message}`)
      },
      onTestSkipped: test => {
        console.log(`Test Skipped: ${test.title}`)
      },
      onTestFinished: test => {
        console.log(`Test Finished: ${test.title}`)
        console.log(`Test Status: ${test.state}`)
        console.log(`Test Error: ${test.err}`)
      },
      onResult: result => {
        console.log('All tests completed')
        console.log(`Total: ${result.stats.tests}`)
        console.log(`Passed: ${result.stats.passes}`)
        console.log(`Failed: ${result.stats.failures}`)
      },
      save: true,
    },
  },
  mocha: {},
  name: 'custom-reporter-plugin tests',
}
