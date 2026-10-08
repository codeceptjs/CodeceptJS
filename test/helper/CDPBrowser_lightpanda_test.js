import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { expect } from 'chai'
import Lightpanda from '../../lib/helper/Lightpanda.js'
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

describe('Lightpanda helper (self-managed lightpanda serve)', function () {
  this.timeout(35000)

  before(async function () {
    global.codecept_dir = path.join(__dirname, '/../data')

    if (!(await isUp(`${siteUrl}/info`))) {
      const msg = `Test app is not running on ${siteUrl} — ALL Lightpanda tests will be skipped.\n  Start it:    php -S 127.0.0.1:8000 -t test/data/app`
      console.log(`\n  ⚠ ${msg}\n`)
      if (!process.env.CI) this.skip()
      throw new Error(msg)
    }

    I = new Lightpanda({ url: siteUrl })
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

  it('launches its own server on a free port', async () => {
    expect(I.mode).to.equal('self-managed')
    expect(I.serverProcess.pid).to.be.a('number')
    expect(I.options.endpoint).to.equal(`http://127.0.0.1:${I.options.port}`)
  })

  it('clicks by link text (synthetic) and asserts after navigation', async () => {
    await I.amOnPage('/')
    await I.click('More info')
    await I.seeInCurrentUrl('/info')
    await I.see('Information')
  })

  it('checks visibility without a rendering engine', async () => {
    await I.amOnPage('/form/field')
    await I.seeElement('input[name=name]')
    await I.dontSeeElement('#does-not-exist')
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

describe('Lightpanda helper config and spawn lifecycle (does not touch :9222)', function () {
  this.timeout(30000)

  it('presets synthetic input, real layout and no screenshots', () => {
    const helper = new Lightpanda({ url: siteUrl })
    expect(helper.options.input).to.equal('synthetic')
    expect(helper.capabilities.layout).to.equal('real')
    expect(helper.capabilities.screenshot).to.equal(false)
  })

  it('keeps the layout preset when capabilities are partially overridden', () => {
    const helper = new Lightpanda({ url: siteUrl, capabilities: { xpath: 'polyfill' } })
    expect(helper.capabilities.layout).to.equal('real')
    expect(helper.capabilities.screenshot).to.equal(false)
    expect(helper.capabilities.xpath).to.equal('polyfill')
  })

  it('only attaches when endpoint is set explicitly', () => {
    const helper = new Lightpanda({ url: siteUrl, endpoint: 'http://127.0.0.1:9222', binaryPath: '/no/such/lightpanda' })
    expect(helper.mode).to.equal('attach')
    expect(helper.server).to.equal(null)
    expect(helper.options.endpoint).to.equal('http://127.0.0.1:9222')
  })

  it('fails fast on bad binaryPath', async () => {
    const badI = new Lightpanda({ url: siteUrl, binaryPath: '/no/such/lightpanda-xyz', port: 9457 })
    try {
      await badI._connect()
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.match(/Failed to start lightpanda/)
    } finally {
      await badI._finishTest()
    }
  })

  it('names its own binary, env var and releases when nothing can be resolved', async () => {
    const helper = new Lightpanda({ url: siteUrl })
    helper._resolveBinary = () => null
    helper._probeUp = async () => false
    try {
      await helper._connect()
      throw new Error('should have thrown')
    } catch (err) {
      expect(err.message).to.include('Lightpanda has no endpoint configured')
      expect(err.message).to.include('LIGHTPANDA_PATH')
      expect(err.message).to.include('lightpanda serve --host 127.0.0.1 --port 9222')
      expect(err.message).to.include('https://github.com/lightpanda-io/browser/releases')
    }
  })

  it('spawns serve with telemetry disabled and reaps the process', async () => {
    const outputDir = path.join(process.cwd(), 'test/data/output')
    const fakeBinaryPath = path.join(outputDir, 'lightpanda-fake-recorder')
    const recordPath = path.join(outputDir, 'lightpanda-fake-recorder.json')
    fs.mkdirSync(outputDir, { recursive: true })
    fs.rmSync(recordPath, { force: true })
    fs.writeFileSync(
      fakeBinaryPath,
      `#!/usr/bin/env node\nprocess.getBuiltinModule("fs").writeFileSync(${JSON.stringify(recordPath)}, JSON.stringify({ argv: process.argv.slice(2), telemetry: process.env.LIGHTPANDA_DISABLE_TELEMETRY }))\nsetInterval(() => {}, 1000)\n`,
    )
    fs.chmodSync(fakeBinaryPath, 0o755)
    const fakeI = new Lightpanda({ url: siteUrl, binaryPath: fakeBinaryPath, port: 9458, serverStartTimeout: 2000 })
    try {
      let connectError = null
      try {
        await fakeI._connect()
      } catch (err) {
        connectError = err
      }
      expect(connectError.message).to.include('lightpanda did not start on port 9458')
      const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'))
      expect(record.argv).to.deep.equal(['serve', '--host', '127.0.0.1', '--port', '9458'])
      expect(record.telemetry).to.equal('true')
      const pid = fakeI.serverProcess.pid
      await fakeI._finishTest()
      expect(() => process.kill(pid, 0)).to.throw()
    } finally {
      fs.rmSync(fakeBinaryPath, { force: true })
      fs.rmSync(recordPath, { force: true })
    }
  })
})
