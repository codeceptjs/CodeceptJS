/**
 * Global variables initialization module
 *
 * Centralizes all global variable setup for CodeceptJS from codecept.js and mocha/ui.js
 */

import fsPath from 'path'
import ActorFactory from './actor.js'
import output from './output.js'
import locator from './locator.js'
import store from './store.js'

/**
 * Initialize CodeceptJS core globals
 * Called from Codecept.initGlobals()
 */
export async function initCodeceptGlobals(dir, config, container) {
  store.initialize({
    codeceptDir: dir,
    outputDir: fsPath.resolve(dir, config.output),
  })

  store.noGlobals = config.noGlobals || false
  store.maskSensitiveData = config.maskSensitiveData || false

  // Keep globals for backward compat with external plugins
  global.codecept_dir = dir
  global.output_dir = fsPath.resolve(dir, config.output)

  // pause/inject/share stay global even under noGlobals — they're the everyday
  // debugging/wiring entry points and have no useful import alternative for
  // page-object code that runs before the container is available.
  global.pause = async (...args) => {
    const pauseModule = await import('./pause.js')
    return (pauseModule.default || pauseModule)(...args)
  }
  global.inject = () => container.support()
  global.share = container.share

  if (config.noGlobals) return;

  output.print(output.styles.debug('Global functions are deprecated. Use `import { Helper, within, session } from "codeceptjs"` instead. Set `noGlobals: true` in config to disable globals.'));

  const HelperModule = await import('@codeceptjs/helper')
  global.Helper = global.codecept_helper = HelperModule.default || HelperModule

  // Set up actor global - will use container when available
  global.actor = global.codecept_actor = (obj) => {
    return ActorFactory(obj, container)
  }
  global.Actor = global.actor

  global.within = async (...args) => {
    return (await import('./effects.js')).within(...args)
  }

  global.session = async (...args) => {
    const sessionModule = await import('./session.js')
    return (sessionModule.default || sessionModule)(...args)
  }

  const dataTableModule = await import('./data/table.js')
  global.DataTable = dataTableModule.default || dataTableModule

  global.locate = locatorQuery => {
    return locator.build(locatorQuery)
  }

  const secretModule = await import('./secret.js')
  global.secret = secretModule.secret || (secretModule.default && secretModule.default.secret)

  const codeceptjsModule = await import('./index.js') // load all objects
  global.codeceptjs = codeceptjsModule.default || codeceptjsModule

  // BDD step definitions
  const stepDefinitionsModule = await import('./mocha/bdd.js')
  const stepDefinitions = stepDefinitionsModule.default || stepDefinitionsModule
  global.Given = stepDefinitions.Given
  global.When = stepDefinitions.When
  global.Then = stepDefinitions.Then
  global.DefineParameterType = stepDefinitions.defineParameterType

  // mask sensitive data
  global.maskSensitiveData = config.maskSensitiveData || false

}

/**
 * Initialize Mocha test framework globals (Feature, Scenario, etc.)
 * Called from mocha/ui.js pre-require event
 */
export function initMochaGlobals(context) {
  if (store.noGlobals) return;

  // Mocha test framework globals
  global.BeforeAll = context.BeforeAll
  global.AfterAll = context.AfterAll
  global.Feature = context.Feature
  global.xFeature = context.xFeature
  global.BeforeSuite = context.BeforeSuite
  global.AfterSuite = context.AfterSuite
  global.Background = context.Background
  global.Before = context.Before
  global.After = context.After
  global.Scenario = context.Scenario
  global.xScenario = context.xScenario
}

/**
 * Clear all CodeceptJS globals (useful for testing/cleanup)
 */
export function clearGlobals() {
  getGlobalNames().forEach(name => delete global[name]);
}

/**
 * Get list of all CodeceptJS global variable names
 */
export function getGlobalNames() {
  return [
    'codecept_dir',
    'output_dir',
    'Helper',
    'codecept_helper',
    'actor',
    'codecept_actor',
    'Actor',
    'pause',
    'within',
    'session',
    'DataTable',
    'locate',
    'inject',
    'share',
    'secret',
    'codeceptjs',
    'Given',
    'When',
    'Then',
    'DefineParameterType',
    'maskSensitiveData',
    'BeforeAll',
    'AfterAll',
    'Feature',
    'xFeature',
    'BeforeSuite',
    'AfterSuite',
    'Background',
    'Before',
    'After',
    'Scenario',
    'xScenario',
  ]
}
