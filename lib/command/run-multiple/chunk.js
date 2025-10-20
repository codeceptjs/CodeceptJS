const { globSync } = require('glob')
const path = require('path')
const fs = require('fs')

/**
 * Splits a list to (n) parts, defined via the size argument.
 */
const splitFiles = (list, size) => {
  const sets = []
  const chunks = list.length / size
  let i = 0

  while (i < chunks) {
    sets[i] = list.splice(0, size)
    i++
  }

  return sets
}

/**
 * Executes a glob pattern and pushes the results to a list.
 */
const findFiles = pattern => {
  const files = []

  globSync(pattern).forEach(file => {
    files.push(path.resolve(file))
  })

  return files
}

/**
 * Joins a list of files to a valid glob pattern
 */
const flattenFiles = list => {
  const pattern = list.join(',')
  return pattern.indexOf(',') > -1 ? `{${pattern}}` : pattern
}

/**
 * Greps a file by its content, checks if Scenario or Feature text'
 * matches the grep text.
 */
const grepFile = (file, grep) => {
  const contents = fs.readFileSync(file, 'utf8')
  const pattern = new RegExp(`((Scenario|Feature)\(.*${grep}.*\))`, 'g') // <- How future proof/solid is this?
  return !!pattern.exec(contents)
}

const mapFileFormats = files => {
  return {
    gherkin: files.filter(file => file.match(/\.feature$/)),
    js: files.filter(file => file.match(/\.t|js$/)),
  }
}

/**
 * Creates a list of chunks incl. configuration by either dividing a list of scenario
 * files by the passed number or executing a usder deifned function to perform
 * the splitting.
 */
const createChunks = (config, patterns = []) => {
  const files = patterns
    .filter(pattern => !!pattern)
    .map(pattern => {
      return findFiles(pattern).filter(file => {
        return config.grep ? grepFile(file, config.grep) : true
      })
    })
    .reduce((acc, val) => acc.concat(val), [])

  let chunks = []
  if (typeof config.chunks === 'function') {
    chunks = config.chunks.call(this, files)
  } else if (typeof config.chunks === 'number' || typeof config.chunks === 'string') {
    chunks = splitFiles(files, Math.ceil(files.length / config.chunks))
  } else {
    throw new Error('chunks is neither a finite number or a valid function')
  }

  const chunkConfig = { ...config }
  delete chunkConfig.chunks

  return chunks.map(chunkFiles => {
    const { js, gherkin } = mapFileFormats(chunkFiles)
    return { ...chunkConfig, tests: flattenFiles(js), gherkin: { features: flattenFiles(gherkin) } }
  })
}

module.exports = {
  createChunks,
}
