const fs = require('fs')
const path = require('path')
const util = require('util')
const mkdirp = require('mkdirp')

const output = require('../output')
const { fileExists, beautify } = require('../utils')

// alias to deep merge
module.exports.deepMerge = require('../utils').deepMerge

module.exports.getConfig = function (configFile) {
  try {
    return require('../config').load(configFile)
  } catch (err) {
    fail(err.stack)
  }
}

module.exports.readConfig = function (configFile) {
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
  currentPath =
    fs.lstatSync(currentPath).isDirectory() || !path.extname(currentPath) ? currentPath : path.dirname(currentPath)
  return currentPath
}
module.exports.getTestRoot = getTestRoot

function fail(msg) {
  output.error(msg)
  process.exit(1)
}

module.exports.fail = fail

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

module.exports.updateConfig = updateConfig

function safeFileWrite(file, contents) {
  if (fileExists(file)) {
    output.error(`File ${file} already exist, skipping...`)
    return false
  }
  fs.writeFileSync(file, contents)
  return true
}

module.exports.safeFileWrite = safeFileWrite

module.exports.captureStream = (stream) => {
  let oldStream
  let buffer = ''

  return {
    startCapture() {
      buffer = ''
      oldStream = stream.write.bind(stream)
      stream.write = (chunk) => (buffer += chunk)
    },
    stopCapture() {
      if (oldStream !== undefined) stream.write = oldStream
    },
    getData: () => buffer,
  }
}

module.exports.printError = (err) => {
  output.print('')
  output.error(err.message)
  output.print('')
  output.print(output.colors.grey(err.stack.replace(err.message, '')))
}

module.exports.createOutputDir = (config, testRoot) => {
  let outputDir
  if (path.isAbsolute(config.output)) outputDir = config.output
  else outputDir = path.join(testRoot, config.output)

  if (!fileExists(outputDir)) {
    output.print(`creating output directory: ${outputDir}`)
    mkdirp.sync(outputDir)
  }
}

module.exports.findConfigFile = (testsPath) => {
  const extensions = ['js', 'ts']
  for (const ext of extensions) {
    const configFile = path.join(testsPath, `codecept.conf.${ext}`)
    if (fileExists(configFile)) {
      return configFile
    }
  }
  return null
}
