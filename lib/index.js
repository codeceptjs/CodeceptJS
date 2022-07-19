/**
 * Index file for loading CodeceptJS programmatically.
 *
 * Includes Public API objects
 * @alias index
 * @namespace
 */
module.exports = {
  /** @type {typeof CodeceptJS.Codecept} */
  codecept: require('./codecept'),
  /** @type {typeof CodeceptJS.Codecept} */
  Codecept: require('./codecept'),
  /** @type {typeof CodeceptJS.output} */
  output: require('./output'),
  /** @type {typeof CodeceptJS.Container} */
  container: require('./container'),
  /** @type {typeof CodeceptJS.event} */
  event: require('./event'),
  /** @type {CodeceptJS.recorder} */
  recorder: require('./recorder'),
  /** @type {typeof CodeceptJS.Config} */
  config: require('./config'),
  /** @type {CodeceptJS.actor} */
  actor: require('./actor'),
  /** @type {typeof CodeceptJS.Helper} */
  helper: require('./helper'),
  /** @type {typeof CodeceptJS.Helper} */
  Helper: require('./helper'),
  /** @type {typeof CodeceptJS.pause} */
  pause: require('./pause'),
  /** @type {typeof CodeceptJS.within} */
  within: require('./within'),
  /**  @type {typeof CodeceptJS.DataTable} */
  dataTable: require('./data/table'),
  /**  @type {typeof CodeceptJS.DataTableArgument} */
  dataTableArgument: require('./data/dataTableArgument'),
  /** @type {typeof CodeceptJS.store} */
  store: require('./store'),
  /** @type {typeof CodeceptJS.Locator} */
  locator: require('./locator'),

  Workers: require('./workers'),
};
