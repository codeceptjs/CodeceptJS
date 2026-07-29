import fs from 'fs'
import fsPath from 'path'
import gherkinParser, { loadTranslations } from './gherkin.js'
import output from '../output.js'
import { resolveImportModulePath } from '../utils.js'

let reloadId = 0

export default async function loadTests(mocha, options = {}) {
  mocha.lazyLoadFiles(true)

  const featureFiles = mocha.files.filter(file => file.match(/\.feature$/))
  const testFiles = mocha.files.filter(file => !file.match(/\.feature$/))

  if (featureFiles.length > 0) {
    await loadTranslations()
    for (const file of featureFiles) {
      mocha.suite.addSuite(gherkinParser(fs.readFileSync(file, 'utf8'), file))
    }
  }

  for (const file of testFiles) {
    const resolvedPath = resolveImportModulePath(fsPath.resolve(file))
    const moduleUrl = new URL(resolvedPath)
    if (options.reload) {
      moduleUrl.searchParams.set('codeceptjsReload', String(++reloadId))
    }

    mocha.suite.emit('pre-require', global, file, mocha)
    try {
      const module = await import(moduleUrl.href)
      mocha.suite.emit('require', module, file, mocha)
    } catch (err) {
      throw enrichLoaderError(err, file)
    }
    mocha.suite.emit('post-require', global, file, mocha)
  }

  validateLoadedTests(mocha)
}

function validateLoadedTests(mocha) {
  const dupes = []
  let missingFeatureInFile = []
  const seenTests = []
  mocha.suite.eachTest(test => {
    if (!test) {
      return
    }
    const name = test.fullTitle()
    if (seenTests.includes(test.uid)) {
      dupes.push(name)
    }
    seenTests.push(test.uid)

    if (name.slice(0, name.indexOf(':')) === '') {
      missingFeatureInFile.push(test.file)
    }
  })

  if (dupes.length) {
    output.error(`Duplicate test names detected - Feature + Scenario name should be unique:\n${dupes.join('\n')}`)
  }

  if (missingFeatureInFile.length) {
    missingFeatureInFile = [...new Set(missingFeatureInFile)]
    output.error(`Missing Feature section in:\n${missingFeatureInFile.join('\n')}`)
  }
}

function enrichLoaderError(err, file) {
  if (err && err.code === 'ERR_REQUIRE_CYCLE_MODULE') {
    err.message = `${err.message}\n\nFailed to load test file as ES Module: ${file}\nAdd "type": "module" to the nearest package.json so TypeScript files are compiled as ES Modules.\nSee https://codecept.io/typescript`
  }
  return err
}
