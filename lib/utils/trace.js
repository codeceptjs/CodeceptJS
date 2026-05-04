import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import Container from '../container.js'
import { clearString } from '../utils.js'
import { formatHtml } from '../html.js'
import { diffAriaSnapshots } from '../aria.js'

// ---------------------------------------------------------------------------
// Helper / directory naming
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Artifact link rendering (trace.md)
// ---------------------------------------------------------------------------

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
  return pathToFileURL(path.join(dir, basename)).href
}

export function writeTraceMarkdown({ dir, title, file, durationMs, commands, captured, error }) {
  let md = `file: ${file || 'mcp'}\n`
  md += `name: ${title}\n`
  md += `time: ${(durationMs / 1000).toFixed(2)}s\n`
  md += `---\n\n`

  if (error) md += `Error: ${error}\n\n---\n\n`

  if (commands && commands.length) {
    md += `### Commands\n`
    for (const c of commands) md += `- ${c}\n`
    md += `\n`
  }

  md += `### Final State\n`
  if (captured.url) md += `  > URL: ${captured.url}\n`
  const links = artifactLinks(captured)
  if (links) md += links + '\n'

  const traceFile = path.join(dir, 'trace.md')
  fs.writeFileSync(traceFile, md)
  return traceFile
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

// ---------------------------------------------------------------------------
// Snapshot capture (HTML / ARIA / screenshot / console / storage)
// ---------------------------------------------------------------------------

function normalizeBrowserLogs(logs) {
  return (logs || []).map(l => {
    if (typeof l === 'string') return l
    if (l && typeof l.type === 'function' && typeof l.text === 'function') {
      return { type: l.type(), text: l.text() }
    }
    return l
  })
}

async function captureStorageState(helper) {
  if (typeof helper.grabStorageState === 'function') {
    try {
      const state = await helper.grabStorageState()
      if (state) return state
    } catch {}
  }

  const state = { cookies: [], origins: [] }

  if (typeof helper.grabCookie === 'function') {
    try {
      const cookies = await helper.grabCookie()
      if (Array.isArray(cookies)) state.cookies = cookies
    } catch {}
  }

  if (typeof helper.executeScript === 'function') {
    try {
      const result = await helper.executeScript(() => {
        const out = { origin: location.origin, items: [] }
        for (let i = 0; i < localStorage.length; i++) {
          const name = localStorage.key(i)
          out.items.push({ name, value: localStorage.getItem(name) })
        }
        return out
      })
      if (result?.items?.length) {
        state.origins.push({ origin: result.origin, localStorage: result.items })
      }
    } catch {}
  }

  return state
}

export async function captureSnapshot(helper, {
  dir,
  prefix = 'snapshot',
  fullPage = false,
  captureURL = true,
  captureScreenshot = true,
  captureHTML = true,
  captureARIA = true,
  captureBrowserLogs = true,
  captureStorage = true,
} = {}) {
  if (!helper) return {}
  const out = {}

  if (captureURL) {
    try {
      if (helper.grabCurrentUrl) out.url = await helper.grabCurrentUrl()
    } catch {}
  }

  if (captureScreenshot && helper.saveScreenshot) {
    try {
      const file = `${prefix}_screenshot.png`
      await helper.saveScreenshot(path.join(dir, file), fullPage)
      out.screenshot = file
    } catch {}
  }

  if (captureHTML && helper.grabSource) {
    try {
      const html = await helper.grabSource()
      // Universal funnel: every captured HTML snapshot flows through formatHtml
      // (minify -> cleanHtml -> beautify). Don't add direct grabSource->writeFile
      // paths elsewhere; route through this util so trash-class cleanup stays
      // consistent across aiTrace, pageInfo, and MCP tools.
      const formatted = await formatHtml(html)
      const file = `${prefix}_page.html`
      fs.writeFileSync(path.join(dir, file), formatted)
      out.html = file
      // Expose pre-cleanup HTML for consumers that need to inspect classes
      // stripped by cleanHtml (e.g. pageInfo's error-class scan).
      out.htmlRaw = html
    } catch {}
  }

  if (captureARIA && helper.grabAriaSnapshot) {
    try {
      const aria = await helper.grabAriaSnapshot()
      const file = `${prefix}_aria.txt`
      fs.writeFileSync(path.join(dir, file), aria)
      out.aria = file
    } catch {}
  }

  if (captureBrowserLogs && helper.grabBrowserLogs) {
    try {
      const logs = await helper.grabBrowserLogs()
      const normalized = normalizeBrowserLogs(logs)
      const file = `${prefix}_console.json`
      fs.writeFileSync(path.join(dir, file), JSON.stringify(normalized, null, 2))
      out.console = file
      out.consoleCount = normalized.length
    } catch {}
  }

  if (captureStorage) {
    try {
      const state = await captureStorageState(helper)
      const cookieCount = state.cookies?.length || 0
      const localStorageCount = (state.origins || [])
        .reduce((sum, o) => sum + (o.localStorage?.length || 0), 0)
      if (cookieCount || localStorageCount) {
        const file = `${prefix}_storage.json`
        fs.writeFileSync(path.join(dir, file), JSON.stringify(state, null, 2))
        out.storage = file
        out.cookieCount = cookieCount
        out.localStorageCount = localStorageCount
      }
    } catch {}
  }

  return out
}

// ---------------------------------------------------------------------------
// TraceReader — read artifacts already on disk (written by aiTrace, MCP, etc.)
// ---------------------------------------------------------------------------

const KIND_SUFFIX = {
  aria: '_aria.txt',
  html: '_page.html',
  screenshot: '_screenshot.png',
  console: '_console.json',
  storage: '_storage.json',
}

export class TraceReader {
  constructor(dir) {
    this.dir = dir
  }

  // Filenames of a given kind, sorted in capture order. aiTrace prefixes with
  // a zero-padded step index (`0000_`, `0001_`...), so a lexical sort is
  // chronological.
  list(kind) {
    const suffix = KIND_SUFFIX[kind]
    if (!suffix || !this.dir || !fs.existsSync(this.dir)) return []
    let entries
    try { entries = fs.readdirSync(this.dir) } catch { return [] }
    return entries.filter(f => f.endsWith(suffix)).sort()
  }

  // Path of the n-th file of `kind`, or null. Python-style indexing:
  // 0..N-1 from the start, -1..-N from the end.
  pathAt(n, kind) {
    const files = this.list(kind)
    if (!files.length) return null
    const i = n < 0 ? files.length + n : n
    if (i < 0 || i >= files.length) return null
    return path.join(this.dir, files[i])
  }

  // Read content of the n-th file of `kind`. Binary kinds (screenshot) are
  // returned as Buffer; text kinds as utf8 string.
  nth(n, kind) {
    const p = this.pathAt(n, kind)
    if (!p) return null
    try {
      if (kind === 'screenshot') return fs.readFileSync(p)
      return fs.readFileSync(p, 'utf8')
    } catch { return null }
  }

  first(kind) { return this.nth(0, kind) }
  last(kind)  { return this.nth(-1, kind) }
  count(kind) { return this.list(kind).length }
}

export const ariaDiff = diffAriaSnapshots
