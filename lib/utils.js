import fs from 'fs'
import os from 'os'
import path from 'path'
import { pathToFileURL } from 'url'
import { createRequire } from 'module'
import chalk from 'chalk'
import getFunctionArguments from 'fn-args'
import deepClone from 'lodash.clonedeep'
import merge from 'lodash.merge'
import { convertColorToRGBA, isColorProperty } from './colorUtils.js'
import store from './store.js'
import Fuse from 'fuse.js'
import crypto from 'crypto'
import jsBeautify from 'js-beautify'
import { spawnSync } from 'child_process'

function deepMerge(target, source) {
  return merge(target, source)
}

export const genTestId = test => {
  return clearString(crypto.createHash('sha256').update(test.fullTitle()).digest('base64').slice(0, -2))
}

export { deepMerge }

export { deepClone }

export const isGenerator = function (fn) {
  return fn.constructor.name === 'GeneratorFunction'
}

export const isFunction = function (fn) {
  return typeof fn === 'function'
}

export const isAsyncFunction = function (fn) {
  if (!fn) return false
  return fn[Symbol.toStringTag] === 'AsyncFunction'
}

export const resolveImportModulePath = function (modulePath) {
  // 1. If it's an absolute path, convert to a file:// URL
  if (path.isAbsolute(modulePath)) {
    return pathToFileURL(modulePath).href;
  }

  // 2. If it's a relative path (starts with ./ or ../), resolve it fully
  if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
    return modulePath
  }

  // 3. Otherwise, it's likely a bare NPM module (e.g., 'chai', 'codeceptjs')
  // Let Node.js resolve it natively from node_modules
  return modulePath;
}

export const fileExists = function (filePath) {
  return fs.existsSync(filePath)
}

export const isFile = function (filePath) {
  let filestat
  try {
    filestat = fs.statSync(filePath)
  } catch (err) {
    if (err.code === 'ENOENT') return false
  }
  if (!filestat) return false
  return filestat.isFile()
}

export const getParamNames = function (fn) {
  if (fn.isSinonProxy) return []
  return getFunctionArguments(fn)
}

export const installedLocally = function () {
  return path.resolve(`${new URL(import.meta.url).pathname}/../../`).indexOf(process.cwd()) === 0
}

export const methodsOfObject = function (obj, className) {
  const methods = []

  const standard = ['constructor', 'toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'bind', 'apply', 'call', 'isPrototypeOf', 'propertyIsEnumerable']

  function pushToMethods(prop) {
    try {
      if (!isFunction(obj[prop]) && !isAsyncFunction(obj[prop])) return
    } catch (err) {
      // can't access property
      return
    }
    if (standard.indexOf(prop) >= 0) return
    if (prop.indexOf('_') === 0) return
    methods.push(prop)
  }

  while (obj.constructor.name !== className) {
    Object.getOwnPropertyNames(obj).forEach(pushToMethods)
    obj = Object.getPrototypeOf(obj)

    if (!obj || !obj.constructor) break
  }
  return methods
}

export const template = function (template, data) {
  return template.replace(/{{([^{}]*)}}/g, (a, b) => {
    const r = data[b]
    if (r === undefined) return ''
    return r.toString()
  })
}

/**
 * Make first char uppercase.
 * @param {string} str
 * @returns {string | undefined}
 */
export const ucfirst = function (str) {
  if (str) return str.charAt(0).toUpperCase() + str.substr(1)
}

/**
 * Make first char lowercase.
 * @param {string} str
 * @returns {string | undefined}
 */
export const lcfirst = function (str) {
  if (str) return str.charAt(0).toLowerCase() + str.substr(1)
}

export const chunkArray = function (arr, chunk) {
  let i
  let j
  const tmp = []
  for (i = 0, j = arr.length; i < j; i += chunk) {
    tmp.push(arr.slice(i, i + chunk))
  }
  return tmp
}

export const clearString = function (str) {
  if (!str) return ''
  /* Replace forbidden symbols in string
   */
  if (str.endsWith('.')) {
    str = str.slice(0, -1)
  }
  return str
    .replace(/ /g, '_')
    .replace(/"/g, "'")
    .replace(/\//g, '_')
    .replace(/</g, '(')
    .replace(/>/g, ')')
    .replace(/:/g, '_')
    .replace(/\\/g, '_')
    .replace(/\|/g, '_')
    .replace(/\?/g, '.')
    .replace(/\*/g, '^')
    .replace(/'/g, '')
}

export const decodeUrl = function (url) {
  /* Replace forbidden symbols in string
   */
  return decodeURIComponent(decodeURIComponent(decodeURIComponent(url)))
}

export const normalizePath = function (path) {
  if (path === '' || path === '/') return '/'
  return path
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/'
}

export const resolveUrl = function (url, baseUrl) {
  if (!url) return url
  if (url.indexOf('http') === 0) return url
  if (!baseUrl) return url
  try {
    return new URL(url, baseUrl).href
  } catch (e) {
    return url
  }
}

export const xpathLocator = {
  /**
   * @param {string} string
   * @returns {string}
   */
  literal: string => {
    if (string.indexOf("'") > -1) {
      string = string
        .split("'", -1)
        .map(substr => `'${substr}'`)
        .join(',"\'",')
      return `concat(${string})`
    }
    return `'${string}'`
  },

  /**
   * Combines passed locators into one disjunction one.
   * @param {string[]} locators
   * @returns {string}
   */
  combine: locators => locators.join(' | '),
}

export const test = {
  grepLines(array, startString, endString) {
    let startIndex = 0
    let endIndex
    array.every((elem, index) => {
      if (elem === startString) {
        startIndex = index
        return true
      }
      if (elem === endString) {
        endIndex = index
        return false
      }
      return true
    })
    return array.slice(startIndex + 1, endIndex)
  },

  submittedData(dataFile) {
    return function (key) {
      if (!fs.existsSync(dataFile)) {
        // Extended timeout for CI environments to handle slower processing
        const waitTime = process.env.CI ? 60 * 1000 : 2 * 1000 // 60 seconds in CI, 2 seconds otherwise
        let pollInterval = 100 // Start with 100ms polling interval
        const maxPollInterval = 2000 // Max 2 second intervals
        const startTime = new Date().getTime()

        // Synchronous polling with exponential backoff to reduce CPU usage
        while (new Date().getTime() - startTime < waitTime) {
          if (fs.existsSync(dataFile)) {
            break
          }

          // Use Node.js child_process.spawnSync with platform-specific sleep commands
          // This avoids busy waiting and allows other processes to run
          try {
            if (isWindows()) {
              // Windows: use ping with precise timing (ping waits exactly the specified ms)
              spawnSync('ping', ['-n', '1', '-w', pollInterval.toString(), '127.0.0.1'], { stdio: 'ignore' })
            } else {
              // Unix/Linux/macOS: use sleep with fractional seconds
              spawnSync('sleep', [(pollInterval / 1000).toString()], { stdio: 'ignore' })
            }
          } catch (err) {
            // If system commands fail, use a simple busy wait with minimal CPU usage
            const end = new Date().getTime() + pollInterval
            while (new Date().getTime() < end) {
              // No-op loop - much lighter than previous approaches
            }
          }

          // Exponential backoff: gradually increase polling interval to reduce resource usage
          pollInterval = Math.min(pollInterval * 1.2, maxPollInterval)
        }
      }
      if (!fs.existsSync(dataFile)) {
        throw new Error('Data file was not created in time')
      }
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
      if (key) {
        return data.form[key]
      }
      return data
    }
  },
}

export const toCamelCase = function (name) {
  if (typeof name !== 'string') {
    return name
  }
  return name.replace(/-(\w)/gi, (_word, letter) => {
    return letter.toUpperCase()
  })
}

function convertFontWeightToNumber(name) {
  const fontWeightPatterns = [
    { num: 100, pattern: /^Thin$/i },
    { num: 200, pattern: /^(Extra|Ultra)-?light$/i },
    { num: 300, pattern: /^Light$/i },
    { num: 400, pattern: /^(Normal|Regular|Roman|Book)$/i },
    { num: 500, pattern: /^Medium$/i },
    { num: 600, pattern: /^(Semi|Demi)-?bold$/i },
    { num: 700, pattern: /^Bold$/i },
    { num: 800, pattern: /^(Extra|Ultra)-?bold$/i },
    { num: 900, pattern: /^(Black|Heavy)$/i },
  ]

  if (/^[1-9]00$/.test(name)) {
    return Number(name)
  }

  const matches = fontWeightPatterns.filter(fontWeight => fontWeight.pattern.test(name))

  if (matches.length) {
    return String(matches[0].num)
  }
  return name
}

function isFontWeightProperty(prop) {
  return prop === 'fontWeight'
}

export const convertCssPropertiesToCamelCase = function (props) {
  const output = {}
  Object.keys(props).forEach(key => {
    const keyCamel = toCamelCase(key)

    if (isFontWeightProperty(keyCamel)) {
      output[keyCamel] = convertFontWeightToNumber(props[key])
    } else if (isColorProperty(keyCamel)) {
      output[keyCamel] = convertColorToRGBA(props[key])
    } else {
      output[keyCamel] = props[key]
    }
  })
  return output
}

export const deleteDir = function (dir_path) {
  if (fs.existsSync(dir_path)) {
    fs.readdirSync(dir_path).forEach(function (entry) {
      const entry_path = path.join(dir_path, entry)
      if (fs.lstatSync(entry_path).isDirectory()) {
        deleteDir(entry_path)
      } else {
        fs.unlinkSync(entry_path)
      }
    })
    fs.rmdirSync(dir_path)
  }
}

/**
 * Returns absolute filename to save screenshot.
 * @param fileName {string} - filename.
 */
export const screenshotOutputFolder = function (fileName) {
  const fileSep = path.sep

  if (!fileName.includes(fileSep) || fileName.includes('record_')) {
    return path.resolve(store.outputDir, fileName)
  }
  return path.resolve(store.codeceptDir, fileName)
}

export const relativeDir = function (fileName) {
  return fileName.replace(store.codeceptDir, '').replace(/^\//, '')
}

export const beautify = function (code) {
  const format = jsBeautify.js
  return format(code, { indent_size: 2, space_in_empty_paren: true })
}

function shouldAppendBaseUrl(url) {
  return !/^\w+\:\/\//.test(url)
}

function trimUrl(url) {
  const firstChar = url.substr(1)
  if (firstChar === '/') {
    url = url.slice(1)
  }
  return url
}

function joinUrl(baseUrl, url) {
  return shouldAppendBaseUrl(url) ? `${baseUrl}/${trimUrl(url)}` : url
}

export const appendBaseUrl = function (baseUrl = '', oneOrMoreUrls) {
  if (typeof baseUrl !== 'string') {
    throw new Error(`Invalid value for baseUrl: ${baseUrl}`)
  }
  if (!(typeof oneOrMoreUrls === 'string' || Array.isArray(oneOrMoreUrls))) {
    throw new Error(`Expected type of Urls is 'string' or 'array', Found '${typeof oneOrMoreUrls}'.`)
  }
  // Remove '/' if it's at the end of baseUrl
  const lastChar = baseUrl.substr(-1)
  if (lastChar === '/') {
    baseUrl = baseUrl.slice(0, -1)
  }

  if (!Array.isArray(oneOrMoreUrls)) {
    return joinUrl(baseUrl, oneOrMoreUrls)
  }
  return oneOrMoreUrls.map(url => joinUrl(baseUrl, url))
}

/**
 * Recursively search key in object and replace it's value.
 *
 * @param {*} obj source object for replacing
 * @param {string} key key to search
 * @param {*} value value to set for key
 */
export const replaceValueDeep = function replaceValueDeep(obj, key, value) {
  if (!obj) return

  if (obj instanceof Array) {
    for (const i in obj) {
      replaceValueDeep(obj[i], key, value)
    }
  }

  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    obj[key] = value
  }

  if (typeof obj === 'object' && obj !== null) {
    const children = Object.values(obj)
    for (const child of children) {
      replaceValueDeep(child, key, value)
    }
  }
  return obj
}

export const ansiRegExp = function ({ onlyFirst = false } = {}) {
  const pattern = ['[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)', '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'].join('|')

  return new RegExp(pattern, onlyFirst ? undefined : 'g')
}

export const tryOrDefault = function (fn, defaultValue) {
  try {
    return fn()
  } catch (_) {
    return defaultValue
  }
}

function normalizeKeyReplacer(match, prefix, key, suffix, offset, string) {
  if (typeof key !== 'string') {
    return string
  }
  const normalizedKey = key.charAt(0).toUpperCase() + key.substr(1).toLowerCase()
  let position = ''
  if (typeof prefix === 'string') {
    position = prefix
  } else if (typeof suffix === 'string') {
    position = suffix
  }
  return normalizedKey + position.charAt(0).toUpperCase() + position.substr(1).toLowerCase()
}

/**
 * Transforms `key` into normalized to OS key.
 * @param {string} key
 * @returns {string}
 */
export const getNormalizedKeyAttributeValue = function (key) {
  // Use operation modifier key based on operating system
  key = key.replace(/(Ctrl|Control|Cmd|Command)[ _]?Or[ _]?(Ctrl|Control|Cmd|Command)/i, os.platform() === 'darwin' ? 'Meta' : 'Control')
  // Selection of keys (https://www.w3.org/TR/uievents-key/#named-key-attribute-values)
  // which can be written in various ways and should be normalized.
  // For example 'LEFT ALT', 'ALT_Left', 'alt left' or 'LeftAlt' will be normalized as 'AltLeft'.
  key = key.replace(/^\s*(?:(Down|Left|Right|Up)[ _]?)?(Arrow|Alt|Ctrl|Control|Cmd|Command|Meta|Option|OS|Page|Shift|Super)(?:[ _]?(Down|Left|Right|Up|Gr(?:aph)?))?\s*$/i, normalizeKeyReplacer)
  // Map alias to corresponding key value
  key = key.replace(/^(Add|Divide|Decimal|Multiply|Subtract)$/, 'Numpad$1')
  key = key.replace(/^AltGr$/, 'AltGraph')
  key = key.replace(/^(Cmd|Command|Os|Super)/, 'Meta')
  key = key.replace('Ctrl', 'Control')
  key = key.replace('Option', 'Alt')
  key = key.replace(/^(NumpadComma|Separator)$/, 'Comma')
  return key
}

export const modifierKeys = ['Alt', 'AltGraph', 'AltLeft', 'AltRight', 'Control', 'ControlLeft', 'ControlRight', 'Meta', 'MetaLeft', 'MetaRight', 'Shift', 'ShiftLeft', 'ShiftRight']
export const isModifierKey = function (key) {
  return modifierKeys.includes(key)
}

export const requireWithFallback = function (...packages) {
  const require = createRequire(import.meta.url)

  const exists = function (pkg) {
    try {
      require.resolve(pkg)
    } catch (e) {
      return false
    }

    return true
  }

  for (const pkg of packages) {
    if (exists(pkg)) {
      return require(pkg)
    }
  }

  throw new Error(`Cannot find modules ${packages.join(',')}`)
}

export const isNotSet = function (obj) {
  if (obj === null) return true
  if (obj === undefined) return true
  return false
}

export const emptyFolder = directoryPath => {
  // Do not throw on non-existent directory, since it may be created later
  if (!fs.existsSync(directoryPath)) return
  for (const file of fs.readdirSync(directoryPath)) {
    fs.rmSync(path.join(directoryPath, file), { recursive: true, force: true })
  }
}

export const printObjectProperties = obj => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  let result = ''
  for (const [key, value] of Object.entries(obj)) {
    result += `${key}: "${value}"; `
  }

  return `{${result}}`
}

export const normalizeSpacesInString = string => {
  return string.replace(/\s+/g, ' ')
}

export const humanizeFunction = function (fn) {
  const fnStr = fn.toString().trim()
  // Remove arrow function syntax, async, and parentheses
  let simplified = fnStr
    .replace(/^async\s*/, '')
    .replace(/^\([^)]*\)\s*=>/, '')
    .replace(/^function\s*\([^)]*\)/, '')
    // Remove curly braces and any whitespace around them
    .replace(/{\s*(.*)\s*}/, '$1')
    // Remove return statement
    .replace(/return\s+/, '')
    // Remove trailing semicolon
    .replace(/;$/, '')
    .trim()

  if (simplified.length > 100) {
    simplified = simplified.slice(0, 97) + '...'
  }

  return simplified
}

/**
 * Searches through a given data source using the Fuse.js library for fuzzy searching.
 *
 * @function searchWithFusejs
 * @param {Array|Object} source - The data source to search through. This can be an array of objects or strings.
 * @param {string} searchString - The search query string to match against the source.
 * @param {Object} [opts] - Optional configuration object for Fuse.js.
 * @param {boolean} [opts.includeScore=true] - Whether to include the score of the match in the results.
 * @param {number} [opts.threshold=0.6] - Determines the match threshold; lower values mean stricter matching.
 * @param {boolean} [opts.caseSensitive=false] - Whether the search should be case-sensitive.
 * @param {number} [opts.distance=100] - Determines how far apart the search term is allowed to be from the target.
 * @param {number} [opts.maxPatternLength=32] - The maximum length of the search pattern. Patterns longer than this are ignored.
 * @param {boolean} [opts.ignoreLocation=false] - Whether the location of the match is ignored when scoring.
 * @param {boolean} [opts.ignoreFieldNorm=false] - When true, the field's length is not considered when scoring.
 * @param {Array<string>} [opts.keys=[]] - List of keys to search in the objects of the source array.
 * @param {boolean} [opts.shouldSort=true] - Whether the results should be sorted by score.
 * @param {string} [opts.sortFn] - A custom sorting function for sorting results.
 * @param {number} [opts.minMatchCharLength=1] - The minimum number of characters that must match.
 * @param {boolean} [opts.useExtendedSearch=false] - Enables extended search capabilities.
 *
 * @returns {Array<Object>} - An array of search results. Each result contains an item and, if `includeScore` is true, a score.
 *
 * @example
 * const data = [
 *   { title: "Old Man's War", author: "John Scalzi" },
 *   { title: "The Lock Artist", author: "Steve Hamilton" },
 * ];
 *
 * const options = {
 *   keys: ['title', 'author'],
 *   includeScore: true,
 *   threshold: 0.4,
 *   caseSensitive: false,
 *   distance: 50,
 *   ignoreLocation: true,
 * };
 *
 * const results = searchWithFusejs(data, 'lock', options);
 * console.log(results);
 */
export const searchWithFusejs = function (source, searchString, opts) {
  const fuse = new Fuse(source, opts)

  return fuse.search(searchString)
}

export const humanizeString = function (string) {
  // split strings by words, then make them all lowercase
  const _result = string
    .replace(/([a-z](?=[A-Z]))/g, '$1 ')
    .split(' ')
    .map(word => word.toLowerCase())

  _result[0] = _result[0] === 'i' ? ucfirst(_result[0]) : _result[0]
  return _result.join(' ').trim()
}

/**
 * Creates a circular-safe replacer function for JSON.stringify
 * @param {string[]} keysToSkip - Keys to skip during serialization to break circular references
 * @returns {Function} Replacer function for JSON.stringify
 */
function createCircularSafeReplacer(keysToSkip = []) {
  const seen = new WeakSet()
  const defaultSkipKeys = ['parent', 'tests', 'suite', 'root', 'runner', 'ctx']
  const skipKeys = new Set([...defaultSkipKeys, ...keysToSkip])

  return function (key, value) {
    // Skip specific keys that commonly cause circular references
    if (key && skipKeys.has(key)) {
      return undefined
    }

    // Coerce types that JSON.stringify can't handle natively
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`
    if (typeof value === 'bigint') return `${value.toString()}n`
    if (typeof value === 'symbol') return value.toString()
    if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack }

    if (value === null || typeof value !== 'object') {
      return value
    }

    // Handle circular references
    if (seen.has(value)) {
      return `[Circular Reference to ${value.constructor?.name || 'Object'}]`
    }

    seen.add(value)
    return value
  }
}

/**
 * Safely stringify an object, handling circular references
 * @param {any} obj - Object to stringify
 * @param {string[]} keysToSkip - Additional keys to skip during serialization
 * @param {number} space - Number of spaces for indentation (default: 0)
 * @returns {string} JSON string representation
 */
export const safeStringify = function (obj, keysToSkip = [], space = 0) {
  try {
    return JSON.stringify(obj, createCircularSafeReplacer(keysToSkip), space)
  } catch (error) {
    // Fallback for any remaining edge cases
    return JSON.stringify({ error: `Failed to serialize: ${error.message}` }, null, space)
  }
}

/**
 * Truncate a string at a byte cap, returning structured info.
 * @param {string} str
 * @param {number} maxBytes
 * @returns {{ value: string, truncated: boolean, fullLength: number }}
 */
export const truncateString = function (str, maxBytes) {
  if (typeof str !== 'string') str = String(str)
  if (str.length <= maxBytes) {
    return { value: str, truncated: false, fullLength: str.length }
  }
  const dropped = str.length - maxBytes
  return {
    value: `${str.slice(0, maxBytes)}\n...[truncated ${dropped} more chars]`,
    truncated: true,
    fullLength: str.length,
  }
}

export const serializeError = function (error) {
  if (error) {
    const { stack, uncaught, message, actual, expected } = error
    return { stack, uncaught, message, actual, expected }
  }
  return null
}

export const base64EncodeFile = function (filePath) {
  return Buffer.from(fs.readFileSync(filePath)).toString('base64')
}

export const getMimeType = function (fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.csv': 'text/csv',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.wav': 'audio/wav',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

export const markdownToAnsi = function (markdown) {
  return (
    markdown
      // Headers (# Text) - make blue and bold
      .replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
        return chalk.bold.blue(`${hashes} ${text}`)
      })
      // Bullet points - replace with yellow bullet character
      .replace(/^[-*]\s+(.+)$/gm, (_, text) => {
        return `${chalk.yellow('•')} ${text}`
      })
      // Bold (**text**) - make bold
      .replace(/\*\*(.+?)\*\*/g, (_, text) => {
        return chalk.bold(text)
      })
      // Italic (*text*) - make italic (dim in terminals)
      .replace(/\*(.+?)\*/g, (_, text) => {
        return chalk.italic(text)
      })
  )
}

export function isWindows() {
  return os.platform() === 'win32'
}
