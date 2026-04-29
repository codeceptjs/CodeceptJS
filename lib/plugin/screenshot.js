import fs from 'fs'
import path from 'path'

import Container from '../container.js'
import recorder from '../recorder.js'
import event from '../event.js'
import output from '../output.js'
import store from '../store.js'

import { fileExists } from '../utils.js'
import Codeceptjs from '../index.js'
import { testToFileName } from '../mocha/test.js'
import {
  parsePluginArgs,
  resolveTrigger,
  matchStepFile,
  matchUrl,
  getBrowserHelper,
} from '../utils/pluginParser.js'

const defaultConfig = {
  on: 'fail',
  uniqueScreenshotNames: false,
  disableScreenshots: false,
  fullPageScreenshots: false,
}

const VALID_MODES = new Set(['fail', 'test', 'step', 'file', 'url'])

/**
 * Saves screenshots from the browser at points triggered by `on=`.
 *
 * Replaces the legacy `screenshotOnFail` plugin. Default `on=fail` preserves the
 * old behavior (screenshot when a test fails).
 *
 * #### Configuration
 *
 * ```js
 * plugins: {
 *   screenshot: {
 *     enabled: true,
 *     on: 'fail',
 *   }
 * }
 * ```
 *
 * #### `on=` modes
 *
 * * **fail** — screenshot when a test fails (default)
 * * **test** — screenshot at the end of every test
 * * **step** — screenshot after every step
 * * **file** — screenshot for steps in `path=...[;line=...]`
 * * **url** — screenshot when the current browser URL matches `pattern=...`
 *
 * Other config options:
 *
 * * `uniqueScreenshotNames`: use unique names for screenshot. Default: false.
 * * `fullPageScreenshots`: make full page screenshots. Default: false.
 * * `disableScreenshots`: legacy switch to skip the plugin entirely.
 *
 * CLI examples:
 *
 * ```
 * npx codeceptjs run -p screenshot
 * npx codeceptjs run -p screenshot:on=step
 * npx codeceptjs run -p screenshot:on=file:path=tests/login_test.js
 * npx codeceptjs run -p screenshot:on=url:pattern=/users/*
 * ```
 */
export default function (config = {}) {
  const helper = getBrowserHelper()
  if (!helper) return

  const cliArgs = parsePluginArgs(config._args)
  const trigger = resolveTrigger(cliArgs, config, { on: defaultConfig.on })

  if (!VALID_MODES.has(trigger.on)) {
    output.error(`screenshot: unknown on="${trigger.on}". Valid: fail, test, step, file, url`)
    return
  }

  const helpers = Container.helpers()
  const options = Object.assign({}, defaultConfig, helper.options, config)

  if (helpers.Mochawesome?.config) {
    options.uniqueScreenshotNames = helpers.Mochawesome.config.uniqueScreenshotNames
  }

  if (Codeceptjs.container.mocha()) {
    options.reportDir = Codeceptjs.container.mocha()?.options?.reporterOptions
      && Codeceptjs.container.mocha()?.options?.reporterOptions?.reportDir
  }

  if (options.disableScreenshots) return

  switch (trigger.on) {
    case 'fail':
      return wireOnFail(options)
    case 'test':
      return wireOnTest(options)
    case 'step':
      return wireOnStep(options, () => true)
    case 'file':
      if (!trigger.path) {
        output.error('screenshot:on=file requires path=. Example: -p screenshot:on=file:path=tests/foo.js')
        return
      }
      return wireOnStep(options, step => matchStepFile(step, trigger.path, trigger.line))
    case 'url':
      if (!trigger.pattern) {
        output.error('screenshot:on=url requires pattern=. Example: -p screenshot:on=url:pattern=/users/*')
        return
      }
      return wireOnUrl(options, trigger.pattern)
  }
}

function wireOnFail(options) {
  let currentTest = null
  event.dispatcher.on(event.test.before, test => {
    currentTest = test
  })
  event.dispatcher.on(event.test.failed, (test, _err, hookName) => {
    if (hookName === 'BeforeSuite' || hookName === 'AfterSuite') return
    const t = test || currentTest
    if (!t) return
    scheduleScreenshot(t, suffix(t, options, 'failed'), options)
  })
}

function wireOnTest(options) {
  event.dispatcher.on(event.test.after, test => {
    if (!test) return
    scheduleScreenshot(test, suffix(test, options, 'test'), options)
  })
}

function wireOnStep(options, filter) {
  let currentTest = null
  let stepCount = 0
  event.dispatcher.on(event.test.before, test => {
    currentTest = test
    stepCount = 0
  })
  event.dispatcher.on(event.step.after, step => {
    if (!currentTest) return
    if (!filter(step)) return
    stepCount++
    const name = `${testToFileName(currentTest, { suffix: '', unique: options.uniqueScreenshotNames })}.step_${stepCount}.png`
    scheduleScreenshot(currentTest, name, options)
  })
}

function wireOnUrl(options, pattern) {
  let currentTest = null
  let stepCount = 0
  event.dispatcher.on(event.test.before, test => {
    currentTest = test
    stepCount = 0
  })
  event.dispatcher.on(event.step.after, () => {
    if (!currentTest) return
    const helper = getBrowserHelper()
    if (!helper) return
    recorder.add('screenshot:url check', async () => {
      try {
        const url = await helper.grabCurrentUrl()
        if (!matchUrl(url, pattern)) return
        stepCount++
        const name = `${testToFileName(currentTest, { suffix: '', unique: options.uniqueScreenshotNames })}.url_${stepCount}.png`
        await takeScreenshot(currentTest, name, options)
      } catch (err) {
        // page may not be ready
      }
    })
  })
}

function suffix(test, options, kind) {
  const base = testToFileName(test, { suffix: '', unique: options.uniqueScreenshotNames })
  return `${base}.${kind}.png`
}

function scheduleScreenshot(test, fileName, options) {
  recorder.add(
    'screenshot capture',
    async () => takeScreenshot(test, fileName, options),
    true,
  )
}

async function takeScreenshot(test, fileName, options) {
  const quietMode = !store.outputDir
  if (!quietMode) {
    output.plugin('screenshot', `Saving screenshot ${fileName}`)
  }

  const helper = getBrowserHelper()
  if (!helper || typeof helper.saveScreenshot !== 'function') return

  try {
    if (options.reportDir) {
      fileName = path.join(options.reportDir, fileName)
      const mochaReportDir = path.resolve(process.cwd(), options.reportDir)
      if (!fileExists(mochaReportDir)) fs.mkdirSync(mochaReportDir)
    }

    if (helper.page && helper.page.isClosed && helper.page.isClosed()) {
      throw new Error('Browser page has been closed')
    }
    if (helper.browser && helper.browser.isConnected && !helper.browser.isConnected()) {
      throw new Error('Browser has been disconnected')
    }

    const screenshotPromise = helper.saveScreenshot(fileName, options.fullPageScreenshots)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Screenshot timeout after 5 seconds')), 5000)
    })

    await Promise.race([screenshotPromise, timeoutPromise])

    if (!test.artifacts) test.artifacts = {}
    const baseOutputDir = store.outputDir || null
    if (baseOutputDir) {
      test.artifacts.screenshot = path.join(baseOutputDir, fileName)
      const mocha = Container.mocha()
      const junit = mocha?.options?.reporterOptions?.['mocha-junit-reporter']
      if (junit?.options?.attachments) {
        test.attachments = [path.join(baseOutputDir, fileName)]
      }
    } else {
      test.artifacts.screenshot = fileName
    }
  } catch (err) {
    if (!quietMode) {
      output.plugin('screenshot', `Failed to save screenshot: ${err.message}`)
    }
    if (
      err
      && ((err.message
        && (err.message.includes('Target page, context or browser has been closed')
          || err.message.includes('Browser page has been closed')
          || err.message.includes('Browser has been disconnected')
          || err.message.includes('was terminated due to')
          || err.message.includes('no such window: target window already closed')
          || err.message.includes('Screenshot timeout after')))
        || (err.type && err.type === 'RuntimeError'))
    ) {
      output.log(`Can't make screenshot, ${err.message}`)
      helper.isRunning = false
    }
  }
}
