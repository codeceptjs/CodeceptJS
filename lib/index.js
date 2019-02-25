/**
 * Index file for loading CodeceptJS programmatically.
 *
 * Includes Public API objects
 */
module.exports = {
  codecept: require('./codecept'),
  output: require('./output'),
  container: require('./container'),
  event: require('./event'),
  recorder: require('./recorder'),
  config: require('./config'),
  actor: require('./actor'),
  helper: require('./helper'),
  pause: require('./pause'),
  within: require('./within'),
  dataTable: require('./data/table'),
  store: require('./store'),
  locator: require('./locator'),
};
