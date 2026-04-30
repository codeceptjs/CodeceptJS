import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import Codecept from '../lib/codecept.js'
import container from '../lib/container.js'
import { getParamsToString } from '../lib/parser.js'
import { methodsOfObject, safeStringify, truncateString } from '../lib/utils.js'
import {
  captureSnapshot,
  pickActingHelper,
  traceDirFor,
  snapshotDirFor,
  artifactsToFileUrls,
  writeTraceMarkdown,
} from '../lib/utils/trace.js'
import event from '../lib/event.js'
import { setPauseHandler, setNextStep } from '../lib/pause.js'
import { EventEmitter } from 'events'
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, resolve as resolvePath } from 'path'
import path from 'path'
import { spawn } from 'child_process'
import { createRequire } from 'module'
import { existsSync, readdirSync } from 'fs'
import { mkdirp } from 'mkdirp'

const require = createRequire(import.meta.url)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let codecept = null
let containerInitialized = false
let browserStarted = false

let runLock = Promise.resolve()
async function withLock(fn) {
  const prev = runLock
  let release
  runLock = new Promise(r => (release = r))
  await prev
  try { return await fn() }
  finally { release() }
}

async function withSilencedIO(fn) {
  const origOut = process.stdout.write.bind(process.stdout)
  const origErr = process.stderr.write.bind(process.stderr)

  process.stdout.write = () => true
  process.stderr.write = () => true

  try {
    return await fn()
  } finally {
    process.stdout.write = origOut
    process.stderr.write = origErr
  }
}

function runCmd(cmd, args, { cwd = process.cwd(), timeout = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'test' },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let out = ''
    let err = ''

    const t = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`Timeout after ${timeout}ms`))
    }, timeout)

    child.stdout.on('data', d => (out += d.toString('utf8')))
    child.stderr.on('data', d => (err += d.toString('utf8')))

    child.on('error', e => {
      clearTimeout(t)
      reject(e)
    })

    child.on('close', code => {
      clearTimeout(t)
      resolve({ code, out, err })
    })
  })
}

function resolveConfigPath(configPath) {
  const cwd = process.cwd()
  const envRoot = process.env.CODECEPTJS_PROJECT_DIR

  if (configPath && !path.isAbsolute(configPath)) {
    const base = envRoot || cwd
    configPath = path.resolve(base, configPath)
  }

  if (!configPath) {
    const base = envRoot || cwd
    configPath = process.env.CODECEPTJS_CONFIG || path.resolve(base, 'codecept.conf.js')
    if (!existsSync(configPath)) configPath = path.resolve(base, 'codecept.conf.cjs')
  }

  if (!existsSync(configPath)) {
    throw new Error(
      `CodeceptJS config not found: ${configPath}\n` +
      `CODECEPTJS_CONFIG=${process.env.CODECEPTJS_CONFIG || 'not set'}\n` +
      `CODECEPTJS_PROJECT_DIR=${process.env.CODECEPTJS_PROJECT_DIR || 'not set'}\n` +
      `cwd=${cwd}`
    )
  }

  return { configPath, configDir: path.dirname(configPath) }
}

function findCodeceptCliUpwards(startDir, { maxUp = 8 } = {}) {
  let dir = startDir

  for (let i = 0; i <= maxUp; i++) {
    const candidates = [
      path.resolve(dir, 'bin', 'codecept.js'),
      path.resolve(dir, 'node_modules', 'codeceptjs', 'bin', 'codecept.js'),
      path.resolve(dir, 'node_modules', '.bin', 'codeceptjs.cmd'),
      path.resolve(dir, 'node_modules', '.bin', 'codeceptjs'),
    ]

    for (const p of candidates) {
      if (existsSync(p)) return { cli: p, root: dir }
    }

    try {
      const pkgJson = require.resolve('codeceptjs/package.json', { paths: [dir] })
      const pkgDir = path.dirname(pkgJson)
      const jsCli = path.resolve(pkgDir, 'bin', 'codecept.js')
      if (existsSync(jsCli)) return { cli: jsCli, root: dir }
    } catch {}

    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  throw new Error(`Cannot find CodeceptJS CLI walking up from: ${startDir}`)
}

function looksLikePath(v) {
  return typeof v === 'string' && (
    v.includes('/') || v.includes('\\') ||
    v.endsWith('.js') || v.endsWith('.ts')
  )
}

function normalizePath(p) {
  return String(p).replace(/\\/g, '/')
}

function findFileByBasename(rootDir, baseNames, { maxDepth = 8 } = {}) {
  const targets = new Set(baseNames.map(x => x.toLowerCase()))

  function walk(dir, depth) {
    if (depth > maxDepth) return null

    let entries
    try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return null }

    for (const e of entries) {
      const full = path.join(dir, e.name)

      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'output') continue
        const res = walk(full, depth + 1)
        if (res) return res
        continue
      }

      if (targets.has(e.name.toLowerCase())) return full
    }

    return null
  }

  return walk(rootDir, 0)
}

async function listTestsJson({ cli, root, configPath }) {
  const args = ['list', '--config', configPath, '--json']
  const isNodeScript = cli.endsWith('.js')

  const res = isNodeScript
    ? await runCmd(process.execPath, [cli, ...args], { cwd: root, timeout: 60000 })
    : await runCmd(cli, args, { cwd: root, timeout: 60000 })

  const out = (res.out || '').trim()
  try { return JSON.parse(out) } catch { return null }
}

function extractFilesFromListJson(json) {
  if (!json) return []
  if (Array.isArray(json)) return json.map(String)
  if (Array.isArray(json.tests)) return json.tests.map(String)
  if (Array.isArray(json.files)) return json.files.map(String)
  if (Array.isArray(json.testFiles)) return json.testFiles.map(String)
  return []
}

async function resolveTestToFile({ cli, root, configPath, test }) {
  if (looksLikePath(test)) return test

  const raw = String(test).trim()
  const candidates = [
    raw,
    `${raw}.js`,
    `${raw}.ts`,
    `${raw}_test.js`,
    `${raw}.test.js`,
  ].map(x => x.toLowerCase())

  const json = await listTestsJson({ cli, root, configPath })
  const files = extractFilesFromListJson(json).map(normalizePath)

  if (files.length) {
    const byName = files.find(f => candidates.some(c => path.basename(f).toLowerCase() === c))
    if (byName) return byName

    const byContains = files.find(f => f.toLowerCase().includes(raw.toLowerCase()))
    if (byContains) return byContains
  }

  const fsFound = findFileByBasename(root, candidates)
  return fsFound ? normalizePath(fsFound) : null
}

function outputBaseDir() {
  return global.output_dir || resolvePath(process.cwd(), 'output')
}

// In-process pause coordination. When a test running through run_test calls
// pause(), the handler registered via setPauseHandler resolves a "paused"
// promise that run_test is racing against test completion. The "pause" tool
// then drives the REPL by mutating next/abort and resolving the controller.
let pausedController = null   // { resolveContinue, registeredVariables }
let pendingRunPromise = null  // run_test's run() promise while paused
let pendingRunResults = null  // results array being collected while paused
let pendingRunCleanup = null  // cleanup callback to detach test.after listener
let pendingRunIO = null       // saved stdout/stderr handles to restore after run completes
const pauseEvents = new EventEmitter()

setPauseHandler(({ registeredVariables }) => {
  return new Promise(resolve => {
    pausedController = {
      registeredVariables,
      resolveContinue: () => {
        pausedController = null
        resolve()
      },
    }
    pauseEvents.emit('paused')
  })
})

async function captureLiveArtifacts(prefix = 'pause') {
  const helper = pickActingHelper(container.helpers())
  if (!helper) return {}
  const dir = snapshotDirFor(outputBaseDir())
  mkdirp.sync(dir)
  const captured = await captureSnapshot(helper, { dir, prefix })
  return artifactsToFileUrls(captured, dir)
}

function collectRunCompletion(errorMessage) {
  const results = pendingRunResults || []
  const stats = {
    tests: results.length,
    passes: results.filter(r => r.status === 'passed').length,
    failures: results.filter(r => r.status === 'failed').length,
  }
  if (typeof pendingRunCleanup === 'function') pendingRunCleanup()
  if (pendingRunIO) {
    process.stdout.write = pendingRunIO.origOut
    process.stderr.write = pendingRunIO.origErr
    pendingRunIO = null
  }
  pendingRunPromise = null
  pendingRunResults = null
  return {
    status: 'completed',
    reporterJson: { stats, tests: results },
    error: errorMessage,
  }
}

async function initCodecept(configPath) {
  if (containerInitialized) return

  const testRoot = process.env.CODECEPTJS_PROJECT_DIR || process.cwd()

  if (!configPath) {
    configPath = process.env.CODECEPTJS_CONFIG || resolvePath(testRoot, 'codecept.conf.js')
    if (!existsSync(configPath)) configPath = resolvePath(testRoot, 'codecept.conf.cjs')
  }

  if (!existsSync(configPath)) {
    throw new Error(
      `CodeceptJS config not found: ${configPath}\n` +
      `CODECEPTJS_CONFIG=${process.env.CODECEPTJS_CONFIG || 'not set'}\n` +
      `CODECEPTJS_PROJECT_DIR=${process.env.CODECEPTJS_PROJECT_DIR || 'not set'}\n` +
      `cwd=${process.cwd()}`
    )
  }

  console.log = () => {}
  console.error = () => {}
  console.warn = () => {}

  const { getConfig } = await import('../lib/command/utils.js')
  const config = await getConfig(configPath)

  codecept = new Codecept(config, {})
  await codecept.init(testRoot)
  await container.create(config, {})
  await container.started()

  containerInitialized = true
  browserStarted = true
}

const server = new Server(
  { name: 'codeceptjs-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_tests',
      description: 'List all tests in the CodeceptJS project',
      inputSchema: { type: 'object', properties: { config: { type: 'string' } } },
    },
    {
      name: 'list_actions',
      description: 'List all available CodeceptJS actions (I.* methods)',
      inputSchema: { type: 'object', properties: { config: { type: 'string' } } },
    },
    {
      name: 'run_code',
      description: 'Run arbitrary CodeceptJS code.',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          timeout: { type: 'number' },
          config: { type: 'string' },
          saveArtifacts: { type: 'boolean' },
        },
        required: ['code'],
      },
    },
    {
      name: 'run_test',
      description: 'Run a specific test. If the test calls pause(), this tool returns early with status "paused" — call the "pause" tool to interact, then send code:"resume" to let the test finish. Otherwise returns when the test completes with the json reporter result.',
      inputSchema: {
        type: 'object',
        properties: {
          test: { type: 'string' },
          timeout: { type: 'number' },
          config: { type: 'string' },
        },
        required: ['test'],
      },
    },
    {
      name: 'run_step_by_step',
      description: 'Run a test step by step with pauses between steps.',
      inputSchema: {
        type: 'object',
        properties: {
          test: { type: 'string' },
          timeout: { type: 'number' },
          config: { type: 'string' },
        },
        required: ['test'],
      },
    },
    {
      name: 'start_browser',
      description: 'Start the browser session.',
      inputSchema: { type: 'object', properties: { config: { type: 'string' } } },
    },
    {
      name: 'stop_browser',
      description: 'Stop the browser session.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'snapshot',
      description: 'Capture current browser state (HTML, ARIA, screenshot, console, URL) without performing any action.',
      inputSchema: {
        type: 'object',
        properties: {
          config: { type: 'string' },
          fullPage: { type: 'boolean' },
        },
      },
    },
    {
      name: 'pause',
      description: 'Send a single line of code to a paused test (one that called pause() during run_test). Same syntax as the TTY pause REPL: an expression like "click(\'Save\')" runs as I.click(\'Save\'); prefix "=>" for raw JS; empty string steps to the next test step; "resume" continues the test to completion; "exit" aborts. Returns the next protocol message — typically {event:"result", ok, value, artifacts, error}, or {event:"paused"} after a step, or {event:"exited", exitInfo} if the test ended.',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          timeout: { type: 'number' },
        },
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'list_tests': {
        const configPath = args?.config
        await initCodecept(configPath)

        codecept.loadTests()
        const tests = codecept.testFiles.map(testFile => {
          const relativePath = testFile.replace(process.cwd(), '').replace(/\\/g, '/')
          return {
            file: testFile,
            relativePath: relativePath.startsWith('/') ? relativePath.slice(1) : relativePath,
          }
        })

        return { content: [{ type: 'text', text: JSON.stringify({ count: tests.length, tests }, null, 2) }] }
      }

      case 'list_actions': {
        const configPath = args?.config
        await initCodecept(configPath)

        const helpers = container.helpers()
        const supportI = container.support('I')
        const actions = []
        const actionDetails = []

        for (const helperName in helpers) {
          const helper = helpers[helperName]
          methodsOfObject(helper).forEach(action => {
            if (actions.includes(action)) return
            actions.push(action)
            const params = getParamsToString(helper[action])
            actionDetails.push({ helper: helperName, action, signature: `I.${action}(${params})` })
          })
        }

        for (const n in supportI) {
          if (actions.includes(n)) continue
          const actor = supportI[n]
          const params = getParamsToString(actor)
          actionDetails.push({ helper: 'SupportObject', action: n, signature: `I.${n}(${params})` })
        }

        return { content: [{ type: 'text', text: JSON.stringify({ count: actionDetails.length, actions: actionDetails }, null, 2) }] }
      }

      case 'start_browser': {
        const configPath = args?.config
        if (browserStarted) {
          return { content: [{ type: 'text', text: JSON.stringify({ status: 'Browser already started' }, null, 2) }] }
        }
        await initCodecept(configPath)
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'Browser started successfully' }, null, 2) }] }
      }

      case 'stop_browser': {
        if (!containerInitialized) {
          return { content: [{ type: 'text', text: JSON.stringify({ status: 'Browser not initialized' }, null, 2) }] }
        }

        const helpers = container.helpers()
        for (const helperName in helpers) {
          const helper = helpers[helperName]
          try { if (helper._finish) await helper._finish() } catch {}
        }

        browserStarted = false
        containerInitialized = false

        return { content: [{ type: 'text', text: JSON.stringify({ status: 'Browser stopped successfully' }, null, 2) }] }
      }

      case 'snapshot': {
        const { config: configPath, fullPage = false } = args || {}
        await initCodecept(configPath)

        const helper = pickActingHelper(container.helpers())
        if (!helper) throw new Error('No supported acting helper available (Playwright, Puppeteer, WebDriver).')

        const dir = snapshotDirFor(outputBaseDir())
        mkdirp.sync(dir)

        const captured = await captureSnapshot(helper, { dir, prefix: 'snapshot', fullPage })
        const traceFile = writeTraceMarkdown({
          dir,
          title: 'snapshot',
          file: 'mcp',
          durationMs: 0,
          commands: [],
          captured,
        })

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              status: 'success',
              dir,
              traceFile: pathToFileURL(traceFile).href,
              artifacts: artifactsToFileUrls(captured, dir),
            }, null, 2),
          }],
        }
      }

      case 'pause': {
        if (!pausedController) throw new Error('No paused test. Run a test first via run_test; if it calls pause(), this tool becomes available.')
        const { code = '', timeout = 60000 } = args || {}
        const I = container.support('I')
        if (!I) throw new Error('I object not available. Make sure helpers are configured.')

        // Mirror TTY parseInput: empty -> step; resume/exit -> end pause
        if (code === '' || code === 'resume' || code === 'exit') {
          setNextStep(code === '')
          const ctrl = pausedController
          ctrl.resolveContinue()

          if (code === '') {
            // Wait for the next paused event (test runs one step then re-pauses)
            // or for the test to finish.
            const finished = pendingRunPromise
              ? pendingRunPromise.then(() => ({ event: 'completed' }), err => ({ event: 'completed', error: err.message }))
              : new Promise(() => {})
            const next = await Promise.race([
              new Promise(r => pauseEvents.once('paused', () => r({ event: 'paused' }))),
              finished,
              new Promise(r => setTimeout(() => r({ event: 'step', note: 'Test did not re-pause within timeout' }), timeout)),
            ])

            if (next.event === 'completed') {
              const final = collectRunCompletion(next.error)
              return { content: [{ type: 'text', text: JSON.stringify(final, null, 2) }] }
            }
            return { content: [{ type: 'text', text: JSON.stringify(next, null, 2) }] }
          }

          // resume / exit — let the test run to completion and return the final reporter result
          if (!pendingRunPromise) {
            return { content: [{ type: 'text', text: JSON.stringify({ event: 'resumed' }, null, 2) }] }
          }
          let runError = null
          try { await pendingRunPromise } catch (err) { runError = err }
          const final = collectRunCompletion(runError?.message)
          return { content: [{ type: 'text', text: JSON.stringify(final, null, 2) }] }
        }

        // Run code via the same I container that the test is using
        const registeredVariables = pausedController.registeredVariables || {}
        let cmd = code
        if (cmd.trim().startsWith('=>')) cmd = cmd.trim().substring(2)
        else cmd = `I.${cmd}`

        let value
        let error = null
        try {
          for (const k of Object.keys(registeredVariables)) {
            // eslint-disable-next-line no-eval
            eval(`var ${k} = registeredVariables['${k}'];`)
          }
          // eslint-disable-next-line no-eval
          const locate = global.locate
          // eslint-disable-next-line no-eval
          value = await Promise.race([
            // eslint-disable-next-line no-eval
            eval(`(async () => (${cmd}))()`),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)),
          ])
        } catch (err) {
          error = err.message
        }

        const artifacts = await captureLiveArtifacts('pause')
        const result = { event: 'result', ok: !error, artifacts }
        if (error) result.error = error
        if (value !== undefined) {
          try { result.value = JSON.parse(JSON.stringify(value)) } catch { result.value = String(value) }
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }

      case 'run_code': {
        const { code, timeout = 60000, config: configPath, saveArtifacts = true } = args
        await initCodecept(configPath)

        const I = container.support('I')
        if (!I) throw new Error('I object not available. Make sure helpers are configured.')

        const result = { status: 'unknown', output: '', error: null, commands: [], artifacts: {} }

        const commands = []
        const onStepAfter = step => {
          try { commands.push(step.toString()) } catch {}
        }
        event.dispatcher.on(event.step.after, onStepAfter)

        const traceDir = traceDirFor(`mcp_${Date.now()}`, 'run_code', outputBaseDir())
        mkdirp.sync(traceDir)
        const startedAt = Date.now()

        const MAX_LOG_ENTRIES = 100
        const MAX_LOG_MSG_BYTES = 2000
        const MAX_RETURN_BYTES = 20000
        const consoleLogs = []
        const consoleMethods = ['log', 'info', 'warn', 'error', 'debug']
        const origConsoleMethods = {}
        const captureLog = level => (...args) => {
          if (consoleLogs.length >= MAX_LOG_ENTRIES) return
          const message = args.map(a => {
            if (typeof a === 'string') return a
            return truncateString(safeStringify(a, [], 2), MAX_LOG_MSG_BYTES).value
          }).join(' ')
          consoleLogs.push({ level, message, t: Date.now() - startedAt })
        }
        for (const m of consoleMethods) {
          origConsoleMethods[m] = console[m]
          console[m] = captureLog(m)
        }

        let returnValue
        try {
          const asyncFn = new Function('I', `return (async () => { ${code} })()`)
          returnValue = await Promise.race([
            asyncFn(I),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)),
          ])

          result.status = 'success'
          result.output = 'Code executed successfully'
        } catch (error) {
          result.status = 'failed'
          result.error = error.message
          result.output = error.stack || error.message
        } finally {
          for (const m of consoleMethods) console[m] = origConsoleMethods[m]
          try { event.dispatcher.removeListener(event.step.after, onStepAfter) } catch {}
        }

        result.commands = commands
        result.logs = consoleLogs
        if (consoleLogs.length === MAX_LOG_ENTRIES) result.logsTruncated = true

        if (returnValue !== undefined) {
          const json = typeof returnValue === 'string' ? returnValue : safeStringify(returnValue, [], 2)
          const stringified = truncateString(json, MAX_RETURN_BYTES)
          result.returnValue = stringified.value
          if (stringified.truncated) result.returnValueTruncated = true
        }

        let captured = {}
        if (saveArtifacts) {
          const helper = pickActingHelper(container.helpers())
          if (helper) {
            try {
              captured = await captureSnapshot(helper, { dir: traceDir, prefix: 'mcp' })
              result.artifacts = artifactsToFileUrls(captured, traceDir)
            } catch (e) {
              result.output += ` (Warning: ${e.message})`
            }
          }
        }

        const traceFile = writeTraceMarkdown({
          dir: traceDir,
          title: 'run_code',
          file: 'mcp',
          durationMs: Date.now() - startedAt,
          commands,
          captured,
          error: result.error,
        })
        result.dir = traceDir
        result.traceFile = pathToFileURL(traceFile).href

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }

      case 'run_test': {
        return await withLock(async () => {
          if (pausedController) {
            throw new Error('A previous run_test is still paused. Send code:"resume" or code:"exit" via the "pause" tool first.')
          }
          const { test, timeout = 60000, config: configPathArg } = args || {}
          await initCodecept(configPathArg)

          // Silence stdout/stderr for the duration of the test (and across any
          // pause window). Restored in collectRunCompletion or on early throw.
          const origOut = process.stdout.write.bind(process.stdout)
          const origErr = process.stderr.write.bind(process.stderr)
          process.stdout.write = () => true
          process.stderr.write = () => true
          pendingRunIO = { origOut, origErr }

          try {
            codecept.loadTests()

            let testFiles = codecept.testFiles
            if (test) {
              const testName = normalizePath(test).toLowerCase()
              testFiles = codecept.testFiles.filter(f => {
                const filePath = normalizePath(f).toLowerCase()
                return filePath.includes(testName) || filePath.endsWith(testName)
              })
            }

            if (!testFiles.length) throw new Error(`No tests found matching: ${test}`)
            const testFile = testFiles[0]

            pendingRunResults = []
            const onAfter = t => {
              pendingRunResults.push({
                title: t.title,
                file: t.file,
                status: t.err ? 'failed' : 'passed',
                error: t.err?.message,
                duration: t.duration,
              })
            }
            event.dispatcher.on(event.test.after, onAfter)
            pendingRunCleanup = () => {
              try { event.dispatcher.removeListener(event.test.after, onAfter) } catch {}
              pendingRunCleanup = null
            }

            let runError = null
            const runPromise = (async () => {
              try {
                await codecept.bootstrap()
                await codecept.run(testFile)
              } catch (err) {
                runError = err
                throw err
              }
            })()

            const pausedPromise = new Promise(resolve => pauseEvents.once('paused', () => resolve('paused')))
            const completedPromise = runPromise.then(() => 'completed', () => 'completed')

            const which = await Promise.race([
              completedPromise,
              pausedPromise,
              new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)),
            ])

            if (which === 'paused') {
              pendingRunPromise = runPromise
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({
                    status: 'paused',
                    file: testFile,
                    note: 'Test hit pause(). Use the "pause" tool to send code; send code:"resume" to let the test finish.',
                  }, null, 2),
                }],
              }
            }

            const final = collectRunCompletion(runError?.message)
            return { content: [{ type: 'text', text: JSON.stringify({ ...final, file: testFile }, null, 2) }] }
          } catch (err) {
            // Restore IO if we're throwing out of run_test before collectRunCompletion
            if (pendingRunIO) {
              process.stdout.write = pendingRunIO.origOut
              process.stderr.write = pendingRunIO.origErr
              pendingRunIO = null
            }
            if (typeof pendingRunCleanup === 'function') pendingRunCleanup()
            pendingRunPromise = null
            pendingRunResults = null
            throw err
          }
        })
      }

      case 'run_step_by_step': {
        const { test, timeout = 60000, config: configPath } = args
        await initCodecept(configPath)

        return await withSilencedIO(async () => {
          codecept.loadTests()

          let testFiles = codecept.testFiles
          if (test) {
            const testName = normalizePath(test).toLowerCase()
            testFiles = codecept.testFiles.filter(f => {
              const filePath = normalizePath(f).toLowerCase()
              return filePath.includes(testName) || filePath.endsWith(testName)
            })
          }

          if (!testFiles.length) throw new Error(`No tests found matching: ${test}`)

          const results = []
          const currentSteps = {}
          const traceDirs = {}
          let currentTestTitle = null
          const testFile = testFiles[0]

          const onBefore = (t) => {
            const traceDir = traceDirFor(t.file, t.title, outputBaseDir())
            currentTestTitle = t.title
            currentSteps[t.title] = []
            traceDirs[t.title] = traceDir
            results.push({
              test: t.title,
              file: t.file,
              status: 'running',
              steps: [],
            })
          }

          const onAfter = async (t) => {
            const r = results.find(x => x.test === t.title)
            if (r) {
              r.status = t.err ? 'failed' : 'completed'
              if (t.err) r.error = t.err.message

              if (t.artifacts?.aiTrace) {
                r.traceFile = pathToFileURL(t.artifacts.aiTrace).href
              }
              if (t.artifacts?.har) r.har = pathToFileURL(t.artifacts.har).href
              if (t.artifacts?.trace) r.trace = pathToFileURL(t.artifacts.trace).href

              if (!t.artifacts?.aiTrace) {
                try {
                  const helper = pickActingHelper(container.helpers())
                  const dir = traceDirs[t.title]
                  if (helper && dir) {
                    mkdirp.sync(dir)
                    const captured = await captureSnapshot(helper, { dir, prefix: 'final' })
                    r.artifacts = artifactsToFileUrls(captured, dir)
                    const tracePath = writeTraceMarkdown({
                      dir,
                      title: t.title,
                      file: t.file,
                      durationMs: 0,
                      commands: (currentSteps[t.title] || []).map(s => s.step),
                      captured,
                      error: r.error,
                    })
                    r.traceFile = pathToFileURL(tracePath).href
                  }
                } catch {}
              }
            }
            currentTestTitle = null
          }

          const onStepAfter = (step) => {
            if (!currentTestTitle || !currentSteps[currentTestTitle]) return
            currentSteps[currentTestTitle].push({
              step: step.toString(),
              status: step.status,
              time: step.endTime - step.startTime,
            })
            const r = results.find(x => x.test === currentTestTitle)
            if (r) r.steps = [...currentSteps[currentTestTitle]]
          }

          event.dispatcher.on(event.test.before, onBefore)
          event.dispatcher.on(event.test.after, onAfter)
          event.dispatcher.on(event.step.after, onStepAfter)

          try {
            await Promise.race([
              (async () => {
                await codecept.bootstrap()
                await codecept.run(testFile)
              })(),
              new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)),
            ])
          } catch (error) {
            const lastRunning = results.filter(r => r.status === 'running').pop()
            if (lastRunning) {
              lastRunning.status = 'failed'
              lastRunning.error = error.message
            }
          } finally {
            try { event.dispatcher.removeListener(event.test.before, onBefore) } catch {}
            try { event.dispatcher.removeListener(event.test.after, onAfter) } catch {}
            try { event.dispatcher.removeListener(event.step.after, onStepAfter) } catch {}
          }

          return { content: [{ type: 'text', text: JSON.stringify({ results, stepByStep: true }, null, 2) }] }
        })
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: error.message, stack: error.stack }, null, 2) }],
      isError: true,
    }
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  import('fs').then(fs => {
    const logFile = path.resolve(process.cwd(), 'mcp-server-error.log')
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${error.stack}\n`)
  })
})
