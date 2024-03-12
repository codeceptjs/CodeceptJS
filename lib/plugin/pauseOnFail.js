import * as event from '../event.js';
import pause from '../pause';

/**
 * Automatically launches [interactive pause](/basics/#pause) when a test fails.
 *
 * Useful for debugging flaky tests on local environment.
 * Add this plugin to config file:
 *
 * ```js
 * plugins: {
 *   pauseOnFail: {},
 * }
 * ```
 *
 * Unlike other plugins, `pauseOnFail` is not recommended to be enabled by default.
 * Enable it manually on each run via `-p` option:
 *
 * ```
 * npx codeceptjs run -p pauseOnFail
 * ```
 *
 */
export default () => {
  let failed = false;

  event.dispatcher.on(event.test.started, () => {
    failed = false;
  });

  event.dispatcher.on(event.step.failed, () => {
    failed = true;
  });

  event.dispatcher.on(event.test.after, () => {
    if (failed) pause();
  });
};
