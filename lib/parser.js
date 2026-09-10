function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex.default : ex
}
import * as acorn from 'acorn'
import parseFunctionModule from 'parse-function'
const parseFunction = _interopDefault(parseFunctionModule)
const ecmaVersion = 11
const parser = parseFunction({ parse: acorn.parse, ecmaVersion, plugins: ['objectRestSpread'] })
import output from './output.js'

parser.use(destructuredArgs)

export const getParamsToString = function (fn) {
  const newFn = fn.toString().replace(/^async/, 'async function')
  return getParams(newFn).join(', ')
}

function getParams(fn, { warnOnLegacyFormat = false } = {}) {
  if (fn.isSinonProxy) return []
  try {
    const reflected = parser.parse(normalizeArrowFn(fn))
    if (warnOnLegacyFormat && (reflected.args.length > 1 || reflected.args[0] === 'I')) {
      output.error('Error: old CodeceptJS v2 format detected. Upgrade your project to the new format -> https://bit.ly/codecept3Up')
    }
    if (reflected.destructuredArgs.length > 0) reflected.args = [...reflected.destructuredArgs]
    const params = reflected.args.map(p => {
      const def = reflected.defaults[p]
      if (def) {
        return `${p}=${def}`
      }
      return p
    })
    return params
  } catch (err) {
    console.log(`Error in ${fn.toString()}`)
    output.error(err)
  }
}

export { getParams }

function normalizeArrowFn(fn) {
  const code = (typeof fn === 'function' ? fn.toString() : String(fn)).trim()
  if (!code.includes('=>') || code.startsWith('async')) return fn
  try {
    if (acorn.parseExpressionAt(code, 0, { ecmaVersion }).type !== 'ArrowFunctionExpression') return fn
  } catch {
    return fn
  }
  return `async ${code}`
}

function destructuredArgs() {
  return (node, result) => {
    result.destructuredArgs = result.destructuredArgs || []

    if (node.type === 'ObjectExpression' && node.properties.length > 0) {
      node.properties.forEach(prop => {
        if (prop.value && prop.value.params.length > 0) {
          result.destructuredArgs = parseDestructuredArgs(prop.value)
        }
      })

      return result
    }

    if (!Array.isArray(node.params)) return result
    result.destructuredArgs = parseDestructuredArgs(node)

    return result
  }
}

function parseDestructuredArgs(node) {
  const destructuredArgs = []
  node.params.forEach(param => {
    if (param.type === 'ObjectPattern' && param.properties && param.properties.length > 0) {
      param.properties.forEach(prop => {
        const { name } = prop.value
        destructuredArgs.push(name)
      })
    }
  })

  return destructuredArgs
}
