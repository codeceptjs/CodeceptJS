import { expect } from 'chai'
import Kitesurf from '../../lib/helper/Kitesurf.js'
import * as cdpApiTests from './cdpwebapi.js'

let I
const isTunnel = Boolean(process.env.SITE_URL && !process.env.SITE_URL.includes('127.0.0.1'))
const siteUrl = isTunnel ? process.env.SITE_URL : 'https://example.com'

describe('Kitesurf helper (Cloudflare Browser Run beta)', function () {
  this.timeout(120000)

  before(async function () {
    if (!process.env.CF_ACCOUNT_ID || !process.env.CF_API_TOKEN) this.skip()
    I = new Kitesurf({ url: siteUrl })
    await I._init()
    cdpApiTests.init({ I, siteUrl })
  })

  after(async () => I && I._finishTest())
  beforeEach(async function () {
    if (!I) this.skip()
    await I._before()
  })
  afterEach(async () => I && I._after())

  it('opens a public page, asserts text and title', async () => {
    await I.amOnPage('/')
    await I.see('Example Domain')
    await I.seeInTitle('Example Domain')
    expect(I.capabilities.layout).to.equal('real')
  })

  it('clicks a link by text using CDP input', async () => {
    await I.amOnPage('/')
    await I.click('More information...')
    await I.waitInUrl('iana', 15)
  })

  it('fills a public form by label and submits', async () => {
    await I.amOnPage('https://httpbin.org/forms/post')
    await I.fillField('Customer name', 'Kitesurf Tester')
    await I.checkOption('Bacon')
    await I.click('Submit order')
    await I.waitInUrl('/post', 20)
    await I.see('Kitesurf Tester')
    await I.see('bacon')
  })

  it('takes a real screenshot', async () => {
    await I.amOnPage('/')
    await I.saveScreenshot('kitesurf_helper.png')
  })

  cdpApiTests.publicTests()
  if (isTunnel) cdpApiTests.tests()
})
