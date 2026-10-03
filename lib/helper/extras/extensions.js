import fs from 'fs'
import path from 'path'
import store from '../../store.js'

const LOAD_FLAG = '--load-extension='
const EXCEPT_FLAG = '--disable-extensions-except='

export function resolveExtensions(extensions) {
  if (!extensions) return []
  const list = Array.isArray(extensions) ? extensions : [extensions]
  return list.map(ext => {
    const dir = path.resolve(store.codeceptDir || process.cwd(), ext)
    if (!fs.existsSync(path.join(dir, 'manifest.json'))) {
      throw new Error(`Can't load browser extension from "${dir}": manifest.json not found. Provide a path to an unpacked extension directory.`)
    }
    return dir
  })
}

export function extensionArgs(dirs, args = []) {
  const fromArgs = flag =>
    args
      .filter(arg => arg.startsWith(flag))
      .flatMap(arg => arg.slice(flag.length).split(','))
      .filter(Boolean)
  const load = [...new Set([...fromArgs(LOAD_FLAG), ...dirs])].join(',')
  const except = [...new Set([...fromArgs(EXCEPT_FLAG), ...dirs])].join(',')
  return [...args.filter(arg => !arg.startsWith(LOAD_FLAG) && !arg.startsWith(EXCEPT_FLAG)), `${EXCEPT_FLAG}${except}`, `${LOAD_FLAG}${load}`]
}
