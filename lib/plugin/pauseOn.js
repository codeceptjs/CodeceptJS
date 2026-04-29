import output from '../output.js'
import pause from './pause.js'

let warned = false

/**
 * @deprecated Use the `pause` plugin. Old positional CLI args are translated
 * to the new `on=key:param=value` form:
 *
 *   `-p pauseOn:fail`                                  → `-p pause:on=fail`
 *   `-p pauseOn:step`                                  → `-p pause:on=step`
 *   `-p pauseOn:file:tests/foo.js:43`                  → `-p pause:on=file:path=tests/foo.js;line=43`
 *   `-p pauseOn:url:/users/*`                          → `-p pause:on=url:pattern=/users/*`
 */
export default function (config = {}) {
  if (!warned) {
    output.error('pauseOn is deprecated; use the `pause` plugin with the new on=key:param=value syntax.')
    warned = true
  }

  const args = config._args || []
  const translated = translatePositionalArgs(args)
  return pause({ ...config, _args: translated })
}

function translatePositionalArgs(args) {
  if (!args.length) return []
  const mode = args[0]
  if (mode === 'fail' || mode === 'step') {
    return [`on=${mode}`]
  }
  if (mode === 'file') {
    const path = args[1]
    const line = args[2]
    if (!path) return ['on=file']
    return line ? [`on=file`, `path=${path};line=${line}`] : [`on=file`, `path=${path}`]
  }
  if (mode === 'url') {
    const pattern = args.slice(1).join(':')
    return pattern ? [`on=url`, `pattern=${pattern}`] : ['on=url']
  }
  return args
}
