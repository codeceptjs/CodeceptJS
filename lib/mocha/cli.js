const {
  reporters: { Base },
} = require('mocha')
const ms = require('ms')
const figures = require('figures')
const event = require('../event')
const AssertionFailedError = require('../assert/error')
const output = require('../output')
const { cloneTest } = require('./test')
const cursor = Base.cursor
let currentMetaStep = []
let codeceptjsEventDispatchersRegistered = false

class Cli extends Base {
  constructor(runner, opts) {
    super(runner)
    let level = 0
    this.loadedTests = []
    opts = opts.reporterOptions || opts
    if (opts.steps) level = 1
    if (opts.debug) level = 2
    if (opts.verbose) level = 3
    output.level(level)
    output.print(`CodeceptJS v${require('../codecept').version()} ${output.standWithUkraine()}`)
    output.print(`Using test root "${global.codecept_dir}"`)

    const showSteps = level >= 1

    if (level >= 2) {
      const Containter = require('../container')
      output.print(output.styles.debug(`Helpers: ${Object.keys(Containter.helpers()).join(', ')}`))
      output.print(output.styles.debug(`Plugins: ${Object.keys(Containter.plugins()).join(', ')}`))
    }

    if (level >= 3) {
      process.on('warning', warning => {
        console.log('\nWarning Details:')
        console.log('Name:', warning.name)
        console.log('Message:', warning.message)
        console.log('Stack:', warning.stack)
        console.log('-------------------')
      })
    }

    runner.on('start', () => {
      console.log()
    })

    runner.on('suite', suite => {
      output.suite.started(suite)
    })

    runner.on('fail', test => {
      if (test.ctx.currentTest) {
        this.loadedTests.push(test.ctx.currentTest.uid)
      }
      if (showSteps && test.steps) {
        return output.scenario.failed(test)
      }
      cursor.CR()
      output.test.failed(test)
    })

    runner.on('pending', test => {
      if (test.parent && test.parent.pending) {
        const suite = test.parent
        const skipInfo = suite.opts.skipInfo || {}
        skipTestConfig(test, skipInfo.message)
      } else {
        skipTestConfig(test, null)
      }
      this.loadedTests.push(test.uid)
      cursor.CR()
      output.test.skipped(test)
    })

    runner.on('pass', test => {
      if (showSteps && test.steps) {
        return output.scenario.passed(test)
      }
      cursor.CR()
      output.test.passed(test)
    })

    if (showSteps) {
      runner.on('test', test => {
        currentMetaStep = []
        if (test.steps) {
          output.test.started(test)
        }
      })

      if (!codeceptjsEventDispatchersRegistered) {
        codeceptjsEventDispatchersRegistered = true

        event.dispatcher.on(event.bddStep.started, step => {
          output.stepShift = 2
          output.step(step)
        })

        event.dispatcher.on(event.step.started, step => {
          let processingStep = step
          const metaSteps = []
          let isHidden = false
          while (processingStep.metaStep) {
            metaSteps.unshift(processingStep.metaStep)
            processingStep = processingStep.metaStep
            if (processingStep.collapsed) isHidden = true
          }
          const shift = metaSteps.length

          for (let i = 0; i < Math.max(currentMetaStep.length, metaSteps.length); i++) {
            if (currentMetaStep[i] !== metaSteps[i]) {
              output.stepShift = 3 + 2 * i
              if (!metaSteps[i]) continue
              // bdd steps are handled by bddStep.started
              if (metaSteps[i].isBDD()) continue
              output.step(metaSteps[i])
            }
          }
          currentMetaStep = metaSteps
          if (isHidden) return
          output.stepShift = 3 + 2 * shift
          output.step(step)
        })

        event.dispatcher.on(event.step.finished, () => {
          output.stepShift = 0
        })
      }
    }

    runner.on('suite end', suite => {
      let skippedCount = 0
      const grep = runner._grep
      for (const test of suite.tests) {
        if (!test.state && !this.loadedTests.includes(test.uid)) {
          if (matchTest(grep, test.title)) {
            if (!test.opts) {
              test.opts = {}
            }
            if (!test.opts.skipInfo) {
              test.opts.skipInfo = {}
            }
            skipTestConfig(test, "Skipped due to failure in 'before' hook")
            output.test.skipped(test)
            skippedCount += 1
          }
        }
      }

      const container = require('../container')
      container.result().addStats({ pending: skippedCount, tests: skippedCount })
    })

    runner.on('end', this.result.bind(this))
  }

  result() {
    const container = require('../container')
    container.result().addStats(this.stats)
    container.result().finish()

    const stats = container.result().stats
    console.log()

    // passes
    if (stats.failures) {
      output.print(output.styles.bold('-- FAILURES:'))
    }

    const failuresLog = []

    // failures
    if (stats.failures) {
      // append step traces
      this.failures = this.failures.map(test => {
        // we will change the stack trace, so we need to clone the test
        const err = test.err

        let log = ''
        let originalMessage = err.message

        if (err instanceof AssertionFailedError) {
          err.message = err.inspect()
        }

        // multi-line error messages (for Playwright)
        if (err.message && err.message.includes('\n')) {
          const lines = err.message.split('\n')
          const truncatedLines = lines.slice(0, 5)
          if (lines.length > 5) {
            truncatedLines.push('...')
          }
          err.message = truncatedLines.join('\n').replace(/^/gm, '  ').trim()
        }

        // add new line before the message
        err.message = '\n  ' + err.message

        // explicitly show file with error
        if (test.file) {
          log += `\n${output.styles.basic(figures.circle)} ${output.styles.section('File:')} ${output.styles.basic(test.file)}\n`
        }

        const steps = test.steps || (test.ctx && test.ctx.test.steps)

        if (steps && steps.length) {
          let scenarioTrace = ''
          steps
            .reverse()
            .slice(0, 10)
            .forEach(step => {
              const hasFailed = step.status === 'failed'
              let line = `${hasFailed ? output.styles.bold(figures.cross) : figures.tick} ${step.toCode()} ${step.line()}`
              if (hasFailed) line = output.styles.bold(line)
              scenarioTrace += `\n${line}`
            })
          log += `\n${output.styles.basic(figures.circle)} ${output.styles.section('Scenario Steps')}:${scenarioTrace}\n`
        }

        // display artifacts in debug mode
        if (test?.artifacts && Object.keys(test.artifacts).length) {
          log += `\n${output.styles.basic(figures.circle)} ${output.styles.section('Artifacts:')}`
          for (const artifact of Object.keys(test.artifacts)) {
            log += `\n- ${artifact}: ${test.artifacts[artifact]}`
          }
        }

        // display metadata
        if (test.meta && Object.keys(test.meta).length) {
          log += `\n\n${output.styles.basic(figures.circle)} ${output.styles.section('Metadata:')}`
          for (const [key, value] of Object.entries(test.meta)) {
            log += `\n- ${key}: ${value}`
          }
        }

        try {
          let stack = err.stack
          stack = (stack || '').replace(originalMessage, '')
          stack = stack ? stack.split('\n') : []

          if (stack[0] && stack[0].includes(err.message)) {
            stack.shift()
          }

          if (stack[0] && stack[0].trim() == 'Error:') {
            stack.shift()
          }

          if (output.level() < 3) {
            stack = stack.slice(0, 3)
          }

          err.stack = `${stack.join('\n')}\n\n${output.colors.blue(log)}`
        } catch (e) {
          console.error(e)
        }

        // we will change the stack trace, so we need to clone the test
        test = cloneTest(test)
        test.err = err
        return test
      })

      const originalLog = Base.consoleLog
      Base.consoleLog = (...data) => {
        failuresLog.push([...data])
        originalLog(...data)
      }
      Base.list(this.failures)
      Base.consoleLog = originalLog
      console.log()
    }

    container.result().addFailures(failuresLog)

    output.result(stats.passes, stats.failures, stats.pending, ms(stats.duration), stats.failedHooks)

    if (stats.failures && output.level() < 3) {
      output.print(output.styles.debug('Run with --verbose flag to see complete NodeJS stacktrace'))
    }
  }
}

function matchTest(grep, test) {
  if (grep) {
    return grep.test(test)
  }
  return true
}

function skipTestConfig(test, message) {
  if (!test.opts) {
    test.opts = {}
  }
  if (!test.opts.skipInfo) {
    test.opts.skipInfo = {}
  }
  test.opts.skipInfo.message = test.opts.skipInfo.message || message
  test.opts.skipInfo.isFastSkipped = true
  event.emit(event.test.skipped, test)
  test.state = 'skipped'
}

module.exports = function (runner, opts) {
  return new Cli(runner, opts)
}
