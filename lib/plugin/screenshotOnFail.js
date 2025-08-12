import fs from 'fs'
import path from 'path'

import Container from '../container.js'

import recorder from '../recorder.js'

import event from '../event.js'

import output from '../output.js'

import { fileExists } from '../utils.js'
import Codeceptjs from '../index.js'
import { testToFileName } from '../mocha/test.js'

const defaultConfig = {
  uniqueScreenshotNames: false,
  disableScreenshots: false,
  fullPageScreenshots: false,
}

const supportedHelpers = Container.STANDARD_ACTING_HELPERS

/**
 * Creates screenshot on failure. Screenshot is saved into `output` directory.
 *
 * Initially this functionality was part of corresponding helper but has been moved into plugin since 1.4
 *
 * This plugin is **enabled by default**.
 *
 * #### Configuration
 *
 * Configuration can either be taken from a corresponding helper (deprecated) or a from plugin config (recommended).
 *
 * ```js
 * plugins: {
 *    screenshotOnFail: {
 *      enabled: true
 *    }
 * }
 * ```
 *
 * Possible config options:
 *
 * * `uniqueScreenshotNames`: use unique names for screenshot. Default: false.
 * * `fullPageScreenshots`: make full page screenshots. Default: false.
 *
 *
 */
export default function (config) {
  const helpers = Container.helpers()
  let helper

  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName]
    }
  }

  if (!helper) return // no helpers for screenshot

  const options = Object.assign(defaultConfig, helper.options, config)

  if (helpers.Mochawesome) {
    if (helpers.Mochawesome.config) {
      options.uniqueScreenshotNames = helpers.Mochawesome.config.uniqueScreenshotNames
    }
  }

  if (Codeceptjs.container.mocha()) {
    options.reportDir = Codeceptjs.container.mocha()?.options?.reporterOptions && Codeceptjs.container.mocha()?.options?.reporterOptions?.reportDir
  }

  if (options.disableScreenshots) {
    // old version of disabling screenshots
    return
  }

  event.dispatcher.on(event.test.failed, (test, _err, hookName) => {
    if (hookName === 'BeforeSuite' || hookName === 'AfterSuite') {
      // no browser here
      return
    }

    recorder.add(
      'screenshot of failed test',
      async () => {
        const dataType = 'image/png'
        // This prevents data driven to be included in the failed screenshot file name
        let fileName

        if (options.uniqueScreenshotNames && test) {
          fileName = `${testToFileName(test, { unique: true })}.failed.png`
        } else {
          fileName = `${testToFileName(test)}.failed.png`
        }
        output.plugin('screenshotOnFail', 'Test failed, try to save a screenshot')

        // Re-check helpers at runtime in case they weren't ready during plugin init
        const runtimeHelpers = Container.helpers()
        let runtimeHelper = null
        for (const helperName of supportedHelpers) {
          if (Object.keys(runtimeHelpers).indexOf(helperName) > -1) {
            runtimeHelper = runtimeHelpers[helperName]
            break
          }
        }

        if (runtimeHelper && typeof runtimeHelper.saveScreenshot === 'function') {
          helper = runtimeHelper
        }

        try {
          if (options.reportDir) {
            fileName = path.join(options.reportDir, fileName)
            const mochaReportDir = path.resolve(process.cwd(), options.reportDir)
            if (!fileExists(mochaReportDir)) {
              fs.mkdirSync(mochaReportDir)
            }
          }

          // Add timeout wrapper to prevent hanging
          const screenshotPromise = helper.saveScreenshot(fileName, options.fullPageScreenshots)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Screenshot timeout after 30 seconds')), 30000)
          })

          await Promise.race([screenshotPromise, timeoutPromise])

          if (!test.artifacts) test.artifacts = {}
          test.artifacts.screenshot = path.join(global.output_dir, fileName)
          if (Container.mocha().options.reporterOptions['mocha-junit-reporter'] && Container.mocha().options.reporterOptions['mocha-junit-reporter'].options.attachments) {
            test.attachments = [path.join(global.output_dir, fileName)]
          }

          const allureReporter = Container.plugins('allure')
          if (allureReporter) {
            allureReporter.addAttachment('Main session - Last Seen Screenshot', fs.readFileSync(path.join(global.output_dir, fileName)), dataType)

            if (helper.activeSessionName) {
              const sessions = helper.sessionPages || helper.sessionWindows
              for (const sessionName in sessions) {
                const screenshotFileName = `${sessionName}_${fileName}`
                const screenshotPath = path.join(global.output_dir, screenshotFileName)

                // Only add attachment if file exists
                if (fileExists(screenshotPath)) {
                  test.artifacts[`${sessionName.replace(/ /g, '_')}_screenshot`] = screenshotPath
                  allureReporter.addAttachment(`${sessionName} - Last Seen Screenshot`, fs.readFileSync(screenshotPath), dataType)
                }
              }
            }
          }

          const cucumberReporter = Container.plugins('cucumberJsonReporter')
          if (cucumberReporter) {
            cucumberReporter.addScreenshot(test.artifacts.screenshot)
          }
        } catch (err) {
          output.plugin('screenshotOnFail', `Failed to save screenshot: ${err.message}`)
          if (err && err.type && err.type === 'RuntimeError' && err.message && (err.message.indexOf('was terminated due to') > -1 || err.message.indexOf('no such window: target window already closed') > -1)) {
            output.log(`Can't make screenshot, ${err}`)
            helper.isRunning = false
          }
        }
      },
      true,
    )
  })
}
