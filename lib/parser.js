function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex.default : ex
}
import * as acorn from 'acorn'
import parseFunctionModule from 'parse-function'
const parseFunction = _interopDefault(parseFunctionModule)
const parser = parseFunction({ parse: acorn.parse, ecmaVersion: 11, plugins: ['objectRestSpread'] })
import output from './output.js'
const { error } = output

parser.use(destructuredArgs)

export const getParamsToString = function (fn) {
  const newFn = fn.toString().replace(/^async/, 'async function')
  return getParams(newFn).join(', ')
}

function getParams(fn) {
  if (fn.isSinonProxy) return []
  try {
    const reflected = parser.parse(fn)
    if (reflected.args.length > 1 || reflected.args[0] === 'I') {
      error('Error: old CodeceptJS v2 format detected. Upgrade your project to the new format -> https://bit.ly/codecept3Up')
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
    error(err)
  }
}

export { getParams }

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
