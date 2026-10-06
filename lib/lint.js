import fs from 'fs'
import path from 'path'
import module from 'module'
import * as acorn from 'acorn'
import * as walk from 'acorn-walk'
import { globSync } from 'glob'

export const LINT_EXTENSIONS = ['.js', '.ts', '.mjs', '.cjs']

const TEST_BLOCKS = new Set(['Scenario', 'Before', 'After', 'BeforeSuite', 'AfterSuite', 'Background'])
const CREDENTIAL_WORDS = /pass(word|wd)|token|secret|api[\s_-]?key/i
const CREDENTIAL_ENV = /pass(word|wd)|(^|_)pass($|_)|token|secret|api_?key/i
const RAW_BROWSER_METHOD = /^use[A-Z]\w*To$/
const PROMISE_COMBINATORS = new Set(['all', 'allSettled', 'race', 'any'])

const isCI = () => !!process.env.CI

function isIdentifier(node, name) {
  return node?.type === 'Identifier' && (name === undefined || node.name === name)
}

function propertyName(member) {
  if (member?.type !== 'MemberExpression') return null
  if (!member.computed && member.property.type === 'Identifier') return member.property.name
  if (member.computed && member.property.type === 'Literal' && typeof member.property.value === 'string') return member.property.value
  return null
}

function actorMethod(node) {
  if (node?.type !== 'CallExpression') return null
  const callee = node.callee
  if (callee.type !== 'MemberExpression' || !isIdentifier(callee.object, 'I')) return null
  return propertyName(callee)
}

function isFunction(node) {
  return node?.type === 'FunctionExpression' || node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionDeclaration'
}

function isDataCall(node) {
  return node?.type === 'CallExpression' && isIdentifier(node.callee, 'Data')
}

function testBlockName(callee) {
  if (callee.type === 'Identifier' && TEST_BLOCKS.has(callee.name)) return callee.name
  if (callee.type !== 'MemberExpression') return null
  const prop = propertyName(callee)
  if (isIdentifier(callee.object, 'Scenario') && ['only', 'skip', 'todo'].includes(prop)) return 'Scenario'
  if (prop === 'Scenario') {
    const obj = callee.object
    if (isDataCall(obj)) return 'Scenario'
    if (obj.type === 'MemberExpression' && isDataCall(obj.object)) return 'Scenario'
  }
  return null
}

function enclosingTestBlock(ancestors) {
  for (let i = ancestors.length - 2; i >= 0; i--) {
    const node = ancestors[i]
    if (node.type !== 'CallExpression' || !isFunction(ancestors[i + 1])) continue
    if (!node.arguments.includes(ancestors[i + 1])) continue
    const name = testBlockName(node.callee)
    if (name) return name
  }
  return null
}

function isHelperClass(node) {
  if (node.type !== 'ClassDeclaration' && node.type !== 'ClassExpression') return false
  const sup = node.superClass
  if (!sup) return false
  return isIdentifier(sup, 'Helper') || propertyName(sup) === 'Helper'
}

function insideHelperClass(ancestors) {
  return ancestors.some(isHelperClass)
}

function insideMethod(ancestors) {
  for (let i = ancestors.length - 2; i > 0; i--) {
    const node = ancestors[i]
    if (!isFunction(node)) continue
    const parent = ancestors[i - 1]
    if (parent.type === 'MethodDefinition') return true
    if (parent.type === 'Property' && parent.value === node) return true
    if (parent.type === 'PropertyDefinition' && parent.value === node) return true
  }
  return false
}

function isSecretCall(node) {
  return node?.type === 'CallExpression' && isIdentifier(node.callee, 'secret')
}

function stringValue(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') return node.value
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked
  return null
}

function envName(node) {
  if (node?.type !== 'MemberExpression') return null
  const obj = node.object
  if (obj.type !== 'MemberExpression' || !isIdentifier(obj.object, 'process') || propertyName(obj) !== 'env') return null
  return propertyName(node)
}

function isPromiseCombinator(node) {
  return node?.type === 'CallExpression' && node.callee.type === 'MemberExpression' && isIdentifier(node.callee.object, 'Promise') && PROMISE_COMBINATORS.has(propertyName(node.callee))
}

function grabResultUsed(ancestors) {
  let i = ancestors.length - 1
  let child = ancestors[i]
  let parent = ancestors[i - 1]
  while (parent && parent.type === 'ChainExpression') {
    child = parent
    parent = ancestors[--i - 1]
  }
  if (!parent) return false
  switch (parent.type) {
    case 'AwaitExpression':
    case 'ExpressionStatement':
    case 'YieldExpression':
    case 'SequenceExpression':
      return false
    case 'MemberExpression':
      return parent.object !== child
    case 'ArrayExpression':
      return !isPromiseCombinator(ancestors[i - 2])
    case 'ArrowFunctionExpression':
      return parent.body === child
    case 'UnaryExpression':
      return parent.operator !== 'void'
    default:
      return true
  }
}

function usesCodeceptGlobals(ast) {
  let found = false
  walk.full(ast, node => {
    if (found) return
    if (node.type === 'CallExpression' && (isIdentifier(node.callee, 'inject') || isIdentifier(node.callee, 'actor') || isIdentifier(node.callee, 'Feature') || testBlockName(node.callee))) found = true
  })
  return found
}

export const rules = [
  {
    id: 'no-fixed-wait',
    level: 'error',
    check(node, ancestors, ctx) {
      if (actorMethod(node) !== 'wait') return
      const arg = node.arguments[0]
      if (arg?.type !== 'Literal' || typeof arg.value !== 'number') return
      ctx.report(node, `${ctx.source(node)} sleeps unconditionally. Wait for a condition: I.waitForElement / I.waitForText / I.see`)
    },
  },
  {
    id: 'no-sleep',
    level: 'error',
    check(node, ancestors, ctx) {
      if (node.type !== 'CallExpression' || !isIdentifier(node.callee, 'setTimeout')) return
      if (insideHelperClass(ancestors)) return
      const inTest = enclosingTestBlock(ancestors)
      if (!inTest && !(ctx.codeceptFile && insideMethod(ancestors))) return
      ctx.report(node, 'setTimeout pauses for a fixed time. Wait for a condition: I.waitForElement / I.waitForText / I.waitForFunction')
    },
  },
  {
    id: 'no-only',
    level: () => (isCI() ? 'error' : 'warn'),
    check(node, ancestors, ctx) {
      if (node.type !== 'MemberExpression' || propertyName(node) !== 'only') return
      const obj = node.object
      if (!isIdentifier(obj, 'Scenario') && !isIdentifier(obj, 'Feature') && !isDataCall(obj)) return
      const name = isDataCall(obj) ? 'Data(...).only' : `${obj.name}.only`
      ctx.report(node, `${name} limits the run to the focused tests. Remove .only before commit`)
    },
  },
  {
    id: 'no-pause',
    level: () => (isCI() ? 'error' : 'warn'),
    check(node, ancestors, ctx) {
      if (node.type !== 'CallExpression' || !isIdentifier(node.callee, 'pause')) return
      ctx.report(node, 'pause() stops the test for interactive debugging. Remove it before commit')
    },
  },
  {
    id: 'secret-credentials',
    level: 'error',
    check(node, ancestors, ctx) {
      const method = actorMethod(node)
      if (!method) return
      let envReported = false
      for (const arg of node.arguments) {
        const name = envName(arg)
        if (name && CREDENTIAL_ENV.test(name)) {
          envReported = true
          ctx.report(arg, `process.env.${name} is passed to I.${method} in plain text and will be printed in logs. Wrap it: secret(process.env.${name})`)
        }
      }
      if (method !== 'fillField' || envReported) return
      const [locator, value] = node.arguments
      const text = stringValue(locator)
      if (!text || !CREDENTIAL_WORDS.test(text) || !value || isSecretCall(value)) return
      ctx.report(node, `I.fillField('${text}', ...) types a credential in plain text and it will be printed in logs. Wrap the value: secret(...)`)
    },
  },
  {
    id: 'await-grab',
    level: 'error',
    check(node, ancestors, ctx) {
      const method = actorMethod(node)
      if (!method || !method.startsWith('grab')) return
      if (!grabResultUsed(ancestors)) return
      ctx.report(node, `I.${method}() returns a promise. Use: await I.${method}(...)`)
    },
  },
  {
    id: 'no-actor-in-helper',
    level: 'error',
    check(node, ancestors, ctx) {
      const isActorRef =
        (node.type === 'Identifier' && node.name === 'I') || (node.type === 'MemberExpression' && propertyName(node) === 'I' && node.object.type === 'CallExpression' && isIdentifier(node.object.callee, 'inject'))
      if (!isActorRef || !insideHelperClass(ancestors)) return
      ctx.report(node, 'The I actor is not available inside a helper. Call other helpers via this.helpers[...]')
    },
  },
  {
    id: 'raw-browser-in-test',
    level: 'warn',
    check(node, ancestors, ctx) {
      const method = actorMethod(node)
      if (!method || !(RAW_BROWSER_METHOD.test(method) || method === 'executeScript')) return
      if (enclosingTestBlock(ancestors) !== 'Scenario') return
      ctx.report(node, `I.${method} runs raw browser code inside a test. Move it into a helper or page object`)
    },
  },
]

export const ruleIds = rules.map(r => r.id)

function withoutNodeWarnings(fn) {
  const original = process.emitWarning
  process.emitWarning = (warning, ...args) => {
    const type = (typeof args[0] === 'string' ? args[0] : args[0]?.type) || warning?.name
    if (type === 'ExperimentalWarning' || type === 'DeprecationWarning') return
    return original.call(process, warning, ...args)
  }
  try {
    return fn()
  } finally {
    process.emitWarning = original
  }
}

let typescriptModule
async function loadTypeScript() {
  if (typescriptModule !== undefined) return typescriptModule
  try {
    const mod = await import('typescript')
    typescriptModule = mod.default || mod
  } catch {
    typescriptModule = null
  }
  return typescriptModule
}

export async function toJavaScript(code, file) {
  if (path.extname(file) !== '.ts') return { code }
  if (typeof module.stripTypeScriptTypes === 'function') {
    try {
      return { code: withoutNodeWarnings(() => module.stripTypeScriptTypes(code, { mode: 'strip' })) }
    } catch {}
  }
  const ts = await loadTypeScript()
  if (!ts) return { skipped: 'TypeScript file skipped: type stripping is not supported by this Node.js version and the "typescript" package is not installed' }
  const result = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, removeComments: false, sourceMap: true },
    fileName: file,
  })
  return { code: result.outputText, position: sourcePosition(result.sourceMapText) }
}

function sourcePosition(sourceMapText) {
  if (!sourceMapText || typeof module.SourceMap !== 'function') return null
  const map = new module.SourceMap(JSON.parse(sourceMapText))
  return ({ line, column }) => {
    const entry = map.findEntry(line - 1, column)
    if (typeof entry?.originalLine !== 'number') return { line, column }
    return { line: entry.originalLine + 1, column: entry.originalColumn }
  }
}

export function parse(code) {
  const options = { ecmaVersion: 'latest', locations: true, allowHashBang: true }
  let comments = []
  try {
    const ast = acorn.parse(code, { ...options, sourceType: 'module', onComment: comments })
    return { ast, comments }
  } catch (err) {
    comments = []
    try {
      const ast = acorn.parse(code, { ...options, sourceType: 'script', allowReturnOutsideFunction: true, onComment: comments })
      return { ast, comments }
    } catch {
      throw err
    }
  }
}

function suppressions(comments, position) {
  const lineOf = loc => (position ? position(loc).line : loc.line)
  const byLine = new Map()
  const add = (line, ids) => {
    if (!byLine.has(line)) byLine.set(line, new Set())
    ids.forEach(id => byLine.get(line).add(id))
  }
  for (const comment of comments) {
    const [directive, ...rest] = comment.value.trim().split(/[\s,]+/)
    const ids = rest.filter(Boolean)
    if (!ids.length) continue
    if (directive === 'codeceptjs-lint-disable-line') add(lineOf(comment.loc.start), ids)
    if (directive === 'codeceptjs-lint-disable-next-line') add(lineOf(comment.loc.end) + 1, ids)
  }
  return byLine
}

function resolveLevel(rule, overrides) {
  const configured = overrides?.[rule.id]
  if (configured !== undefined) {
    if (configured === false || configured === 'off' || configured === 0) return 'off'
    if (configured === 'warn' || configured === 'warning' || configured === 1) return 'warn'
    if (configured === 'error' || configured === true || configured === 2) return 'error'
  }
  return typeof rule.level === 'function' ? rule.level() : rule.level
}

export function normalizeSource(text) {
  return text.replace(/\s+/g, ' ').trim()
}

export async function lintSource(code, file = 'file.js', options = {}) {
  const js = await toJavaScript(code, file)
  if (js.skipped) return { file, findings: [], skipped: js.skipped }

  const { ast, comments } = parse(js.code)
  const suppressed = suppressions(comments, js.position)
  const active = rules.map(rule => ({ rule, level: resolveLevel(rule, options.rules) })).filter(r => r.level !== 'off')
  const findings = []
  const seen = new Set()

  const ctx = {
    codeceptFile: usesCodeceptGlobals(ast),
    source: node => normalizeSource(js.code.slice(node.start, node.end)),
  }

  walk.fullAncestor(ast, (node, state, ancestors) => {
    for (const { rule, level } of active) {
      rule.check(node, ancestors, {
        ...ctx,
        report(target, message) {
          const { line, column } = js.position ? js.position(target.loc.start) : target.loc.start
          const key = `${rule.id}:${target.start}`
          if (seen.has(key)) return
          seen.add(key)
          if (suppressed.get(line)?.has(rule.id)) return
          findings.push({ file, line, column: column + 1, rule: rule.id, level, message, source: ctx.source(target) })
        },
      })
    }
  })

  findings.sort((a, b) => a.line - b.line || a.column - b.column)
  return { file, findings }
}

export async function lintFile(file, options = {}) {
  const code = fs.readFileSync(file, 'utf8')
  return lintSource(code, file, options)
}

function isLintable(file) {
  return LINT_EXTENSIONS.includes(path.extname(file))
}

function localFile(entry, root) {
  if (typeof entry !== 'string') return null
  if (!entry.startsWith('.') && !path.isAbsolute(entry)) return null
  const resolved = path.resolve(root, entry)
  const candidates = [resolved, ...LINT_EXTENSIONS.map(ext => resolved + ext)]
  return candidates.find(f => fs.existsSync(f) && fs.statSync(f).isFile()) || null
}

function expandPath(entry) {
  const resolved = path.resolve(entry)
  if (fs.existsSync(resolved)) {
    if (fs.statSync(resolved).isDirectory()) {
      return globSync(`**/*{${LINT_EXTENSIONS.join(',')}}`, { cwd: resolved, absolute: true, ignore: ['**/node_modules/**'] })
    }
    return [resolved]
  }
  return globSync(entry, { absolute: true, ignore: ['**/node_modules/**'] })
}

export function collectFiles(config = {}, root = process.cwd(), paths = []) {
  let files = []
  if (paths.length) {
    for (const entry of paths) files.push(...expandPath(entry))
  } else {
    const tests = [].concat(config.tests || [])
    for (const pattern of tests) {
      files.push(...globSync(pattern, { cwd: root, absolute: true, ignore: ['**/node_modules/**'] }))
    }
    for (const entry of Object.values(config.include || {})) {
      const file = localFile(entry, root)
      if (file) files.push(file)
    }
    for (const helper of Object.values(config.helpers || {})) {
      const file = localFile(helper?.require, root)
      if (file) files.push(file)
    }
  }
  files = [...new Set(files.map(f => path.resolve(f)))].filter(isLintable)
  return files.filter(f => !isIgnored(f, config, root))
}

export function isIgnored(file, config = {}, root = process.cwd()) {
  const ignore = [].concat(config.lint?.ignore || [])
  if (!ignore.length) return false
  const target = path.resolve(file)
  return withoutNodeWarnings(() => ignore.some(pattern => path.matchesGlob(target, path.resolve(root, pattern))))
}

export function lintOptions(config = {}) {
  return { rules: config.lint?.rules || {} }
}

export function findingKey(finding) {
  return `${finding.rule}\u0000${finding.source}`
}

export function newErrors(before, after) {
  const counts = new Map()
  for (const f of before) {
    if (f.level !== 'error') continue
    counts.set(findingKey(f), (counts.get(findingKey(f)) || 0) + 1)
  }
  const added = []
  for (const f of after) {
    if (f.level !== 'error') continue
    const key = findingKey(f)
    const left = counts.get(key) || 0
    if (left > 0) counts.set(key, left - 1)
    else added.push(f)
  }
  return added
}
