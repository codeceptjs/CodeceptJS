const path = require('path')
const fs = require('fs')
const Container = require('../container')
const recorder = require('../recorder')
const event = require('../event')
const supportedHelpers = Container.STANDARD_ACTING_HELPERS
const { scanForErrorMessages } = require('../html')
const { output } = require('..')
const { humanizeString, ucfirst } = require('../utils')
const { testToFileName } = require('../mocha/test')
const defaultConfig = {
  errorClasses: ['error', 'warning', 'alert', 'danger'],
  browserLogs: ['error'],
}

/**
 * Collects information from web page after each failed test and adds it to the test as an artifact.
 * It is suggested to enable this plugin if you run tests on CI and you need to debug failed tests.
 * This plugin can be paired with `analyze` plugin to provide more context.
 *
 * It collects URL, HTML errors (by classes), and browser logs.
 *
 * Enable this plugin in config:
 *
 * ```js
 * plugins: {
 *  pageInfo: {
 *   enabled: true,
 * }
 * ```
 *
 * Additional config options:
 *
 * * `errorClasses` - list of classes to search for errors (default: `['error', 'warning', 'alert', 'danger']`)
 * * `browserLogs` - list of types of errors to search for in browser logs (default: `['error']`)
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

  event.dispatcher.on(event.test.failed, test => {
    const pageState = {}

    recorder.add('URL of failed test', async () => {
      try {
        const url = await helper.grabCurrentUrl()
        pageState.url = url
      } catch (err) {
        // not really needed
      }
    })
    recorder.add('HTML snapshot failed test', async () => {
      try {
        const html = await helper.grabHTMLFrom('body')

        if (!html) return

        const errors = scanForErrorMessages(html, config.errorClasses)
        if (errors.length) {
          output.debug('Detected errors in HTML code')
          errors.forEach(error => output.debug(error))
          pageState.htmlErrors = errors
        }
      } catch (err) {
        // not really needed
      }
    })

    recorder.add('Browser logs for failed test', async () => {
      try {
        const logs = await helper.grabBrowserLogs()

        if (!logs) return

        pageState.browserErrors = getBrowserErrors(logs, config.browserLogs)
      } catch (err) {
        // not really needed
      }
    })

    recorder.add('Save page info', () => {
      test.addNote('pageInfo', pageStateToMarkdown(pageState))

      const pageStateFileName = path.join(global.output_dir, `${testToFileName(test)}.pageInfo.md`)
      fs.writeFileSync(pageStateFileName, pageStateToMarkdown(pageState))
      test.artifacts.pageInfo = pageStateFileName
      return pageState
    })
  })
}

function pageStateToMarkdown(pageState) {
  let markdown = ''

  for (const [key, value] of Object.entries(pageState)) {
    if (!value) continue
    let result = ''

    if (Array.isArray(value)) {
      result = value.map(v => `- ${JSON.stringify(v, null, 2)}`).join('\n')
    } else if (typeof value === 'string') {
      result = `${value}`
    } else {
      result = JSON.stringify(value, null, 2)
    }

    if (!result.trim()) continue

    markdown += `### ${ucfirst(humanizeString(key))}\n\n`
    markdown += result
    markdown += '\n\n'
  }

  return markdown
}

function getBrowserErrors(logs, type = ['error']) {
  // Playwright & WebDriver console messages
  let errors = logs
    .map(log => {
      if (typeof log === 'string') return log
      if (!log.type) return null
      return { type: log.type(), text: log.text() }
    })
    .filter(l => l && (typeof l === 'string' || type.includes(l.type)))
    .map(l => (typeof l === 'string' ? l : l.text))

  return errors
}
