const colors = require('chalk')
const readline = require('readline')
const ora = require('ora-classic')
const debug = require('debug')('codeceptjs:pause')

const container = require('./container')
const history = require('./history')
const store = require('./store')
const aiAssistant = require('./ai')
const recorder = require('./recorder')
const event = require('./event')
const output = require('./output')
const { methodsOfObject, searchWithFusejs } = require('./utils')

// npm install colors
let rl
let nextStep
let finish
let next
let registeredVariables = {}
/**
 * Pauses test execution and starts interactive shell
 * @param {Object<string, *>} [passedObject]
 */
const pause = function (passedObject = {}) {
  if (store.dryRun) return

  next = false
  // add listener to all next steps to provide next() functionality
  event.dispatcher.on(event.step.after, () => {
    recorder.add('Start next pause session', () => {
      // test already finished, nothing to pause
      if (!store.currentTest) return
      if (!next) return
      return pauseSession()
    })
  })

  event.dispatcher.on(event.test.finished, () => {
    finish()
    recorder.session.restore('pause')
    rl.close()
    history.save()
  })

  recorder.add('Start new session', () => pauseSession(passedObject))
}

function pauseSession(passedObject = {}) {
  registeredVariables = passedObject
  recorder.session.start('pause')
  if (!next) {
    let vars = Object.keys(registeredVariables).join(', ')
    if (vars) vars = `(vars: ${vars})`

    output.print(colors.yellow(' Interactive shell started'))
    output.print(colors.yellow(' Use JavaScript syntax to try steps in action'))
    output.print(colors.yellow(` - Press ${colors.bold('ENTER')} to run the next step`))
    output.print(colors.yellow(` - Press ${colors.bold('TAB')} twice to see all available commands`))
    output.print(colors.yellow(` - Type ${colors.bold('exit')} + Enter to exit the interactive shell`))
    output.print(colors.yellow(` - Prefix ${colors.bold('=>')} to run js commands ${colors.bold(vars)}`))

    if (aiAssistant.isEnabled) {
      output.print(colors.blue(` ${colors.bold('AI is enabled! (experimental)')} Write what you want and make AI run it`))
      output.print(colors.blue(' Please note, only HTML fragments with interactive elements are sent to AI provider'))
      output.print(colors.blue(' Ideas: ask it to fill forms for you or to click'))
    }
  }

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    completer,
    history: history.load(),
    historySize: 50, // Adjust the history size as needed
  })

  store.onPause = true
  rl.on('line', parseInput)
  rl.on('close', () => {
    if (!next) console.log('Exiting interactive shell....')
    store.onPause = false
  })
  return new Promise(resolve => {
    finish = resolve
    return askForStep()
  })
}

async function parseInput(cmd) {
  rl.pause()
  next = false
  recorder.session.start('pause')
  if (cmd === '') next = true
  if (!cmd || cmd === 'resume' || cmd === 'exit') {
    finish()
    recorder.session.restore('pause')
    rl.close()
    history.save()
    return nextStep()
  }
  for (const k of Object.keys(registeredVariables)) {
    eval(`var ${k} = registeredVariables['${k}'];`)
  }

  let executeCommand = Promise.resolve()

  const getCmd = () => {
    debug('Command:', cmd)
    return cmd
  }

  let isCustomCommand = false
  let lastError = null
  let isAiCommand = false
  let $res
  try {
    const locate = global.locate // enable locate in this context

    const I = container.support('I')
    if (cmd.trim().startsWith('=>')) {
      isCustomCommand = true
      cmd = cmd.trim().substring(2, cmd.length)
    } else if (aiAssistant.isEnabled && cmd.trim() && !cmd.match(/^\w+\(/) && cmd.includes(' ')) {
      const currentOutputLevel = output.level()
      output.level(0)
      const res = I.grabSource()
      isAiCommand = true
      executeCommand = executeCommand.then(async () => {
        try {
          const html = await res
          await aiAssistant.setHtmlContext(html)
        } catch (err) {
          output.print(output.styles.error(' ERROR '), "Can't get HTML context", err.stack)
          return
        } finally {
          output.level(currentOutputLevel)
        }

        const spinner = ora('Processing AI request...').start()
        cmd = await aiAssistant.writeSteps(cmd)
        spinner.stop()
        output.print('')
        output.print(colors.blue(aiAssistant.getResponse()))
        output.print('')
        return cmd
      })
    } else {
      cmd = `I.${cmd}`
    }
    executeCommand = executeCommand
      .then(async () => {
        const cmd = getCmd()
        if (!cmd) return
        return eval(cmd)
      })
      .catch(err => {
        debug(err)
        if (isAiCommand) return
        if (!lastError) output.print(output.styles.error(' ERROR '), err.message)
        debug(err.stack)

        lastError = err.message
      })

    const val = await executeCommand

    if (isCustomCommand) {
      if (val !== undefined) console.log('Result', '$res=', val)
      $res = val
    }

    if (cmd?.startsWith('I.see') || cmd?.startsWith('I.dontSee')) {
      output.print(output.styles.success('  OK  '), cmd)
    }
    if (cmd?.startsWith('I.grab')) {
      output.print(output.styles.debug(val))
    }

    history.push(cmd) // add command to history when successful
  } catch (err) {
    if (!lastError) output.print(output.styles.error(' ERROR '), err.message)
    lastError = err.message
  }
  recorder.session.catch(err => {
    const msg = err.cliMessage ? err.cliMessage() : err.message

    // pop latest command from history because it failed
    history.pop()

    if (isAiCommand) return
    if (!lastError) output.print(output.styles.error(' FAIL '), msg)
    lastError = err.message
  })
  recorder.add('ask for next step', askForStep)
  nextStep()
}

function askForStep() {
  return new Promise(resolve => {
    nextStep = resolve
    rl.setPrompt(' I.', 3)
    rl.resume()
    rl.prompt([false])
  })
}

function completer(line) {
  const I = container.support('I')
  const completions = methodsOfObject(I)
  // If no input, return all completions
  if (!line) {
    return [completions, line]
  }

  // Search using Fuse.js
  const searchResults = searchWithFusejs(completions, line, {
    threshold: 0.3,
    distance: 100,
    minMatchCharLength: 1,
  })
  const hits = searchResults.map(result => result.item)

  return [hits, line]
}

function registerVariable(name, value) {
  registeredVariables[name] = value
}

module.exports = pause

module.exports.registerVariable = registerVariable
