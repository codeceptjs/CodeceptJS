import { expect } from 'chai'
import Obscura from '../../lib/helper/Obscura.js'
import TestHelper from '../support/TestHelper.js'

const siteUrl = TestHelper.siteUrl()
let I

describe('Obscura helper (against obscura serve on :9222)', function () {
  this.timeout(30000)

  before(async function () {
    try {
      await fetch('http://127.0.0.1:9222/json/version')
    } catch (e) {
      if (!process.env.CI) this.skip()
      throw new Error('obscura serve is not running on :9222')
    }
    I = new Obscura({ url: siteUrl })
    await I._init()
  })

  after(async () => I && I._finishTest())
  beforeEach(async () => I._before())
  afterEach(async () => I._after())

  it('presets synthetic input and polyfilled xpath', async () => {
    await I.amOnPage('/')
    expect(I.options.input).to.equal('synthetic')
    expect(I.capabilities.layout).to.equal('none')
  })

  it('clicks by link text (synthetic) and asserts after navigation', async () => {
    await I.amOnPage('/')
    await I.click('More info')
    await I.seeInCurrentUrl('/info')
    await I.see('Information')
  })

  it('rejects visibility assertions with a clear message', async () => {
    await I.amOnPage('/')
    try {
      await I.seeElement('#area1')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.include('layout engine')
    }
  })

  it('rejects screenshots with a clear message', async () => {
    await I.amOnPage('/')
    try {
      await I.saveScreenshot('nope.png')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.include('no rendering engine')
    }
  })
})
