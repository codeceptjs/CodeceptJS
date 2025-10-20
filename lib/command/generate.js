const colors = require('chalk')
const fs = require('fs')
const inquirer = require('inquirer')
const mkdirp = require('mkdirp')
const path = require('path')
const { fileExists, ucfirst, lcfirst, beautify } = require('../utils')
const output = require('../output')
const generateDefinitions = require('./definitions')
const { getConfig, getTestRoot, safeFileWrite, readConfig } = require('./utils')

let extension = 'js'

const testTemplate = `Feature('{{feature}}');

Scenario('test something', async ({ {{actor}} }) => {

});
`

// generates empty test
module.exports.test = function (genPath) {
  const testsPath = getTestRoot(genPath)
  global.codecept_dir = testsPath
  const config = getConfig(testsPath)
  if (!config) return

  output.print('Creating a new test...')
  output.print('----------------------')

  const defaultExt = config.tests.match(/([^\*/]*?)$/)[1] || `_test.${extension}`

  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'feature',
        message: 'Feature which is being tested (ex: account, login, etc)',
        validate: val => !!val,
      },
      {
        type: 'input',
        message: 'Filename of a test',
        name: 'filename',
        default(answers) {
          return answers.feature.replace(' ', '_') + defaultExt
        },
      },
    ])
    .then(result => {
      const testFilePath = path.dirname(path.join(testsPath, config.tests)).replace(/\*\*$/, '')
      let testFile = path.join(testFilePath, result.filename)
      const ext = path.extname(testFile)
      if (!ext) testFile += defaultExt
      const dir = path.dirname(testFile)
      if (!fileExists(dir)) mkdirp.sync(dir)
      let testContent = testTemplate.replace('{{feature}}', result.feature)

      const container = require('../container')
      container.create(config, {})
      // translate scenario test
      if (container.translation().loaded) {
        const vocabulary = container.translation().vocabulary
        testContent = testContent.replace('{{actor}}', container.translation().I)
        if (vocabulary.contexts.Feature) testContent = testContent.replace('Feature', vocabulary.contexts.Feature)
        if (vocabulary.contexts.Scenario) testContent = testContent.replace('Scenario', vocabulary.contexts.Scenario)
        output.print(`Test was created in ${colors.bold(config.translation)} localization. See: https://codecept.io/translation/`)
      } else {
        testContent = testContent.replace('{{actor}}', 'I')
      }
      if (!config.fullPromiseBased) testContent = testContent.replace('async', '')

      if (!safeFileWrite(testFile, testContent)) return
      output.success(`\nTest for ${result.filename} was created in ${testFile}`)
    })
}

const pageObjectTemplate = `const { I } = inject();

module.exports = {

  // insert your locators and methods here
}
`

const poModuleTemplateTS = `const { I } = inject();

export = {

  // insert your locators and methods here
}
`

const poClassTemplate = `const { I } = inject();

class {{name}} {
  constructor() {
    //insert your locators
    // this.button = '#button'
  }
  // insert your methods here
}

// For inheritance
module.exports = new {{name}}();
export = {{name}};
`

module.exports.pageObject = function (genPath, opts) {
  const testsPath = getTestRoot(genPath)
  const config = getConfig(testsPath)
  const kind = opts.T || 'page'
  if (!config) return

  let configFile = path.join(testsPath, `codecept.conf.${extension}`)

  if (!fileExists(configFile)) {
    extension = 'ts'
    configFile = path.join(testsPath, `codecept.conf.${extension}`)
  }
  output.print(`Creating a new ${kind} object`)
  output.print('--------------------------')

  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: `Name of a ${kind} object`,
        validate: val => !!val,
      },
      {
        type: 'input',
        name: 'filename',
        message: 'Where should it be stored',
        default: answers => `./${kind}s/${answers.name}.${extension}`,
      },
      {
        type: 'list',
        name: 'objectType',
        message: 'What is your preferred object type',
        choices: ['module', 'class'],
        default: 'module',
      },
    ])
    .then(result => {
      const pageObjectFile = path.join(testsPath, result.filename)
      const dir = path.dirname(pageObjectFile)
      if (!fileExists(dir)) fs.mkdirSync(dir)

      let actor = 'actor'

      if (config.include.I) {
        let actorPath = config.include.I
        if (actorPath.charAt(0) === '.') {
          // relative path
          actorPath = path.relative(dir, path.dirname(path.join(testsPath, actorPath))) + actorPath.substring(1) // get an upper level
        }
        actor = `require('${actorPath}')`
      }

      const name = lcfirst(result.name) + ucfirst(kind)
      if (result.objectType === 'module' && extension === 'ts') {
        if (!safeFileWrite(pageObjectFile, poModuleTemplateTS.replace('{{actor}}', actor))) return
      } else if (result.objectType === 'module' && extension === 'js') {
        if (!safeFileWrite(pageObjectFile, pageObjectTemplate.replace('{{actor}}', actor))) return
      } else if (result.objectType === 'class') {
        const content = poClassTemplate.replace(/{{actor}}/g, actor).replace(/{{name}}/g, name)
        if (!safeFileWrite(pageObjectFile, content)) return
      }

      let data = readConfig(configFile)
      config.include[name] = result.filename

      if (!data) throw Error('Config file is empty')
      const currentInclude = `${data.match(/include:[\s\S][^\}]*/i)[0]}\n ${name}:${JSON.stringify(config.include[name])}`

      data = data.replace(/include:[\s\S][^\}]*/i, `${currentInclude},`)

      fs.writeFileSync(configFile, beautify(data), 'utf-8')

      output.success(`${ucfirst(kind)} object for ${result.name} was created in ${pageObjectFile}`)
      output.print(`Your config file (${colors.cyan('include')} section) has included the new created PO:

    include: {
    ...
      ${name}: '${result.filename}',
    },`)

      output.print(`Use ${output.colors.bold(colors.cyan(name))} as parameter in test scenarios to access this object:`)
      output.print(`\nScenario('my new test', ({ I, ${name} })) { /** ... */ }\n`)

      try {
        generateDefinitions(testsPath, {})
      } catch (_err) {
        output.print(`Run ${colors.green('npx codeceptjs def')} to update your types to get auto-completion for object.`)
      }
    })
}

const helperTemplate = `const Helper = require('@codeceptjs/helper');

class {{name}} extends Helper {

  // before/after hooks
  /**
   * @protected
   */
  _before() {
    // remove if not used
  }

  /**
   * @protected
   */
  _after() {
    // remove if not used
  }

  // add custom methods here
  // If you need to access other helpers
  // use: this.helpers['helperName']

}

module.exports = {{name}};
`

module.exports.helper = function (genPath) {
  const testsPath = getTestRoot(genPath)

  output.print('Creating a new helper')
  output.print('--------------------------')

  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Name of a Helper',
        validate: val => !!val,
      },
      {
        type: 'input',
        name: 'filename',
        message: 'Where should it be stored',
        default: answers => `./${answers.name.toLowerCase()}_helper.${extension}`,
      },
    ])
    .then(result => {
      const name = ucfirst(result.name)
      const helperFile = path.join(testsPath, result.filename)
      const dir = path.dirname(helperFile)
      if (!fileExists(dir)) fs.mkdirSync(dir)

      if (!safeFileWrite(helperFile, helperTemplate.replace(/{{name}}/g, name))) return
      output.success(`Helper for ${name} was created in ${helperFile}`)
      output.print(`Update your config file (add to ${colors.cyan('helpers')} section):

helpers: {
  ${name}: {
    require: '${result.filename}',
  },
},
    `)
    })
}

const healTemplate = fs.readFileSync(path.join(__dirname, '../template/heal.js'), 'utf8').toString()

module.exports.heal = function (genPath) {
  const testsPath = getTestRoot(genPath)

  let configFile = path.join(testsPath, `codecept.conf.${extension}`)

  if (!fileExists(configFile)) {
    configFile = path.join(testsPath, `codecept.conf.${extension}`)
    if (fileExists(configFile)) extension = 'ts'
  }

  output.print('Creating basic heal recipes')
  output.print(`Add your own custom recipes to ./heal.${extension} file`)
  output.print('Require this file in the config file and enable heal plugin:')
  output.print('--------------------------')
  output.print(`
require('./heal')

exports.config = {
  // ... 
  plugins: {
    heal: {
      enabled: true
    }
  }
}
  `)

  const healFile = path.join(testsPath, `heal.${extension}`)
  if (!safeFileWrite(healFile, healTemplate)) return
  output.success(`Heal recipes were created in ${healFile}`)
}
