#!/usr/bin/env node
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
  TraceReader,
  ariaDiff,
} from '../lib/utils/trace.js'
import event from '../lib/event.js'
import recorder from '../lib/recorder.js'
import WebElement from '../lib/element/WebElement.js'
import { locate, within, session, secret, inject, pause } from '../lib/index.js'
import { tryTo, retryTo, hopeThat } from '../lib/effects.js'
import step from '../lib/steps.js'
import { element, eachElement, expectElement, expectAnyElement, expectAllElements } from '../lib/els.js'
import { setPauseHandler, pauseNow } from '../lib/pause.js'
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
let shellSessionActive = false
let bootstrapDone = false
let currentPluginsSig = ''
let currentAiTraceDir = null  // mirrors the dir aiTrace plugin computes per test/session
let aiTraceEnabled = false  // tracked across the session so tool responses can surface a hint when off

event.dispatcher.on(event.test.before, test => {
  try {
    const title = (test && (test.fullTitle ? test.fullTitle() : test.title)) || 'MCP Session'
    currentAiTraceDir = traceDirFor(test?.file, title, outputBaseDir())
  } catch {}
})

function aiTraceHint() {
  if (aiTraceEnabled) return undefined
  return 'aiTrace plugin is disabled — re-run start_browser with plugins={ aiTrace: { enabled: true } } to capture per-step DOM/ARIA/console traces for debugging.'
}

function applyMochaGrep(grep) {
  if (grep) container.mocha().grep(grep)
}

function pauseAtMatcher(pauseAt) {
  if (pauseAt == null) return () => false
  if (typeof pauseAt === 'number') return (idx) => idx === pauseAt
  if (typeof pauseAt === 'string') {
    const m = pauseAt.match(/^\/(.+)\/([gimsuy]*)$/)
    const re = m ? new RegExp(m[1], m[2]) : new RegExp(pauseAt.replace(/[.+?^${}()|[\]\\]/g, '\\$&'), 'i')
    return (_idx, name) => re.test(name)
  }
  return () => false
}

async function ensureBootstrap() {
  if (bootstrapDone) return
  await codecept.bootstrap()
  bootstrapDone = true
}

async function startShellSession() {
  if (shellSessionActive) return
  await ensureBootstrap()
  recorder.start()
  event.emit(event.suite.before, {
    fullTitle: () => 'MCP Session',
    tests: [],
    retries: () => {},
  })
  event.emit(event.test.before, {
    title: 'MCP Session',
    artifacts: {},
    retries: () => {},
  })
  shellSessionActive = true
}

async function endShellSession() {
  if (!shellSessionActive) return
  try { event.emit(event.test.after, {}) } catch {}
  try { event.emit(event.suite.after, {}) } catch {}
  try { event.emit(event.all.result, {}) } catch {}
  shellSessionActive = false
}

async function ensureSession() {
  if (shellSessionActive || pausedController) return
  await startShellSession()
}

function normalizePluginOverrides(plugins) {
  if (!plugins || typeof plugins !== 'object') return {}
  const out = {}
  for (const [name, opts] of Object.entries(plugins)) {
    if (opts === false) continue
    out[name] = (opts === true || opts == null) ? {} : opts
  }
  return out
}

function applyPluginOverrides(config, plugins) {
  config.plugins = config.plugins || {}
  for (const [name, opts] of Object.entries(plugins)) {
    config.plugins[name] = { ...(config.plugins[name] || {}), ...opts, enabled: true }
  }
}

function pluginsSignature(plugins) {
  const keys = Object.keys(plugins).sort()
  return JSON.stringify(keys.map(k => [k, plugins[k]]))
}

async function teardownContainer() {
  if (!containerInitialized) return
  try {
    await closeBrowser()
    try { if (codecept?.teardown) await codecept.teardown() } catch {}
  } finally {
    containerInitialized = false
    browserStarted = false
    bootstrapDone = false
    aiTraceEnabled = false
    codecept = null
    currentPluginsSig = ''
  }
}

let shutdownStarted = false
function installShutdownHooks() {
  const onSignal = (signal) => {
    if (shutdownStarted) return
    shutdownStarted = true
    teardownContainer().finally(() => process.exit(signal === 'SIGINT' ? 130 : 0))
  }
  process.on('SIGTERM', () => onSignal('SIGTERM'))
  process.on('SIGINT', () => onSignal('SIGINT'))
  process.on('beforeExit', () => {
    if (shutdownStarted) return
    shutdownStarted = true
    teardownContainer().catch(() => {})
  })
}

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
let pausedController = null
let pendingRunPromise = null
let pendingRunResults = null
let pendingRunCleanup = null
let pendingTestFile = null
let pendingStepInfo = null
let abortRun = false
const pauseEvents = new EventEmitter()

setPauseHandler(({ registeredVariables }) => {
  if (abortRun) return Promise.reject(new Error('MCP session aborted'))
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

async function cancelRun() {
  if (!pendingRunPromise && !pausedController) return false
  abortRun = true
  if (typeof pendingRunCleanup === 'function') { try { pendingRunCleanup() } catch {} }
  if (pausedController) { try { pausedController.resolveContinue() } catch {} ; pausedController = null }

  try { container.mocha().runner?.abort() } catch {}

  if (pendingRunPromise) {
    try { await pendingRunPromise.catch(() => {}) } catch {}
  }
  pendingRunPromise = null
  pendingRunResults = null
  pendingTestFile = null
  pendingStepInfo = null
  return true
}

async function waitForTestResult(runPromise, timeout) {
  const pausedPromise = new Promise(resolve => pauseEvents.once('paused', () => resolve('paused')))
  const completedPromise = runPromise.then(() => 'completed', () => 'completed')
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
  })
  try {
    return { status: await Promise.race([completedPromise, pausedPromise, timeoutPromise]) }
  } catch (err) {
    await cancelRun()
    return { status: 'aborted', error: err.message }
  } finally {
    clearTimeout(timeoutId)
  }
}

async function closeBrowser() {
  if (!containerInitialized) return
  await cancelRun()
  await endShellSession()
  for (const helper of Object.values(container.helpers() || {})) {
    try { if (helper._cleanup) await helper._cleanup() } catch {}
    try { if (helper._finishTest) await helper._finishTest() } catch {}
  }
  browserStarted = false
}

async function captureLiveArtifacts(prefix = 'pause') {
  const helper = pickActingHelper(container.helpers())
  if (!helper) return {}
  const dir = snapshotDirFor(outputBaseDir())
  mkdirp.sync(dir)
  const captured = await captureSnapshot(helper, { dir, prefix })
  return artifactsToFileUrls(captured, dir)
}

async function gatherPageBrief() {
  const helper = pickActingHelper(container.helpers())
  if (!helper) return {}
  const out = {}
  try { if (helper.grabCurrentUrl) out.url = await helper.grabCurrentUrl() } catch {}
  try { if (helper.grabTitle) out.title = await helper.grabTitle() } catch {}
  try {
    if (helper.grabSource) {
      const html = await helper.grabSource()
      out.contentSize = typeof html === 'string' ? html.length : null
    }
  } catch {}
  return out
}

function collectRunCompletion(errorMessage) {
  const results = pendingRunResults || []
  const stats = {
    tests: results.length,
    passes: results.filter(r => r.status === 'passed').length,
    failures: results.filter(r => r.status === 'failed').length,
  }
  if (typeof pendingRunCleanup === 'function') pendingRunCleanup()
  pendingRunPromise = null
  pendingRunResults = null
  pendingTestFile = null
  pendingStepInfo = null
  let error = errorMessage || null
  if (!error && results.length === 0) {
    error = 'No tests ran and no error was reported. The Mocha instance may have been disposed (set mocha.cleanReferencesAfterRun=false in config) or the test file matched no scenarios.'
  }
  return {
    status: error ? 'failed' : 'completed',
    aiTraceDir: currentAiTraceDir,
    reporterJson: { stats, tests: results },
    error,
    aiTraceHint: aiTraceHint(),
  }
}

function pausedPayload() {
  return {
    status: 'paused',
    file: pendingTestFile,
    aiTraceDir: currentAiTraceDir,
    pausedAfter: pendingStepInfo,
    suggestions: [
      'Call snapshot to capture URL/HTML/ARIA/screenshot/console/storage at this point',
      'Call run_code to inspect or manipulate state (e.g. return await I.grabText("h1"))',
      'Call continue to release the pause and let the test run the next step (or finish)',
      'Query a saved step snapshot offline: codeceptq <locator> --file <aiTraceDir>/<NNNN>_<step>_page.html',
    ],
  }
}

async function initCodecept(configPath, pluginOverrides) {
  const plugins = normalizePluginOverrides(pluginOverrides)
  const sig = pluginsSignature(plugins)

  if (containerInitialized) {
    if (!Object.keys(plugins).length || sig === currentPluginsSig) return
    await teardownContainer()
  }

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

  // aiTrace is the canonical per-step ARIA/HTML/screenshot capture for MCP.
  // Always on so run_code / continue can read the latest snapshot from disk
  // instead of double-capturing through grabAriaSnapshot etc.
  applyPluginOverrides(config, { aiTrace: { on: 'step' }, browser: { show: false }, ...plugins })

  codecept = new Codecept(config, {})
  await codecept.init(testRoot)
  await container.started()

  containerInitialized = true
  browserStarted = true
  aiTraceEnabled = config.plugins?.aiTrace?.enabled === true
  currentPluginsSig = sig
}

async function formatReturnValue(value) {
  if (value instanceof WebElement) return await value.describe()
  if (Array.isArray(value) && value.length && value.every(v => v instanceof WebElement)) {
    return await Promise.all(value.map(v => v.describe()))
  }
  return value
}

const server = new Server(
  { name: 'codeceptjs-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

const PLUGINS_PROP = {
  type: 'object',
  description: 'Plugin configs to enable for this session, keyed by plugin name. Same shape as `plugins` in codecept.conf.js — each value is the plugin\'s config object (`enabled: true` is added automatically). Common entries:\n' +
    '  • { browser: { show: true } } — visible browser (headed)\n' +
    '  • { browser: { show: false } } — headless\n' +
    '  • { browser: { browser: "firefox", windowSize: "1280x720" } } — switch browser + viewport\n' +
    '  • { pause: { on: "fail" } } / { screenshot: { on: "step" } } / { aiTrace: {} }\n' +
    'Override or add to whatever the project config already enables.',
  additionalProperties: { type: 'object' },
}

const CONFIG_PROP = {
  type: 'string',
  description: 'Path to codecept.conf.js (or .cjs). Defaults to $CODECEPTJS_CONFIG, then ./codecept.conf.js in $CODECEPTJS_PROJECT_DIR or cwd. Only needed for projects with a non-standard config location.',
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_tests',
      description: 'List all tests in the CodeceptJS project. Uses the active session if start_browser was called, otherwise auto-inits with project defaults.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'list_actions',
      description: 'List all available CodeceptJS actions (I.* methods). Uses the active session if start_browser was called, otherwise auto-inits with project defaults.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'run_code',
      description: 'Run arbitrary CodeceptJS code. Response includes `availableObjects` listing every symbol in scope (I, helpers, container, step, tryTo, within, etc.).',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          timeout: { type: 'number' },
          saveArtifacts: { type: 'boolean' },
          settleMs: { type: 'number', description: 'Wait N ms after the code finishes before capturing artifacts. Default 300. Set higher (1000+) when actions trigger slow re-renders, or 0 to skip.' },
        },
        required: ['code'],
      },
    },
    {
      name: 'run_test',
      description: 'Run a specific test. Returns reporter JSON with one entry per scenario; each entry has a `traceFile` (file:// URL) pointing to the aiTrace markdown for that scenario — Read it on failures to see the failing step\'s DOM/ARIA/screenshot. If aiTrace is disabled the response includes an `aiTraceHint`. If the test calls pause() — or if pauseAt is set and reached — returns early with status "paused" so the agent can inspect via run_code and release with continue. To learn step indices for pauseAt, call run_step_by_step first. Auto-inits with project defaults if no session is active — call start_browser first to customize launch (e.g. plugins={ browser: { show: true } } to watch the run).',
      inputSchema: {
        type: 'object',
        properties: {
          test: { type: 'string' },
          timeout: { type: 'number' },
          grep: { type: 'string', description: 'Filter scenarios by title (passed to mocha.grep). Mirrors --grep on the CLI.' },
          pauseAt: {
            description: 'Programmatic breakpoint. Either a 1-based step index (number) or a step-name match (string — substring case-insensitive, or `/regex/i` literal). Examples: 5 / "fill field" / "/grab.*url/i".',
            oneOf: [{ type: 'number' }, { type: 'string' }],
          },
          plugins: PLUGINS_PROP,
        },
        required: ['test'],
      },
    },
    {
      name: 'run_step_by_step',
      description: 'Run a test interactively, pausing after every step. Returns paused payload after the first step (URL/title/contentSize, last step info, suggestions). Call continue to advance one step (and re-pause), or run_code/snapshot to inspect state. On completion each scenario in `reporterJson.tests[]` has a `traceFile` (file:// URL) for the per-step aiTrace markdown — Read it for the full execution log. Much more useful when start_browser was called with plugins={ browser: { show: true } } so you can watch what happens between pauses.',
      inputSchema: {
        type: 'object',
        properties: {
          test: { type: 'string' },
          timeout: { type: 'number' },
          grep: { type: 'string', description: 'Filter scenarios by title (passed to mocha.grep). Mirrors --grep on the CLI.' },
          plugins: PLUGINS_PROP,
        },
        required: ['test'],
      },
    },
    {
      name: 'start_browser',
      description: 'Start the session — initializes the codeceptjs container, loads helpers, and applies any plugin overrides. This is the only tool that customizes initialization; every other tool either uses the active session or auto-inits with project defaults.\n\n' +
        'MCP enforces two plugin defaults so the agent gets useful telemetry:\n' +
        '  • aiTrace: { on: "step", enabled: true } — per-step DOM/ARIA/console/screenshot traces for debugging\n' +
        '  • browser: { show: false, enabled: true } — headless by default\n' +
        'Both can be overridden via the `plugins` arg. To watch the run live: plugins={ browser: { show: true } }. To skip per-step trace overhead on a re-run: plugins={ aiTrace: { enabled: false } } (or { on: "fail" } to only capture failures). To switch config or plugins mid-session, call stop_browser first.',
      inputSchema: {
        type: 'object',
        properties: {
          config: CONFIG_PROP,
          plugins: PLUGINS_PROP,
        },
      },
    },
    {
      name: 'stop_browser',
      description: 'Stop the session, close browsers, and tear down the container. Required before re-initing with different config or plugins.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'snapshot',
      description: 'Capture current browser state (HTML, ARIA, screenshot, console, URL) without performing any action. Returns `traceFile` (file:// URL) to a markdown trace bundling the captured artifacts — Read it for full context. Auto-inits with project defaults if no session is active.',
      inputSchema: {
        type: 'object',
        properties: {
          fullPage: { type: 'boolean' },
          settleMs: { type: 'number', description: 'Wait N ms before capturing. Default 300. Set higher when the previous action is still re-rendering, or 0 to skip.' },
        },
      },
    },
    {
      name: 'continue',
      description: 'Release a paused test (one that called pause() during run_test) and let it run to completion. Returns the final reporter result. Use run_code to inspect or manipulate state while the test is paused — both tools share the same container.',
      inputSchema: {
        type: 'object',
        properties: {
          timeout: { type: 'number' },
        },
      },
    },
    {
      name: 'cancel',
      description: 'Abort the currently paused or in-progress test run without closing the browser. Use when you want to bail out of a paused test and start something else without going through stop_browser/start_browser. The browser session and Mocha state stay alive.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'list_tests': {
        await initCodecept()

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
        await initCodecept()

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
        const { config: configPath, plugins } = args || {}
        if (browserStarted && shellSessionActive) {
          return { content: [{ type: 'text', text: JSON.stringify({ status: 'Session already active', plugins: plugins ?? null }, null, 2) }] }
        }
        await initCodecept(configPath, plugins)
        if (containerInitialized && !browserStarted) {
          for (const helper of Object.values(container.helpers() || {})) {
            try { if (helper._beforeSuite) await helper._beforeSuite() } catch {}
          }
          browserStarted = true
        }
        await startShellSession()
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'Session started — run_code and snapshot are now available', plugins: plugins ?? null }, null, 2) }] }
      }

      case 'stop_browser': {
        if (!containerInitialized) {
          return { content: [{ type: 'text', text: JSON.stringify({ status: 'Browser not initialized' }, null, 2) }] }
        }
        await closeBrowser()
        return { content: [{ type: 'text', text: JSON.stringify({ status: 'Browser stopped — Mocha and config preserved; call start_browser to reopen' }, null, 2) }] }
      }

      case 'snapshot': {
        const { fullPage = false, settleMs = 300 } = args || {}
        await initCodecept()
        await ensureSession()

        const helper = pickActingHelper(container.helpers())
        if (!helper) throw new Error('No supported acting helper available (Playwright, Puppeteer, WebDriver).')

        const dir = snapshotDirFor(outputBaseDir())
        mkdirp.sync(dir)

        if (settleMs > 0) await new Promise(r => setTimeout(r, settleMs))
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
              aiTraceHint: aiTraceHint(),
            }, null, 2),
          }],
        }
      }

      case 'continue': {
        if (!pausedController) throw new Error('No paused test. Run a test first via run_test or run_step_by_step; this tool becomes available if the test pauses.')
        const { timeout = 60000 } = args || {}
        return await withSilencedIO(async () => {
          pausedController.resolveContinue()
          if (!pendingRunPromise) {
            return { content: [{ type: 'text', text: JSON.stringify({ status: 'continued' }, null, 2) }] }
          }

          // Race: test pauses again (step-by-step or another pause()) vs test finishes.
          const pausedAgain = new Promise(resolve => pauseEvents.once('paused', () => resolve('paused')))
          const completed = pendingRunPromise.then(() => 'completed', () => 'completed')
          const which = await Promise.race([
            pausedAgain,
            completed,
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)),
          ])

          if (which === 'paused') {
            const page = await gatherPageBrief()
            return { content: [{ type: 'text', text: JSON.stringify({ ...pausedPayload(), page }, null, 2) }] }
          }

          let runError = null
          try { await pendingRunPromise } catch (err) { runError = err }
          const file = pendingTestFile
          const final = collectRunCompletion(runError?.message)
          return { content: [{ type: 'text', text: JSON.stringify({ ...final, file }, null, 2) }] }
        })
      }

      case 'cancel': {
        const cancelled = await cancelRun()
        await ensureSession()
        return { content: [{ type: 'text', text: JSON.stringify({ status: cancelled ? 'Run cancelled — browser kept open' : 'No run in progress' }, null, 2) }] }
      }

      case 'run_code': {
        const { code, timeout = 60000, saveArtifacts = true, settleMs = 300 } = args
        await initCodecept()
        await ensureSession()

        const support = container.supportObjects() || {}
        if (!support.I) throw new Error('I object not available. Make sure helpers are configured.')

        const result = { status: 'unknown', output: '', error: null, commands: [], artifacts: {} }

        const commands = []
        let lastStepValue
        const onStepAfter = step => {
          try { commands.push(step.toString()) } catch {}
        }
        const onStepPassed = (step, val) => {
          if (val !== undefined) lastStepValue = val
        }
        event.dispatcher.on(event.step.after, onStepAfter)
        event.dispatcher.on(event.step.passed, onStepPassed)

        const traceDir = traceDirFor(`mcp_${Date.now()}`, 'run_code', outputBaseDir())
        mkdirp.sync(traceDir)
        const startedAt = Date.now()

        // Pin the latest aiTrace ARIA file before running the code, so we
        // can diff after. aiTrace owns per-step capture; we just read it.
        const reader = new TraceReader(currentAiTraceDir)
        const ariaBefore = reader.last('aria')

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

        const scope = {
          locate, within, session, secret, inject, pause, share: container.share,
          tryTo, retryTo, hopeThat,
          step, element, eachElement, expectElement, expectAnyElement, expectAllElements,
          container, helpers: container.helpers(),
          ...support,
        }
        const paramNames = ['I', ...Object.keys(scope).filter(k => k !== 'I').sort()]
        const paramValues = paramNames.map(k => scope[k])

        const wasPaused = !!pausedController
        if (wasPaused) recorder.session.start('mcp_run_code')

        let returnValue
        try {
          const asyncFn = new Function(...paramNames, `return (async () => { ${code} })()`)
          returnValue = await Promise.race([
            asyncFn(...paramValues),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)),
          ])
          await recorder.promise()

          result.status = 'success'
          result.output = 'Code executed successfully'
        } catch (error) {
          result.status = 'failed'
          result.error = error.message
          result.output = error.stack || error.message
        } finally {
          for (const m of consoleMethods) console[m] = origConsoleMethods[m]
          try { event.dispatcher.removeListener(event.step.after, onStepAfter) } catch {}
          try { event.dispatcher.removeListener(event.step.passed, onStepPassed) } catch {}
          if (wasPaused) {
            try { recorder.session.restore('mcp_run_code') } catch {}
          } else {
            try { recorder.reset() } catch {}
          }
        }

        result.commands = commands
        result.logs = consoleLogs
        if (consoleLogs.length === MAX_LOG_ENTRIES) result.logsTruncated = true
        result.availableObjects = paramNames

        if (returnValue === undefined) returnValue = await Promise.resolve(lastStepValue)
        returnValue = await formatReturnValue(returnValue)

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
              if (settleMs > 0) await new Promise(r => setTimeout(r, settleMs))
              captured = await captureSnapshot(helper, { dir: traceDir, prefix: 'mcp' })
              result.artifacts = artifactsToFileUrls(captured, traceDir)
            } catch (e) {
              result.output += ` (Warning: ${e.message})`
            }
          }
        }

        // Diff against the latest aiTrace ARIA file produced by the steps
        // that just ran inside this run_code call.
        const ariaAfter = reader.last('aria')
        if (ariaBefore && ariaAfter && ariaBefore !== ariaAfter) {
          const diff = ariaDiff(ariaBefore, ariaAfter)
          if (diff) result.ariaDiff = diff
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
        result.aiTraceHint = aiTraceHint()

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }

      case 'run_test': {
        return await withLock(async () => {
          if (pausedController) {
            throw new Error('A previous run_test is still paused. Call "continue" first.')
          }
          const { test, timeout = 60000, pauseAt, grep, plugins } = args || {}
          await initCodecept(undefined, plugins)
          await endShellSession()
          applyMochaGrep(grep)

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
            const testFile = testFiles[0]

            pendingRunResults = []
            pendingTestFile = testFile
            pendingStepInfo = null
            let stepIndex = 0
            const matchPauseAt = pauseAtMatcher(pauseAt)

            const onAfter = t => {
              const aiTrace = t.artifacts?.aiTrace
              pendingRunResults.push({
                title: t.title,
                file: t.file,
                status: t.err ? 'failed' : 'passed',
                error: t.err?.message,
                duration: t.duration,
                traceFile: aiTrace ? pathToFileURL(aiTrace).href : null,
              })
            }
            const onStepAfter = step => {
              stepIndex += 1
              const idx = stepIndex
              const name = (() => { try { return step.toString() } catch { return '' } })()
              recorder.add('mcp pause info', () => {
                pendingStepInfo = { index: idx, name, status: step.status }
              })
              if (matchPauseAt(idx, name)) pauseNow()
            }
            event.dispatcher.on(event.test.after, onAfter)
            event.dispatcher.on(event.step.after, onStepAfter)
            pendingRunCleanup = () => {
              try { event.dispatcher.removeListener(event.test.after, onAfter) } catch {}
              try { event.dispatcher.removeListener(event.step.after, onStepAfter) } catch {}
              pendingRunCleanup = null
            }

            abortRun = false
            let runError = null
            const runPromise = (async () => {
              try {
                await ensureBootstrap()
                await codecept.run(testFile)
              } catch (err) {
                runError = err
                throw err
              }
            })()
            pendingRunPromise = runPromise

            const result = await waitForTestResult(runPromise, timeout)
            if (result.status === 'aborted') {
              await startShellSession()
              return { content: [{ type: 'text', text: JSON.stringify({ status: 'failed', file: testFile, error: result.error }, null, 2) }] }
            }

            if (result.status === 'paused') {
              const page = await gatherPageBrief()
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({ ...pausedPayload(), page }, null, 2),
                }],
              }
            }

            pendingRunPromise = null
            const final = collectRunCompletion(runError?.message)
            await startShellSession()
            return { content: [{ type: 'text', text: JSON.stringify({ ...final, file: testFile }, null, 2) }] }
          })
        })
      }

      case 'run_step_by_step': {
        return await withLock(async () => {
          if (pausedController) {
            throw new Error('A previous run is still paused. Call "continue" first.')
          }
          const { test, timeout = 60000, grep, plugins } = args || {}
          await initCodecept(undefined, plugins)
          await endShellSession()
          applyMochaGrep(grep)

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
            const testFile = testFiles[0]

            pendingRunResults = []
            pendingTestFile = testFile
            pendingStepInfo = null
            let stepIndex = 0

            const onAfter = t => {
              const aiTrace = t.artifacts?.aiTrace
              pendingRunResults.push({
                title: t.title,
                file: t.file,
                status: t.err ? 'failed' : 'passed',
                error: t.err?.message,
                duration: t.duration,
                traceFile: aiTrace ? pathToFileURL(aiTrace).href : null,
              })
            }
            const onStepAfter = step => {
              stepIndex += 1
              const idx = stepIndex
              const name = (() => { try { return step.toString() } catch { return '' } })()
              recorder.add('mcp pause info', () => {
                pendingStepInfo = { index: idx, name, status: step.status }
              })
              pauseNow()
            }
            event.dispatcher.on(event.test.after, onAfter)
            event.dispatcher.on(event.step.after, onStepAfter)
            pendingRunCleanup = () => {
              try { event.dispatcher.removeListener(event.test.after, onAfter) } catch {}
              try { event.dispatcher.removeListener(event.step.after, onStepAfter) } catch {}
              pendingRunCleanup = null
            }

            abortRun = false
            let runError = null
            const runPromise = (async () => {
              try {
                await ensureBootstrap()
                await codecept.run(testFile)
              } catch (err) {
                runError = err
                throw err
              }
            })()
            pendingRunPromise = runPromise

            const result = await waitForTestResult(runPromise, timeout)
            if (result.status === 'aborted') {
              await startShellSession()
              return { content: [{ type: 'text', text: JSON.stringify({ status: 'failed', file: testFile, error: result.error }, null, 2) }] }
            }

            if (result.status === 'paused') {
              const page = await gatherPageBrief()
              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify({ ...pausedPayload(), page }, null, 2),
                }],
              }
            }

            pendingRunPromise = null
            const final = collectRunCompletion(runError?.message)
            await startShellSession()
            return { content: [{ type: 'text', text: JSON.stringify({ ...final, file: testFile }, null, 2) }] }
          })
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
  installShutdownHooks()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  import('fs').then(fs => {
    const logFile = path.resolve(process.cwd(), 'mcp-server-error.log')
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${error.stack}\n`)
  })
})
