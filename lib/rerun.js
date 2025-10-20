const fsPath = require('path')
const container = require('./container')
const event = require('./event')
const BaseCodecept = require('./codecept')
const output = require('./output')

class CodeceptRerunner extends BaseCodecept {
  runOnce(test) {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      container.createMocha()
      const mocha = container.mocha()
      this.testFiles.forEach(file => {
        delete require.cache[file]
      })
      mocha.files = this.testFiles
      if (test) {
        if (!fsPath.isAbsolute(test)) {
          test = fsPath.join(global.codecept_dir, test)
        }
        mocha.files = mocha.files.filter(t => fsPath.basename(t, '.js') === test || t === test)
      }
      try {
        mocha.run(failures => {
          if (failures === 0) {
            resolve()
          } else {
            reject(new Error(`${failures} tests fail`))
          }
        })
      } catch (e) {
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

module.exports = CodeceptRerunner
