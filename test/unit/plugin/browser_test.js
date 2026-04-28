import { expect } from 'chai'
import Config from '../../../lib/config.js'
import container from '../../../lib/container.js'
import event from '../../../lib/event.js'
import output from '../../../lib/output.js'
import recorder from '../../../lib/recorder.js'

// This test imports the plugin directly, bypassing the runner. The runner
// (lib/codecept.js) is what normally installs globalThis.codeceptjs so that
// @codeceptjs/configure can reach framework singletons; do the same here.
globalThis.codeceptjs = { config: Config, container, event, output, recorder }

import browser from '../../../lib/plugin/browser.js'

async function applyAndCreate(args, base = {}) {
  Config.reset()
  await browser({ _args: args })
  return Config.create(base)
}

describe('browser plugin', () => {
  beforeEach(() => Config.reset())

  it('does nothing when no args passed', async () => {
    const cfg = await applyAndCreate([], { helpers: { Playwright: { show: true } } })
    expect(cfg.helpers.Playwright.show).to.equal(true)
  })

  describe('show / hide flags', () => {
    it('show forces headed for Playwright + Puppeteer', async () => {
      const cfg = await applyAndCreate(['show'], {
        helpers: { Playwright: { show: false }, Puppeteer: { show: false } },
      })
      expect(cfg.helpers.Playwright.show).to.equal(true)
      expect(cfg.helpers.Puppeteer.show).to.equal(true)
    })

    it('hide forces headless for Playwright + Puppeteer', async () => {
      const cfg = await applyAndCreate(['hide'], {
        helpers: { Playwright: { show: true }, Puppeteer: { show: true } },
      })
      expect(cfg.helpers.Playwright.show).to.equal(false)
      expect(cfg.helpers.Puppeteer.show).to.equal(false)
    })

    it('hide injects --headless into WebDriver chrome capability args', async () => {
      const cfg = await applyAndCreate(['hide'], {
        helpers: { WebDriver: { browser: 'chrome' } },
      })
      const args = cfg.helpers.WebDriver.desiredCapabilities.chromeOptions.args
      expect(args).to.include('--headless')
    })

    it('show strips --headless from WebDriver chrome capability args', async () => {
      const cfg = await applyAndCreate(['show'], {
        helpers: {
          WebDriver: { browser: 'chrome', desiredCapabilities: { chromeOptions: { args: ['--headless', '--disable-gpu'] } } },
        },
      })
      const args = cfg.helpers.WebDriver.desiredCapabilities.chromeOptions.args
      expect(args).not.to.include('--headless')
      expect(args).to.include('--disable-gpu')
    })
  })

  describe('windowSize', () => {
    it('windowSize=WxH sets windowSize across browser helpers and chrome args', async () => {
      const cfg = await applyAndCreate(['windowSize=800x600'], {
        helpers: { Playwright: {}, Puppeteer: {}, WebDriver: {} },
      })
      expect(cfg.helpers.Playwright.windowSize).to.equal('800x600')
      expect(cfg.helpers.Playwright.chromium.args).to.include('--window-size=800,600')
      expect(cfg.helpers.Puppeteer.windowSize).to.equal('800x600')
      expect(cfg.helpers.WebDriver.windowSize).to.equal('800x600')
    })
  })

  describe('generic key=value passthrough', () => {
    it('coerces booleans and applies to every browser helper present', async () => {
      const cfg = await applyAndCreate(['video=false'], {
        helpers: { Playwright: {}, Puppeteer: {}, WebDriver: {}, Appium: {} },
      })
      expect(cfg.helpers.Playwright.video).to.equal(false)
      expect(cfg.helpers.Puppeteer.video).to.equal(false)
      expect(cfg.helpers.WebDriver.video).to.equal(false)
      expect(cfg.helpers.Appium.video).to.equal(false)
    })

    it('keeps numbers as strings (helpers coerce as needed)', async () => {
      const cfg = await applyAndCreate(['waitForTimeout=5000'], {
        helpers: { Playwright: {} },
      })
      expect(cfg.helpers.Playwright.waitForTimeout).to.equal('5000')
    })

    it('keeps strings as strings', async () => {
      const cfg = await applyAndCreate(['url=http://staging.test'], {
        helpers: { Playwright: {} },
      })
      expect(cfg.helpers.Playwright.url).to.equal('http://staging.test')
    })

    it('skips helpers not present in config without errors', async () => {
      const cfg = await applyAndCreate(['video=true'], {
        helpers: { Playwright: {} },
      })
      expect(cfg.helpers.Playwright.video).to.equal(true)
      expect(cfg.helpers.Puppeteer).to.equal(undefined)
    })
  })

  describe('browser engine selection', () => {
    it('browser=firefox routes through setBrowser, Puppeteer gets product', async () => {
      const cfg = await applyAndCreate(['browser=firefox'], {
        helpers: { Puppeteer: {}, Playwright: {} },
      })
      expect(cfg.helpers.Puppeteer.product).to.equal('firefox')
      expect(cfg.helpers.Puppeteer.browser).to.equal(undefined)
      expect(cfg.helpers.Playwright.browser).to.equal('firefox')
    })

    it('browser=webkit + show=false combine cleanly', async () => {
      const cfg = await applyAndCreate(['hide', 'browser=webkit'], {
        helpers: { Playwright: { show: true } },
      })
      expect(cfg.helpers.Playwright.browser).to.equal('webkit')
      expect(cfg.helpers.Playwright.show).to.equal(false)
    })
  })

  describe('combined args', () => {
    it('applies show + windowSize + key=value in a single call', async () => {
      const cfg = await applyAndCreate(['show', 'windowSize=1024x768', 'video=false'], {
        helpers: { Playwright: { show: false }, Puppeteer: { show: false }, WebDriver: { browser: 'chrome' } },
      })
      expect(cfg.helpers.Playwright.show).to.equal(true)
      expect(cfg.helpers.Playwright.windowSize).to.equal('1024x768')
      expect(cfg.helpers.Playwright.video).to.equal(false)
      expect(cfg.helpers.Puppeteer.show).to.equal(true)
      expect(cfg.helpers.Puppeteer.windowSize).to.equal('1024x768')
      expect(cfg.helpers.WebDriver.windowSize).to.equal('1024x768')
    })
  })

  describe('unknown arg', () => {
    it('does not throw when an arg has no value and is not a flag', async () => {
      let threw = false
      try { await applyAndCreate(['weirdtoken'], { helpers: { Playwright: {} } }) } catch { threw = true }
      expect(threw).to.equal(false)
    })
  })
})
