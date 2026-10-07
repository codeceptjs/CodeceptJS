import fs from 'fs'
import path from 'path'
import module from 'module'
import * as acorn from 'acorn'
import * as walk from 'acorn-walk'
import { globSync } from 'glob'

const EXTENSIONS = ['.js', '.ts', '.mjs', '.cjs']
const TEST_BLOCKS = ['Scenario', 'Before', 'After', 'BeforeSuite', 'AfterSuite']
const CREDENTIALS = /pass(word|wd)|(^|_)pass(_|$)|token|secret|api[\s_-]?key/i

function actorMethod(node) {
  if (node.type !== 'CallExpression') return
  if (node.callee.type !== 'MemberExpression') return
  if (node.callee.object.name !== 'I') return
  return node.callee.property.name
}

function insideTestBlock(ancestors) {
  return ancestors.some(node => {
    if (node.type !== 'CallExpression') return false
    let callee = node.callee
    if (callee.type === 'MemberExpression') callee = callee.object
    return TEST_BLOCKS.includes(callee.name)
  })
}

function insideHelper(ancestors) {
  return ancestors.some(node => node.superClass && node.superClass.name === 'Helper')
}

class Rule {
  get level() {
    return 'error'
  }
}

class NoFixedWait extends Rule {
  id = 'no-fixed-wait'

  check(node) {
    if (actorMethod(node) !== 'wait') return
    if (typeof node.arguments[0]?.value !== 'number') return
    return 'I.wait() sleeps unconditionally. Wait for a condition: I.waitForElement / I.waitForText / I.see'
  }
}

class NoSleep extends Rule {
  id = 'no-sleep'

  check(node, ancestors) {
    if (node.type !== 'CallExpression' || node.callee.name !== 'setTimeout') return
    if (insideHelper(ancestors)) return
    return 'setTimeout pauses for a fixed time. Wait for a condition: I.waitForElement / I.waitForText / I.waitForFunction'
  }
}

class NoOnly extends Rule {
  id = 'no-only'

  get level() {
    if (process.env.CI) return 'error'
    return 'warn'
  }

  check(node) {
    if (node.type !== 'MemberExpression' || node.property.name !== 'only') return
    const target = node.object.name || node.object.callee?.name
    if (!['Scenario', 'Feature', 'Data'].includes(target)) return
    return `${target}.only limits the run to focused tests. Remove it before commit`
  }
}

class NoPause extends Rule {
  id = 'no-pause'

  get level() {
    if (process.env.CI) return 'error'
    return 'warn'
  }

  check(node) {
    if (node.type !== 'CallExpression' || node.callee.name !== 'pause') return
    return 'pause() stops the test for debugging. Remove it before commit'
  }
}

class SecretCredentials extends Rule {
  id = 'secret-credentials'

  check(node) {
    const method = actorMethod(node)
    if (!method) return
    for (const arg of node.arguments) {
      const env = arg.type === 'MemberExpression' && arg.object.property?.name === 'env' && arg.property.name
      if (env && CREDENTIALS.test(env)) return `process.env.${env} is printed in logs. Wrap it: secret(process.env.${env})`
    }
    if (method !== 'fillField') return
    const [locator, value] = node.arguments
    if (typeof locator?.value !== 'string' || !CREDENTIALS.test(locator.value)) return
    if (!value || value.callee?.name === 'secret') return
    return `I.fillField('${locator.value}', ...) types a credential that is printed in logs. Wrap the value: secret(...)`
  }
}

class AwaitGrab extends Rule {
  id = 'await-grab'

  check(node, ancestors) {
    const method = actorMethod(node)
    if (!method || !method.startsWith('grab')) return
    const parent = ancestors[ancestors.length - 2]
    if (!['VariableDeclarator', 'AssignmentExpression', 'BinaryExpression', 'TemplateLiteral', 'MemberExpression'].includes(parent.type)) return
    return `I.${method}() returns a promise. Use: await I.${method}()`
  }
}

class NoActorInHelper extends Rule {
  id = 'no-actor-in-helper'

  check(node, ancestors) {
    if (node.type !== 'Identifier' || node.name !== 'I') return
    if (!insideHelper(ancestors)) return
    return 'I is not available inside a helper. Call other helpers via this.helpers[...]'
  }
}

class RawBrowserInTest extends Rule {
  id = 'raw-browser-in-test'

  get level() {
    return 'warn'
  }

  check(node, ancestors) {
    const method = actorMethod(node)
    if (!method) return
    if (method !== 'executeScript' && !/^use\w+To$/.test(method)) return
    if (!insideTestBlock(ancestors)) return
    return `I.${method} runs raw browser code in a test. Move it into a helper or page object`
  }
}

export const rules = [new NoFixedWait(), new NoSleep(), new NoOnly(), new NoPause(), new SecretCredentials(), new AwaitGrab(), new NoActorInHelper(), new RawBrowserInTest()]

export default class Linter {
  constructor(config = {}, root = process.cwd()) {
    this.config = config
    this.root = root
    this.levels = config.lint?.rules || {}
  }

  files(paths = []) {
    const files = []
    for (const pattern of paths) {
      if (fs.existsSync(pattern) && fs.statSync(pattern).isDirectory()) {
        files.push(...globSync(`${pattern}/**/*.{js,ts,mjs,cjs}`, { absolute: true, ignore: '**/node_modules/**' }))
      } else {
        files.push(...globSync(pattern, { absolute: true }))
      }
    }
    if (!paths.length) {
      for (const pattern of [].concat(this.config.tests || [])) {
        files.push(...globSync(pattern, { cwd: this.root, absolute: true }))
      }
      files.push(...this.supportFiles())
    }
    return [...new Set(files)].filter(file => EXTENSIONS.includes(path.extname(file)))
  }

  includes(file) {
    for (const pattern of [].concat(this.config.tests || [])) {
      if (path.matchesGlob(file, path.resolve(this.root, pattern))) return true
    }
    return this.supportFiles().includes(file)
  }

  supportFiles() {
    const entries = Object.values(this.config.include || {})
    for (const helper of Object.values(this.config.helpers || {})) entries.push(helper.require)
    const files = []
    for (const entry of entries) {
      if (typeof entry !== 'string' || !entry.startsWith('.')) continue
      const file = path.resolve(this.root, entry)
      for (const candidate of [file, ...EXTENSIONS.map(ext => file + ext)]) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) files.push(candidate)
      }
    }
    return files
  }

  lintFile(file) {
    return this.lint(fs.readFileSync(file, 'utf8'), file)
  }

  lint(code, file) {
    if (file.endsWith('.ts')) code = module.stripTypeScriptTypes(code)

    const comments = []
    let ast
    try {
      ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true, onComment: comments })
    } catch (err) {
      comments.length = 0
      ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true, allowReturnOutsideFunction: true, onComment: comments })
    }

    const disabled = []
    for (const comment of comments) {
      const [directive, rule] = comment.value.trim().split(/\s+/)
      if (directive === 'codeceptjs-lint-disable-line') disabled.push(`${comment.loc.start.line}:${rule}`)
      if (directive === 'codeceptjs-lint-disable-next-line') disabled.push(`${comment.loc.end.line + 1}:${rule}`)
    }

    const findings = []
    walk.fullAncestor(ast, (node, state, ancestors) => {
      for (const rule of rules) {
        const level = this.levels[rule.id] || rule.level
        if (level === 'off') continue
        const message = rule.check(node, ancestors)
        if (!message) continue
        const { line, column } = node.loc.start
        if (disabled.includes(`${line}:${rule.id}`)) continue
        findings.push({ file, line, column: column + 1, rule: rule.id, level, message, source: code.slice(node.start, node.end) })
      }
    })
    return findings.sort((a, b) => a.line - b.line || a.column - b.column)
  }
}
