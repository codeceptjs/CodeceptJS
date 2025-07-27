import Mocha from 'mocha'
import fsPath from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import reporter from './cli.js'
import gherkinParser, { loadTranslations } from './gherkin.js'
import output from '../output.js'
import scenarioUiFunction from './ui.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = fsPath.dirname(__filename)

let mocha

class MochaFactory {
  static create(config, opts) {
    mocha = new Mocha(Object.assign(config, opts))
    output.process(opts.child)
    mocha.ui(scenarioUiFunction)

    // Manually trigger UI setup for globals to be available in ESM context
    // This ensures Feature, Scenario, Before, etc. are available immediately
    if (mocha.suite && mocha.suite.emit) {
      const context = {}
      mocha.suite.emit('pre-require', context, '', mocha)
    }

    Mocha.Runner.prototype.uncaught = function (err) {
      if (err) {
        if (err.toString().indexOf('ECONNREFUSED') >= 0) {
          // Handle ECONNREFUSED without dynamic import for now
          err = new Error('Connection refused: ' + err.toString())
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
        const featureFiles = mocha.files.filter(file => file.match(/\.feature$/))
        for (const file of featureFiles) {
          const suite = gherkinParser(fs.readFileSync(file, 'utf8'), file)
          mocha.suite.addSuite(suite)
        }

        // remove feature files
        const jsFiles = mocha.files.filter(file => !file.match(/\.feature$/))
        mocha.files = mocha.files.filter(file => !file.match(/\.feature$/))

        // Load JavaScript test files using ESM imports
        if (jsFiles.length > 0) {
          try {
            // Try original loadFiles first for compatibility
            Mocha.prototype.loadFiles.call(mocha, fn)
          } catch (e) {
            // If original loadFiles fails, load ESM files manually
            if (e.message.includes('not in cache') || e.message.includes('ESM') || e.message.includes('getStatus')) {
              console.warn('Loading ESM test files manually due to Mocha compatibility issues')
              // Load ESM files by importing them synchronously using top-level await workaround
              for (const file of jsFiles) {
                try {
                  // Convert file path to file:// URL for dynamic import
                  const fileUrl = `file://${file}`
                  // Use import() but don't await it - let it load in the background
                  import(fileUrl).catch(importErr => {
                    // If dynamic import fails, the file may have syntax errors or other issues
                    console.error(`Failed to load test file ${file}:`, importErr.message)
                  })
                } catch (fileErr) {
                  console.error(`Error processing test file ${file}:`, fileErr.message)
                }
              }
            } else {
              throw e
            }
          }
        }

        // add ids for each test and check uniqueness
        const dupes = []
        let missingFeatureInFile = []
        const seenTests = []
        mocha.suite.eachTest(test => {
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
