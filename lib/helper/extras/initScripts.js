import fs from 'fs'
import path from 'path'
import store from '../../store.js'

export function resolveInitScripts(scripts) {
  if (!scripts) return []
  const list = Array.isArray(scripts) ? scripts : [scripts]
  return list.map(script => {
    if (typeof script === 'function') return `(${script.toString()})();`
    if (typeof script !== 'string') {
      throw new Error(`Invalid init script: expected a path to a JavaScript file or a function, got ${typeof script}`)
    }
    const file = path.resolve(store.codeceptDir || process.cwd(), script)
    if (!fs.existsSync(file)) throw new Error(`Init script "${file}" not found`)
    return fs.readFileSync(file, 'utf8')
  })
}
