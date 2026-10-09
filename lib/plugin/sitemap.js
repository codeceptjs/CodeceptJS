import fs from 'fs'
import path from 'path'
import { isMainThread, threadId } from 'worker_threads'
import { mkdirp } from 'mkdirp'
import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom'

import Container from '../container.js'
import event from '../event.js'
import recorder from '../recorder.js'
import store from '../store.js'
import output from '../output.js'

const defaultConfig = {
  outputName: 'sitemap.xml',
  output: null,
  stripQuery: false,
}

const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'
const PARTIAL_PREFIX = '.sitemap.'

/**
 * Collects all pages visited while tests are running and saves them as a [sitemap](https://www.sitemaps.org/protocol.html) XML file.
 *
 * The plugin listens to browser navigation events, so it doesn't slow down test steps.
 * Page loads and SPA route changes (`history.pushState`) of the top-level page are recorded, iframes are ignored.
 * Every unique `http(s)` URL is added to the sitemap. URL fragments (`#...`) are dropped.
 *
 * Supported helpers: Playwright, Puppeteer, and WebDriver with BiDi protocol enabled (default).
 * The sitemap is written once all tests finish.
 *
 * #### Configuration
 *
 * ```js
 * "plugins": {
 *    "sitemap": {
 *      "enabled": true
 *    }
 *  }
 * ```
 *
 * Possible config options:
 *
 * * `outputName`: file name for the sitemap. Default: `sitemap.xml`.
 * * `output`: directory where the sitemap is stored, relative to the project root. Default: the `output` directory.
 * * `stripQuery`: remove query strings so `/posts?page=1` and `/posts?page=2` become one `/posts` entry. Default: false.
 *
 * CLI examples:
 *
 * ```
 * npx codeceptjs run -p sitemap
 * npx codeceptjs run -p sitemap:outputName=visited.xml
 * ```
 *
 * Works with `run-workers`: URLs from all workers are merged into a single sitemap.
 *
 * @param {*} config
 */
export default function (config = {}) {
  config = Object.assign({}, defaultConfig, config)
  if (config.stripQuery === 'true') config.stripQuery = true

  const urls = new Set()

  const outputDir = () => {
    if (config.output) return path.resolve(store.codeceptDir || process.cwd(), config.output)
    return store.outputDir || process.cwd()
  }

  const addUrl = url => {
    if (!url) return
    let parsed
    try {
      parsed = new URL(url)
    } catch {
      return
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return
    parsed.hash = ''
    if (config.stripQuery) parsed.search = ''
    urls.add(parsed.toString())
  }

  const writeSitemap = list => {
    if (!list.length) return

    const dir = outputDir()
    mkdirp.sync(dir)
    const file = path.join(dir, config.outputName)
    fs.writeFileSync(file, buildXml(list.sort()))
    output.plugin('sitemap', `Sitemap with ${list.length} pages saved to ${file}`)
  }

  const attached = new WeakSet()

  const onLoad = page => addUrl(page.url())

  const onFrameNavigated = frame => {
    if (frame.parentFrame()) return
    addUrl(frame.url())
  }

  const attachPage = page => {
    if (!page || attached.has(page)) return
    attached.add(page)
    addUrl(page.url())
    page.on('load', onLoad)
    page.on('framenavigated', onFrameNavigated)
  }

  const attachContext = context => {
    attached.add(context)
    context.on('page', attachPage)
    context.pages().forEach(attachPage)
  }

  const attachPlaywright = browser => {
    if (!browser.contexts) return attachContext(browser)
    attached.add(browser)
    browser.on('context', attachContext)
    browser.contexts().forEach(attachContext)
  }

  const attachPuppeteer = async browser => {
    attached.add(browser)
    browser.on('targetcreated', async target => {
      if (target.type() !== 'page') return
      attachPage(await target.page())
    })
    for (const page of await browser.pages()) attachPage(page)
  }

  const subscribeBidi = async browser => {
    attached.add(browser)
    const frames = new Set()
    const onNavigation = params => {
      if (frames.has(params.context)) return
      addUrl(params.url)
    }
    browser.on('browsingContext.contextCreated', params => {
      if (params.parent) frames.add(params.context)
    })
    browser.on('browsingContext.load', onNavigation)
    browser.on('browsingContext.historyUpdated', onNavigation)
    try {
      await browser.sessionSubscribe({ events: ['browsingContext.contextCreated', 'browsingContext.load'] })
    } catch (err) {
      output.plugin('sitemap', `Can't subscribe to navigation events: ${err.message}`)
    }
    try {
      await browser.sessionSubscribe({ events: ['browsingContext.historyUpdated'] })
    } catch {}
  }

  event.dispatcher.on(event.test.started, () => {
    const helpers = Container.helpers()

    if (helpers.Playwright) {
      const browser = helpers.Playwright.browser
      if (browser && !attached.has(browser)) attachPlaywright(browser)
      return
    }

    if (helpers.Puppeteer) {
      const browser = helpers.Puppeteer.browser
      if (!browser || attached.has(browser)) return
      recorder.add('sitemap: listen to navigation', () => attachPuppeteer(browser), true)
      return
    }

    if (helpers.WebDriver) {
      const browser = helpers.WebDriver.browser
      if (!browser || attached.has(browser)) return
      if (!browser.capabilities || !browser.capabilities.webSocketUrl) {
        attached.add(browser)
        output.plugin('sitemap', 'WebDriver BiDi protocol is disabled, visited pages are not collected')
        return
      }
      recorder.add('sitemap: subscribe to navigation', () => subscribeBidi(browser), true)
    }
  })

  const partialFiles = dir => {
    if (!fs.existsSync(dir)) return []
    return fs
      .readdirSync(dir)
      .filter(name => name.startsWith(PARTIAL_PREFIX) && name.endsWith('.json'))
      .map(name => path.join(dir, name))
  }

  event.dispatcher.on(event.all.result, () => {
    if (isMainThread) {
      if (store.workerMode) return
      writeSitemap([...urls])
      return
    }
    if (!urls.size) return
    const dir = outputDir()
    mkdirp.sync(dir)
    fs.writeFileSync(path.join(dir, `${PARTIAL_PREFIX}${process.pid}.${threadId}.json`), JSON.stringify([...urls]))
  })

  event.dispatcher.on(event.workers.before, () => {
    for (const partial of partialFiles(outputDir())) fs.unlinkSync(partial)
  })

  event.dispatcher.on(event.workers.result, () => {
    for (const partial of partialFiles(outputDir())) {
      try {
        for (const url of JSON.parse(fs.readFileSync(partial, 'utf8'))) urls.add(url)
      } catch {}
      fs.unlinkSync(partial)
    }
    writeSitemap([...urls])
  })
}

function buildXml(list) {
  const doc = new DOMImplementation().createDocument(SITEMAP_NS, 'urlset', null)
  const urlset = doc.documentElement
  for (const url of list) {
    const urlEl = doc.createElementNS(SITEMAP_NS, 'url')
    const locEl = doc.createElementNS(SITEMAP_NS, 'loc')
    locEl.appendChild(doc.createTextNode(url))
    urlEl.appendChild(doc.createTextNode('\n    '))
    urlEl.appendChild(locEl)
    urlEl.appendChild(doc.createTextNode('\n  '))
    urlset.appendChild(doc.createTextNode('\n  '))
    urlset.appendChild(urlEl)
  }
  urlset.appendChild(doc.createTextNode('\n'))
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(doc)}\n`
}
