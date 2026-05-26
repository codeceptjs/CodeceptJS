import fs from 'fs'
import path from 'path'
import os from 'os'
import { mkdirp } from 'mkdirp'
import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom'

import event from '../event.js'
import store from '../store.js'
import output from '../output.js'

const defaultConfig = {
  outputName: 'report.xml',
  output: null,
  testGroupName: 'CodeceptJS',
  attachSteps: true,
  attachMeta: true,
  stepsInFailure: true,
}

const INVALID_XML_CHARS = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\uFFFE\\uFFFF]', 'g')

/**
 *
 * Generates a JUnit-compatible XML report after a test run.
 *
 * Unlike Mocha's `mocha-junit-reporter`, this plugin understands CodeceptJS steps and substeps.
 * For every `<testcase>` it includes:
 *
 * * `<properties>` — the test's meta information: every `meta` key from `Scenario('...', { meta })`, plus its `tags` and `retries`
 * * `<system-out>` — an indented step/substep log (substeps are nested under their meta step); only failed steps are marked
 * * `<failure>` — for failed tests: the error message, type, stack trace and (optionally) the step trace
 *
 * The produced file is consumable by Jenkins, GitLab CI, CircleCI, GitHub Actions test reporters, etc.
 *
 * #### Configuration
 *
 * ```js
 * "plugins": {
 *    "junitReporter": {
 *      "enabled": true
 *    }
 *  }
 * ```
 *
 * Possible config options:
 *
 * * `outputName`: file name for the report. Default: `report.xml`.
 * * `output`: directory where the report is stored, relative to the project root. Default: the `output` directory.
 * * `testGroupName`: value of the `name` attribute on the root `<testsuites>` element. Default: `CodeceptJS`.
 * * `attachMeta`: add the test's meta information (`meta` keys, `tags`, `retries`) as `<properties>`. Default: true.
 * * `attachSteps`: add the step/substep log as `<system-out>`. Default: true.
 * * `stepsInFailure`: append the step trace to the `<failure>` body. Default: true.
 *
 * CLI examples:
 *
 * ```
 * npx codeceptjs run -p junitReporter
 * npx codeceptjs run -p junitReporter:outputName=junit.xml
 * ```
 *
 * > ℹ When running with `run-workers`, steps are serialized between processes and substep nesting is flattened.
 *
 * @param {*} config
 */
export default function (config = {}) {
  config = Object.assign({}, defaultConfig, config)

  let written = false

  const writeReport = result => {
    if (written) return
    if (!result || !Array.isArray(result.tests)) return
    written = true

    const dir = config.output ? path.resolve(store.codeceptDir || process.cwd(), config.output) : store.outputDir || process.cwd()
    mkdirp.sync(dir)
    const file = path.join(dir, config.outputName)

    fs.writeFileSync(file, buildXml(result, config))
    output.plugin('junitReporter', `JUnit report saved to ${file}`)
  }

  event.dispatcher.on(event.all.result, writeReport)
  event.dispatcher.on(event.workers.result, writeReport)
}

function buildXml(result, config) {
  const doc = new DOMImplementation().createDocument(null, null, null)
  const suites = groupBySuite(result.tests)

  const root = doc.createElement('testsuites')
  setAttr(root, 'name', config.testGroupName)
  setAttr(root, 'tests', result.tests.length)
  setAttr(root, 'failures', countState(result.tests, 'failed'))
  setAttr(root, 'skipped', countSkipped(result.tests))
  setAttr(root, 'errors', 0)
  setAttr(root, 'time', toSeconds(sumDuration(result.tests)))
  setAttr(root, 'timestamp', toIso(result.stats && result.stats.start))
  doc.appendChild(root)

  suites.forEach((tests, index) => {
    const suite = tests[0] && tests[0].parent
    const suiteName = (suite && suite.title) || 'Tests'
    const suiteFile = (suite && suite.file) || (tests[0] && tests[0].file) || ''

    const suiteEl = doc.createElement('testsuite')
    setAttr(suiteEl, 'name', suiteName)
    setAttr(suiteEl, 'id', index)
    setAttr(suiteEl, 'tests', tests.length)
    setAttr(suiteEl, 'failures', countState(tests, 'failed'))
    setAttr(suiteEl, 'skipped', countSkipped(tests))
    setAttr(suiteEl, 'errors', 0)
    setAttr(suiteEl, 'time', toSeconds(sumDuration(tests)))
    setAttr(suiteEl, 'timestamp', toIso(suite && suite.startedAt))
    setAttr(suiteEl, 'hostname', os.hostname())
    if (suiteFile) setAttr(suiteEl, 'file', suiteFile)
    root.appendChild(suiteEl)

    for (const test of tests) {
      suiteEl.appendChild(buildTestCase(doc, test, suiteName, config))
    }
  })

  return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(doc) + '\n'
}

function buildTestCase(doc, test, suiteName, config) {
  const testEl = doc.createElement('testcase')
  setAttr(testEl, 'name', test.title || '(no title)')
  setAttr(testEl, 'classname', suiteName)
  setAttr(testEl, 'time', toSeconds(test.duration || 0))
  const file = test.file || (test.parent && test.parent.file)
  if (file) setAttr(testEl, 'file', file)

  if (config.attachMeta) {
    const properties = metaProperties(test)
    if (properties.length) {
      const propertiesEl = doc.createElement('properties')
      for (const [name, value] of properties) {
        const prop = doc.createElement('property')
        setAttr(prop, 'name', name)
        setAttr(prop, 'value', value)
        propertiesEl.appendChild(prop)
      }
      testEl.appendChild(propertiesEl)
    }
  }

  const flat = flattenSteps(Array.isArray(test.steps) ? test.steps : [])

  if (test.state === 'skipped' || test.state === 'pending') {
    const skipped = doc.createElement('skipped')
    const reason = skipReason(test)
    if (reason) setAttr(skipped, 'message', reason)
    testEl.appendChild(skipped)
  } else if (test.state === 'failed') {
    const err = test.err || {}
    const failure = doc.createElement('failure')
    setAttr(failure, 'message', err.message || 'Test failed')
    setAttr(failure, 'type', err.name || 'Error')
    let body = err.stack || err.message || 'Test failed'
    if (config.stepsInFailure && flat.length) {
      body += '\n\nSteps:\n' + flat.map(stepLogLine).join('\n')
    }
    failure.appendChild(doc.createTextNode(cleanText(body)))
    testEl.appendChild(failure)
  }

  if (config.attachSteps && flat.length) {
    const out = doc.createElement('system-out')
    out.appendChild(doc.createTextNode(cleanText(flat.map(stepLogLine).join('\n'))))
    testEl.appendChild(out)
  }

  return testEl
}

function metaProperties(test) {
  const props = []
  const meta = test.meta || {}
  for (const key of Object.keys(meta)) {
    if (meta[key] === undefined || meta[key] === null) continue
    props.push([key, stringifyMeta(meta[key])])
  }
  if (Array.isArray(test.tags) && test.tags.length) {
    props.push(['tags', test.tags.join(' ')])
  }
  if (test.retries > 0 || test.retryNum > 0) {
    props.push(['retries', String(test.retryNum || test.retries)])
  }
  return props
}

function stringifyMeta(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch (err) {
    return String(value)
  }
}

function flattenSteps(steps) {
  const out = []
  let prevChain = []

  for (const step of steps) {
    const chain = metaChain(step)

    let common = 0
    while (common < chain.length && common < prevChain.length && chain[common].key === prevChain[common].key) common++

    for (let d = common; d < chain.length; d++) {
      out.push({ depth: d, step: chain[d].step })
    }
    out.push({ depth: chain.length, step })
    prevChain = chain
  }

  return out
}

function metaChain(step) {
  const chain = []
  let meta = step && step.metaStep
  while (meta) {
    chain.unshift({ step: meta, key: meta })
    meta = meta.metaStep
  }
  if (!chain.length && step && step.parent && step.parent.title) {
    chain.push({ step: { title: step.parent.title, status: step.status }, key: `meta:${step.parent.title}` })
  }
  return chain
}

function stepLogLine(entry) {
  const indent = '  '.repeat(entry.depth)
  const mark = entry.step && entry.step.status === 'failed' ? '[FAILED] ' : ''
  return `${indent}${mark}${stepText(entry.step)} (${stepDuration(entry.step)}ms)`
}

function stepText(step) {
  if (step && typeof step.toString === 'function' && step.toString !== Object.prototype.toString) return step.toString()
  return (step && step.title) || 'step'
}

function stepDuration(step) {
  if (!step) return 0
  if (typeof step.duration === 'number' && step.duration >= 0) return step.duration
  if (step.startTime && step.endTime) return Math.max(0, step.endTime - step.startTime)
  return 0
}

function groupBySuite(tests) {
  const groups = []
  const byKey = new Map()
  for (const test of tests) {
    const key = test.parent || test
    if (!byKey.has(key)) {
      const list = []
      byKey.set(key, list)
      groups.push(list)
    }
    byKey.get(key).push(test)
  }
  return groups
}

function skipReason(test) {
  if (test.opts && test.opts.skipInfo && test.opts.skipInfo.message) return test.opts.skipInfo.message
  if (test.meta && test.meta.skipReason) return test.meta.skipReason
  return ''
}

function countState(tests, state) {
  return tests.filter(t => t.state === state).length
}

function countSkipped(tests) {
  return tests.filter(t => t.state === 'skipped' || t.state === 'pending').length
}

function sumDuration(tests) {
  return tests.reduce((sum, t) => sum + (t.duration || 0), 0)
}

function toSeconds(ms) {
  return (Math.max(0, ms) / 1000).toFixed(3)
}

function toIso(value) {
  const date = value ? new Date(value) : new Date()
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString()
}

function cleanText(text) {
  return String(text == null ? '' : text).replace(INVALID_XML_CHARS, '')
}

function setAttr(el, name, value) {
  el.setAttribute(name, cleanText(value))
}
