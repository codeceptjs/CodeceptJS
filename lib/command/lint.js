import fs from 'fs'
import path from 'path'
import output from '../output.js'
import Config from '../config.js'
import { captureStream } from './utils.js'
import { LINT_EXTENSIONS, collectFiles, isIgnored, lintFile, lintOptions, lintSource, newErrors } from '../lint.js'

const HOOK_AGENTS = ['claude']
const CONFIG_NAMES = ['codecept.config.js', 'codecept.conf.js', 'codecept.js', 'codecept.config.cjs', 'codecept.conf.cjs', 'codecept.config.ts', 'codecept.conf.ts']

function findConfig(dir) {
  return CONFIG_NAMES.map(name => path.join(dir, name)).find(f => fs.existsSync(f)) || null
}

async function loadConfig(configPath, dir) {
  const file = configPath ? path.resolve(configPath) : findConfig(dir)
  if (!file) return { config: null, root: dir }
  const root = fs.existsSync(file) && fs.statSync(file).isDirectory() ? file : path.dirname(file)
  return { config: await Config.load(file), root }
}

function relative(file) {
  const rel = path.relative(process.cwd(), file)
  return rel.startsWith('..') ? file : rel
}

function formatFinding(f, colors = true) {
  const level = f.level === 'error' ? 'error' : 'warn '
  const levelText = colors ? (f.level === 'error' ? output.colors.red(level) : output.colors.yellow(level)) : level
  const location = `${relative(f.file)}:${f.line}:${f.column}`
  return `${colors ? output.colors.bold(location) : location}  ${levelText}  ${colors ? output.colors.grey(f.rule) : f.rule}  ${f.message}`
}

export default async function lint(paths = [], options = {}) {
  if (options.hook) return runHookCommand(options)

  let loaded
  try {
    loaded = await loadConfig(options.config, process.cwd())
  } catch (err) {
    output.error(`Can't load config: ${err.message}`)
    process.exitCode = 2
    return
  }
  const { config, root } = loaded
  if (!config && !paths.length) {
    output.error('No codecept config found. Pass files to lint or use -c to point to a config')
    process.exitCode = 2
    return
  }

  const files = collectFiles(config || {}, root, paths)
  const opts = lintOptions(config || {})
  const findings = []
  const failures = []
  const skipped = []

  for (const file of files) {
    try {
      const result = await lintFile(file, opts)
      if (result.skipped) skipped.push({ file, reason: result.skipped })
      findings.push(...result.findings)
    } catch (err) {
      failures.push({ file, message: err.message })
    }
  }

  const errors = findings.filter(f => f.level === 'error').length
  const warnings = findings.length - errors

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ files: files.length, errors, warnings, findings, failures, skipped }, null, 2)}\n`)
  } else {
    for (const f of findings) output.print(formatFinding(f))
    for (const s of skipped) output.print(`${output.colors.bold(relative(s.file))}  ${output.colors.yellow('skip ')}  ${s.reason}`)
    for (const e of failures) output.print(`${output.colors.bold(relative(e.file))}  ${output.colors.red('parse')}  ${e.message}`)
    const summary = `${files.length} file(s) checked, ${errors} error(s), ${warnings} warning(s)`
    output.print(errors || failures.length ? output.colors.red(summary) : output.colors.green(summary))
  }

  if (failures.length || (!files.length && paths.length)) process.exitCode = 2
  else if (errors) process.exitCode = 1
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', chunk => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

function applyEdit(content, oldString, newString, replaceAll) {
  if (typeof oldString !== 'string' || typeof newString !== 'string') return null
  if (oldString === '') return content === '' ? newString : null
  if (!content.includes(oldString)) return null
  return replaceAll ? content.split(oldString).join(newString) : content.replace(oldString, () => newString)
}

function resultingContent(toolName, input, current) {
  if (toolName === 'Write') return typeof input.content === 'string' ? input.content : null
  if (toolName === 'Edit') return applyEdit(current, input.old_string, input.new_string, input.replace_all)
  if (toolName === 'MultiEdit') {
    let content = current
    for (const edit of input.edits || []) {
      content = applyEdit(content, edit.old_string, edit.new_string, edit.replace_all)
      if (content === null) return null
    }
    return content
  }
  return null
}

export async function runHook(payload, { agent = 'claude', config: configPath } = {}) {
  const allow = { code: 0, stderr: '' }
  if (!HOOK_AGENTS.includes(agent)) return { code: 0, stderr: `codeceptjs lint: unsupported hook agent "${agent}", supported: ${HOOK_AGENTS.join(', ')}\n` }
  if (!payload || typeof payload !== 'object') return allow

  const toolName = payload.tool_name
  const input = payload.tool_input || {}
  if (!['Write', 'Edit', 'MultiEdit'].includes(toolName) || typeof input.file_path !== 'string') return allow

  const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd())
  const file = path.resolve(payload.cwd || projectDir, input.file_path)
  const rel = path.relative(projectDir, file)
  if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).includes('node_modules')) return allow
  if (!LINT_EXTENSIONS.includes(path.extname(file))) return allow

  let config = {}
  let root = projectDir
  const stdout = captureStream(process.stdout)
  stdout.startCapture()
  try {
    const loaded = await loadConfig(configPath, projectDir)
    if (loaded.config) {
      config = loaded.config
      root = loaded.root
    }
  } catch {
    config = {}
  } finally {
    stdout.stopCapture()
  }
  if (isIgnored(file, config, root)) return allow

  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
  const after = resultingContent(toolName, input, current)
  if (after === null) return allow

  const opts = lintOptions(config)
  let afterResult
  try {
    afterResult = await lintSource(after, file, opts)
  } catch (err) {
    return { code: 0, stderr: `codeceptjs lint: ${relative(file)} could not be parsed after this edit (${err.message})\n` }
  }
  if (afterResult.skipped) return allow

  let beforeFindings = []
  if (current) {
    try {
      beforeFindings = (await lintSource(current, file, opts)).findings
    } catch {
      beforeFindings = []
    }
  }

  const added = newErrors(beforeFindings, afterResult.findings)
  if (!added.length) return allow

  const lines = added.map(f => formatFinding(f, false))
  return {
    code: 2,
    stderr: `codeceptjs lint blocked this edit, ${added.length} new error(s):\n${lines.join('\n')}\nFix the code and retry.\n`,
  }
}

async function runHookCommand(options) {
  let result = { code: 0, stderr: '' }
  try {
    const raw = await readStdin()
    let payload = null
    try {
      payload = JSON.parse(raw)
    } catch {
      payload = null
    }
    result = await runHook(payload, { agent: options.hook, config: options.config })
  } catch (err) {
    result = { code: 0, stderr: `codeceptjs lint: hook failed (${err.message})\n` }
  }
  process.exitCode = result.code
  process.stderr.write(result.stderr, () => process.exit(result.code))
}
