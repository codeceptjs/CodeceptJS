import Mocha from 'mocha'
import fsPath from 'path'
import { fileURLToPath } from 'url'
import reporter from './cli.js'
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
