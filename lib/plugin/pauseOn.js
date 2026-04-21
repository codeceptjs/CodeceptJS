import event from '../event.js'
import pause from '../pause.js'
import recorder from '../recorder.js'
import Container from '../container.js'
import output from '../output.js'

const supportedHelpers = Container.STANDARD_ACTING_HELPERS

/**
 * Pauses test execution in different modes. Unlike `pauseOnFail`, this plugin supports
 * multiple triggers for pausing and is controlled via CLI arguments.
 *
 * Enable it via `-p` option with a mode:
 *
 * ```
 * npx codeceptjs run -p pauseOn:fail
 * npx codeceptjs run -p pauseOn:step
 * npx codeceptjs run -p pauseOn:file:tests/login_test.js
 * npx codeceptjs run -p pauseOn:file:tests/login_test.js:43
 * npx codeceptjs run -p pauseOn:url:/users/*
 * ```
 *
 * #### Modes
 *
 * * **fail** — pause when a step fails (same as `pauseOnFail` plugin)
 * * **step** — pause before first step, use `next` to advance step-by-step
 * * **file** — pause when execution reaches a specific file (and optionally line)
 * * **url** — pause when the browser URL matches a pattern (supports `*` wildcards)
 *
 */
export default function (config = {}) {
  const args = config._args || []
  const mode = args[0] || 'fail'

  switch (mode) {
    case 'fail':
      return initFailMode()
    case 'step':
      return initStepMode()
    case 'file':
      return initFileMode(args.slice(1))
    case 'url':
      return initUrlMode(args.slice(1))
    default:
      output.error(`pauseOn: unknown mode "${mode}". Available: fail, step, file, url`)
  }
}

function initFailMode() {
  let failed = false

  event.dispatcher.on(event.test.started, () => {
    failed = false
  })

  event.dispatcher.on(event.step.failed, () => {
    failed = true
  })

  event.dispatcher.on(event.test.after, () => {
    if (failed) pause()
  })
}

function initStepMode() {
  let activated = false

  event.dispatcher.on(event.test.before, () => {
    if (activated) return
    activated = true
    recorder.add('pauseOn:step', () => pause())
  })
}

function initFileMode(fileArgs) {
  if (fileArgs.length === 0) {
    output.error('pauseOn:file requires a path. Usage: -p pauseOn:file:<path>[:<line>]')
    return
  }

  const targetFile = fileArgs[0]
  const targetLine = fileArgs[1] ? parseInt(fileArgs[1], 10) : null
  let paused = false

  event.dispatcher.on(event.step.before, (step) => {
    if (paused) return

    const stepLine = step.line()
    if (!stepLine) return

    const match = parseStepLine(stepLine)
    if (!match) return

    const fileMatches = match.file.includes(targetFile) || match.file.endsWith(targetFile)
    if (!fileMatches) return

    if (targetLine !== null && match.line !== targetLine) return

    paused = true
    recorder.add('pauseOn:file', () => pause())
  })
}

function initUrlMode(urlArgs) {
  if (urlArgs.length === 0) {
    output.error('pauseOn:url requires a pattern. Usage: -p pauseOn:url:<pattern>')
    return
  }

  const urlPattern = urlArgs.join(':')

  const helpers = Container.helpers()
  let helper = null
  for (const helperName of supportedHelpers) {
    if (Object.keys(helpers).indexOf(helperName) > -1) {
      helper = helpers[helperName]
    }
  }

  if (!helper) {
    output.error('pauseOn:url requires a browser helper (Playwright, WebDriver, Puppeteer, Appium)')
    return
  }

  const regex = patternToRegex(urlPattern)
  let paused = false

  event.dispatcher.on(event.step.after, () => {
    if (paused) return

    recorder.add('pauseOn:url check', async () => {
      if (paused) return
      try {
        const currentUrl = await helper.grabCurrentUrl()
        if (regex.test(currentUrl)) {
          paused = true
          return pause()
        }
      } catch (err) {
        // page may not be loaded yet
      }
    })
  })
}

function parseStepLine(stepLine) {
  let line = stepLine.trim()
  if (line.startsWith('at ')) line = line.substring(3).trim()

  const lastColon = line.lastIndexOf(':')
  if (lastColon < 0) return null
  const secondLastColon = line.lastIndexOf(':', lastColon - 1)
  if (secondLastColon < 0) return null

  const file = line.substring(0, secondLastColon)
  const lineNum = parseInt(line.substring(secondLastColon + 1, lastColon), 10)

  if (isNaN(lineNum)) return null

  return { file, line: lineNum }
}

function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  const regexStr = escaped.replace(/\*/g, '.*')
  return new RegExp(regexStr)
}
