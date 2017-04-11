'use strict';
/**
 * Index file for loading CodeceptJS programmatically.
 *
 * Includes Public API objects
 */
module.exports = {
  Codecept: require('./codecept'),
  output: require('./output'),
  container: require('./container'),
  event: require('./event'),
  recorder: require('./recorder')
}