import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as acorn from 'acorn'
import { getConfig, getTestRoot } from './utils.js'
import Codecept from '../codecept.js'
import container from '../container.js'
import { getParamsToString } from '../parser.js'
import { methodsOfObject } from '../utils.js'
import output from '../output.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const helperDir = path.resolve(__dirname, '..', 'helper')
const webapiDir = path.resolve(__dirname, '..', '..', 'docs', 'webapi')

let partialsCache = null

function loadWebApiPartials() {
  if (partialsCache) return partialsCache
  const map = new Map()
  if (fs.existsSync(webapiDir)) {
    for (const file of fs.readdirSync(webapiDir)) {
      if (path.extname(file) !== '.mustache') continue
      const name = path.basename(file, '.mustache')
      map.set(name, fs.readFileSync(path.join(webapiDir, file), 'utf8'))
    }
  }
  partialsCache = map
  return map
}

function resolveHelperSource(helper, helperName, config, testsPath) {
  const builtin = path.join(helperDir, `${helper.constructor.name}.js`)
  if (fs.existsSync(builtin)) return builtin
  const requirePath = config?.helpers?.[helperName]?.require
  if (requirePath) {
    const resolved = path.isAbsolute(requirePath) ? requirePath : path.resolve(testsPath, requirePath)
    if (fs.existsSync(resolved)) return resolved
  }
  return null
}

function findClassNode(ast) {
  for (const node of ast.body) {
    if (node.type === 'ClassDeclaration') return node
    if (node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'ClassDeclaration') return node.declaration
    if (node.type === 'ExportDefaultDeclaration' && node.declaration?.type === 'ClassDeclaration') return node.declaration
  }
  return null
}

function stripJsDoc(value) {
  return value
    .split('\n')
    .map(line => line.replace(/^\s*\* ?/, ''))
    .join('\n')
    .trim()
}

function resolvePartials(text, partials) {
  return text.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (match, name) => {
    return partials.has(name) ? partials.get(name) : match
  })
}

function extractMethodDocs(helper, helperName, config, testsPath, partials) {
  const result = new Map()
  const sourceFile = resolveHelperSource(helper, helperName, config, testsPath)
  if (!sourceFile) return result

  let source
  try {
    source = fs.readFileSync(sourceFile, 'utf8')
  } catch {
    return result
  }

  const comments = []
  let ast
  try {
    ast = acorn.parse(source, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
      onComment: comments,
    })
  } catch {
    return result
  }

  const classNode = findClassNode(ast)
  if (!classNode) return result

  const blockComments = comments
    .filter(c => c.type === 'Block' && c.value.startsWith('*'))
    .sort((a, b) => a.start - b.start)

  let cursor = 0
  for (const member of classNode.body.body) {
    if (member.type !== 'MethodDefinition') continue
    if (member.kind === 'constructor' || member.static) continue
    const name = member.key?.name
    if (!name || name.startsWith('_')) continue

    let attached = null
    let attachedIdx = -1
    for (let i = cursor; i < blockComments.length; i++) {
      const c = blockComments[i]
      if (c.end > member.start) break
      attached = c
      attachedIdx = i
    }
    if (attached) {
      cursor = attachedIdx + 1
      const stripped = stripJsDoc(attached.value)
      const resolved = resolvePartials(stripped, partials)
      result.set(name, resolved)
    }
  }

  return result
}

function printDocBlock(doc) {
  if (!doc) return
  for (const line of doc.split('\n')) {
    output.print(`    ${line}`)
  }
  output.print('')
}

export default async function (path, options = {}) {
  const configFile = options.config
  const testsPath = getTestRoot(configFile || path)
  const config = await getConfig(configFile || testsPath)
  const codecept = new Codecept(config, {})
  await codecept.init(testsPath)
  await container.started()

  const filter = options.action ? options.action.replace(/^I\./, '') : null
  const showDocs = !!(options.docs || filter)
  const partials = showDocs ? loadWebApiPartials() : null

  if (!filter) output.print('List of test actions: -- ')
  const helpers = container.helpers()
  const supportI = container.support('I')
  const actions = []
  let matched = false
  for (const name in helpers) {
    const helper = helpers[name]
    const docs = showDocs ? extractMethodDocs(helper, name, config, testsPath, partials) : null
    methodsOfObject(helper).forEach(action => {
      actions[action] = 1
      if (filter && action !== filter) return
      const params = getParamsToString(helper[action])
      output.print(` ${output.colors.grey(name)} I.${output.colors.bold(action)}(${params})`)
      if (docs && docs.has(action)) printDocBlock(docs.get(action))
      matched = true
    })
  }
  for (const name in supportI) {
    if (actions[name]) continue
    if (filter && name !== filter) continue
    const actor = supportI[name]
    const params = getParamsToString(actor)
    output.print(` I.${output.colors.bold(name)}(${params})`)
    matched = true
  }
  if (filter && !matched) {
    output.print(`No action named ${output.colors.bold(filter)} found in enabled helpers or support objects.`)
    return
  }
  if (!filter) {
    output.print('PS: Actions are retrieved from enabled helpers. ')
    output.print('Implement custom actions in your helper classes.')
  }
}
