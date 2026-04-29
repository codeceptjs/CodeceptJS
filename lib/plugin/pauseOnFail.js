import output from '../output.js'
import pause from './pause.js'

let warned = false

/**
 * @deprecated Use the `pause` plugin with `on: 'fail'` (the default).
 */
export default function (config = {}) {
  if (!warned) {
    output.error('pauseOnFail is deprecated; use the `pause` plugin (default on=fail).')
    warned = true
  }
  return pause({ ...config, on: 'fail' })
}
