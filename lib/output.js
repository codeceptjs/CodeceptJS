const colors = require('chalk')
const figures = require('figures')
const { maskData, shouldMaskData, getMaskConfig } = require('./utils/mask_data')

const styles = {
  error: colors.bgRed.white.bold,
  success: colors.bgGreen.white.bold,
  scenario: colors.magenta.bold,
  basic: colors.white,
  debug: colors.cyan,
  log: colors.grey,
  bold: colors.bold,
  section: colors.white.dim.bold,
}

let outputLevel = 0
let outputProcess = ''
let newline = true

/**
 * @alias output
 * @namespace
 */
module.exports = {
  colors,
  styles,
  print,
  /** @type {number} */
  stepShift: 0,

  standWithUkraine() {
    return `#${colors.bold.yellow('StandWith')}${colors.bold.cyan('Ukraine')}`
  },

  /**
   * Set or return current verbosity level
   * @param {number} [level]
   * @returns {number}
   */
  level(level) {
    if (level !== undefined) outputLevel = level
    return outputLevel
  },

  /**
   * Print information for a process
   * Used in multiple-run
   * @param {string | null} process
   * @returns {string}
   */
  process(process) {
    if (process === null) return (outputProcess = '')
    if (process) {
      // Handle objects by converting to empty string or extracting properties
      let processValue = process
      if (typeof process === 'object') {
        // If it's an object, try to extract a numeric value or use empty string
        processValue = process.id || process.index || process.worker || ''
      }

      // Check if this is a run-multiple process (contains : or .)
      // Format: "1.runName:browserName" from run-multiple
      if (String(processValue).includes(':') || (String(processValue).includes('.') && String(processValue).split('.').length > 1)) {
        // Keep original format for run-multiple
        outputProcess = colors.cyan.bold(`[${processValue}]`)
      } else {
        // Standard worker format for run-workers
        const processNum = parseInt(processValue, 10)
        const processStr = !isNaN(processNum) ? String(processNum).padStart(2, '0') : String(processValue).padStart(2, '0')

        // Assign different colors to different workers for better identification
        const workerColors = [
          colors.cyan, // Worker 01 - Cyan
          colors.magenta, // Worker 02 - Magenta
          colors.green, // Worker 03 - Green
          colors.yellow, // Worker 04 - Yellow
          colors.blue, // Worker 05 - Blue
          colors.red, // Worker 06 - Red
          colors.white, // Worker 07 - White
          colors.gray, // Worker 08 - Gray
        ]
        const workerIndex = !isNaN(processNum) ? processNum - 1 : -1
        const colorFn = workerIndex >= 0 && workerColors[workerIndex % workerColors.length] ? workerColors[workerIndex % workerColors.length] : colors.cyan
        outputProcess = colorFn.bold(`[Worker ${processStr}]`)
      }
    }
    return outputProcess
  },

  /**
   * Print information in --debug mode
   * @param {string} msg
   */
  debug(msg) {
    const _msg = shouldMaskData() ? maskData(msg, getMaskConfig()) : msg
    if (outputLevel >= 2) {
      print(' '.repeat(this.stepShift), styles.debug(`${figures.pointerSmall} ${_msg}`))
    }
  },

  /**
   * Print information in --verbose mode
   * @param {string} msg
   */
  log(msg) {
    const _msg = shouldMaskData() ? maskData(msg, getMaskConfig()) : msg
    if (outputLevel >= 3) {
      print(' '.repeat(this.stepShift), styles.log(truncate(`   ${_msg}`, this.spaceShift)))
    }
  },

  /**
   * Print error
   * @param {string} msg
   */
  error(msg) {
    const _msg = shouldMaskData() ? maskData(msg, getMaskConfig()) : msg
    print(styles.error(_msg))
  },

  /**
   * Print a successful message
   * @param {string} msg
   */
  success(msg) {
    const _msg = shouldMaskData() ? maskData(msg, getMaskConfig()) : msg
    print(styles.success(_msg))
  },

  /**
   * Prints plugin message
   * @param {string} pluginName
   * @param {string} msg
   */
  plugin(pluginName, msg = '') {
    this.debug(`<${pluginName}> ${msg}`)
  },

  /**
   * Print a step
   * @param {CodeceptJS.Step} step
   */
  step(step) {
    if (outputLevel === 0) return
    if (!step) return
    // Avoid to print non-gherkin steps, when gherkin is running for --steps mode
    if (outputLevel === 1) {
      if (typeof step === 'object' && step.hasBDDAncestor()) {
        return
      }
    }

    let stepLine = step.toCliStyled ? step.toCliStyled() : step.toString()
    if (step.metaStep && outputLevel >= 1) {
      // this.stepShift += 2;
      stepLine = colors.dim(truncate(stepLine, this.spaceShift))
    }
    if (step.comment) {
      stepLine += colors.grey(step.comment.split('\n').join('\n' + ' '.repeat(4)))
    }

    const _stepLine = shouldMaskData() ? maskData(stepLine, getMaskConfig()) : stepLine
    print(' '.repeat(this.stepShift), truncate(_stepLine, this.spaceShift))
  },

  /** @namespace */
  suite: {
    /**
     * @param {Mocha.Suite} suite
     */
    started: suite => {
      if (!suite.title) return
      print(`${colors.bold(suite.title)} --`)
      if (suite.file && outputLevel >= 1) print(colors.underline.grey(suite.file))
      if (suite.comment) print(suite.comment)
    },
  },

  /** @namespace */
  test: {
    /**
     * @param {Mocha.Test} test
     */
    started(test) {
      // Only show feature name in workers mode (when outputProcess is set)
      const featureName = outputProcess && test.parent?.title ? `${colors.cyan.bold(test.parent.title)} › ` : ''
      print(`  ${featureName}${colors.magenta.bold(test.title)}`)
    },
    /**
     * @param {Mocha.Test} test
     */
    passed(test) {
      // Only show feature name in workers mode (when outputProcess is set)
      const featureName = outputProcess && test.parent?.title ? `${colors.cyan(test.parent.title)} › ` : ''
      const scenarioName = colors.bold(test.title)
      const executionTime = colors.cyan(`in ${test.duration}ms`)
      print(`  ${colors.green.bold(figures.tick)} ${featureName}${scenarioName} ${executionTime}`)
    },
    /**
     * @param {Mocha.Test} test
     */
    failed(test) {
      // Only show feature name in workers mode (when outputProcess is set)
      const featureName = outputProcess && test.parent?.title ? `${colors.yellow(test.parent.title)} › ` : ''
      const scenarioName = colors.bold(test.title)
      const executionTime = colors.yellow(`in ${test.duration}ms`)
      print(`  ${colors.red.bold(figures.cross)} ${featureName}${scenarioName} ${executionTime}`)
    },
    /**
     * @param {Mocha.Test} test
     */
    skipped(test) {
      // Only show feature name in workers mode (when outputProcess is set)
      const featureName = outputProcess && test.parent?.title ? `${colors.gray(test.parent.title)} › ` : ''
      const scenarioName = colors.bold(test.title)
      print(`  ${colors.yellow.bold('S')} ${featureName}${scenarioName}`)
    },
  },

  /** @namespace */
  scenario: {
    /**
     * @param {Mocha.Test} test
     */
    started(test) {
      if (outputLevel < 1) return
      print(`  ${colors.dim.bold('Scenario()')}`)
    },
    /**
     * @param {Mocha.Test} test
     */
    passed(test) {
      print(`  ${colors.green.bold(`${figures.tick} OK`)} ${colors.grey(`in ${test.duration}ms`)}`)
      print()
    },
    /**
     * @param {Mocha.Test} test
     */
    failed(test) {
      print(`  ${colors.red.bold(`${figures.cross} FAILED`)} ${colors.grey(`in ${test.duration}ms`)}`)
      print()
    },
  },

  hook: {
    started(hook) {
      if (outputLevel < 1) return
      print(`  ${colors.dim.bold(hook.toCode())}`)
    },
    passed(hook) {
      if (outputLevel < 1) return
      print()
    },
    failed(hook) {
      if (outputLevel < 1) return
      print(`  ${colors.red.bold(hook.toCode())}`)
    },
  },

  /**
   *
   * Print a text in console log
   * @param {string} message
   * @param {string} [color]
   */
  say(message, color = 'cyan') {
    if (colors[color] === undefined) {
      color = 'cyan'
    }
    if (outputLevel >= 1) print(`   ${colors[color].bold(message)}`)
  },

  /**
   * Prints the stats of a test run to the console.
   * @param {number} passed
   * @param {number} failed
   * @param {number} skipped
   * @param {number|string} duration
   * @param {number} [failedHooks]
   */
  result(passed, failed, skipped, duration, failedHooks = 0) {
    let style = colors.bgGreen
    let msg = ` ${passed || 0} passed`
    let status = style.bold('  OK ')
    if (failed) {
      style = style.bgRed
      status = style.bold('  FAIL ')
      msg += `, ${failed} failed`
    }

    if (failedHooks > 0) {
      style = style.bgRed
      status = style.bold('  FAIL ')
      msg += `, ${failedHooks} failedHooks`
    }
    status += style.grey(' |')

    if (skipped) {
      if (!failed) style = style.bgYellow
      msg += `, ${skipped} skipped`
    }
    msg += '  '
    print(status + style(msg) + colors.grey(` // ${duration}`))
  },
}

function print(...msg) {
  if (outputProcess) {
    msg.unshift(outputProcess)
  }
  if (!newline) {
    console.log()
    newline = true
  }

  console.log.apply(this, msg)
}

function truncate(msg, gap = 0) {
  if (msg.indexOf('\n') > 0 || outputLevel >= 3) {
    return msg // don't cut multi line steps or on verbose log level
  }
  const width = (process.stdout.columns || 200) - gap - 4
  if (msg.length > width) {
    msg = msg.substr(0, width - 1) + figures.ellipsis
  }
  return msg
}
