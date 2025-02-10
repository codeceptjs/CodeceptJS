const fs = require('fs')
const path = require('path')

const Container = require('../container')
const recorder = require('../recorder')
const event = require('../event')
const output = require('../output')
const { fileExists } = require('../utils')
const Codeceptjs = require('../index')
const { testToFileName } = require('../mocha/test')

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
module.exports = function (config) {
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
          fileName = `${testToFileName(test, _getUUID(test))}.failed.png`
        } else {
          fileName = `${testToFileName(test)}.failed.png`
        }
        output.plugin('screenshotOnFail', 'Test failed, try to save a screenshot')

        try {
          if (options.reportDir) {
            fileName = path.join(options.reportDir, fileName)
            const mochaReportDir = path.resolve(process.cwd(), options.reportDir)
            if (!fileExists(mochaReportDir)) {
              fs.mkdirSync(mochaReportDir)
            }
          }
          await helper.saveScreenshot(fileName, options.fullPageScreenshots)

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
                test.artifacts[`${sessionName.replace(/ /g, '_')}_screenshot`] = path.join(global.output_dir, screenshotFileName)
                allureReporter.addAttachment(`${sessionName} - Last Seen Screenshot`, fs.readFileSync(path.join(global.output_dir, screenshotFileName)), dataType)
              }
            }
          }

          const cucumberReporter = Container.plugins('cucumberJsonReporter')
          if (cucumberReporter) {
            cucumberReporter.addScreenshot(test.artifacts.screenshot)
          }
        } catch (err) {
          output.plugin(err)
          if (err && err.type && err.type === 'RuntimeError' && err.message && (err.message.indexOf('was terminated due to') > -1 || err.message.indexOf('no such window: target window already closed') > -1)) {
            output.log(`Can't make screenshot, ${err}`)
            helper.isRunning = false
          }
        }
      },
      true,
    )
  })

  function _getUUID(test) {
    if (test.uid) {
      return test.uid
    }

    return Math.floor(new Date().getTime() / 1000)
  }
}
