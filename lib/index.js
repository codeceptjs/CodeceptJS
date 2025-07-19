/**
 * Index file for loading CodeceptJS programmatically.
 *
 * Includes Public API objects
 * @alias index
 * @namespace
 */
import codeceptModule from './codecept.js'
import outputModule from './output.js'
import containerModule from './container.js'
import eventModule from './event.js'
import recorderModule from './recorder.js'
import configModule from './config.js'
import actorModule from './actor.js'
import helperModule from './helper.js'
import pauseModule from './pause.js'
import withinModule from './within.js'
import dataTableModule from './data/table.js'
import dataTableArgumentModule from './data/dataTableArgument.js'
import storeModule from './store.js'
import locatorModule from './locator.js'
import healModule from './heal.js'
import aiModule from './ai.js'
import workersModule from './workers.js'

// Handle ESM/CommonJS compatibility
const codecept = codeceptModule.default || codeceptModule
const output = outputModule.default || outputModule
const container = containerModule.default || containerModule
const event = eventModule.default || eventModule
const recorder = recorderModule.default || recorderModule
const config = configModule.default || configModule
const actor = actorModule.default || actorModule
const helper = helperModule.default || helperModule
const pause = pauseModule.default || pauseModule
const within = withinModule.default || withinModule
const dataTable = dataTableModule.default || dataTableModule
const dataTableArgument = dataTableArgumentModule.default || dataTableArgumentModule
const store = storeModule.default || storeModule
const locator = locatorModule.default || locatorModule
const heal = healModule.default || healModule
const ai = aiModule.default || aiModule
const Workers = workersModule.default || workersModule

export default {
  /** @type {typeof CodeceptJS.Codecept} */
  codecept,
  /** @type {typeof CodeceptJS.Codecept} */
  Codecept: codecept,
  /** @type {typeof CodeceptJS.output} */
  output,
  /** @type {typeof CodeceptJS.Container} */
  container,
  /** @type {typeof CodeceptJS.event} */
  event,
  /** @type {CodeceptJS.recorder} */
  recorder,
  /** @type {typeof CodeceptJS.Config} */
  config,
  /** @type {CodeceptJS.actor} */
  actor,
  /** @type {typeof CodeceptJS.Helper} */
  helper,
  /** @type {typeof CodeceptJS.Helper} */
  Helper: helper,
  /** @type {typeof CodeceptJS.pause} */
  pause,
  /** @type {typeof CodeceptJS.within} */
  within,
  /**  @type {typeof CodeceptJS.DataTable} */
  dataTable,
  /**  @type {typeof CodeceptJS.DataTableArgument} */
  dataTableArgument,
  /** @type {typeof CodeceptJS.store} */
  store,
  /** @type {typeof CodeceptJS.Locator} */
  locator,

  heal,
  ai,

  Workers,
}
