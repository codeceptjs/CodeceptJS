import path from 'path'
import fs from 'fs'
import Container from '../container.js'
import recorder from '../recorder.js'
import event from '../event.js'
import { scanForErrorMessages } from '../html.js'
import { captureSnapshot, pickActingHelper } from '../utils/trace.js'
import { output } from '../index.js'
import store from '../store.js'
import { humanizeString, ucfirst } from '../utils.js'
import { testToFileName } from '../mocha/test.js'

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
export default function (config = {}) {
  config = Object.assign(defaultConfig, config)

  event.dispatcher.on(event.test.failed, test => {
    const helper = pickActingHelper(Container.helpers())
    if (!helper) return

    const pageState = {}

    recorder.add('pageInfo capture', async () => {
      try {
        const prefix = `${testToFileName(test)}.pageInfo`
        const captured = await captureSnapshot(helper, {
          dir: store.outputDir,
          prefix,
          captureScreenshot: false,
        })

        if (captured.url) pageState.url = captured.url

        if (captured.html) {
          const htmlPath = path.join(store.outputDir, captured.html)
          pageState.htmlSnapshot = htmlPath
          const htmlForScan = captured.htmlRaw || (() => {
            try { return fs.readFileSync(htmlPath, 'utf8') } catch { return '' }
          })()
          if (htmlForScan) {
            try {
              const errors = scanForErrorMessages(htmlForScan, config.errorClasses)
              if (errors.length) {
                output.debug('Detected errors in HTML code')
                errors.forEach(error => output.debug(error))
                pageState.htmlErrors = errors
              }
            } catch {}
          }
        }

        if (captured.aria) {
          pageState.ariaSnapshot = path.join(store.outputDir, captured.aria)
        }

        if (captured.console) {
          const consolePath = path.join(store.outputDir, captured.console)
          pageState.consoleSnapshot = consolePath
          try {
            const logs = JSON.parse(fs.readFileSync(consolePath, 'utf8'))
            pageState.browserErrors = getBrowserErrors(logs, config.browserLogs)
          } catch {}
        }
      } catch {}
    }, true)

    recorder.add('Save page info', () => {
      test.addNote('pageInfo', pageStateToMarkdown(pageState))

      const pageStateFileName = path.join(store.outputDir, `${testToFileName(test)}.pageInfo.md`)
      fs.writeFileSync(pageStateFileName, pageStateToMarkdown(pageState))
      test.artifacts.pageInfo = pageStateFileName
      return pageState
    }, true)
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
  // Accepts Playwright ConsoleMessage objects, normalized {type, text}, or strings
  return logs
    .map(log => {
      if (typeof log === 'string') return log
      if (!log) return null
      const t = typeof log.type === 'function' ? log.type() : log.type
      const text = typeof log.text === 'function' ? log.text() : log.text
      if (!t) return null
      return { type: t, text }
    })
    .filter(l => l && (typeof l === 'string' || type.includes(l.type)))
    .map(l => (typeof l === 'string' ? l : l.text))
}
