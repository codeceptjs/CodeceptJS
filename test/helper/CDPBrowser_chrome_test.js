import { expect } from 'chai'
import { spawn } from 'child_process'
import puppeteer from 'puppeteer'
import CDPBrowser from '../../lib/helper/CDPBrowser.js'
import TestHelper from '../support/TestHelper.js'

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
})
