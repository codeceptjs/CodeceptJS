import path from 'path'
import assert from 'assert'
import { fileURLToPath } from 'url'
import TestHelper from '../support/TestHelper.js'
import TestCafe from '../../lib/helper/TestCafe.js'
import webApiTests from './webapi.js'
import * as codeceptjs from '../../lib/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.codeceptjs = codeceptjs

let I
const siteUrl = TestHelper.siteUrl()

describe('TestCafe', function () {
  this.timeout(60000) // Reduced timeout from 120s to 60s for faster feedback
  this.retries(1)

  before(() => {
    global.codecept_dir = path.join(__dirname, '/../data')
    global.output_dir = path.join(__dirname, '/../data/output')

    I = new TestCafe({
      url: siteUrl,
      windowSize: '1000x700',
      show: false,
      browser: 'chrome:headless --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu',
      restart: false,
      waitForTimeout: 50000,
    })
    I._init()
    return I._beforeSuite()
  })

  after(() => {
    return I._finishTest()
  })

  beforeEach(() => {
    webApiTests.init({
      I,
      siteUrl,
    })
    return I._before().then(() => {
      page = I.page
      browser = I.browser
    })
  })

  afterEach(() => {
    return I._after()
  })

  describe('open page : #amOnPage', () => {
    it('should open main page of configured site', async () => {
      await I.amOnPage('/')
      const url = await I.grabCurrentUrl()
      await url.should.eql(`${siteUrl}/`)
    })
    it('should open any page of configured site', async () => {
      await I.amOnPage('/info')
      const url = await I.grabCurrentUrl()
      return url.should.eql(`${siteUrl}/info`)
    })

    it('should open absolute url', async () => {
      await I.amOnPage(siteUrl)
      const url = await I.grabCurrentUrl()
      return url.should.eql(`${siteUrl}/`)
    })
  })

  describe('#waitForFunction', () => {
    it('should wait for function returns true', () => {
      return I.amOnPage('/form/wait_js').then(() => I.waitForFunction(() => window.__waitJs, 3))
    })

    it('should pass arguments and wait for function returns true', () => {
      return I.amOnPage('/form/wait_js').then(() => I.waitForFunction(varName => window[varName], ['__waitJs'], 3))
    })
  })

  webApiTests.tests()

  describe('#useTestCafeTo', () => {
    it('should return title', async () => {
      await I.amOnPage('/')
      const title = await I.useTestCafeTo('test', async ({ t }) => {
        return t.eval(() => document.title, { boundTestRun: null })
      })
      assert.equal('TestEd Beta 2.0', title)
    })
  })
})
