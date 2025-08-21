import fs from 'fs'
import path from 'path'
import util from 'util'
import { mkdirp } from 'mkdirp'

import output from '../output.js'
import Config from '../config.js'
import { fileExists, beautify, deepMerge } from '../utils.js'

// alias to deep merge
export { deepMerge }

export const getConfig = async function (configFile) {
  try {
    return await Config.load(configFile)
  } catch (err) {
    fail(err.stack)
  }
}

export const getConfigSync = function (configFile) {
  try {
    return Config.loadSync(configFile)
  } catch (err) {
    fail(err.stack)
  }
}

export const readConfig = function (configFile) {
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

function fail(msg) {
  output.error(msg)
  process.exit(1)
}

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

function safeFileWrite(file, contents) {
  if (fileExists(file)) {
    output.error(`File ${file} already exist, skipping...`)
    return false
  }
  fs.writeFileSync(file, contents)
  return true
}

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

// Export functions
export { getTestRoot, fail, updateConfig, safeFileWrite }
