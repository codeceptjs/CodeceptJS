import colors from 'chalk'
import readline from 'readline'
import ora from 'ora-classic'
import path from 'path'
import { mkdirp } from 'mkdirp'
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
import {
  captureSnapshot,
  pickActingHelper,
  snapshotDirFor,
  artifactsToFileUrls,
} from './utils/trace.js'

// npm install colors
let rl
let nextStep
let finish
let next
let registeredVariables = {}

const isMcpContext = () => process.env.CODECEPTJS_MCP === '1' && !process.stdin.isTTY
const isMcpYieldMode = () => isMcpContext() && process.env.CODECEPTJS_MCP_PAUSE === '1'
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
    if (typeof finish === 'function') finish()
    recorder.session.restore('pause')
    if (rl) rl.close()
    if (!isMcpContext()) history.save()
  })

  recorder.add('Start new session', () => pauseSession(passedObject))
}

function pauseSession(passedObject = {}) {
  registeredVariables = passedObject
  recorder.session.start('pause')

  if (isMcpContext()) {
    if (isMcpYieldMode()) return mcpYieldSession()
    output.print(colors.yellow(' pause() skipped — running in MCP context without yield mode'))
    recorder.session.restore('pause')
    return Promise.resolve()
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

function emitMcpProtocol(obj) {
  process.stdout.write(JSON.stringify({ __mcpPause: true, ...obj }) + '\n')
}

async function captureMcpArtifacts() {
  const helpers = container.helpers ? container.helpers() : {}
  const helper = pickActingHelper(helpers)
  if (!helper) return {}
  const baseDir = global.output_dir || path.resolve(process.cwd(), 'output')
  const dir = snapshotDirFor(baseDir)
  mkdirp.sync(dir)
  const captured = await captureSnapshot(helper, { dir, prefix: 'pause' })
  return artifactsToFileUrls(captured, dir)
}

let mcpRl = null
let mcpCurrentHandler = null

function ensureMcpReadline() {
  if (mcpRl) return mcpRl
  mcpRl = readline.createInterface({ input: process.stdin, terminal: false })
  mcpRl.on('line', raw => {
    if (mcpCurrentHandler) mcpCurrentHandler(raw)
  })
  return mcpRl
}

function mcpYieldSession() {
  const I = container.support('I')
  ensureMcpReadline()
  store.onPause = true
  emitMcpProtocol({ event: 'paused' })

  return new Promise((resolve, reject) => {
    let resolved = false
    finish = () => {
      if (resolved) return
      resolved = true
      store.onPause = false
      recorder.session.restore('pause')
      mcpCurrentHandler = null
      resolve()
    }

    mcpCurrentHandler = async raw => {
      const line = raw.toString().trim()
      if (!line) return
      let msg
      try {
        msg = JSON.parse(line)
      } catch (e) {
        emitMcpProtocol({ event: 'error', message: 'Invalid JSON: ' + e.message })
        return
      }

      const id = msg.id
      try {
        switch (msg.type) {
          case 'run': {
            await mcpRun(msg.code, id, I)
            return
          }
          case 'snapshot': {
            const artifacts = await captureMcpArtifacts()
            emitMcpProtocol({ id, type: 'result', ok: true, artifacts })
            return
          }
          case 'step': {
            next = true
            emitMcpProtocol({ id, type: 'resumed', step: true })
            finish()
            return
          }
          case 'resume': {
            next = false
            emitMcpProtocol({ id, type: 'resumed' })
            finish()
            return
          }
          case 'exit': {
            next = false
            store.onPause = false
            recorder.session.restore('pause')
            emitMcpProtocol({ id, type: 'exited' })
            resolved = true
            mcpCurrentHandler = null
            reject(new Error('Test aborted from MCP pause_session'))
            return
          }
          default:
            emitMcpProtocol({ id, event: 'error', message: `Unknown command type: ${msg.type}` })
        }
      } catch (err) {
        emitMcpProtocol({ id, event: 'error', message: err.message })
      }
    }
  })
}

async function mcpRun(rawCode, id, I) {
  if (typeof rawCode !== 'string' || !rawCode.length) {
    emitMcpProtocol({ id, type: 'result', ok: false, error: 'Missing or invalid code' })
    return
  }

  let cmd = rawCode
  let isCustom = false
  if (cmd.trim().startsWith('=>')) {
    isCustom = true
    cmd = cmd.trim().substring(2)
  } else {
    cmd = `I.${cmd}`
  }

  for (const k of Object.keys(registeredVariables)) {
    eval(`var ${k} = registeredVariables['${k}'];`)
  }
  const locate = global.locate

  let value
  let error = null
  try {
    value = await eval(cmd)
  } catch (err) {
    error = err.message
    debug(err.stack)
  }

  const artifacts = await captureMcpArtifacts()
  const payload = { id, type: 'result', ok: !error, artifacts }
  if (error) payload.error = error
  if (value !== undefined) {
    try {
      payload.value = JSON.parse(JSON.stringify(value))
    } catch {
      payload.value = String(value)
    }
  }
  if (isCustom) payload.custom = true
  emitMcpProtocol(payload)
}

export default pause
export { registerVariable }
export const __test = {
  isMcpContext,
  isMcpYieldMode,
  emitMcpProtocol,
  mcpYieldSession,
  resetForTest() {
    rl = undefined
    nextStep = undefined
    finish = undefined
    next = undefined
    registeredVariables = {}
    mcpRl = null
    mcpCurrentHandler = null
  },
}
