import { expect } from 'chai'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolveExtensions, extensionArgs } from '../../../lib/helper/extras/extensions.js'
import Playwright from '../../../lib/helper/Playwright.js'
import Puppeteer from '../../../lib/helper/Puppeteer.js'
import WebDriver from '../../../lib/helper/WebDriver.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const extension = path.resolve(__dirname, '../../data/extension')

describe('browser extensions config', () => {
  describe('#resolveExtensions', () => {
    it('should return empty list when not set', () => {
      expect(resolveExtensions()).to.eql([])
    })

    it('should accept a single path and a list of paths', () => {
      expect(resolveExtensions(extension)).to.eql([extension])
      expect(resolveExtensions([extension])).to.eql([extension])
    })

    it('should throw when directory has no manifest.json', () => {
      expect(() => resolveExtensions(__dirname)).to.throw('manifest.json not found')
    })
  })

  describe('#extensionArgs', () => {
    it('should add load flags and keep other args', () => {
      expect(extensionArgs(['/a', '/b'], ['--no-sandbox'])).to.eql(['--no-sandbox', '--disable-extensions-except=/a,/b', '--load-extension=/a,/b'])
    })

    it('should merge with extensions already passed in args', () => {
      const args = extensionArgs(['/b'], ['--load-extension=/a', '--disable-extensions-except=/a'])
      expect(args).to.eql(['--disable-extensions-except=/a,/b', '--load-extension=/a,/b'])
      expect(extensionArgs(['/b'], args)).to.eql(args)
    })
  })

  describe('Playwright', () => {
    it('should launch persistent chromium context with extensions', () => {
      const I = new Playwright({ url: 'http://localhost', show: false, extensions: extension })
      expect(I.playwrightOptions.args).to.include(`--load-extension=${extension}`)
      expect(I.playwrightOptions.userDataDir).to.be.a('string')
      expect(I.userDataDir).to.be.a('string')
      expect(I.playwrightOptions.channel).to.equal('chromium')
    })

    it('should keep custom executablePath and userDataDir', () => {
      const I = new Playwright({ url: 'http://localhost', browser: 'chromium', extensions: extension, chromium: { executablePath: '/bin/chrome', userDataDir: '/tmp/profile' } })
      expect(I.playwrightOptions.channel).to.be.undefined
      expect(I.playwrightOptions.userDataDir).to.equal('/tmp/profile')
    })

    it('should apply chromium options when browser is not set explicitly', () => {
      const I = new Playwright({ url: 'http://localhost', extensions: extension, chromium: { executablePath: '/bin/chrome' } })
      expect(I.playwrightOptions.executablePath).to.equal('/bin/chrome')
      expect(I.playwrightOptions.channel).to.be.undefined
    })

    it('should not allow extensions in other browsers', () => {
      expect(() => new Playwright({ url: 'http://localhost', browser: 'firefox', extensions: extension })).to.throw('only in chromium')
    })
  })

  describe('Puppeteer', () => {
    it('should pass extension args to chrome', () => {
      const I = new Puppeteer({ url: 'http://localhost', extensions: extension, chrome: { args: ['--no-sandbox'] } })
      expect(I.puppeteerOptions.args).to.eql(['--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`])
      expect(I.puppeteerOptions.enableExtensions).to.equal(true)
      expect(I.puppeteerOptions.ignoreDefaultArgs).to.include('--disable-extensions')
    })

    it('should not allow extensions for remote browser', () => {
      expect(() => new Puppeteer({ url: 'http://localhost', extensions: extension, chrome: { browserWSEndpoint: 'ws://localhost:3000' } })).to.throw('remote')
    })
  })

  describe('WebDriver', () => {
    it('should add extension args to goog:chromeOptions', () => {
      const I = new WebDriver({ url: 'http://localhost', browser: 'chrome', extensions: extension, desiredCapabilities: { 'goog:chromeOptions': { args: ['--headless=new'] } } })
      expect(I.options.capabilities['goog:chromeOptions'].args).to.eql(['--headless=new', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`])
    })

    it('should add extension args to ms:edgeOptions', () => {
      const I = new WebDriver({ url: 'http://localhost', browser: 'MicrosoftEdge', extensions: extension })
      expect(I.options.capabilities['ms:edgeOptions'].args).to.include(`--load-extension=${extension}`)
    })

    it('should not allow extensions in firefox', () => {
      expect(() => new WebDriver({ url: 'http://localhost', browser: 'firefox', extensions: extension })).to.throw('only in chrome')
    })
  })
})
