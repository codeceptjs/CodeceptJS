const debug = require('debug')('codeceptjs:heal')
const colors = require('chalk')
const recorder = require('../recorder')
const event = require('../event')
const output = require('../output')
const heal = require('../heal')
const store = require('../store')
const container = require('../container')

const defaultConfig = {
  healLimit: 2,
}

/**
 * Self-healing tests with AI.
 *
 * Read more about heaking in [Self-Healing Tests](https://codecept.io/heal/)
 *
 * ```js
 * plugins: {
 *   heal: {
 *    enabled: true,
 *   }
 * }
 * ```
 *
 * More config options are available:
 *
 * * `healLimit` - how many steps can be healed in a single test (default: 2)
 *
 */
module.exports = function (config = {}) {
  if (store.debugMode && !process.env.DEBUG) {
    event.dispatcher.on(event.test.failed, () => {
      output.plugin('heal', 'Healing is disabled in --debug mode, use DEBUG="codeceptjs:heal" to enable it in debug mode')
    })
    return
  }

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
    caughtError = null
  })

  event.dispatcher.on(event.step.started, step => (currentStep = step))

  event.dispatcher.on(event.step.after, step => {
    if (isHealing) return
    if (healTries >= config.healLimit) return // out of limit

    if (!heal.hasCorrespondingRecipes(step)) return

    recorder.catchWithoutStop(async err => {
      isHealing = true
      if (caughtError === err) throw err // avoid double handling
      caughtError = err

      const test = currentTest

      recorder.session.start('heal')

      debug('Self-healing started', step.toCode())

      await heal.healStep(step, err, { test })

      healTries++

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
