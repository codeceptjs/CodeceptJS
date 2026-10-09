import { expect } from 'chai'
import fs from 'fs'
import { EventEmitter } from 'events'
import os from 'os'
import path from 'path'
import sitemap from '../../../lib/plugin/sitemap.js'
import container from '../../../lib/container.js'
import event from '../../../lib/event.js'
import recorder from '../../../lib/recorder.js'
import store from '../../../lib/store.js'

let page
let outputDir
let originalOutputDir

const createPage = () => {
  const p = new EventEmitter()
  p.currentUrl = 'about:blank'
  p.url = () => p.currentUrl
  return p
}

const startTest = async () => {
  event.dispatcher.emit(event.test.started, {})
  await recorder.promise()
}

const visit = async url => {
  page.currentUrl = url
  page.emit('load', page)
}

describe('sitemap plugin', () => {
  beforeEach(() => {
    recorder.reset()
    recorder.start()
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-'))
    originalOutputDir = store.outputDir
    store.outputDir = outputDir
    page = createPage()
    const browser = new EventEmitter()
    browser.pages = async () => [page]
    container.clear({
      Puppeteer: {
        options: {},
        browser,
      },
    })
  })

  afterEach(() => {
    event.dispatcher.removeAllListeners(event.test.started)
    event.dispatcher.removeAllListeners(event.all.result)
    event.dispatcher.removeAllListeners(event.workers.before)
    event.dispatcher.removeAllListeners(event.workers.result)
    store.outputDir = originalOutputDir
    fs.rmSync(outputDir, { recursive: true, force: true })
  })

  it('writes unique visited pages to sitemap.xml', async () => {
    sitemap({})
    await startTest()
    await visit('http://localhost:8000/')
    await visit('http://localhost:8000/form/field#top')
    await visit('http://localhost:8000/form/field')
    await visit('about:blank')
    await visit('http://localhost:8000/search?q=a&b=c')
    event.dispatcher.emit(event.all.result, {})

    const xml = fs.readFileSync(path.join(outputDir, 'sitemap.xml'), 'utf8')
    expect(xml).to.include('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml.match(/<loc>/g).length).to.equal(3)
    expect(xml).to.include('<loc>http://localhost:8000/</loc>')
    expect(xml).to.include('<loc>http://localhost:8000/form/field</loc>')
    expect(xml).to.include('<loc>http://localhost:8000/search?q=a&amp;b=c</loc>')
    expect(xml).not.to.include('about:blank')
  })

  it('records SPA route changes and ignores iframe navigations', async () => {
    sitemap({})
    await startTest()
    await startTest()
    expect(page.listenerCount('load')).to.equal(1)
    page.emit('framenavigated', { url: () => 'http://localhost:8000/frame', parentFrame: () => ({}) })
    page.emit('framenavigated', { url: () => 'http://localhost:8000/spa-route', parentFrame: () => null })
    event.dispatcher.emit(event.all.result, {})

    const xml = fs.readFileSync(path.join(outputDir, 'sitemap.xml'), 'utf8')
    expect(xml.match(/<loc>/g).length).to.equal(1)
    expect(xml).to.include('<loc>http://localhost:8000/spa-route</loc>')
  })

  it('attaches to Puppeteer pages opened later', async () => {
    sitemap({})
    await startTest()
    const newTab = createPage()
    newTab.currentUrl = 'http://localhost:8000/new-tab'
    const browser = container.helpers('Puppeteer').browser
    browser.emit('targetcreated', { type: () => 'page', page: async () => newTab })
    browser.emit('targetcreated', { type: () => 'service_worker', page: async () => null })
    await new Promise(resolve => setImmediate(resolve))
    newTab.currentUrl = 'http://localhost:8000/new-tab/next'
    newTab.emit('load', newTab)
    event.dispatcher.emit(event.all.result, {})

    const xml = fs.readFileSync(path.join(outputDir, 'sitemap.xml'), 'utf8')
    expect(xml).to.include('<loc>http://localhost:8000/new-tab</loc>')
    expect(xml).to.include('<loc>http://localhost:8000/new-tab/next</loc>')
  })

  it('attaches to Playwright contexts and pages once per browser', async () => {
    const context = new EventEmitter()
    context.pages = () => [page]
    const browser = new EventEmitter()
    browser.contexts = () => [context]
    container.clear({ Playwright: { options: {}, browser } })

    sitemap({})
    await startTest()
    await startTest()
    expect(browser.listenerCount('context')).to.equal(1)
    expect(page.listenerCount('load')).to.equal(1)

    await visit('http://localhost:8000/')
    const sessionContext = new EventEmitter()
    sessionContext.pages = () => []
    browser.emit('context', sessionContext)
    const sessionPage = createPage()
    sessionContext.emit('page', sessionPage)
    sessionPage.currentUrl = 'http://localhost:8000/session'
    sessionPage.emit('load', sessionPage)
    event.dispatcher.emit(event.all.result, {})

    const xml = fs.readFileSync(path.join(outputDir, 'sitemap.xml'), 'utf8')
    expect(xml.match(/<loc>/g).length).to.equal(2)
    expect(xml).to.include('<loc>http://localhost:8000/session</loc>')
  })

  it('collects pages from WebDriver BiDi events', async () => {
    const browser = new EventEmitter()
    browser.capabilities = { webSocketUrl: 'ws://localhost' }
    browser.subscribed = []
    browser.sessionSubscribe = async ({ events }) => browser.subscribed.push(...events)
    container.clear({ WebDriver: { options: {}, browser } })

    sitemap({})
    event.dispatcher.emit(event.test.started, {})
    await recorder.promise()
    expect(browser.subscribed).to.include('browsingContext.load')

    browser.emit('browsingContext.contextCreated', { context: 'frame-1', parent: 'top' })
    browser.emit('browsingContext.load', { context: 'top', url: 'http://localhost:8000/' })
    browser.emit('browsingContext.load', { context: 'frame-1', url: 'http://localhost:8000/frame' })
    browser.emit('browsingContext.historyUpdated', { context: 'top', url: 'http://localhost:8000/spa-route' })
    event.dispatcher.emit(event.all.result, {})

    const xml = fs.readFileSync(path.join(outputDir, 'sitemap.xml'), 'utf8')
    expect(xml.match(/<loc>/g).length).to.equal(2)
    expect(xml).not.to.include('/frame')
  })

  it('strips query strings when configured', async () => {
    sitemap({ stripQuery: true, outputName: 'pages.xml' })
    await startTest()
    await visit('http://localhost:8000/posts?page=1')
    await visit('http://localhost:8000/posts?page=2')
    event.dispatcher.emit(event.all.result, {})

    const xml = fs.readFileSync(path.join(outputDir, 'pages.xml'), 'utf8')
    expect(xml.match(/<loc>/g).length).to.equal(1)
    expect(xml).to.include('<loc>http://localhost:8000/posts</loc>')
  })

  it('merges worker partials on workers.result', async () => {
    sitemap({})
    fs.writeFileSync(path.join(outputDir, '.sitemap.1.1.json'), JSON.stringify(['http://localhost:8000/a']))
    fs.writeFileSync(path.join(outputDir, '.sitemap.1.2.json'), JSON.stringify(['http://localhost:8000/b', 'http://localhost:8000/a']))
    event.dispatcher.emit(event.workers.result, {})

    const xml = fs.readFileSync(path.join(outputDir, 'sitemap.xml'), 'utf8')
    expect(xml.match(/<loc>/g).length).to.equal(2)
    expect(fs.readdirSync(outputDir)).to.deep.equal(['sitemap.xml'])
  })

  it('does not write a file when no pages were visited', () => {
    sitemap({})
    event.dispatcher.emit(event.all.result, {})
    expect(fs.existsSync(path.join(outputDir, 'sitemap.xml'))).to.equal(false)
  })
})
