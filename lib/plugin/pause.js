import event from '../event.js'
import pause from '../pause.js'
import recorder from '../recorder.js'
import output from '../output.js'
import {
  parsePluginArgs,
  resolveTrigger,
  matchStepFile,
  matchUrl,
  getBrowserHelper,
} from '../utils/pluginParser.js'

const VALID_MODES = new Set(['fail', 'test', 'step', 'file', 'url'])

/**
 * Pauses test execution interactively. Replaces the legacy `pauseOn` and `pauseOnFail`
 * plugins. The default `on=fail` matches the old `pauseOnFail` behavior.
 *
 * #### Configuration
 *
 * ```js
 * plugins: {
 *   pause: {
 *     enabled: false,
 *     on: 'fail',
 *   }
 * }
 * ```
 *
 * #### `on=` modes
 *
 * * **fail** — pause when a step fails (default)
 * * **test** — pause after each test
 * * **step** — pause before the first step (interactive walk-through)
 * * **file** — pause when execution reaches `path=...[;line=...]`
 * * **url** — pause when the browser URL matches `pattern=...`
 *
 * CLI examples:
 *
 * ```
 * npx codeceptjs run -p pause
 * npx codeceptjs run -p pause:on=step
 * npx codeceptjs run -p pause:on=file:path=tests/login_test.js;line=43
 * npx codeceptjs run -p pause:on=url:pattern=/users/*
 * ```
 */
export default function (config = {}) {
  const cliArgs = parsePluginArgs(config._args)
  const trigger = resolveTrigger(cliArgs, config, { on: 'fail' })

  if (!VALID_MODES.has(trigger.on)) {
    output.error(`pause: unknown on="${trigger.on}". Valid: fail, test, step, file, url`)
    return
  }

  switch (trigger.on) {
    case 'fail':
      return initFailMode()
    case 'test':
      return initTestMode()
    case 'step':
      return initStepMode()
    case 'file':
      if (!trigger.path) {
        output.error('pause:on=file requires path=. Example: -p pause:on=file:path=tests/foo.js')
        return
      }
      return initFileMode(trigger.path, trigger.line)
    case 'url':
      if (!trigger.pattern) {
        output.error('pause:on=url requires pattern=. Example: -p pause:on=url:pattern=/users/*')
        return
      }
      return initUrlMode(trigger.pattern)
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

function initTestMode() {
  event.dispatcher.on(event.test.after, () => pause())
}

function initStepMode() {
  let activated = false

  event.dispatcher.on(event.test.before, () => {
    if (activated) return
    activated = true
    recorder.add('pause:step', () => pause())
  })
}

function initFileMode(targetPath, targetLine) {
  let paused = false

  event.dispatcher.on(event.step.before, step => {
    if (paused) return
    if (!matchStepFile(step, targetPath, targetLine)) return
    paused = true
    recorder.add('pause:file', () => pause())
  })
}

function initUrlMode(pattern) {
  const helper = getBrowserHelper()

  if (!helper) {
    output.error('pause:on=url requires a browser helper (Playwright, WebDriver, Puppeteer, Appium)')
    return
  }

  let paused = false

  event.dispatcher.on(event.step.after, () => {
    if (paused) return

    recorder.add('pause:url check', async () => {
      if (paused) return
      try {
        const currentUrl = await helper.grabCurrentUrl()
        if (matchUrl(currentUrl, pattern)) {
          paused = true
          return pause()
        }
      } catch (err) {
        // page may not be loaded yet
      }
    })
  })
}
