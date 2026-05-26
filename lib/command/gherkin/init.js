import path from 'path'
import { mkdirp } from 'mkdirp'

import output from '../../output.js'
import { fileExists } from '../../utils.js'
import { getConfig, getTestRoot, updateConfig, safeFileWrite, findConfigFile } from '../utils.js'

const featureFile = `Feature: Business rules
  In order to achieve my goals
  As a persona
  I want to be able to interact with a system

  Scenario: do something
    Given I have a defined step
`

const stepsFile = `const { I } = inject();
// Add in your custom step files

Given('I have a defined step', () => {
  // TODO: replace with your own step
});
`

export default async function (genPath) {
  const testsPath = getTestRoot(genPath)
  const configFile = findConfigFile(testsPath)

  if (!configFile) {
    output.error("Can't initialize Gherkin. This command must be run in an already initialized project.")
    process.exit(1)
  }

  const config = await getConfig(testsPath)
  const extension = path.extname(configFile).substring(1)

  output.print('Initializing Gherkin (Cucumber BDD) for CodeceptJS')
  output.print('--------------------------')

  if (config.gherkin && config.gherkin.steps) {
    output.error('Gherkin is already initialized in this project. See `gherkin` section in the config')
    process.exit(1)
  }

  let dir
  dir = path.join(testsPath, 'features')
  if (!fileExists(dir)) {
    mkdirp.sync(dir)
    // Use relative path for output
    const relativeDir = path.relative(process.cwd(), dir)
    output.success(`Created ${relativeDir}, place your *.feature files in it`)
  }

  if (safeFileWrite(path.join(dir, 'basic.feature'), featureFile)) {
    output.success('Created sample feature file: features/basic.feature')
  }

  dir = path.join(testsPath, 'step_definitions')
  if (!fileExists(dir)) {
    mkdirp.sync(dir)
    // Use relative path for output
    const relativeDir = path.relative(process.cwd(), dir)
    output.success(`Created ${relativeDir}, place step definitions into it`)
  }

  if (safeFileWrite(path.join(dir, `steps.${extension}`), stepsFile)) {
    output.success(`Created sample steps file: step_definitions/steps.${extension}`)
  }

  config.gherkin = {
    features: './features/*.feature',
    steps: [`./step_definitions/steps.${extension}`],
  }

  updateConfig(testsPath, config, extension)

  output.success('Gherkin setup is done.')
  output.success('Start writing feature files and implement corresponding steps.')
}
