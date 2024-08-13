const Container = require('../container')
const recorder = require('../recorder')
const event = require('../event')
const supportedHelpers = require('./standardActingHelpers')
const { scanForErrorMessages } = require('../html')
const { output } = require('..')

const defaultConfig = {
  errorClasses: ['error', 'warning', 'alert', 'danger'],
}

/**
 * Prints errors found in HTML code after each failed test.
 *
 * It scans HTML and searches for elements with error classes.
 * If an element found prints a text from it to console and adds as artifact to the test.
 *
 * Enable this plugin in config:
 *
 * ```js
 * plugins: {
 *  debugErrors: {
 *   enabled: true,
 * }
 * ```
 *
 * Additional config options:
 *
 * * `errorClasses` - list of classes to search for errors (default: `['error', 'warning', 'alert', 'danger']`)
 *
 */
module.exports = function (config = {}) {
  const helpers = Container.helpers()
  let helper

  config = Object.assign(defaultConfig, config)

  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName]
    }
  }

  if (!helper) return // no helpers for screenshot

  event.dispatcher.on(event.test.failed, (test) => {
    recorder.add('HTML snapshot failed test', async () => {
      try {
        const currentOutputLevel = output.level()
        output.level(0)
        const html = await helper.grabHTMLFrom('body')
        output.level(currentOutputLevel)

        if (!html) return

        const errors = scanForErrorMessages(html, config.errorClasses)
        if (errors.length) {
          output.debug('Detected errors in HTML code')
          errors.forEach((error) => output.debug(error))
          test.artifacts.errors = errors
        }
      } catch (err) {
        // not really needed
      }
    })
  })
}
