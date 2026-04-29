import Container from '../container.js'

const supportedHelpers = Container.STANDARD_ACTING_HELPERS

const RESERVED_KEYS = new Set(['on', 'path', 'line', 'pattern'])

/**
 * Parse a plugin's _args (from CLI `-p plugin:key=value:key=value`) into a flat dict.
 * Each entry is split on `;` then on the first `=`. Bare segments become `{ key: true }`.
 *
 * Examples:
 *   parsePluginArgs(['on=fail'])
 *     → { on: 'fail' }
 *   parsePluginArgs(['on=file', 'path=tests/foo.js;line=43'])
 *     → { on: 'file', path: 'tests/foo.js', line: '43' }
 *   parsePluginArgs(['on=file', 'path=tests/foo.js', 'line=43'])
 *     → { on: 'file', path: 'tests/foo.js', line: '43' }
 *   parsePluginArgs(['show'])
 *     → { show: true }
 */
export function parsePluginArgs(args = []) {
  const opts = {}
  for (const arg of args) {
    if (!arg) continue
    for (const segment of arg.split(';')) {
      if (!segment) continue
      if (segment.includes('=')) {
        const eq = segment.indexOf('=')
        const key = segment.slice(0, eq)
        const value = segment.slice(eq + 1)
        opts[key] = coerce(value)
      } else {
        opts[segment] = true
      }
    }
  }
  return opts
}

function coerce(v) {
  if (v === 'true') return true
  if (v === 'false') return false
  return v
}

/**
 * Compose CLI args > config > defaults into a normalized trigger spec.
 * Returns `{ on, path, line, pattern, ...rest }`. `line` is coerced to a number.
 */
export function resolveTrigger(cliArgs = {}, config = {}, defaults = {}) {
  const merged = { ...defaults, ...pickKnown(config), ...cliArgs }
  if (merged.line != null) merged.line = parseInt(merged.line, 10)
  return merged
}

function pickKnown(config) {
  const out = {}
  for (const key of Object.keys(config || {})) {
    if (RESERVED_KEYS.has(key)) out[key] = config[key]
  }
  return out
}

/**
 * Match a step's source location against a `path` (substring/suffix) and optional `line`.
 * Reads the step's stack via `step.line()` to get `file:row:col`.
 */
export function matchStepFile(step, targetPath, targetLine) {
  if (!targetPath) return false
  const stepLine = step.line && step.line()
  if (!stepLine) return false

  const parsed = parseStepLine(stepLine)
  if (!parsed) return false

  const fileMatches = parsed.file.includes(targetPath) || parsed.file.endsWith(targetPath)
  if (!fileMatches) return false

  if (targetLine != null && !Number.isNaN(targetLine) && parsed.line !== targetLine) return false
  return true
}

function parseStepLine(stepLine) {
  let line = stepLine.trim()
  if (line.startsWith('at ')) line = line.substring(3).trim()

  const lastColon = line.lastIndexOf(':')
  if (lastColon < 0) return null
  const secondLastColon = line.lastIndexOf(':', lastColon - 1)
  if (secondLastColon < 0) return null

  const file = line.substring(0, secondLastColon)
  const lineNum = parseInt(line.substring(secondLastColon + 1, lastColon), 10)

  if (Number.isNaN(lineNum)) return null
  return { file, line: lineNum }
}

/**
 * Match a URL string against a glob-style pattern (supports `*` wildcards).
 */
export function matchUrl(currentUrl, pattern) {
  if (!pattern || !currentUrl) return false
  return patternToRegex(pattern).test(currentUrl)
}

function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  const regexStr = escaped.replace(/\*/g, '.*')
  return new RegExp(regexStr)
}

/**
 * Return the first available standard browser helper, or null.
 */
export function getBrowserHelper() {
  const helpers = Container.helpers()
  for (const name of supportedHelpers) {
    if (Object.keys(helpers).indexOf(name) > -1) {
      return helpers[name]
    }
  }
  return null
}
