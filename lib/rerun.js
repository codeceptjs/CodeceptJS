import fsPath from 'path'
import store from './store.js'
import container from './container.js'
import event from './event.js'
import BaseCodecept from './codecept.js'
import output from './output.js'
import { createRequire } from 'module'
import { resolveImportModulePath } from './utils.js'

const require = createRequire(import.meta.url)

class CodeceptRerunner extends BaseCodecept {
  async runOnce(test) {
    await container.started()

    // Ensure translations are loaded for Gherkin features
    try {
      const { loadTranslations } = await import('./mocha/gherkin.js')
      await loadTranslations()
    } catch (e) {
      // Ignore if gherkin module not available
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Create a fresh Mocha instance for each run
        // @ts-ignore
        container.createMocha()
        const mocha = container.mocha()

        let filesToRun = this.testFiles
        if (test) {
          if (!fsPath.isAbsolute(test)) {
            test = fsPath.join(store.codeceptDir, test)
          }
          filesToRun = this.testFiles.filter(t => fsPath.basename(t, '.js') === test || t === test)
        }

        // Clear any existing tests/suites
        mocha.suite.suites = []
        mocha.suite.tests = []

        // Manually load each test file by importing it
        for (const file of filesToRun) {
          try {
            // Clear CommonJS cache if available (for mixed environments)
            try {
              delete require.cache[file]
            } catch (e) {
              // ESM modules don't have require.cache, ignore
            }

            // Force reload the module by using a cache-busting query parameter
            const fileUrl = `${fsPath.resolve(file)}`
            const resolvedPath = resolveImportModulePath(fileUrl)
            await import(resolvedPath)
          } catch (e) {
            console.error(`Error loading test file ${file}:`, e)
          }
        }

        const done = () => {
          event.emit(event.all.result, container.result())
          event.emit(event.all.after, this)

          // Check if there were any failures
          if (container.result().hasFailed) {
            reject(new Error('Test run failed'))
          } else {
            resolve(undefined)
          }
        }

        event.emit(event.all.before, this)
        mocha.run(() => done())
      } catch (e) {
        output.error(e.stack)
        reject(e)
      }
    })
  }

  async runTests(test) {
    const configRerun = this.config.rerun || {}
    const minSuccess = configRerun.minSuccess || 1
    const maxReruns = configRerun.maxReruns || 1
    if (minSuccess > maxReruns) {
      process.exitCode = 1
      throw new Error(`run-rerun Configuration Error: minSuccess must be less than maxReruns. Current values: minSuccess=${minSuccess} maxReruns=${maxReruns}`)
    }
    if (maxReruns === 1) {
      await this.runOnce(test)
      return
    }
    let successCounter = 0
    let rerunsCounter = 0
    while (rerunsCounter < maxReruns && successCounter < minSuccess) {
      container.result().reset() // reset result
      rerunsCounter++
      try {
        await this.runOnce(test)
        successCounter++
        output.success(`\nProcess run ${rerunsCounter} of max ${maxReruns}, success runs ${successCounter}/${minSuccess}\n`)
      } catch (e) {
        output.error(`\nFail run ${rerunsCounter} of max ${maxReruns}, success runs ${successCounter}/${minSuccess} \n`)
        console.error(e)
      }
    }
    if (successCounter < minSuccess) {
      throw new Error(`Flaky tests detected! ${successCounter} success runs achieved instead of ${minSuccess} success runs expected`)
    }
  }

  async run(test) {
    event.emit(event.all.before, this)
    try {
      await this.runTests(test)
    } catch (e) {
      output.error(e.stack)
      throw e
    } finally {
      event.emit(event.all.result, this)
      event.emit(event.all.after, this)
    }
  }
}

export default CodeceptRerunner
