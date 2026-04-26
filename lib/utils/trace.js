import crypto from 'crypto'
import path from 'path'
import Container from '../container.js'
import { clearString } from '../utils.js'

export function pickActingHelper(helpers) {
  for (const name of Container.STANDARD_ACTING_HELPERS) {
    if (helpers[name]) return helpers[name]
  }
  return null
}

export function traceDirFor(testFile, testTitle, baseDir) {
  const hash = crypto.createHash('sha256').update((testFile || '') + (testTitle || '')).digest('hex').slice(0, 8)
  const cleanTitle = clearString(testTitle || '').slice(0, 200)
  return path.resolve(baseDir, `trace_${cleanTitle}_${hash}`)
}

export function snapshotDirFor(baseDir) {
  const hash = crypto.randomBytes(4).toString('hex')
  return path.resolve(baseDir, `snapshot_${Date.now()}_${hash}`)
}

const ARTIFACT_LABELS = {
  html: 'HTML',
  aria: 'ARIA',
  screenshot: 'Screenshot',
  console: 'Browser Logs',
  storage: 'Storage',
}

export function artifactLinks(artifacts, { indent = '  ', consoleCount } = {}) {
  const lines = []
  const order = ['html', 'aria', 'screenshot', 'console', 'storage']

  for (const key of order) {
    const file = artifacts[key]
    if (!file) continue
    const label = ARTIFACT_LABELS[key]
    let line = `${indent}> [${label}](./${file})`
    if (key === 'console') {
      const count = consoleCount ?? artifacts.consoleCount ?? 0
      line += ` (${count} entries)`
    } else if (key === 'storage') {
      const cookies = artifacts.cookieCount ?? 0
      const ls = artifacts.localStorageCount ?? 0
      line += ` (${cookies} cookies, ${ls} localStorage)`
    }
    lines.push(line)
  }

  return lines.join('\n')
}

export function fileToUrl(dir, basename) {
  return `file://${path.join(dir, basename)}`
}

export function artifactsToFileUrls(captured, dir) {
  const out = {}
  if (captured.url) out.url = captured.url
  if (captured.screenshot) out.screenshot = fileToUrl(dir, captured.screenshot)
  if (captured.html) out.html = fileToUrl(dir, captured.html)
  if (captured.aria) out.aria = fileToUrl(dir, captured.aria)
  if (captured.console) out.console = fileToUrl(dir, captured.console)
  if (captured.storage) out.storage = fileToUrl(dir, captured.storage)
  if (typeof captured.consoleCount === 'number') out.consoleCount = captured.consoleCount
  if (typeof captured.cookieCount === 'number') out.cookieCount = captured.cookieCount
  if (typeof captured.localStorageCount === 'number') out.localStorageCount = captured.localStorageCount
  return out
}
