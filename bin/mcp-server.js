import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import Codecept from '../lib/codecept.js'
import container from '../lib/container.js'
import { getParamsToString } from '../lib/parser.js'
import { methodsOfObject } from '../lib/utils.js'
import event from '../lib/event.js'
import { fileURLToPath } from 'url'
import { dirname, resolve as resolvePath } from 'path'
import path from 'path'
import crypto from 'crypto'
import { spawn } from 'child_process'
import { createRequire } from 'module'
import { existsSync, readdirSync } from 'fs'

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

function clearString(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_')
}

function getTraceDir(testTitle, testFile) {
  const hash = crypto.createHash('sha256').update(testFile + testTitle).digest('hex').slice(0, 8)
  const cleanTitle = clearString(testTitle).slice(0, 200)
  const outputDir = global.output_dir || resolvePath(process.cwd(), 'output')
  return resolvePath(outputDir, `trace_${cleanTitle}_${hash}`)
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
      description: 'Run a specific test.',
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

      case 'run_code': {
        const { code, timeout = 60000, config: configPath, saveArtifacts = true } = args
        await initCodecept(configPath)

        const I = container.support('I')
        if (!I) throw new Error('I object not available. Make sure helpers are configured.')

        const result = { status: 'unknown', output: '', error: null, artifacts: {} }

        try {
          const asyncFn = new Function('I', `return (async () => { ${code} })()`)
          await Promise.race([
            asyncFn(I),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)),
          ])

          result.status = 'success'
          result.output = 'Code executed successfully'

          if (saveArtifacts) {
            const helpers = container.helpers()
            const helper = Object.values(helpers)[0]
            if (helper) {
              try {
                if (helper.grabAriaSnapshot) result.artifacts.aria = await helper.grabAriaSnapshot()
                if (helper.grabCurrentUrl) result.artifacts.url = await helper.grabCurrentUrl()
                if (helper.grabBrowserLogs) result.artifacts.consoleLogs = (await helper.grabBrowserLogs()) || []
                if (helper.grabSource) {
                  const html = await helper.grabSource()
                  result.artifacts.html = html.substring(0, 10000) + '...'
                }
              } catch (e) {
                result.output += ` (Warning: ${e.message})`
              }
            }
          }
        } catch (error) {
          result.status = 'failed'
          result.error = error.message
          result.output = error.stack || error.message
        }

        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      }

      case 'run_test': {
        return await withLock(async () => {
          const { test, timeout = 60000, config: configPathArg } = args || {}
          const { configPath, configDir } = resolveConfigPath(configPathArg)

          const { cli, root } = findCodeceptCliUpwards(configDir)
          const isNodeScript = cli.endsWith('.js')

          const resolvedFile = await resolveTestToFile({ cli, root, configPath, test })
          const runArgs = ['run', '--config', configPath, '--reporter', 'json']

          if (resolvedFile) runArgs.push(resolvedFile)
          else if (looksLikePath(test)) runArgs.push(test)
          else runArgs.push('--grep', String(test))

          const res = isNodeScript
            ? await runCmd(process.execPath, [cli, ...runArgs], { cwd: root, timeout })
            : await runCmd(cli, runArgs, { cwd: root, timeout })

          const { code, out, err } = res

          let parsed = null
          const jsonStart = out.indexOf('{')
          const jsonEnd = out.lastIndexOf('}')
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            try { parsed = JSON.parse(out.slice(jsonStart, jsonEnd + 1)) } catch {}
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                meta: { exitCode: code, cli, root, configPath, args: runArgs, resolvedFile: resolvedFile || null },
                reporterJson: parsed,
                stderr: err ? err.slice(0, 20000) : '',
                rawStdout: parsed ? '' : out.slice(0, 20000),
              }, null, 2),
            }],
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
          let currentTestTitle = null
          const testFile = testFiles[0]

          const onBefore = (t) => {
            const traceDir = getTraceDir(t.title, t.file)
            currentTestTitle = t.title
            currentSteps[t.title] = []
            results.push({
              test: t.title,
              file: t.file,
              traceFile: `file://${resolvePath(traceDir, 'trace.md')}`,
              status: 'running',
              steps: [],
            })
          }

          const onAfter = (t) => {
            const r = results.find(x => x.test === t.title)
            if (r) {
              r.status = t.err ? 'failed' : 'completed'
              if (t.err) r.error = t.err.message
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
