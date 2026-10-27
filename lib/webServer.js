import { spawn, spawnSync } from 'child_process'
import path from 'path'
import output from './output.js'
import store from './store.js'
import { isWindows } from './utils.js'

const TAIL_SIZE = 20
const KILL_TIMEOUT = 5000
const SIGNALS = ['SIGINT', 'SIGTERM']

class WebServer {
  static running = []

  static signalHandlers = Object.fromEntries(SIGNALS.map(signal => [signal, () => WebServer.onSignal(signal)]))

  constructor(config) {
    const { command, url, enabled = true, timeout = 60000, cwd = '.', env = {} } = config
    if (!command) throw new Error('webServer: "command" is required')
    if (!url) throw new Error(`webServer: "url" is required for "${command}"`)
    this.command = command
    this.url = url
    this.enabled = enabled
    this.timeout = timeout
    this.cwd = cwd
    this.env = env
    this.tail = []
    this.proc = null
  }

  static async startAll(config) {
    if (!config) return
    const configs = Array.isArray(config) ? config : [config]
    for (const serverConfig of configs) {
      await new WebServer(serverConfig).start()
    }
  }

  static async stopAll() {
    while (WebServer.running.length) {
      await WebServer.running[WebServer.running.length - 1].stop()
      WebServer.running.pop()
    }
    WebServer.removeListeners()
  }

  static killAllSync() {
    for (const server of WebServer.running) server.kill('SIGKILL')
  }

  static onSignal(signal) {
    WebServer.killAllSync()
    WebServer.removeListeners()
    if (process.listenerCount(signal) === 0) process.kill(process.pid, signal)
  }

  static addListeners() {
    if (WebServer.running.length) return
    process.on('exit', WebServer.killAllSync)
    for (const signal of SIGNALS) process.on(signal, WebServer.signalHandlers[signal])
  }

  static removeListeners() {
    process.removeListener('exit', WebServer.killAllSync)
    for (const signal of SIGNALS) process.removeListener(signal, WebServer.signalHandlers[signal])
  }

  async isUp() {
    try {
      const res = await fetch(this.url, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(1000) })
      await res.body?.cancel().catch(() => {})
      return true
    } catch (err) {
      return false
    }
  }

  async start() {
    if (!this.enabled) return

    if (await this.isUp()) {
      output.print(`Reusing web server at ${this.url}`)
      return
    }

    output.print(`Starting web server: ${this.command}`)

    this.proc = spawn(this.command, {
      shell: true,
      detached: !isWindows(),
      cwd: path.resolve(store.codeceptDir || process.cwd(), this.cwd),
      env: { ...process.env, ...this.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    this.collect(this.proc.stdout)
    this.collect(this.proc.stderr)

    WebServer.addListeners()
    WebServer.running.push(this)

    let exited = null
    const closed = new Promise(resolve => this.proc.once('close', resolve))
    this.proc.once('error', err => {
      exited = `failed to start: ${err.message}`
    })
    this.proc.once('exit', (code, signal) => {
      exited = `exited with ${signal ? `signal ${signal}` : `code ${code}`}`
    })

    const deadline = Date.now() + this.timeout
    let delay = 100
    while (true) {
      if (exited) {
        await Promise.race([closed, new Promise(resolve => setTimeout(resolve, 500))])
        await WebServer.stopAll()
        throw new Error(`webServer "${this.command}" ${exited} before ${this.url} was ready.${this.formatTail()}`)
      }
      if (await this.isUp()) break
      if (Date.now() >= deadline) {
        await WebServer.stopAll()
        throw new Error(`webServer "${this.command}" did not respond at ${this.url} within ${this.timeout}ms.${this.formatTail()}`)
      }
      await new Promise(resolve => setTimeout(resolve, delay))
      delay = Math.min(delay * 2, 1000)
    }
  }

  async stop() {
    if (!this.proc) return
    this.kill('SIGTERM')
    await this.waitForExit()
    this.proc.stdout?.destroy()
    this.proc.stderr?.destroy()
  }

  kill(signal) {
    const { proc } = this
    if (!proc?.pid) return
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

  waitForExit() {
    const { proc } = this
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
      killTimer = setTimeout(() => this.kill('SIGKILL'), KILL_TIMEOUT)
      safetyTimer = setTimeout(finish, KILL_TIMEOUT + 500)
    })
  }

  collect(stream) {
    let rest = ''
    stream.on('data', chunk => {
      const lines = (rest + chunk.toString()).split(/\r?\n/)
      rest = lines.pop()
      for (const line of lines) this.addLine(line)
    })
    stream.on('end', () => this.addLine(rest))
  }

  addLine(line) {
    if (!line.trim()) return
    this.tail.push(line)
    if (this.tail.length > TAIL_SIZE) this.tail.shift()
    if (store.debugMode || output.level() >= 2) output.print(output.styles.debug(`[webServer] ${line}`))
  }

  formatTail() {
    if (!this.tail.length) return '\n(no output)'
    return `\nLast output:\n${this.tail.join('\n')}`
  }
}

export default WebServer
