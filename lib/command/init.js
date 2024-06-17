const colors = require('chalk')
const fs = require('fs')
const inquirer = require('inquirer')
const mkdirp = require('mkdirp')
const path = require('path')
const { inspect } = require('util')
const spawn = require('cross-spawn')

const { print, success, error } = require('../output')
const { fileExists, beautify, installedLocally } = require('../utils')
const { getTestRoot } = require('./utils')
const generateDefinitions = require('./definitions')
const { test: generateTest } = require('./generate')
const isLocal = require('../utils').installedLocally()

const defaultConfig = {
  tests: './*_test.js',
  output: '',
  helpers: {},
  include: {},
}

const helpers = ['Playwright', 'WebDriver', 'Puppeteer', 'REST', 'GraphQL', 'Appium', 'TestCafe']
const translations = Object.keys(require('../../translations'))

const noTranslation = 'English (no localization)'
translations.unshift(noTranslation)

const packages = []
let isTypeScript = false
let extension = 'js'

const requireCodeceptConfigure = "const { setHeadlessWhen, setCommonPlugins } = require('@codeceptjs/configure');"
const importCodeceptConfigure = "import { setHeadlessWhen, setCommonPlugins } from '@codeceptjs/configure';"

const configHeader = `
// turn on headless mode when running with HEADLESS=true environment variable
// export HEADLESS=true && npx codeceptjs run
setHeadlessWhen(process.env.HEADLESS);

// enable all common plugins https://github.com/codeceptjs/configure#setcommonplugins
setCommonPlugins();

`

const defaultActor = `// in this file you can append custom step methods to 'I' object

module.exports = function() {
  return actor({

    // Define custom steps here, use 'this' to access default methods of I.
    // It is recommended to place a general 'login' function here.

  });
}
`

const defaultActorTs = `// in this file you can append custom step methods to 'I' object

export = function() {
  return actor({

    // Define custom steps here, use 'this' to access default methods of I.
    // It is recommended to place a general 'login' function here.

  });
}
`

module.exports = function (initPath) {
  const testsPath = getTestRoot(initPath)

  print()
  print(`  Welcome to ${colors.magenta.bold('CodeceptJS')} initialization tool`)
  print('  It will prepare and configure a test environment for you')
  print()
  print(' Useful links:')
  print()
  print('  👉 How to start testing ASAP: https://codecept.io/quickstart/#init')
  print('  👉 How to select helper: https://codecept.io/basics/#architecture')
  print('  👉 TypeScript setup: https://codecept.io/typescript/#getting-started')
  print()

  if (!path) {
    print('No test root specified.')
    print(`Test root is assumed to be ${colors.yellow.bold(testsPath)}`)
    print('----------------------------------')
  } else {
    print(`Installing to ${colors.bold(testsPath)}`)
  }

  if (!fileExists(testsPath)) {
    print(`Directory ${testsPath} does not exist, creating...`)
    mkdirp.sync(testsPath)
  }

  const configFile = path.join(testsPath, 'codecept.conf.js')
  if (fileExists(configFile)) {
    error(`Config is already created at ${configFile}`)
    return
  }

  const typeScriptconfigFile = path.join(testsPath, 'codecept.conf.ts')
  if (fileExists(typeScriptconfigFile)) {
    error(`Config is already created at ${typeScriptconfigFile}`)
    return
  }

  inquirer
    .prompt([
      {
        name: 'typescript',
        type: 'confirm',
        default: false,
        message: 'Do you plan to write tests in TypeScript?',
      },
      {
        name: 'tests',
        type: 'input',
        default: (answers) => `./*_test.${answers.typescript ? 'ts' : 'js'}`,
        message: 'Where are your tests located?',
      },
      {
        name: 'helper',
        type: 'list',
        choices: helpers,
        default: 'Playwright',
        message: 'What helpers do you want to use?',
      },
      {
        name: 'jsonResponse',
        type: 'confirm',
        default: true,
        message: 'Do you want to use JSONResponse helper for assertions on JSON responses? http://bit.ly/3ASVPy9',
        when: (answers) => ['GraphQL', 'REST'].includes(answers.helper) === true,
      },
      {
        name: 'output',
        default: './output',
        message: 'Where should logs, screenshots, and reports to be stored?',
      },
      {
        name: 'translation',
        type: 'list',
        message: 'Do you want to enable localization for tests? http://bit.ly/3GNUBbh',
        choices: translations,
      },
    ])
    .then((result) => {
      if (result.typescript === true) {
        isTypeScript = true
        extension = isTypeScript === true ? 'ts' : 'js'
        packages.push('typescript')
        packages.push('ts-node')
        packages.push('@types/node')
      }

      const config = defaultConfig
      config.name = testsPath.split(path.sep).pop()
      config.output = result.output

      config.tests = result.tests
      if (isTypeScript) {
        config.tests = `${config.tests.replace(/\.js$/, `.${extension}`)}`
      }

      // create a directory tests if it is included in tests path
      const matchResults = config.tests.match(/[^*.]+/)
      if (matchResults) {
        mkdirp.sync(path.join(testsPath, matchResults[0]))
      }

      if (result.translation !== noTranslation) config.translation = result.translation

      const helperName = result.helper
      config.helpers[helperName] = {}

      if (result.jsonResponse === true) {
        config.helpers.JSONResponse = {}
      }

      let helperConfigs = []

      try {
        const Helper = require(`../helper/${helperName}`)
        if (Helper._checkRequirements) {
          packages.concat(Helper._checkRequirements())
        }

        if (!Helper._config()) return
        helperConfigs = helperConfigs.concat(
          Helper._config().map((config) => {
            config.message = `[${helperName}] ${config.message}`
            config.name = `${helperName}_${config.name}`
            config.type = config.type || 'input'
            return config
          }),
        )
      } catch (err) {
        error(err)
      }

      const finish = async () => {
        // create steps file by default
        // no extra step file for typescript (as it doesn't match TS conventions)
        const stepFile = `./steps_file.${extension}`
        fs.writeFileSync(path.join(testsPath, stepFile), extension === 'ts' ? defaultActorTs : defaultActor)

        if (isTypeScript) {
          config.include = _actorTranslation('./steps_file', config.translation)
        } else {
          config.include = _actorTranslation(stepFile, config.translation)
        }

        print(`Steps file created at ${stepFile}`)

        let configSource
        const hasConfigure = isLocal && !initPath

        if (isTypeScript) {
          configSource = beautify(`export const config : CodeceptJS.MainConfig = ${inspect(config, false, 4, false)}`)

          if (hasConfigure) configSource = importCodeceptConfigure + configHeader + configSource

          fs.writeFileSync(typeScriptconfigFile, configSource, 'utf-8')
          print(`Config created at ${typeScriptconfigFile}`)
        } else {
          configSource = beautify(
            `/** @type {CodeceptJS.MainConfig} */\nexports.config = ${inspect(config, false, 4, false)}`,
          )

          if (hasConfigure) configSource = requireCodeceptConfigure + configHeader + configSource

          fs.writeFileSync(configFile, configSource, 'utf-8')
          print(`Config created at ${configFile}`)
        }

        if (config.output) {
          if (!fileExists(config.output)) {
            mkdirp.sync(path.join(testsPath, config.output))
            print(`Directory for temporary output files created at '${config.output}'`)
          } else {
            print(`Directory for temporary output files is already created at '${config.output}'`)
          }
        }

        const jsconfig = {
          compilerOptions: {
            allowJs: true,
          },
        }

        const tsconfig = {
          'ts-node': {
            files: true,
          },
          compilerOptions: {
            target: 'es2018',
            lib: ['es2018', 'DOM'],
            esModuleInterop: true,
            module: 'commonjs',
            strictNullChecks: false,
            types: ['codeceptjs', 'node'],
            declaration: true,
            skipLibCheck: true,
          },
          exclude: ['node_modules'],
        }

        if (isTypeScript) {
          const tsconfigJson = beautify(JSON.stringify(tsconfig))
          const tsconfigFile = path.join(testsPath, 'tsconfig.json')
          if (fileExists(tsconfigFile)) {
            print(`tsconfig.json already exists at ${tsconfigFile}`)
          } else {
            fs.writeFileSync(tsconfigFile, tsconfigJson)
          }
        } else {
          const jsconfigJson = beautify(JSON.stringify(jsconfig))
          const jsconfigFile = path.join(testsPath, 'jsconfig.json')
          if (fileExists(jsconfigFile)) {
            print(`jsconfig.json already exists at ${jsconfigFile}`)
          } else {
            fs.writeFileSync(jsconfigFile, jsconfigJson)
            print(`Intellisense enabled in ${jsconfigFile}`)
          }
        }

        const generateDefinitionsManually = colors.bold(
          `To get auto-completion support, please generate type definitions: ${colors.green('npx codeceptjs def')}`,
        )

        if (packages) {
          try {
            install(packages)
          } catch (err) {
            print(colors.bold.red(err.toString()))
            print()
            print(colors.bold.red('Please install next packages manually:'))
            print(`npm i ${packages.join(' ')} --save-dev`)
            print()
            print('Things to do after missing packages installed:')
            print('☑', generateDefinitionsManually)
            print('☑ Create first test:', colors.green('npx codeceptjs gt'))
            print(colors.bold.magenta('Find more information at https://codecept.io'))
            return
          }
        }

        try {
          generateDefinitions(testsPath, {})
        } catch (err) {
          print(colors.bold.red("Couldn't generate type definitions"))
          print(colors.red(err.toString()))
          print('Skipping type definitions...')
          print(generateDefinitionsManually)
        }

        print('')
        success(' Almost ready... Next step:')

        const generatedTest = generateTest(testsPath)
        if (!generatedTest) return
        generatedTest.then(() => {
          print('\n--')
          print(colors.bold.green('CodeceptJS Installed! Enjoy supercharged testing! 🤩'))
          print(colors.bold.magenta('Find more information at https://codecept.io'))
          print()
        })
      }

      print('Configure helpers...')
      inquirer.prompt(helperConfigs).then(async (helperResult) => {
        if (helperResult.Playwright_browser === 'electron') {
          delete helperResult.Playwright_url
          delete helperResult.Playwright_show

          helperResult.Playwright_electron = {
            executablePath: '// require("electron") or require("electron-forge")',
            args: ['path/to/your/main.js'],
          }
        }

        Object.keys(helperResult).forEach((key) => {
          const parts = key.split('_')
          const helperName = parts[0]
          const configName = parts[1]
          if (!configName) return
          config.helpers[helperName][configName] = helperResult[key]
        })

        print('')
        await finish()
      })
    })
}

function install(dependencies) {
  let command
  let args

  if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    dependencies.push('codeceptjs')
    throw new Error("Error: 'package.json' file not found. Generate it with 'npm init -y' command.")
  }

  if (!installedLocally()) {
    console.log('CodeceptJS should be installed locally')
    dependencies.push('codeceptjs')
  }

  console.log('Installing packages: ', colors.green(dependencies.join(', ')))

  if (fileExists('yarn.lock')) {
    command = 'yarnpkg'
    args = ['add', '-D', '--exact']
    ;[].push.apply(args, dependencies)

    args.push('--cwd')
    args.push(process.cwd())
  } else {
    command = 'npm'
    args = ['install', '--save-dev', '--loglevel', 'error'].concat(dependencies)
  }

  if (process.env._INIT_DRY_RUN_INSTALL) {
    args.push('--dry-run')
  }

  const { status } = spawn.sync(command, args, { stdio: 'inherit' })
  if (status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`)
  }
  return true
}

function _actorTranslation(stepFile, translationSelected) {
  let actor

  for (const translationAvailable of translations) {
    if (actor) {
      break
    }

    if (translationSelected === translationAvailable) {
      const nameOfActor = require('../../translations')[translationAvailable].I

      actor = {
        [nameOfActor]: stepFile,
      }
    }
  }

  if (!actor) {
    actor = {
      I: stepFile,
    }
  }

  return actor
}
