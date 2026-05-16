import output from '../output.js'
import screenshot from './screenshot.js'

let warned = false

/**
 * Saves a screenshot when a test fails.
 *
 * **Deprecated:** use the `screenshot` plugin with `on: 'fail'`, which is the default behavior.
 */
export default function (config = {}) {
  if (!warned) {
    output.error('screenshotOnFail is deprecated; use the `screenshot` plugin (default on=fail).')
    warned = true
  }
  return screenshot({ ...config, on: 'fail' })
}
