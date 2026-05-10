import debugFactory from 'debug'
const debug = debugFactory('codeceptjs:heal')
import colors from 'chalk'
import recorder from '../recorder.js'

import event from '../event.js'

import output from '../output.js'

import healModule from '../heal.js'
const heal = healModule.default || healModule
import store from '../store.js'
import {
  parsePluginArgs,
  resolveTrigger,
  matchStepFile,
  matchUrl,
  getBrowserHelper,
} from '../utils/pluginParser.js'


const defaultConfig = {
  on: 'fail',
  healLimit: 2,
}

/**
 * Self-healing tests with AI.
 *
 * Read more about healing in [Self-Healing Tests](https://codecept.io/heal/)
 *
 * ```js
 * plugins: {
 *   heal: {
 *    enabled: true,
 *    on: 'fail',
 *   }
 * }
 * ```
 *
 * More config options are available:
 *
 * * `healLimit` - how many steps can be healed in a single test (default: 2)
 * * `on` - trigger mode. `fail` (default), `file` (filter to a path), `url` (filter to a URL pattern).
 *
 * #### `on=` modes
 *
 * Heal always runs on step failures; `on=` narrows when it engages.
 *
 * * **fail** — heal any failing step (default)
 * * **file** — heal only failures in `path=...[;line=...]`
 * * **url** — heal only failures when the current URL matches `pattern=...`
 *
 * `on=step` and `on=test` are not supported and are rejected with an error.
 */
export default function (config = {}) {
  if (store.debugMode && !process.env.DEBUG) {
    event.dispatcher.on(event.test.failed, () => {
      output.plugin('heal', 'Healing is disabled in --debug mode, use DEBUG="codeceptjs:heal" to enable it in debug mode')
    })
    return
  }

  const cliArgs = parsePluginArgs(config._args)
  const trigger = resolveTrigger(cliArgs, config, { on: defaultConfig.on }, {
    name: 'heal',
    validModes: ['fail', 'file', 'url'],
  })
  if (!trigger) return

  let currentTest = null
  let currentStep = null
  let healedSteps = 0
  let caughtError
  let healTries = 0
  let isHealing = false

  config = Object.assign(defaultConfig, config)

  event.dispatcher.on(event.test.before, test => {
    currentTest = test
    healedSteps = 0
    healTries = 0
    caughtError = null
  })

  event.dispatcher.on(event.step.started, step => (currentStep = step))

  event.dispatcher.on(event.step.after, step => {
    if (isHealing) return
    if (healTries >= config.healLimit) return // out of limit

    if (!heal.hasCorrespondingRecipes(step)) return

    if (trigger.on === 'file' && !matchStepFile(step, trigger.path, trigger.line)) return

    recorder.catchWithoutStop(async err => {
      if (healTries >= config.healLimit) throw err
      isHealing = true
      healTries++
      if (caughtError === err) throw err // avoid double handling
      caughtError = err

      const test = currentTest

      if (trigger.on === 'url') {
        try {
          const helper = getBrowserHelper()
          const url = helper && helper.grabCurrentUrl ? await helper.grabCurrentUrl() : null
          if (!matchUrl(url, trigger.pattern)) {
            isHealing = false
            throw err
          }
        } catch (e) {
          if (e === err) throw e
          isHealing = false
          throw err
        }
      }

      recorder.session.start('heal')

      debug('Self-healing started', step.toCode())

      await heal.healStep(step, err, { test })

      recorder.add('close healing session', () => {
        recorder.reset()
        recorder.session.restore('heal')
        recorder.ignoreErr(err)
      })
      await recorder.promise()

      isHealing = false
    })
  })

  event.dispatcher.on(event.all.result, () => {
    if (!heal.fixes?.length) return

    const { print } = output

    print('')
    print('===================')
    print(colors.bold.green('Self-Healing Report:'))

    print(`${colors.bold(heal.fixes.length)} ${heal.fixes.length === 1 ? 'step was' : 'steps were'} healed`)

    const suggestions = heal.fixes.filter(fix => fix.recipe && heal.recipes[fix.recipe].suggest)

    if (!suggestions.length) return

    let i = 1
    print('')
    print('Suggested changes:')
    print('')

    for (const suggestion of suggestions) {
      print(`${i}. To fix ${colors.bold.magenta(suggestion.test?.title)}`)
      print('  Replace the failed code:', colors.gray(`(suggested by ${colors.bold(suggestion.recipe)})`))
      print(colors.red(`- ${suggestion.step.toCode()}`))
      print(colors.green(`+ ${suggestion.snippet}`))
      print(suggestion.step.line())
      print('')
      i++
    }
  })

  event.dispatcher.on(event.workers.result, result => {
    const { print } = output

    const healedTests = Object.values(result.tests)
      .flat()
      .filter(test => test.notes.some(note => note.type === 'heal'))
    if (!healedTests.length) return

    setTimeout(() => {
      print('')
      print('===================')
      print(colors.bold.green('Self-Healing Report:'))

      print('')
      print('Suggested changes:')
      print('')

      healedTests.forEach(test => {
        print(`${colors.bold.magenta(test.title)}`)
        test.notes
          .filter(note => note.type === 'heal')
          .forEach(note => {
            print(note.text)
            print('')
          })
      })
    }, 0)
  })
}
