/**
 * Index file for loading HermionaJS programmatically.
 *
 * Includes Public API objects
 * @alias index
 * @namespace
 */
module.exports = {
  /** @type {typeof HermionaJS.Hermiona} */
  hermiona: require('./hermiona'),
  /** @type {typeof HermionaJS.Hermiona} */
  Hermiona: require('./hermiona'),
  /** @type {typeof HermionaJS.output} */
  output: require('./output'),
  /** @type {typeof HermionaJS.Container} */
  container: require('./container'),
  /** @type {typeof HermionaJS.event} */
  event: require('./event'),
  /** @type {HermionaJS.recorder} */
  recorder: require('./recorder'),
  /** @type {typeof HermionaJS.Config} */
  config: require('./config'),
  /** @type {HermionaJS.actor} */
  actor: require('./actor'),
  /** @type {typeof HermionaJS.Helper} */
  helper: require('./helper'),
  /** @type {typeof HermionaJS.Helper} */
  Helper: require('./helper'),
  /** @type {typeof HermionaJS.pause} */
  pause: require('./pause'),
  /** @type {typeof HermionaJS.within} */
  within: require('./within'),
  /**  @type {typeof HermionaJS.DataTable} */
  dataTable: require('./data/table'),
  /**  @type {typeof HermionaJS.DataTableArgument} */
  dataTableArgument: require('./data/dataTableArgument'),
  /** @type {typeof HermionaJS.store} */
  store: require('./store'),
  /** @type {typeof HermionaJS.Locator} */
  locator: require('./locator'),

  Workers: require('./workers'),
};
