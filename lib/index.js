/**
 * Index file for loading CodeceptJS programmatically.
 *
 * Includes Public API objects
 * @alias index
 * @namespace
 */
import codecept from './codecept.js'
import output from './output.js'
import container from './container.js'
import event from './event.js'
import recorder from './recorder.js'
import config from './config.js'
import actor from './actor.js'
import helper from './helper.js'
import pause from './pause.js'
import { within } from './effects.js'
import dataTable from './data/table.js'
import dataTableArgument from './data/dataTableArgument.js'
import store from './store.js'
import locator from './locator.js'
import heal from './heal.js'
import ai from './ai.js'
import Workers from './workers.js'
import Secret, { secret } from './secret.js'
import session from './session.js'

const inject = (name) => container.support(name)
const locate = (query) => locator.build(query)

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

  /** @type {typeof CodeceptJS.Secret} */
  Secret,
  /** @type {typeof CodeceptJS.secret} */
  secret,

  session,
  inject,
  locate,
}

// Named exports for ESM compatibility
export { codecept, output, container, event, recorder, config, actor, helper, pause, within, dataTable, dataTableArgument, store, locator, heal, ai, Workers, Secret, secret, session, inject, locate }
