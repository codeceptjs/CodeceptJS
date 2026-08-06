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
})
