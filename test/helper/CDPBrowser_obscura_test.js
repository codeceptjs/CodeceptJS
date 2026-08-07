import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
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

const findObscuraBinary = () => {
  if (process.env.OBSCURA_PATH) return process.env.OBSCURA_PATH
  try {
    return execSync('which obscura', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null
  } catch (e) {
    return null
  }
}

describe('Obscura helper (against obscura serve on :9222)', function () {
  this.timeout(35000)

  before(async function () {
    global.codecept_dir = path.join(__dirname, '/../data')

    let binaryPath = null
    if (!(await isUp('http://127.0.0.1:9222/json/version'))) {
      binaryPath = findObscuraBinary()
      if (!binaryPath) {
        const msg = [
          'Obscura is not running on 127.0.0.1:9222 and no obscura binary was found — ALL Obscura tests will be skipped.',
          'Start it:    obscura serve --port 9222 --allow-private-network',
          'Or install:  https://github.com/h4ckf0r0day/obscura/releases (put on PATH or set OBSCURA_PATH=/path/to/obscura)',
        ].join('\n  ')
        console.log(`\n  ⚠ ${msg}\n`)
        if (!process.env.CI) this.skip()
        throw new Error(msg)
      }
      console.log(`\n  ℹ Obscura not running on :9222 — auto-spawning from ${binaryPath}\n`)
    }

    if (!(await isUp(`${siteUrl}/info`))) {
      const msg = `Test app is not running on ${siteUrl} — ALL Obscura tests will be skipped.\n  Start it:    php -S 127.0.0.1:8000 -t test/data/app`
      console.log(`\n  ⚠ ${msg}\n`)
      if (!process.env.CI) this.skip()
      throw new Error(msg)
    }

    I = new Obscura({ url: siteUrl, ...(binaryPath ? { binaryPath } : {}) })
    await I._init()
    webApiTests.init({ I, siteUrl })
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
