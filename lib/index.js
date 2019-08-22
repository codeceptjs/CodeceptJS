/**
 * Index file for loading CodeceptJS programmatically.
 *
 * Includes Public API objects
 * @alias index
 * @interface
 */
module.exports = {
  /**
   * @type {typeof CodeceptJS.Codecept}
   * @inner
   */
  codecept: require('./codecept'),
  /**
   * @type {CodeceptJS.output}
   * @inner
   */
  output: require('./output'),
  /**
   * @type {typeof CodeceptJS.Container}
   * @inner
   */
  container: require('./container'),
  /**
   * @type {CodeceptJS.event}
   * @inner
   */
  event: require('./event'),
  /**
   * @type {CodeceptJS.recorder}
   * @inner
   */
  recorder: require('./recorder'),
  /**
   * @type {typeof CodeceptJS.Config}
   * @inner
   */
  config: require('./config'),
  actor: require('./actor'),
  /**
   * @type {typeof CodeceptJS.Helper}
   * @inner
   */
  helper: require('./helper'),
  pause: require('./pause'),
  within: require('./within'),
  /**
   * @type {typeof CodeceptJS.DataTable}
   * @inner
   */
  dataTable: require('./data/table'),
  /**
   * @type {CodeceptJS.store}
   * @inner
   */
  store: require('./store'),
  /**
   * @type {typeof CodeceptJS.Locator}
   * @inner
   */
  locator: require('./locator'),
};
