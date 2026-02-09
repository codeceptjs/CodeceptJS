import crypto from 'crypto'
import fs from 'fs'
import { mkdirp } from 'mkdirp'
import path from 'path'
import { fileURLToPath } from 'url'

import Container from '../container.js'
import recorder from '../recorder.js'
import event from '../event.js'
import output from '../output.js'
import { deleteDir, clearString } from '../utils.js'
import colors from 'chalk'

const supportedHelpers = Container.STANDARD_ACTING_HELPERS

const defaultConfig = {
  deleteSuccessful: false,
  fullPageScreenshots: false,
  output: global.output_dir,
  captureHTML: true,
  captureARIA: true,
  captureBrowserLogs: true,
  captureHTTP: true,
  captureDebugOutput: true,
  ignoreSteps: [],
}

/**
 *
 * Generates AI-friendly trace files for debugging with AI agents.
 * This plugin creates a markdown file with test execution logs and links to all artifacts
 * (screenshots, HTML, ARIA snapshots, browser logs, HTTP requests) for each step.
 *
 * #### Configuration
 *
 * ```js
 * "plugins": {
 *    "aiTrace": {
 *      "enabled": true
 *    }
 *  }
 * ```
 *
 * Possible config options:
 *
 * * `deleteSuccessful`: delete traces for successfully executed tests. Default: false.
 * * `fullPageScreenshots`: should full page screenshots be used. Default: false.
 * * `output`: a directory where traces should be stored. Default: `output`.
 * * `captureHTML`: capture HTML for each step. Default: true.
 * * `captureARIA`: capture ARIA snapshot for each step. Default: true.
 * * `captureBrowserLogs`: capture browser console logs. Default: true.
 * * `captureHTTP`: capture HTTP requests (requires `trace` or `recordHar` enabled in helper config). Default: true.
 * * `captureDebugOutput`: capture CodeceptJS debug output. Default: true.
 * * `ignoreSteps`: steps to ignore in trace. Array of RegExps is expected.
 *
 * @param {*} config
 */
export default function (config) {
  const helpers = Container.helpers()
  let helper

  config = Object.assign(defaultConfig, config)

  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName]
    }
  }

  if (!helper) {
    output.warn('aiTrace plugin: No supported helper found (Playwright, Puppeteer, WebDriver). Plugin disabled.')
    return
  }

  let dir
  let stepNum
  let steps = []
  let debugOutput = []
  let error
  let savedSteps = new Set()
  let currentTest = null
  let testStartTime
  let currentUrl = null

  const reportDir = config.output ? path.resolve(global.codecept_dir, config.output) : defaultConfig.output

  if (config.captureDebugOutput) {
    const originalDebug = output.debug
    output.debug = function (...args) {
      debugOutput.push(args.join(' '))
      originalDebug.apply(output, args)
    }
  }

  event.dispatcher.on(event.suite.before, suite => {
    stepNum = -1
  })

  event.dispatcher.on(event.test.before, test => {
    const testTitle = clearString(test.fullTitle()).slice(0, 200)
    const uniqueHash = crypto
      .createHash('sha256')
      .update(test.file + test.title)
      .digest('hex')
      .slice(0, 8)
    dir = path.join(reportDir, `trace_${testTitle}_${uniqueHash}`)
    mkdirp.sync(dir)
    stepNum = 0
    error = null
    steps = []
    debugOutput = []
    savedSteps.clear()
    currentTest = test
    testStartTime = Date.now()
    currentUrl = null
  })

  event.dispatcher.on(event.step.after, step => {
    if (!currentTest) return
    recorder.add('save ai trace step', async () => persistStep(step), true)
  })

  event.dispatcher.on(event.step.failed, step => {
    if (!currentTest) return
    recorder.add('save ai trace failed step', async () => persistStep(step), true)
  })

  event.dispatcher.on(event.test.passed, test => {
    if (config.deleteSuccessful) {
      deleteDir(dir)
      return
    }
    persist(test, 'passed')
  })

  event.dispatcher.on(event.test.failed, (test, _err, hookName) => {
    if (hookName === 'BeforeSuite' || hookName === 'AfterSuite') {
      return
    }
    persist(test, 'failed')
  })

  async function persistStep(step) {
    if (stepNum === -1) return
    if (isStepIgnored(step)) return
    if (step.metaStep && step.metaStep.name === 'BeforeSuite') return

    const stepKey = step.toString()
    if (savedSteps.has(stepKey)) {
      const existingStep = steps.find(s => s.step === stepKey)
      if (existingStep && step.status === 'failed') {
        existingStep.status = 'failed'
      }
      return
    }
    savedSteps.add(stepKey)

    const stepPrefix = `${String(stepNum).padStart(4, '0')}`
    stepNum++

    const stepData = {
      step: step.toString(),
      status: step.status,
      prefix: stepPrefix,
      artifacts: {},
      meta: {},
      debugOutput: [],
    }

    if (step.startTime && step.endTime) {
      stepData.meta.duration = ((step.endTime - step.startTime) / 1000).toFixed(2) + 's'
    }

    if (config.captureDebugOutput && debugOutput.length > 0) {
      stepData.debugOutput = [...debugOutput]
      debugOutput = []
    }

    try {
      if (helper.grabCurrentUrl) {
        try {
          const url = await helper.grabCurrentUrl()
          stepData.meta.url = url
          currentUrl = url
        } catch (err) {
          // Ignore URL capture errors
        }
      }

      // Save screenshot
      if (!step.artifacts?.screenshot) {
        const screenshotFile = `${stepPrefix}_screenshot.png`
        await helper.saveScreenshot(path.join(dir, screenshotFile), config.fullPageScreenshots)
        stepData.artifacts.screenshot = screenshotFile
      } else {
        stepData.artifacts.screenshot = step.artifacts.screenshot
      }

      // Save HTML
      if (config.captureHTML && helper.grabSource) {
        if (!step.artifacts?.html) {
          try {
            const html = await helper.grabSource()
            const htmlFile = `${stepPrefix}_page.html`
            fs.writeFileSync(path.join(dir, htmlFile), html)
            stepData.artifacts.html = htmlFile
          } catch (err) {
            output.debug(`aiTrace: Could not capture HTML: ${err.message}`)
          }
        } else {
          stepData.artifacts.html = step.artifacts.html
        }
      }

      // Save ARIA snapshot
      if (config.captureARIA && helper.grabAriaSnapshot) {
        try {
          const aria = await helper.grabAriaSnapshot()
          const ariaFile = `${stepPrefix}_aria.txt`
          fs.writeFileSync(path.join(dir, ariaFile), aria)
          stepData.artifacts.aria = ariaFile
        } catch (err) {
          output.debug(`aiTrace: Could not capture ARIA snapshot: ${err.message}`)
        }
      }

      // Save browser logs
      if (config.captureBrowserLogs && helper.grabBrowserLogs) {
        try {
          const logs = await helper.grabBrowserLogs()
          const logsFile = `${stepPrefix}_console.json`
          fs.writeFileSync(path.join(dir, logsFile), JSON.stringify(logs || [], null, 2))
          stepData.artifacts.console = logsFile
          stepData.meta.consoleCount = logs ? logs.length : 0
        } catch (err) {
          output.debug(`aiTrace: Could not capture browser logs: ${err.message}`)
        }
      }
    } catch (err) {
      output.plugin(`aiTrace: Can't save step artifacts: ${err}`)
    }

    steps.push(stepData)
  }

  function persist(test, status) {
    if (!steps.length) {
      output.debug('aiTrace: No steps to save in trace')
      return
    }

    const testDuration = ((Date.now() - testStartTime) / 1000).toFixed(2)

    let markdown = `file: ${test.file || 'unknown'}\n`
    markdown += `name: ${test.title}\n`
    markdown += `time: ${testDuration}s\n`
    markdown += `---\n\n`

    if (status === 'failed') {
      if (test.art && test.art.message) {
        markdown += `Error: ${test.art.message}\n\n`
      }
      if (test.art && test.art.stack) {
        markdown += `${test.art.stack}\n\n`
      }
      markdown += `---\n\n`
    }

    if (config.captureDebugOutput && debugOutput.length > 0) {
      markdown += `CodeceptJS Debug Output:\n\n`
      debugOutput.forEach(line => {
        markdown += `> ${line}\n`
      })
      markdown += `\n---\n\n`
    }

    steps.forEach((stepData, index) => {
      markdown += `${stepData.step}\n`

      if (stepData.meta.duration) {
        markdown += `  > duration: ${stepData.meta.duration}\n`
      }

      if (stepData.meta.url) {
        markdown += `  > navigated to ${stepData.meta.url}\n`
      }

      if (config.captureDebugOutput && stepData.debugOutput && stepData.debugOutput.length > 0) {
        stepData.debugOutput.forEach(line => {
          markdown += `  > ${line}\n`
        })
      }

      if (stepData.artifacts.html) {
        markdown += `  > [HTML](./${stepData.artifacts.html})\n`
      }

      if (stepData.artifacts.aria) {
        markdown += `  > [ARIA Snapshot](./${stepData.artifacts.aria})\n`
      }

      if (stepData.artifacts.screenshot) {
        markdown += `  > [Screenshot](./${stepData.artifacts.screenshot})\n`
      }

      if (stepData.artifacts.console) {
        const count = stepData.meta.consoleCount || 0
        markdown += `  > [Browser Logs](./${stepData.artifacts.console}) (${count} entries)\n`
      }

      if (config.captureHTTP) {
        if (test.artifacts && test.artifacts.har) {
          const harPath = path.relative(reportDir, test.artifacts.har)
          markdown += `  > HTTP: see [HAR file](../${harPath}) for network requests\n`
        } else if (test.artifacts && test.artifacts.trace) {
          const tracePath = path.relative(reportDir, test.artifacts.trace)
          markdown += `  > HTTP: see [Playwright trace](../${tracePath}) for network requests\n`
        }
      }

      markdown += `\n`
    })

    const traceFile = path.join(dir, 'trace.md')
    fs.writeFileSync(traceFile, markdown)

    output.print(`🤖 AI Trace: ${colors.white.bold(`file://${traceFile}`)}`)

    if (!test.artifacts) test.artifacts = {}
    test.artifacts.aiTrace = traceFile
  }

  function isStepIgnored(step) {
    if (!config.ignoreSteps) return false
    for (const pattern of config.ignoreSteps || []) {
      if (step.name.match(pattern)) return true
    }
    return false
  }
}

