const Mocha = require('mocha')
const fsPath = require('path')
const fs = require('fs')
const reporter = require('./cli')
const gherkinParser = require('./gherkin')
const output = require('../output')
const ConnectionRefused = require('../helper/errors/ConnectionRefused')

const scenarioUi = fsPath.join(__dirname, './ui.js')

let mocha

class MochaFactory {
  static create(config, opts) {
    mocha = new Mocha(Object.assign(config, opts))
    output.process(opts.child)
    mocha.ui(scenarioUi)

    Mocha.Runner.prototype.uncaught = function (err) {
      if (err) {
        if (err.toString().indexOf('ECONNREFUSED') >= 0) {
          err = new ConnectionRefused(err)
        }
        output.error(err)
        output.print(err.stack)
        process.exit(1)
      }
      output.error('Uncaught undefined exception')
      process.exit(1)
    }

    mocha.loadFiles = fn => {
      // load features
      if (mocha.suite.suites.length === 0) {
        mocha.files.filter(file => file.match(/\.feature$/)).forEach(file => mocha.suite.addSuite(gherkinParser(fs.readFileSync(file, 'utf8'), file)))

        // remove feature files
        mocha.files = mocha.files.filter(file => !file.match(/\.feature$/))

        Mocha.prototype.loadFiles.call(mocha, fn)

        // add ids for each test and check uniqueness
        const dupes = []
        let missingFeatureInFile = []
        const seenTests = []
        mocha.suite.eachTest(test => {
          const name = test.fullTitle()
          if (seenTests.includes(test.uid)) {
            dupes.push(name)
          }
          seenTests.push(test.uid)

          if (name.slice(0, name.indexOf(':')) === '') {
            missingFeatureInFile.push(test.file)
          }
        })
        if (dupes.length) {
          // ideally this should be no-op and throw (breaking change)...
          output.error(`Duplicate test names detected - Feature + Scenario name should be unique:\n${dupes.join('\n')}`)
        }

        if (missingFeatureInFile.length) {
          missingFeatureInFile = [...new Set(missingFeatureInFile)]
          output.error(`Missing Feature section in:\n${missingFeatureInFile.join('\n')}`)
        }
      }
    }

    const presetReporter = opts.reporter || config.reporter
    // use standard reporter
    if (!presetReporter) {
      mocha.reporter(reporter, opts)
      return mocha
    }

    // load custom reporter with options
    const reporterOptions = Object.assign(config.reporterOptions || {})

    if (opts.reporterOptions !== undefined) {
      opts.reporterOptions.split(',').forEach(opt => {
        const L = opt.split('=')
        if (L.length > 2 || L.length === 0) {
          throw new Error(`invalid reporter option '${opt}'`)
        } else if (L.length === 2) {
          reporterOptions[L[0]] = L[1]
        } else {
          reporterOptions[L[0]] = true
        }
      })
    }

    const attributes = Object.getOwnPropertyDescriptor(reporterOptions, 'codeceptjs-cli-reporter')
    if (reporterOptions['codeceptjs-cli-reporter'] && attributes) {
      Object.defineProperty(reporterOptions, 'codeceptjs/lib/mocha/cli', attributes)
      delete reporterOptions['codeceptjs-cli-reporter']
    }

    // custom reporters
    mocha.reporter(presetReporter, reporterOptions)
    return mocha
  }
}

module.exports = MochaFactory
