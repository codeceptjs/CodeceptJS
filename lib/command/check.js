import { getConfig, getTestRoot } from './utils.js'
import Codecept from '../codecept.js'
import output from '../output.js'
import store from '../store.js'
import Container from '../container.js'
import figures from 'figures'
import chalk from 'chalk'
import { createTest } from '../mocha/test.js'
import { getMachineInfo } from './info.js'
import definitions from './definitions.js'

export default async function (options) {
  const configFile = options.config

  setTimeout(() => {
    output.error("Something went wrong. Checks didn't pass and timed out. Please check your config and helpers.")
    process.exit(1)
  }, options.timeout || 50000)

  const checks = {
    config: false,
    container: false,
    pageObjects: false,
    plugins: false,
    ai: true, // we don't need to check AI
    helpers: false,
    setup: false,
    teardown: false,
    tests: false,
    def: false,
  }

  const testRoot = getTestRoot(configFile)
  let config = await getConfig(configFile)

  try {
    config = await getConfig(configFile)
    checks['config'] = true
  } catch (err) {
    checks['config'] = err
  }

  printCheck('config', checks['config'], config.name)

  let codecept
  try {
    codecept = new Codecept(config, options)
    await codecept.init(testRoot)
    await Container.started()
    checks.container = true
  } catch (err) {
    checks.container = err
  }

  const standardActingHelpers = Container.STANDARD_ACTING_HELPERS

  printCheck('container', checks['container'])

  if (codecept) {
    try {
      if (options.bootstrap) await codecept.bootstrap()
      checks.bootstrap = true
    } catch (err) {
      checks.bootstrap = err
    }
    printCheck('bootstrap', checks['bootstrap'], options.bootstrap ? 'Bootstrap was executed' : 'No bootstrap command')
  }

  let numTests = 0
  if (codecept) {
    try {
      codecept.loadTests()
      const files = codecept.testFiles
      const mocha = Container.mocha()
      mocha.files = files
      mocha.loadFiles()

      for (const suite of mocha.suite.suites) {
        if (suite && suite.tests) {
          numTests += suite.tests.length
        }
      }

      if (numTests > 0) {
        checks.tests = true
      } else {
        throw new Error('No tests found')
      }
    } catch (err) {
      checks.tests = err
    }
  }

  if (config?.ai?.request) {
    checks.ai = true
    printCheck('ai', checks['ai'], 'Configuration is enabled, request function is set')
  } else {
    printCheck('ai', checks['ai'], 'Disabled')
  }

  printCheck('tests', checks['tests'], `Total: ${numTests} tests`)

  store.dryRun = true

  const helpers = Container.helpers()

  try {
    if (!Object.keys(helpers).length) throw new Error('No helpers found')
    // load helpers
    for (const helper of Object.values(helpers)) {
      if (helper._init) await helper._init()
    }
    checks.helpers = true
  } catch (err) {
    checks.helpers = err
  }

  printCheck('helpers', checks['helpers'], `${Object.keys(helpers).join(', ')}`)

  const pageObjects = Container.support()

  try {
    if (Object.keys(pageObjects).length) {
      for (const pageObject of Object.values(pageObjects)) {
        pageObject.name
      }
    }
    checks.pageObjects = true
  } catch (err) {
    checks.pageObjects = err
  }
  printCheck('page objects', checks['pageObjects'], `Total: ${Object.keys(pageObjects).length} support objects`)

  checks.plugins = true // how to check plugins?
  printCheck('plugins', checks['plugins'], Object.keys(Container.plugins()).join(', '))

  if (Object.keys(helpers).length) {
    store.dryRun = false
    const suite = Container.mocha().suite
    const test = createTest('test', () => {})
    checks.setup = true
    for (const helper of Object.values(helpers)) {
      try {
        if (helper._beforeSuite) await helper._beforeSuite(suite)
        if (helper._before) await helper._before(test)
      } catch (err) {
        err.message = `${helper.constructor.name} helper: ${err.message}`
        if (checks.setup instanceof Error) err.message = `${err.message}\n\n${checks.setup?.message || ''}`.trim()
        checks.setup = err
      }
    }

    printCheck('Helpers Before', checks['setup'], standardActingHelpers.some(h => Object.keys(helpers).includes(h)) ? 'Initializing browser' : '')

    checks.teardown = true
    for (const helper of Object.values(helpers).reverse()) {
      try {
        if (helper._after) await helper._after(test)
        if (helper._finishTest) await helper._finishTest(suite)
        if (helper._afterSuite) await helper._afterSuite(suite)
      } catch (err) {
        err.message = `${helper.constructor.name} helper: ${err.message}`
        if (checks.teardown instanceof Error) err.message = `${err.message}\n\n${checks.teardown?.message || ''}`.trim()
        checks.teardown = err
      }
    }

    printCheck('Helpers After', checks['teardown'], standardActingHelpers.some(h => Object.keys(helpers).includes(h)) ? 'Closing browser' : '')
    store.dryRun = true
  }

  try {
    definitions(configFile, { dryRun: true })
    checks.def = true
  } catch (err) {
    checks.def = err
  }

  printCheck('TypeScript Definitions', checks['def'])

  output.print('')

  if (!Object.values(checks).every(check => check === true)) {
    output.error("Something went wrong. Checks didn't pass.")
    output.print()
    await getMachineInfo()
    process.exit(1)
  }

  output.print(output.styles.success('All checks passed'.toUpperCase()), 'Ready to run your tests 🚀')
  process.exit(0)
}

function printCheck(name, value, comment = '') {
  let status = ''
  if (value == true) {
    status += chalk.bold.green(figures.tick)
  } else {
    status += chalk.bold.red(figures.cross)
  }

  if (value instanceof Error) {
    comment = `${comment} ${chalk.red(value.message)}`.trim()
  }

  output.print(status, name.toUpperCase(), chalk.dim(comment))
}
