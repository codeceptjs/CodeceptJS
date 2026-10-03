import { expect } from 'chai'
import sinon from 'sinon'
import path from 'path'
import { fileURLToPath } from 'url'
import { resolveInitScripts } from '../../../lib/helper/extras/initScripts.js'
import Playwright from '../../../lib/helper/Playwright.js'
import Puppeteer from '../../../lib/helper/Puppeteer.js'
import WebDriver from '../../../lib/helper/WebDriver.js'
import CDPBrowser from '../../../lib/helper/CDPBrowser.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const initFile = path.resolve(__dirname, '../../data/init-scripts/init.js')
const fileSource = "window.__codeceptInit = 'from file'\n"

describe('initScripts config', () => {
  describe('#resolveInitScripts', () => {
    it('should return empty list when not set', () => {
      expect(resolveInitScripts()).to.eql([])
    })

    it('should read files and serialize functions', () => {
      const scripts = resolveInitScripts([initFile, () => (window.__fn = 1)])
      expect(scripts[0]).to.equal(fileSource)
      expect(scripts[1]).to.equal('(() => (window.__fn = 1))();')
    })

    it('should accept a single script', () => {
      expect(resolveInitScripts(initFile)).to.eql([fileSource])
    })

    it('should throw for missing file', () => {
      expect(() => resolveInitScripts('./no-such-script.js')).to.throw('not found')
    })

    it('should throw for unsupported value', () => {
      expect(() => resolveInitScripts([42])).to.throw('Invalid init script')
    })
  })

  describe('Playwright', () => {
    it('should add init scripts once per browser context', async () => {
      const I = new Playwright({ url: 'http://localhost', initScripts: initFile })
      const context = { addInitScript: sinon.stub().resolves() }
      await I._addInitScripts(context)
      await I._addInitScripts(context)
      expect(context.addInitScript.calledOnceWith({ content: fileSource })).to.equal(true)
    })
  })

  describe('Puppeteer', () => {
    it('should add init scripts once per page', async () => {
      const I = new Puppeteer({ url: 'http://localhost', initScripts: initFile })
      const page = { evaluateOnNewDocument: sinon.stub().resolves() }
      await Promise.all([I._addInitScripts(page), I._addInitScripts(page)])
      expect(page.evaluateOnNewDocument.calledOnceWith(fileSource)).to.equal(true)
    })
  })

  describe('WebDriver', () => {
    it('should add BiDi preload scripts', async () => {
      const I = new WebDriver({ url: 'http://localhost', browser: 'chrome', initScripts: initFile })
      const browser = { isBidi: true, scriptAddPreloadScript: sinon.stub().resolves() }
      await I._addInitScripts(browser)
      expect(browser.scriptAddPreloadScript.calledOnceWith({ functionDeclaration: `() => {\n${fileSource}\n}` })).to.equal(true)
    })

    it('should require BiDi protocol', async () => {
      const I = new WebDriver({ url: 'http://localhost', browser: 'chrome', initScripts: initFile })
      let error
      await I._addInitScripts({ isBidi: false }).catch(e => (error = e))
      expect(error.message).to.include('BiDi')
    })
  })

  describe('CDPBrowser', () => {
    it('should resolve init scripts from config', () => {
      const I = new CDPBrowser({ initScripts: initFile })
      expect(I.initScripts).to.eql([fileSource])
    })
  })
})
