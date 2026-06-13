import colors from 'chalk'
import readline from 'readline'
import ora from 'ora-classic'
import debugModule from 'debug'
const debug = debugModule('codeceptjs:pause')
import container from './container.js'
import history from './history.js'
import store from './store.js'
import aiAssistant from './ai.js'
import recorder from './recorder.js'
import event from './event.js'
import output from './output.js'
import { methodsOfObject, searchWithFusejs } from './utils.js'

// npm install colors
let rl
let nextStep
let finish
let next
let registeredVariables = {}
let externalHandler = null
let pauseSessionOpen = false

function onStepAfter() {
  recorder.add('Start next pause session', () => {
    // test already finished, nothing to pause
    if (!store.currentTest) return
    if (!next) return
    return pauseSession()
  })
}

function onTestFinished() {
  if (typeof finish === 'function') finish()
  if (pauseSessionOpen) {
    recorder.session.restore('pause')
    pauseSessionOpen = false
  }
  if (rl) rl.close()
  if (!externalHandler) history.save()
  event.dispatcher.removeListener(event.step.after, onStepAfter)
  event.dispatcher.removeListener(event.test.finished, onTestFinished)
}

function registerPauseListeners() {
  event.dispatcher.removeListener(event.step.after, onStepAfter)
  event.dispatcher.removeListener(event.test.finished, onTestFinished)
  event.dispatcher.on(event.step.after, onStepAfter)
  event.dispatcher.on(event.test.finished, onTestFinished)
}

/**
 * Pauses test execution and starts interactive shell
 * @param {Object<string, *>} [passedObject]
 */
const pause = function (passedObject = {}) {
  if (store.dryRun) return

  next = false
  registerPauseListeners()

  recorder.add('Start new session', () => pauseSession(passedObject))
}

function pauseSession(passedObject = {}) {
  registeredVariables = passedObject
  recorder.session.start('pause')
  pauseSessionOpen = true

  if (externalHandler) {
    store.onPause = true
    return externalHandler({ registeredVariables }).then(() => {
      store.onPause = false
      recorder.session.restore('pause')
      pauseSessionOpen = false
    })
  }

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
    if (typeof finish === 'function') finish()
    recorder.session.restore('pause')
    pauseSessionOpen = false
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
      try {
        output.print(output.styles.debug(JSON.stringify(val, null, 2)))
      } catch (err) {
        output.print(output.styles.error(' ERROR '), 'Failed to stringify result:', err.message)
        output.print(output.styles.error(' RAW VALUE '), String(val))
      }
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

/**
 * Hook for external pause drivers (e.g. the MCP server). When set, pauseSession
 * delegates to the handler instead of opening a readline REPL. The handler
 * receives `{ registeredVariables }` and returns a Promise that resolves when
 * the driver decides to continue (resume) or step.
 *
 * The driver controls step-vs-resume by mutating `next` via setNextStep before
 * resolving its Promise.
 */
function setPauseHandler(handler) {
  externalHandler = handler
}

/**
 * Trigger a one-shot pause from outside the test (e.g. the MCP server,
 * pausing the test at a specific step index without modifying the test).
 * Schedules pauseSession through the recorder so it slots between steps.
 */
function pauseNow(passedObject = {}) {
  if (store.dryRun) return
  registerPauseListeners()
  recorder.add('Triggered pause', () => pauseSession(passedObject))
}

export default pause
export { registerVariable, setPauseHandler, pauseNow }
