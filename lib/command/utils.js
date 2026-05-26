import fs from 'fs'
import path from 'path'
import util from 'util'
import { mkdirp } from 'mkdirp'

import output from '../output.js'
import { fileExists, beautify, deepMerge } from '../utils.js'

// alias to deep merge
export { deepMerge }

export async function getConfig(configFile) {
  try {
    const configModule = await import('../config.js')
    const config = configModule.default || configModule
    return await config.load(configFile)
  } catch (err) {
    fail(err.stack)
  }
}

export function readConfig(configFile) {
  try {
    const data = fs.readFileSync(configFile, 'utf8')
    return data
  } catch (err) {
    output.error(err)
  }
}

function getTestRoot(currentPath) {
  if (!currentPath) currentPath = '.'
  if (!path.isAbsolute(currentPath)) currentPath = path.join(process.cwd(), currentPath)
  currentPath = fs.lstatSync(currentPath).isDirectory() || !path.extname(currentPath) ? currentPath : path.dirname(currentPath)
  return currentPath
}
export { getTestRoot }

function fail(msg) {
  output.error(msg)
  process.exit(1)
}

export { fail }

function updateConfig(testsPath, config, extension) {
  const configFile = path.join(testsPath, `codecept.conf.${extension}`)
  if (!fileExists(configFile)) {
    const msg = `codecept.conf.${extension} config can\'t be updated automatically`
    console.log()
    console.log(`${output.colors.bold.red(msg)}`)
    console.log(`${output.colors.bold.red('Please update it manually:')}`)
    console.log()
    console.log(config)
    console.log()
    return
  }
  console.log(`${output.colors.yellow('Updating configuration file...')}`)
  return fs.writeFileSync(configFile, beautify(`exports.config = ${util.inspect(config, false, 4, false)}`), 'utf-8')
}

export { updateConfig }

function safeFileWrite(file, contents) {
  if (fileExists(file)) {
    output.error(`File ${file} already exist, skipping...`)
    return false
  }
  fs.writeFileSync(file, contents)
  return true
}

export { safeFileWrite }

export const captureStream = stream => {
  let oldStream
  let buffer = ''

  return {
    startCapture() {
      buffer = ''
      oldStream = stream.write.bind(stream)
      stream.write = chunk => (buffer += chunk)
    },
    stopCapture() {
      if (oldStream !== undefined) stream.write = oldStream
    },
    getData: () => buffer,
  }
}

export const printError = err => {
  output.print('')
  output.error(err.message)
  output.print('')
  output.print(output.colors.grey(err.stack.replace(err.message, '')))
}

export const createOutputDir = (config, testRoot) => {
  let outputDir
  if (path.isAbsolute(config.output)) outputDir = config.output
  else outputDir = path.join(testRoot, config.output)

  if (!fileExists(outputDir)) {
    output.print(`creating output directory: ${outputDir}`)
    mkdirp.sync(outputDir)
  }
}

export async function autoExit() {
  const timeout = parseInt(process.env.CODECEPT_AUTO_EXIT_TIMEOUT, 10)
  if (timeout === 0) return
  const exitTimeout = timeout || 2000

  const { default: container } = await import('../container.js')
  const helpers = container.helpers()
  if (!helpers || !Object.values(helpers).some(h => typeof h._cleanup === 'function')) return

  const { default: recorder } = await import('../recorder.js')
  await Promise.race([recorder.promise(), new Promise(resolve => setTimeout(resolve, exitTimeout))])
  process.exit(process.exitCode || 0)
}

export const findConfigFile = testsPath => {
  const extensions = ['js', 'ts']
  for (const ext of extensions) {
    const configFile = path.join(testsPath, `codecept.conf.${ext}`)
    if (fileExists(configFile)) {
      return configFile
    }
  }
  return null
}
