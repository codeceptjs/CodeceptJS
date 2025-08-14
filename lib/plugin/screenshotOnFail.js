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
          fileName = `${testToFileName(test, { suffix: '', unique: true })}.failed.png`
        } else {
          fileName = `${testToFileName(test, { suffix: '', unique: false })}.failed.png`
        }
        const quietMode = !('output_dir' in global) || !global.output_dir
        if (!quietMode) {
          output.plugin('screenshotOnFail', 'Test failed, try to save a screenshot')
        }

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

          // Check if browser/page is still available before attempting screenshot
          if (helper.page && helper.page.isClosed && helper.page.isClosed()) {
            throw new Error('Browser page has been closed')
          }
          if (helper.browser && helper.browser.isConnected && !helper.browser.isConnected()) {
            throw new Error('Browser has been disconnected')
          }

          // Add timeout wrapper to prevent hanging with shorter timeout for ESM
          const screenshotPromise = helper.saveScreenshot(fileName, options.fullPageScreenshots)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Screenshot timeout after 5 seconds')), 5000)
          })

          await Promise.race([screenshotPromise, timeoutPromise])

          if (!test.artifacts) test.artifacts = {}
          // Some unit tests may not define global.output_dir; avoid throwing when it is undefined
          // Detect output directory safely (may not be initialized in narrow unit tests)
          const baseOutputDir = 'output_dir' in global && typeof global.output_dir === 'string' && global.output_dir ? global.output_dir : null
          if (baseOutputDir) {
            test.artifacts.screenshot = path.join(baseOutputDir, fileName)
            if (Container.mocha().options.reporterOptions['mocha-junit-reporter'] && Container.mocha().options.reporterOptions['mocha-junit-reporter'].options.attachments) {
              test.attachments = [path.join(baseOutputDir, fileName)]
            }
          } else {
            // Fallback: just store the file name to keep tests stable without triggering path errors
            test.artifacts.screenshot = fileName
          }

          const allureReporter = Container.plugins('allure')
          if (allureReporter) {
            if (baseOutputDir) {
              try {
                allureReporter.addAttachment('Main session - Last Seen Screenshot', fs.readFileSync(path.join(baseOutputDir, fileName)), dataType)
              } catch (_e) {
                /* ignore missing file during unit tests */
              }
            }

            if (helper.activeSessionName) {
              const sessions = helper.sessionPages || helper.sessionWindows
              for (const sessionName in sessions) {
                const screenshotFileName = `${sessionName}_${fileName}`
                if (!baseOutputDir) continue
                const screenshotPath = path.join(baseOutputDir, screenshotFileName)

                // Only add attachment if file exists
                if (fileExists(screenshotPath)) {
                  test.artifacts[`${sessionName.replace(/ /g, '_')}_screenshot`] = screenshotPath
                  if (baseOutputDir) {
                    try {
                      allureReporter.addAttachment(`${sessionName} - Last Seen Screenshot`, fs.readFileSync(screenshotPath), dataType)
                    } catch (_e) {
                      /* ignore */
                    }
                  }
                }
              }
            }
          }

          const cucumberReporter = Container.plugins('cucumberJsonReporter')
          if (cucumberReporter) {
            cucumberReporter.addScreenshot(test.artifacts.screenshot)
          }
        } catch (err) {
          if (!quietMode) {
            output.plugin('screenshotOnFail', `Failed to save screenshot: ${err.message}`)
          }
          // Enhanced error handling for browser closed scenarios
          if (
            err &&
            ((err.message &&
              (err.message.includes('Target page, context or browser has been closed') ||
                err.message.includes('Browser page has been closed') ||
                err.message.includes('Browser has been disconnected') ||
                err.message.includes('was terminated due to') ||
                err.message.includes('no such window: target window already closed') ||
                err.message.includes('Screenshot timeout after'))) ||
              (err.type && err.type === 'RuntimeError'))
          ) {
            output.log(`Can't make screenshot, ${err.message}`)
            helper.isRunning = false
          }
        }
      },
      true,
    )
  })
}
