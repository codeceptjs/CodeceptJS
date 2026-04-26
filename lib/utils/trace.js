import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import Container from '../container.js'
import { clearString } from '../utils.js'
import { formatHtml } from '../html.js'

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
  return `file://${path.join(dir, basename)}`
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
