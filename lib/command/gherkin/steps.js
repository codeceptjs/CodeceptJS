import { getConfig, getTestRoot } from '../utils.js'
import Codecept from '../../codecept.js'
import output from '../../output.js'
import { getSteps, clearSteps } from '../../mocha/bdd.js'

export default async function (genPath, options) {
  const configFile = options.config || genPath
  const testsPath = getTestRoot(configFile)
  const config = await getConfig(configFile)
  if (!config) return

  // Clear any previously loaded steps
  clearSteps()
  
  const codecept = new Codecept(config, {})
  await codecept.init(testsPath)

  output.print('Gherkin Step Definitions:')
  output.print()
  const steps = getSteps()
  for (const step of Object.keys(steps)) {
    output.print(`  ${output.colors.bold(step)} ${output.colors.green(steps[step].line || '')}`)
  }
  output.print()
  if (!Object.keys(steps).length) {
    output.error('No Gherkin steps defined')
  }
}
