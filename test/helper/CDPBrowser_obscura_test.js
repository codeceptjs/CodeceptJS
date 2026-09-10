import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { expect } from 'chai'
import Obscura from '../../lib/helper/Obscura.js'
import TestHelper from '../support/TestHelper.js'
import * as webApiTests from './webapi.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const siteUrl = TestHelper.siteUrl()
let I

const isUp = url =>
  fetch(url).then(
    () => true,
    () => false,
  )

describe('Obscura helper (self-managed obscura serve)', function () {
  this.timeout(35000)

  before(async function () {
    global.codecept_dir = path.join(__dirname, '/../data')

    if (!(await isUp(`${siteUrl}/info`))) {
      const msg = `Test app is not running on ${siteUrl} — ALL Obscura tests will be skipped.\n  Start it:    php -S 127.0.0.1:8000 -t test/data/app`
      console.log(`\n  ⚠ ${msg}\n`)
      if (!process.env.CI) this.skip()
      throw new Error(msg)
    }

    I = new Obscura({ url: siteUrl })
    try {
      await I._connect()
    } catch (err) {
      console.log(`\n  ⚠ ${err.message}\n`)
      if (!process.env.CI) this.skip()
      throw err
    }
    webApiTests.init({ I, siteUrl })
  })

  after(async () => I && I._finishTest())
  beforeEach(async () => I._before())
  afterEach(async () => I._after())

  it('presets synthetic input, detects layout capability per binary', async () => {
    await I.amOnPage('/')
    expect(I.options.input).to.equal('synthetic')
    expect(['real', 'none']).to.include(I.capabilities.layout)
  })

  it('clicks by link text (synthetic) and asserts after navigation', async () => {
    await I.amOnPage('/')
    await I.click('More info')
    await I.seeInCurrentUrl('/info')
    await I.see('Information')
  })

  it('amOnPage does not pile extra latency on top of a JS-heavy page (regression guard)', async () => {
    const start = Date.now()
    await I.amOnPage('/view/js_heavy.php')
    const candidates = I._candidates('a')
    await I._run(candidates, 'count')
    const elapsed = Date.now() - start
    expect(elapsed).to.be.below(4000, `amOnPage + first action took ${elapsed}ms against a page with ~1.5s of post-load isolate activity`)
  })

  it('rejects visibility assertions with a clear message when there is no layout engine', async function () {
    await I.amOnPage('/')
    if (I.capabilities.layout !== 'none') this.skip() // this binary has a real layout engine; seeElement works instead of throwing
    try {
      await I.seeElement('#area1')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.include('layout engine')
    }
  })

  it('rejects screenshots with a clear message when there is no rendering engine', async function () {
    await I.amOnPage('/')
    if (I.capabilities.screenshot !== false) this.skip() // this binary can render; saveScreenshot works instead of throwing
    try {
      await I.saveScreenshot('nope.png')
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.include('no rendering engine')
    }
  })

  webApiTests.tests()
})

describe('Obscura helper spawn lifecycle (does not touch :9222)', function () {
  this.timeout(30000)

  it('fails fast on bad binaryPath', async () => {
    const badI = new Obscura({ url: siteUrl, binaryPath: '/no/such/obscura-xyz', port: 9455 })
    try {
      await badI._connect()
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.match(/Failed to start obscura/)
    } finally {
      await badI._finishTest()
    }
  })

  it('kills a SIGTERM-ignoring child within bounds', async () => {
    const fakeBinaryPath = path.join(process.cwd(), 'test/data/output/obscura-fake-sigterm-ignorer')
    fs.writeFileSync(fakeBinaryPath, '#!/usr/bin/env node\nprocess.on("SIGTERM", () => {})\nsetInterval(() => {}, 1000)\n')
    fs.chmodSync(fakeBinaryPath, 0o755)
    const fakeI = new Obscura({ url: siteUrl, binaryPath: fakeBinaryPath, port: 9456, serverStartTimeout: 2000 })
    try {
      let connectError = null
      try {
        await fakeI._connect()
      } catch (err) {
        connectError = err
      }
      expect(connectError, '_connect should have rejected because the fake binary never serves /json/version').to.not.equal(null)
      const pid = fakeI.serverProcess && fakeI.serverProcess.pid
      expect(pid).to.be.a('number')
      await fakeI._finishTest()
      expect(() => process.kill(pid, 0)).to.throw()
    } finally {
      fs.rmSync(fakeBinaryPath, { force: true })
    }
  })
})
