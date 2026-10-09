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

const mainFrame = url => ({ url: () => url, parentFrame: () => null })

const visit = async url => {
  event.dispatcher.emit(event.step.started, {})
  page.emit('framenavigated', mainFrame(url))
}

describe('sitemap plugin', () => {
  beforeEach(() => {
    recorder.reset()
    recorder.start()
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sitemap-'))
    originalOutputDir = store.outputDir
    store.outputDir = outputDir
    page = new EventEmitter()
    page.url = () => 'about:blank'
    container.clear({
      Puppeteer: {
        options: {},
        page,
      },
    })
  })

  afterEach(() => {
    event.dispatcher.removeAllListeners(event.step.started)
    event.dispatcher.removeAllListeners(event.test.started)
    event.dispatcher.removeAllListeners(event.all.result)
    event.dispatcher.removeAllListeners(event.workers.before)
    event.dispatcher.removeAllListeners(event.workers.result)
    store.outputDir = originalOutputDir
    fs.rmSync(outputDir, { recursive: true, force: true })
  })

  it('writes unique visited pages to sitemap.xml', async () => {
    sitemap({})
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

  it('ignores iframe navigations and attaches to a page once', async () => {
    sitemap({})
    event.dispatcher.emit(event.step.started, {})
    event.dispatcher.emit(event.step.started, {})
    expect(page.listenerCount('framenavigated')).to.equal(1)
    page.emit('framenavigated', { url: () => 'http://localhost:8000/frame', parentFrame: () => ({}) })
    page.emit('framenavigated', mainFrame('http://localhost:8000/spa-route'))
    event.dispatcher.emit(event.all.result, {})

    const xml = fs.readFileSync(path.join(outputDir, 'sitemap.xml'), 'utf8')
    expect(xml.match(/<loc>/g).length).to.equal(1)
    expect(xml).to.include('<loc>http://localhost:8000/spa-route</loc>')
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
