import fs from 'fs'
import { mkdirp } from 'mkdirp'
import path from 'path'

import store from '../store.js'
import Container from '../container.js'
import recorder from '../recorder.js'
import event from '../event.js'
import output from '../output.js'
import { deleteDir, clearString } from '../utils.js'
import { captureSnapshot, pickActingHelper, traceDirFor, artifactLinks } from '../utils/trace.js'
import {
  parsePluginArgs,
  resolveTrigger,
  matchStepFile,
  matchUrl,
} from '../utils/pluginParser.js'

const defaultConfig = {
  on: 'step',
  deleteSuccessful: false,
  fullPageScreenshots: false,
  output: store.outputDir,
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
 * * `on`: trigger mode — `step` (default), `fail`, `test`, `file`, `url`.
 *
 * #### `on=` modes
 *
 * * **step** — persist every step (default)
 * * **fail** — persist only the failed step
 * * **test** — persist only the last step of each test
 * * **file** — persist steps from `path=...[;line=...]`
 * * **url** — persist when the current URL matches `pattern=...`
 *
 * @param {*} config
 */
export default function (config = {}) {
  const cliArgs = parsePluginArgs(config._args)
  const trigger = resolveTrigger(cliArgs, config, { on: defaultConfig.on }, { name: 'aiTrace' })
  if (!trigger) return

  config = Object.assign(defaultConfig, config)

  const helper = pickActingHelper(Container.helpers())

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
  let testFailed = false
  let pendingArtifactCapture = null
  let firstFailedStepSaved = false

  const reportDir = config.output ? path.resolve(store.codeceptDir, config.output) : defaultConfig.output

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
    let title
    try {
      title = test.fullTitle ? test.fullTitle() : test.title
    } catch (err) {
      title = test.title
    }
    dir = traceDirFor(test.file, title, reportDir)
    mkdirp.sync(dir)
    deleteDir(dir)
    mkdirp.sync(dir)
    stepNum = 0
    error = null
    steps = []
    debugOutput = []
    savedSteps.clear()
    currentTest = test
    testStartTime = Date.now()
    currentUrl = null
    testFailed = false
    firstFailedStepSaved = false
    pendingArtifactCapture = null
  })

  event.dispatcher.on(event.step.after, step => {
    if (!currentTest) return
    if (step.status === 'failed') {
      testFailed = true
    }
    if (step.status === 'queued' && testFailed) {
      output.debug(`aiTrace: Skipping queued step "${step.toString()}" - testFailed: ${testFailed}`)
      return
    }
    if (step.status === 'failed' && firstFailedStepSaved) {
      output.debug(`aiTrace: Skipping failed step "${step.toString()}" - already handled by step.failed event`)
      return
    }

    // on= filtering
    if (trigger.on === 'fail') return // failed steps handled by step.failed
    if (trigger.on === 'file' && !matchStepFile(step, trigger.path, trigger.line)) return
    if (trigger.on === 'url') {
      recorder.add('aiTrace:url check', async () => {
        try {
          if (!helper.grabCurrentUrl) return
          const url = await helper.grabCurrentUrl()
          if (!matchUrl(url, trigger.pattern)) return
          await persistStep(step)
        } catch (err) {
          output.debug(`aiTrace: Error in url-mode step persistence: ${err.message}`)
        }
      }, true)
      return
    }

    recorder.add(`aiTrace step persistence: ${step.toString()}`, () => persistStep(step).catch(err => {
      output.debug(`aiTrace: Error saving step: ${err.message}`)
    }), true)
  })

  event.dispatcher.on(event.step.failed, step => {
    if (!currentTest) return
    if (step.status === 'queued' && testFailed) {
      output.debug(`aiTrace: Skipping queued failed step "${step.toString()}" - testFailed: ${testFailed}`)
      return
    }
    if (firstFailedStepSaved) {
      output.debug(`aiTrace: Skipping subsequent failed step "${step.toString()}" - already saved first failed step`)
      return
    }

    const stepKey = step.toString()
    if (savedSteps.has(stepKey)) {
      const existingStep = steps.find(s => s.step === stepKey)
      if (!existingStep) {
        output.debug(`aiTrace: Step "${stepKey}" marked as saved but not found in steps array`)
        return
      }
      existingStep.status = 'failed'

      pendingArtifactCapture = captureArtifactsForStep(step, existingStep, existingStep.prefix).catch(err => {
        output.debug(`aiTrace: Error updating failed step: ${err.message}`)
      })
    } else {
      if (stepNum === -1) return
      if (isStepIgnored(step)) return
      if (step.metaStep && step.metaStep.title === 'BeforeSuite') return

      const stepPrefix = generateStepPrefix(step, stepNum)
      stepNum++

      const stepData = {
        step: stepKey,
        status: 'failed',
        prefix: stepPrefix,
        artifacts: {},
        meta: {},
        debugOutput: [],
      }

      if (step.startTime && step.endTime) {
        stepData.meta.duration = ((step.endTime - step.startTime) / 1000).toFixed(2) + 's'
      }

      savedSteps.add(stepKey)
      steps.push(stepData)
      firstFailedStepSaved = true

      pendingArtifactCapture = captureArtifactsForStep(step, stepData, stepPrefix).catch(err => {
        output.debug(`aiTrace: Error capturing failed step artifacts: ${err.message}`)
      })
    }
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
    recorder.add('aiTrace:persist failed', async () => {
      if (pendingArtifactCapture) {
        await pendingArtifactCapture
        pendingArtifactCapture = null
      }
      persist(test, 'failed')
    }, true)
  })

  async function persistStep(step) {
    if (stepNum === -1) return
    if (isStepIgnored(step)) return
    if (step.metaStep && step.metaStep.title === 'BeforeSuite') return

    const stepKey = step.toString()

    if (savedSteps.has(stepKey)) {
      const existingStep = steps.find(s => s.step === stepKey)
      if (existingStep && step.status === 'failed') {
        existingStep.status = 'failed'
        step.artifacts = {}
        await captureArtifactsForStep(step, existingStep, existingStep.prefix)
      }
      return
    }
    savedSteps.add(stepKey)

    const stepPrefix = generateStepPrefix(step, stepNum)
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

    await captureArtifactsForStep(step, stepData, stepPrefix)
    steps.push(stepData)
  }

  async function captureArtifactsForStep(step, stepData, stepPrefix) {
    if (!step.artifacts) {
      step.artifacts = {}
    }

    let browserAvailable = true

    try {
      try {
        if (helper.grabCurrentUrl) {
          const url = await helper.grabCurrentUrl()
          stepData.meta.url = url
          currentUrl = url
        }
      } catch (err) {
        browserAvailable = false
        output.debug(`aiTrace: Browser unavailable, partial artifact capture: ${err.message}`)
      }

      let preExistingScreenshot = false
      if (step.artifacts?.screenshot) {
        const screenshotPath = path.isAbsolute(step.artifacts.screenshot)
          ? step.artifacts.screenshot
          : path.resolve(dir, step.artifacts.screenshot)
        const screenshotFile = path.basename(screenshotPath)
        stepData.artifacts.screenshot = screenshotFile
        step.artifacts.screenshot = screenshotPath
        preExistingScreenshot = true

        if (!fs.existsSync(screenshotPath)) {
          try {
            await helper.saveScreenshot(screenshotPath, config.fullPageScreenshots)
          } catch (err) {
            output.debug(`aiTrace: Could not save screenshot: ${err.message}`)
          }
        }
      }

      const captured = await captureSnapshot(helper, {
        dir,
        prefix: stepPrefix,
        fullPage: config.fullPageScreenshots,
        captureHTML: config.captureHTML && browserAvailable,
        captureARIA: config.captureARIA && browserAvailable,
        captureBrowserLogs: config.captureBrowserLogs && browserAvailable,
        captureStorage: false,
      })

      if (!preExistingScreenshot && captured.screenshot) {
        stepData.artifacts.screenshot = captured.screenshot
        step.artifacts.screenshot = path.join(dir, captured.screenshot)
      }
      if (step.artifacts?.html) {
        stepData.artifacts.html = step.artifacts.html
      } else if (captured.html) {
        stepData.artifacts.html = captured.html
      }
      if (captured.aria) stepData.artifacts.aria = captured.aria
      if (captured.console) {
        stepData.artifacts.console = captured.console
        stepData.meta.consoleCount = captured.consoleCount
      }
    } catch (err) {
      output.plugin(`aiTrace: Can't save step artifacts: ${err}`)
    }
  }

  function persist(test, status) {
    if (!steps.length) {
      output.debug('aiTrace: No steps to save in trace')
      return
    }

    // on=test: only render the last step in markdown; artifacts of earlier steps
    // remain on disk unreferenced.
    if (trigger.on === 'test') {
      steps = steps.slice(-1)
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
      const stepAnchor = clearString(stepData.step).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50)
      markdown += `### Step ${index + 1}: ${stepData.step}\n`
      markdown += `<a id="${stepAnchor}"></a>\n`

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

      const links = artifactLinks(stepData.artifacts, { consoleCount: stepData.meta.consoleCount })
      if (links) markdown += links + '\n'

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

    output.print(`Trace Saved: file://${traceFile}`)

    if (!test.artifacts) test.artifacts = {}
    test.artifacts.aiTrace = traceFile
  }

  function isStepIgnored(step) {
    if (!config.ignoreSteps) return false
    if (!step.title) return false
    for (const pattern of config.ignoreSteps || []) {
      if (step.title.match(pattern)) return true
    }
    return false
  }

  function generateStepPrefix(step, index) {
    const stepName = step.toString()
    const cleanedName = clearString(stepName)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_{2,}/g, '_')
      .slice(0, 80)
      .trim()

    return `${String(index).padStart(4, '0')}_${cleanedName}`
  }
}
