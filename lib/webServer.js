import { spawn, spawnSync } from 'child_process'
import path from 'path'
import output from './output.js'
import store from './store.js'
import { isWindows } from './utils.js'

const TAIL_SIZE = 20
const KILL_TIMEOUT = 5000
const SIGNALS = ['SIGINT', 'SIGTERM']

const servers = []

async function isUp(url) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(1000) })
    await res.body?.cancel().catch(() => {})
    return true
  } catch (err) {
    return false
  }
}

function killGroup(proc, signal) {
  if (!proc.pid) return
  try {
    if (isWindows()) {
      if (proc.exitCode !== null) return
      spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'])
    } else {
      process.kill(-proc.pid, signal)
    }
  } catch (err) {
    try {
      proc.kill(signal)
    } catch (e) {}
  }
}

function killAllSync() {
  for (const server of servers) killGroup(server.proc, 'SIGKILL')
}

function onSignal(signal) {
  killAllSync()
  removeListeners()
  if (process.listenerCount(signal) === 0) process.kill(process.pid, signal)
}

const signalHandlers = Object.fromEntries(SIGNALS.map(signal => [signal, () => onSignal(signal)]))

function addListeners() {
  if (servers.length) return
  process.on('exit', killAllSync)
  for (const signal of SIGNALS) process.on(signal, signalHandlers[signal])
}

function removeListeners() {
  process.removeListener('exit', killAllSync)
  for (const signal of SIGNALS) process.removeListener(signal, signalHandlers[signal])
}

function formatTail(lines) {
  if (!lines.length) return '\n(no output)'
  return `\nLast output:\n${lines.join('\n')}`
}

function waitForExit(proc, timeout) {
  return new Promise(resolve => {
    if (proc.exitCode !== null || proc.signalCode !== null) return resolve()
    let killTimer
    let safetyTimer
    const finish = () => {
      clearTimeout(killTimer)
      clearTimeout(safetyTimer)
      resolve()
    }
    proc.once('exit', finish)
    killTimer = setTimeout(() => killGroup(proc, 'SIGKILL'), timeout)
    safetyTimer = setTimeout(finish, timeout + 500)
  })
}

async function stopServer(server) {
  const { proc } = server
  killGroup(proc, 'SIGTERM')
  await waitForExit(proc, KILL_TIMEOUT)
  proc.stdout?.destroy()
  proc.stderr?.destroy()
}

async function startServer(serverConfig) {
  const { command, url, timeout = 60000, cwd = '.', env = {} } = serverConfig
  const reuseExistingServer = serverConfig.reuseExistingServer ?? !process.env.CI

  if (!command) throw new Error('webServer: "command" is required')
  if (!url) throw new Error(`webServer: "url" is required for "${command}"`)

  if (await isUp(url)) {
    if (reuseExistingServer) {
      output.print(`Reusing web server at ${url}`)
      return
    }
    throw new Error(`webServer: ${url} is already in use. Stop the process running there or set "reuseExistingServer: true".`)
  }

  output.print(`Starting web server: ${command}`)

  const proc = spawn(command, {
    shell: true,
    detached: !isWindows(),
    cwd: path.resolve(store.codeceptDir || process.cwd(), cwd),
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const tail = []
  const collect = stream => {
    let rest = ''
    stream.on('data', chunk => {
      const lines = (rest + chunk.toString()).split(/\r?\n/)
      rest = lines.pop()
      for (const line of lines) addLine(line)
    })
    stream.on('end', () => addLine(rest))
  }
  const addLine = line => {
    if (!line.trim()) return
    tail.push(line)
    if (tail.length > TAIL_SIZE) tail.shift()
    if (store.debugMode || output.level() >= 2) output.print(output.styles.debug(`[webServer] ${line}`))
  }
  collect(proc.stdout)
  collect(proc.stderr)

  addListeners()
  const server = { proc, command, url }
  servers.push(server)

  let exited = null
  const closed = new Promise(resolve => proc.once('close', resolve))
  proc.once('error', err => {
    exited = `failed to start: ${err.message}`
  })
  proc.once('exit', (code, signal) => {
    exited = `exited with ${signal ? `signal ${signal}` : `code ${code}`}`
  })

  const deadline = Date.now() + timeout
  let delay = 100
  while (true) {
    if (exited) {
      await Promise.race([closed, new Promise(resolve => setTimeout(resolve, 500))])
      await stopWebServer()
      throw new Error(`webServer "${command}" ${exited} before ${url} was ready.${formatTail(tail)}`)
    }
    if (await isUp(url)) break
    if (Date.now() >= deadline) {
      await stopWebServer()
      throw new Error(`webServer "${command}" did not respond at ${url} within ${timeout}ms.${formatTail(tail)}`)
    }
    await new Promise(resolve => setTimeout(resolve, delay))
    delay = Math.min(delay * 2, 1000)
  }
}

export async function startWebServer(config) {
  if (!config) return
  const configs = Array.isArray(config) ? config : [config]
  for (const serverConfig of configs) {
    await startServer(serverConfig)
  }
}

export async function stopWebServer() {
  while (servers.length) {
    const server = servers[servers.length - 1]
    await stopServer(server)
    servers.pop()
  }
  removeListeners()
}
