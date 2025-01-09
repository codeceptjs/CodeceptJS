const figures = require('figures')
const Container = require('../container')
const event = require('../event')
const output = require('../output')
const { searchWithFusejs } = require('../utils')

module.exports = function () {
  let isEmptyRun = true

  event.dispatcher.on(event.test.before, test => {
    isEmptyRun = false
  })

  event.dispatcher.on(event.all.result, () => {
    if (isEmptyRun) {
      const mocha = Container.mocha()

      if (mocha.options.grep) {
        output.print()
        output.print('No tests found by pattern: ' + mocha.options.grep)

        const allTests = []
        mocha.suite.suites.forEach(suite => {
          suite.tests.forEach(test => {
            allTests.push(test.fullTitle())
          })
        })

        const results = searchWithFusejs(allTests, mocha.options.grep.toString(), {
          includeScore: true,
          threshold: 0.6,
          caseSensitive: false,
        })

        if (results.length > 0) {
          output.print()
          output.print('Maybe you wanted to run one of these tests?')
          results.forEach(result => {
            output.print(figures.checkboxOff, output.styles.log(result.item))
          })

          output.print()
          output.print(output.styles.debug('To run the first test use the following command:'))
          output.print(output.styles.bold('npx codeceptjs run --debug --grep "' + results[0].item + '"'))
        }
      }
      if (process.env.CI && !process.env.DONT_FAIL_ON_EMPTY_RUN) {
        output.print()
        output.error('No tests were executed. Failing on CI to avoid false positives')
        output.error('To disable this check, set `DONT_FAIL_ON_EMPTY_RUN` environment variable to true in CI config')
        process.exitCode = 1
      }
    }
  })
}
