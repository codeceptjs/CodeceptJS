import { expect } from 'chai'
import Kitesurf from '../../lib/helper/Kitesurf.js'

let I

describe('Kitesurf helper (Cloudflare Browser Run beta)', function () {
  this.timeout(120000)

  before(async function () {
    if (!process.env.CF_ACCOUNT_ID || !process.env.CF_API_TOKEN) this.skip()
    I = new Kitesurf({ url: 'https://example.com' })
    await I._init()
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
})
