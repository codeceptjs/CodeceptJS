import fsPath from 'path'
import container from './container.js'
import MochaFactory from './mocha/factory.js'
import event from './event.js'
import recorder from './recorder.js'
import output from './output.js'
import store from './store.js'
import { validateTypeScriptSetup, getTSNodeESMWarning } from './utils/loaderCheck.js'

class Runner {
  constructor(codecept) {
    this.codecept = codecept
  }

  getSuites(pattern) {
    if (this.codecept.testFiles.length === 0) {
      this.codecept.loadTests(pattern)
    }

    const tempMocha = MochaFactory.create(this.codecept.config.mocha || {}, this.codecept.opts || {})
    tempMocha.files = this.codecept.testFiles
    tempMocha.loadFiles()

    const suites = []
    for (const suite of tempMocha.suite.suites) {
      suites.push({
        ...suite.simplify(),
        file: suite.file || '',
        tests: suite.tests.map(test => ({
          ...test.simplify(),
          fullTitle: test.fullTitle(),
        })),
      })
    }

    tempMocha.unloadFiles()
    return suites
  }

  async run(test) {
    let files = this.codecept.testFiles
    let grep

    if (test) {
      if (!fsPath.isAbsolute(test)) {
        test = fsPath.join(store.codeceptDir, test)
      }
      const testBasename = fsPath.basename(test, '.js')
      const testFeatureBasename = fsPath.basename(test, '.feature')
      files = files.filter(t => {
        return fsPath.basename(t, '.js') === testBasename || fsPath.basename(t, '.feature') === testFeatureBasename || t === test
      })
    }

    return this._execute({ files, grep })
  }

  async runSuite(suite) {
    return this.run(suite.file)
  }

  async runTest(test) {
    return this._execute({ grep: test.fullTitle })
  }

  async _execute({ files, grep } = {}) {
    await container.started()

    const tsValidation = validateTypeScriptSetup(this.codecept.testFiles, this.codecept.requiringModules || [])
    if (tsValidation.hasError) {
      output.error(tsValidation.message)
      process.exit(1)
    }

    const tsWarning = getTSNodeESMWarning(this.codecept.requiringModules || [])
    if (tsWarning) {
      output.print(output.colors.yellow(tsWarning))
    }

    try {
      const { loadTranslations } = await import('./mocha/gherkin.js')
      await loadTranslations()
    } catch (e) {
      // Ignore if gherkin module not available
    }

    return new Promise((resolve, reject) => {
      const mocha = container.mocha()
      mocha.files = files || this.codecept.testFiles

      if (grep) {
        mocha.grep(grep)
      }

      const done = async (failures) => {
        event.emit(event.all.result, container.result())
        event.emit(event.all.after, this.codecept)
        await recorder.promise()
        if (failures) {
          process.exitCode = 1
        }
        resolve()
      }

      try {
        event.emit(event.all.before, this.codecept)
        mocha.run(async (failures) => await done(failures))
      } catch (e) {
        output.error(e.stack)
        reject(e)
      }
    })
  }
}

export default Runner
