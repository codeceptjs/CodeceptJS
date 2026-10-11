import { WebSocket } from 'ws'
import debugModule from 'debug'

const debug = debugModule('codeceptjs:cdp')

class CDPConnection {
  constructor(endpoint, options = {}) {
    this.endpoint = endpoint
    this.headers = options.headers || {}
    this.timeout = options.timeout || 10000
    this.ws = null
    this.lastId = 0
    this.pending = new Map()
    this.listeners = new Map()
    this.stats = new Map()
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.endpoint, { headers: this.headers })
      this.ws.once('open', resolve)
      this.ws.once('error', reject)
    })
    this.ws.on('message', raw => {
      try {
        this._onMessage(JSON.parse(raw.toString()))
      } catch (err) {
      }
    })
    this.ws.on('close', () => {
      for (const { reject, timer } of this.pending.values()) {
        clearTimeout(timer)
        reject(new Error('CDP connection closed'))
      }
      this.pending.clear()
    })
    return this
  }

  get isConnected() {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN
  }

  send(method, params = {}, sessionId = undefined) {
    if (!this.isConnected) {
      return Promise.reject(new Error(`CDP connection is not open (sending ${method})`))
    }
    const id = ++this.lastId
    const message = { id, method, params }
    if (sessionId) message.sessionId = sessionId
    const started = Date.now()
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CDP command ${method} timed out after ${this.timeout}ms`))
      }, this.timeout)
      this.pending.set(id, { resolve, reject, timer })
      this.ws.send(JSON.stringify(message))
    })
    const record = () => {
      const ms = Date.now() - started
      const stat = this.stats.get(method) || { count: 0, total: 0, max: 0 }
      stat.count++
      stat.total += ms
      if (ms > stat.max) stat.max = ms
      this.stats.set(method, stat)
      let detail = ''
      if (params.expression) detail = params.expression.slice(0, 80).replace(/\s+/g, ' ')
      debug(`${method} ${ms}ms`, detail)
    }
    promise.then(record, record)
    return promise
  }

  printStats() {
    const rows = [...this.stats.entries()].sort((a, b) => b[1].total - a[1].total)
    for (const [method, { count, total, max }] of rows) {
      debug(`${method}: ${count} calls, total ${total}ms, avg ${Math.round(total / count)}ms, max ${max}ms`)
    }
  }

  on(method, fn) {
    if (!this.listeners.has(method)) this.listeners.set(method, [])
    this.listeners.get(method).push(fn)
  }

  _onMessage(msg) {
    if (msg.id && this.pending.has(msg.id)) {
      const { resolve, reject, timer } = this.pending.get(msg.id)
      clearTimeout(timer)
      this.pending.delete(msg.id)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
      return
    }
    if (msg.method && this.listeners.has(msg.method)) {
      for (const fn of this.listeners.get(msg.method)) {
        try {
          fn(msg.params, msg.sessionId)
        } catch (err) {
        }
      }
    }
  }

  async close() {
    if (!this.ws) return
    this.printStats()
    await new Promise(resolve => {
      if (this.ws.readyState === WebSocket.CLOSED) return resolve()
      this.ws.once('close', resolve)
      this.ws.close()
    })
    this.ws = null
  }
}

export default CDPConnection
