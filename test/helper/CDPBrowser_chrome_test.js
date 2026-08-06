import fs from 'fs'
import path from 'path'
import { expect } from 'chai'
import { spawn } from 'child_process'
import puppeteer from 'puppeteer'
import CDPBrowser from '../../lib/helper/CDPBrowser.js'
import TestHelper from '../support/TestHelper.js'
import * as cdpApiTests from './cdpwebapi.js'

const siteUrl = TestHelper.siteUrl()
let chrome
let I

describe('CDPBrowser (against Chrome)', function () {
  this.timeout(30000)

  before(async () => {
    chrome = spawn(puppeteer.executablePath(), ['--headless=new', '--remote-debugging-port=9333', '--no-sandbox', '--disable-gpu', 'about:blank'], { stdio: 'ignore' })
    await new Promise(r => setTimeout(r, 2000))
    I = new CDPBrowser({ url: siteUrl, endpoint: 'http://127.0.0.1:9333' })
    await I._init()
    cdpApiTests.init({ I, siteUrl })
  })

  after(async () => {
    await I._finishTest()
    chrome.kill()
  })

  beforeEach(async () => I._before())
  afterEach(async () => I._after())

  it('opens a page and grabs url/title/source', async () => {
    await I.amOnPage('/')
    expect(await I.grabCurrentUrl()).to.include(':8000')
    expect(await I.grabTitle()).to.equal('TestEd Beta 2.0')
    expect(await I.grabSource()).to.include('<html')
  })

  it('executes scripts with arguments', async () => {
    await I.amOnPage('/')
    const val = await I.executeScript((a, b) => a + b, 2, 3)
    expect(val).to.equal(5)
  })

  it('probes capabilities on a real browser', async () => {
    await I.amOnPage('/')
    expect(I.capabilities.layout).to.equal('real')
    expect(I.capabilities.xpath).to.equal('native')
  })

  it('resolves relative and absolute urls', async () => {
    await I.amOnPage('/info')
    expect(await I.grabCurrentUrl()).to.include('/info')
    await I.amOnPage(`${siteUrl}/login`)
    expect(await I.grabCurrentUrl()).to.include('/login')
  })

  it('see / dontSee against page text', async () => {
    await I.amOnPage('/')
    await I.see('Welcome to test app!')
    await I.dontSee('text that is not on the page')
    try {
      await I.see('text that is not on the page')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.expected).to.equal('text that is not on the page')
    }
  })

  it('seeElementInDOM and grabNumberOfElements', async () => {
    await I.amOnPage('/')
    await I.seeElementInDOM('#area1')
    await I.dontSeeElementInDOM('#no-such-element')
    expect(await I.grabNumberOfElements('#area1 a')).to.equal(1)
  })

  it('seeElement respects visibility on real-layout browsers', async () => {
    await I.amOnPage('/form/field')
    await I.seeElement('#name')
    await I.dontSeeElement('#email')
  })

  it('grabs text, value, attribute', async () => {
    await I.amOnPage('/form/field')
    expect(await I.grabTextFrom({ css: 'label' })).to.equal('Name')
    expect(await I.grabValueFrom('#name')).to.equal('OLD_VALUE')
    expect(await I.grabAttributeFrom('#name', 'type')).to.equal('text')
    expect(await I.grabTextFromAll('label')).to.be.an('array')
  })

  it('url and title assertions', async () => {
    await I.amOnPage('/info')
    await I.seeInCurrentUrl('/info')
    await I.dontSeeInCurrentUrl('/form')
    await I.amOnPage('/')
    await I.seeInTitle('TestEd')
  })

  it('clicks by CSS and by link text', async () => {
    await I.amOnPage('/')
    await I.click('#link')
    await I.seeInCurrentUrl('/info')
    await I.amOnPage('/')
    await I.click('More info')
    await I.seeInCurrentUrl('/info')
  })

  it('forceClick works via synthetic click', async () => {
    await I.amOnPage('/')
    await I.forceClick('More info')
    await I.seeInCurrentUrl('/info')
  })

  it('fills a field by label and submits a form', async () => {
    await I.amOnPage('/form/field')
    await I.fillField('Name', 'cdp tester')
    await I.click('Submit')
    await I.waitInUrl('/form/complex', 5)
    await I.see('Thank you!')
    await I.see('cdp tester')
  })

  it('checks and unchecks options', async () => {
    await I.amOnPage('/form/checkbox')
    await I.checkOption('I Agree')
    await I.seeCheckboxIsChecked('#checkin')
    await I.uncheckOption('#checkin')
    await I.dontSeeCheckboxIsChecked('#checkin')
  })

  it('selects an option by label', async () => {
    await I.amOnPage('/form/select')
    await I.selectOption('Select your age', '21-60')
    expect(await I.grabValueFrom('#age')).to.equal('adult')
  })

  it('waits for elements and text', async () => {
    await I.amOnPage('/')
    await I.waitForElement('#area1', 2)
    await I.waitForText('Welcome', 2)
    await I.waitForFunction(() => document.readyState === 'complete', [], 2)
  })

  it('manages cookies', async () => {
    await I.amOnPage('/')
    await I.setCookie({ name: 'ctest', value: 'v1' })
    const cookie = await I.grabCookie('ctest')
    expect(cookie.value).to.equal('v1')
    await I.clearCookie('ctest')
    expect(await I.grabCookie('ctest')).to.equal(undefined)
  })

  it('takes a screenshot on capable browsers', async () => {
    global.output_dir = 'test/data/output'
    await I.amOnPage('/')
    const fileName = 'cdp_chrome.png'
    await I.saveScreenshot(fileName)
    const filePath = path.join(global.output_dir, fileName)
    try {
      expect(fs.existsSync(filePath)).to.equal(true)
      expect(fs.statSync(filePath).size).to.be.above(0)
    } finally {
      fs.rmSync(filePath, { force: true })
    }
  })

  it('rejects a cdp click on a zero-size element', async () => {
    await I.amOnPage('/form/field')
    try {
      await I.click({ css: '#email' })
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.match(/zero size/)
    }
  })

  cdpApiTests.tests()
})
