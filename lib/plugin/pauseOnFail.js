import output from '../output.js'
import pause from './pause.js'

let warned = false

/**
 * Starts an interactive pause when a test fails.
 *
 * **Deprecated:** use the `pause` plugin with `on: 'fail'`, which is the default behavior.
 */
export default function (config = {}) {
  if (!warned) {
    output.error('pauseOnFail is deprecated; use the `pause` plugin (default on=fail).')
    warned = true
  }
  return pause({ ...config, on: 'fail' })
}
