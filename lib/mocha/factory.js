import Mocha from 'mocha'
import fsPath from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import reporter from './cli.js'
import gherkinParser, { loadTranslations } from './gherkin.js'
import output from '../output.js'
import scenarioUiFunction from './ui.js'
import { initMochaGlobals } from '../globals.js'
import { fixErrorStack } from '../utils/typescript.js'
import container from '../container.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = fsPath.dirname(__filename)

let mocha

class MochaFactory {
  static create(config, opts) {
    const merged = Object.assign({}, config, opts)
    mocha = new Mocha(merged)
    if (merged.cleanReferencesAfterRun !== true) {
      mocha.cleanReferencesAfterRun(false)
    }
    output.process(opts.child)
    mocha.ui(scenarioUiFunction)

    // Manually trigger UI setup for globals to be available in ESM context
    // This ensures Feature, Scenario, Before, etc. are available immediately
    if (mocha.suite && mocha.suite.emit) {
      const context = {}
      mocha.suite.emit('pre-require', context, '', mocha)
      // Also set globals immediately so they're available when ESM modules load
      initMochaGlobals(context)
    }

    Mocha.Runner.prototype.uncaught = function (err) {
      if (err) {
        if (err.toString().indexOf('ECONNREFUSED') >= 0) {
          // Handle ECONNREFUSED without dynamic import for now
          err = new Error('Connection refused: ' + err.toString())
        }
        const fileMapping = container?.tsFileMapping?.()
        if (fileMapping) {
          fixErrorStack(err, fileMapping)
        }
        output.error(err)
        output.print(err.stack)
        process.exit(1)
      }
      output.error('Uncaught undefined exception')
      process.exit(1)
    }

    // Override loadFiles to handle feature files
    const originalLoadFiles = Mocha.prototype.loadFiles
    mocha.loadFiles = function (fn) {
      // load features
      const featureFiles = this.files.filter(file => file.match(/\.feature$/))
      if (featureFiles.length > 0) {
        // Load translations for Gherkin features
        loadTranslations().catch(() => {
          // Ignore if translations can't be loaded
        })

        for (const file of featureFiles) {
          const suite = gherkinParser(fs.readFileSync(file, 'utf8'), file)
          this.suite.addSuite(suite)
        }

        // remove feature files
        const jsFiles = this.files.filter(file => !file.match(/\.feature$/))
        this.files = this.files.filter(file => !file.match(/\.feature$/))

        // Load JavaScript test files using original loadFiles
        if (jsFiles.length > 0) {
          originalLoadFiles.call(this, fn)
        }

        // add ids for each test and check uniqueness
        const dupes = []
        let missingFeatureInFile = []
        const seenTests = []
        this.suite.eachTest(test => {
          if (!test) {
            return // Skip undefined tests
          }
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
      } else {
        // Use original for non-feature files
        originalLoadFiles.call(this, fn)
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

export default MochaFactory
