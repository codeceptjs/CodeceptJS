import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { expect } from 'chai'
import Kitesurf from '../../lib/helper/Kitesurf.js'
import TestHelper from '../support/TestHelper.js'
import * as webApiTests from './webapi.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const siteUrl = TestHelper.siteUrl()
const endpoint = process.env.KITESURF_ENDPOINT || 'http://127.0.0.1:8787'
let I

const isUp = url =>
  fetch(url).then(
    res => res.ok,
    () => false,
  )

describe('Kitesurf helper (local engine)', function () {
  this.timeout(35000)

  before(async function () {
    global.codecept_dir = path.join(__dirname, '/../data')

    for (const url of [`${siteUrl}/info`, `${endpoint}/json/version`]) {
      if (await isUp(url)) continue
      const msg = `${url} is not reachable — ALL Kitesurf tests will be skipped.\n  Start the test app:  php -S 127.0.0.1:8000 -t test/data/app\n  Start Kitesurf:      pnpm run dev (in a cloudflare/kitesurf checkout)`
      console.log(`\n  ⚠ ${msg}\n`)
      if (!process.env.CI) this.skip()
      throw new Error(msg)
    }

    I = new Kitesurf({ url: siteUrl, endpoint })
    await I._connect()
    webApiTests.init({ I, siteUrl })
  })

  after(async () => I && I._finishTest())
  beforeEach(async () => I._before())
  afterEach(async () => I._after())

  it('attaches to the endpoint without Cloudflare credentials', async () => {
    expect(I.selfHosted).to.equal(true)
    expect(I.cloudSessionId).to.equal(null)
  })

  it('clicks by link text and asserts after navigation', async () => {
    await I.amOnPage('/')
    await I.click('More info')
    await I.seeInCurrentUrl('/info')
    await I.see('Information')
  })

  webApiTests.tests()
})

describe('Kitesurf helper config', () => {
  it('uses Cloudflare Browser Run when no endpoint is set', async () => {
    const helper = new Kitesurf({ url: siteUrl })
    helper.options.accountId = ''
    helper.options.apiToken = ''
    expect(helper.selfHosted).to.equal(false)
    try {
      await helper._resolveEndpoint()
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.include('Kitesurf requires accountId and apiToken')
    }
  })

  it('connects to an explicit endpoint', () => {
    const helper = new Kitesurf({ url: siteUrl, endpoint: 'http://127.0.0.1:8787' })
    expect(helper.selfHosted).to.equal(true)
    expect(helper.options.endpoint).to.equal('http://127.0.0.1:8787')
  })
})

describe('Kitesurf helper (Cloudflare Browser Run)', function () {
  this.timeout(120000)
  let cloud

  before(async function () {
    global.codecept_dir = path.join(__dirname, '/../data')
    if (!process.env.CF_ACCOUNT_ID || !process.env.CF_API_TOKEN) this.skip()
    cloud = new Kitesurf({ url: 'https://example.com' })
    await cloud._init()
  })

  after(async () => cloud && cloud._finishTest())
  beforeEach(async () => cloud._before())
  afterEach(async () => cloud._after())

  it('opens a public page, asserts text and title', async () => {
    await cloud.amOnPage('https://example.com')
    await cloud.see('Example Domain')
    await cloud.seeInTitle('Example Domain')
  })
})
