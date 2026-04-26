import fs from 'fs'
import path from 'path'
import { formatHtml } from '../html.js'

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
