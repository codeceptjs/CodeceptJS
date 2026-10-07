import assert from 'assert'
import path from 'path'
import fs from 'fs'
import os from 'os'
import net from 'net'
import http from 'http'
import { exec } from 'child_process'
import { fileURLToPath } from 'url'
import debugFactory from 'debug'

const debug = debugFactory('codeceptjs:test')
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const runner = path.join(__dirname, '/../../bin/codecept.js')
const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/webServer')
const config = `--config ${codecept_dir}/codecept.conf.js`

let pidFile

function run(command, env) {
  return new Promise(resolve => {
    exec(`${runner} ${command} ${config}`, { env: { ...process.env, WEB_SERVER_PID_FILE: pidFile, ...env } }, (err, stdout, stderr) => {
      debug(stdout)
      debug(stderr)
      resolve({ err, stdout: stdout + stderr })
    })
  })
}

function pids() {
  if (!fs.existsSync(pidFile)) return []
  return fs.readFileSync(pidFile, 'utf8').split('\n').filter(Boolean).map(Number)
}

function isPortFree(port) {
  return new Promise(resolve => {
    const socket = net.connect(port, '127.0.0.1')
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => resolve(true))
  })
}

async function isDead(pid) {
  for (let i = 0; i < 20; i++) {
    try {
      process.kill(pid, 0)
    } catch (err) {
      return err.code === 'ESRCH'
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return false
}

describe('CodeceptJS webServer', function () {
  this.timeout(40000)

  beforeEach(() => {
    pidFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'codecept-webserver-')), 'pids')
  })

  it('should start server before tests and stop it after', async () => {
    const port = 18631
    const { err, stdout } = await run('run', { WEB_SERVER_PORT: port })
    assert(!err, stdout)
    assert(stdout.includes('Starting web server: node server.js'), stdout)
    assert(stdout.includes('2 passed'), stdout)
    assert.equal(pids().length, 1)
    assert(await isPortFree(port), 'port should be free after run')
    assert(await isDead(pids()[0]), 'server process should be killed')
  })

  it('should kill all processes spawned by the command', async function () {
    if (process.platform === 'win32') this.skip()
    const port = 18640
    const { err, stdout } = await run('run', { WEB_SERVER_PORT: port, WEB_SERVER_COMMAND: 'node silent.js & node server.js' })
    assert(!err, stdout)
    assert(stdout.includes('2 passed'), stdout)
    assert.equal(pids().length, 2)
    for (const pid of pids()) assert(await isDead(pid), `process ${pid} should be killed`)
  })

  it('should reuse existing server', async () => {
    const port = 18632
    const server = http.createServer((req, res) => res.end('web server is up'))
    await new Promise(resolve => server.listen(port, '127.0.0.1', resolve))
    try {
      const { err, stdout } = await run('run', {
        WEB_SERVER_PORT: port,
        WEB_SERVER_COMMAND: 'node -e "process.exit(1)"',
      })
      assert(!err, stdout)
      assert(stdout.includes(`Reusing web server at http://127.0.0.1:${port}`), stdout)
      assert(!stdout.includes('Starting web server'), stdout)
      assert(stdout.includes('2 passed'), stdout)
    } finally {
      server.close()
    }
  })

  it('should not start server when disabled', async () => {
    const port = 18633
    const { err, stdout } = await run('run', { WEB_SERVER_PORT: port, WEB_SERVER_ENABLED: 'false' })
    assert(!stdout.includes('Starting web server'), stdout)
    assert(!stdout.includes('Reusing web server'), stdout)
    assert.equal(pids().length, 0)
  })

  it('should fail on timeout with tail of server output and kill it', async () => {
    const port = 18634
    const { err, stdout } = await run('run', {
      WEB_SERVER_PORT: port,
      WEB_SERVER_COMMAND: 'node silent.js',
      WEB_SERVER_TIMEOUT: 1500,
    })
    assert(err, stdout)
    assert(stdout.includes(`did not respond at http://127.0.0.1:${port} within 1500ms`), stdout)
    assert(stdout.includes('server line 29'), stdout)
    assert(stdout.includes('server line 10'), stdout)
    assert(!stdout.includes('server line 9\n'), stdout)
    assert(!stdout.includes('passed'), stdout)
    assert.equal(pids().length, 1)
    assert(await isDead(pids()[0]), 'server process should be killed')
  })

  it('should fail when server exits early', async () => {
    const { err, stdout } = await run('run', {
      WEB_SERVER_PORT: 18635,
      WEB_SERVER_COMMAND: `node -e "console.error('boom'); process.exit(3)"`,
    })
    assert(err, stdout)
    assert(stdout.includes('exited with code 3'), stdout)
    assert(stdout.includes('boom'), stdout)
  })

  it('should start server once for run-workers', async () => {
    const port = 18636
    const { err, stdout } = await run('run-workers 2', { WEB_SERVER_PORT: port })
    assert(!err, stdout)
    assert(stdout.includes('2 passed'), stdout)
    assert.equal(pids().length, 1)
    assert(await isPortFree(port), 'port should be free after run')
  })

  it('should start server once for run-multiple', async () => {
    const port = 18637
    const { err, stdout } = await run('run-multiple default', { WEB_SERVER_PORT: port })
    assert(!err, stdout)
    assert.equal(stdout.match(/2 passed/g)?.length, 2, stdout)
    assert.equal(pids().length, 1)
    assert(await isPortFree(port), 'port should be free after run')
  })

  it('should start server once for run-rerun', async () => {
    const port = 18638
    const { err, stdout } = await run('run-rerun', { WEB_SERVER_PORT: port })
    assert(!err, stdout)
    assert.equal(pids().length, 1)
    assert(await isPortFree(port), 'port should be free after run')
  })

  it('should not start server for dry-run', async () => {
    const { err, stdout } = await run('dry-run', { WEB_SERVER_PORT: 18639 })
    assert(!err, stdout)
    assert(!stdout.includes('Starting web server'), stdout)
    assert.equal(pids().length, 0)
  })
})
