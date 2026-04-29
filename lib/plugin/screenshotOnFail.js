import output from '../output.js'
import screenshot from './screenshot.js'

let warned = false

/**
 * @deprecated Use the `screenshot` plugin with `on: 'fail'` (the default).
 */
export default function (config = {}) {
  if (!warned) {
    output.error('screenshotOnFail is deprecated; use the `screenshot` plugin (default on=fail).')
    warned = true
  }
  return screenshot({ ...config, on: 'fail' })
}
