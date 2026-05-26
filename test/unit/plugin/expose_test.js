import { expect } from 'chai'
import Container from '../../../lib/container.js'
import expose from '../../../lib/plugin/expose.js'

async function setup(helpers) {
  await Container.create({ helpers: {} })
  Object.assign(Container.helpers(), helpers)
}

describe('expose plugin', () => {
  afterEach(async () => {
    await Container.clear()
  })

  describe('registration', () => {
    it('registers each inject name as a function-typed support entry', async () => {
      await setup({ Playwright: { page: null, browser: null } })
      expose({ inject: { page: 'Playwright.page', browser: 'Playwright.browser' } })
      expect(typeof Container.support('page')).to.equal('function')
      expect(typeof Container.support('browser')).to.equal('function')
    })

    it('makes the injected proxy resolve to the helper property when present', async () => {
      const fakePage = { url: () => 'http://example.com' }
      await setup({ Playwright: { page: fakePage } })
      expose({ inject: { page: 'Playwright.page' } })
      const page = Container.support('page')
      expect(page.url()).to.equal('http://example.com')
    })
  })

  describe('live proxy', () => {
    it('reflects mid-test reassignment of helper.page (tab switch)', async () => {
      const helper = { page: { url: () => 'http://first.com' } }
      await setup({ Playwright: helper })
      expose({ inject: { page: 'Playwright.page' } })
      const page = Container.support('page')
      expect(page.url()).to.equal('http://first.com')
      helper.page = { url: () => 'http://second.com' }
      expect(page.url()).to.equal('http://second.com')
    })

    it('returns undefined for any property when helper.page is null (post-cleanup, dry-run)', async () => {
      await setup({ Playwright: { page: null } })
      expose({ inject: { page: 'Playwright.page' } })
      const page = Container.support('page')
      expect(page.click).to.equal(undefined)
      expect(page.evaluate).to.equal(undefined)
    })

    it('binds method calls to the current helper.page so `this` resolves correctly', async () => {
      const helper = {
        page: {
          name: 'one',
          who() { return this.name },
        },
      }
      await setup({ Playwright: helper })
      expose({ inject: { page: 'Playwright.page' } })
      const page = Container.support('page')
      expect(page.who()).to.equal('one')
      helper.page = { name: 'two', who() { return this.name } }
      expect(page.who()).to.equal('two')
    })

    it('does not wrap method results in MetaStep (returns raw values)', async () => {
      const ctx = { kind: 'BrowserContext' }
      await setup({ Playwright: { page: { context: () => ctx } } })
      expose({ inject: { page: 'Playwright.page' } })
      const page = Container.support('page')
      expect(page.context()).to.equal(ctx)
    })
  })

  describe('shorthand', () => {
    it('resolves to the first configured standard browser helper', async () => {
      const fakePage = { mark: 'puppeteer' }
      await setup({ Puppeteer: { page: fakePage } })
      expose({ inject: { page: 'page' } })
      expect(Container.support('page').mark).to.equal('puppeteer')
    })

    it('rejects unknown shorthand properties', async () => {
      await setup({ Playwright: {} })
      expect(() => expose({ inject: { x: 'unknownProp' } })).to.throw(/shorthand 'unknownProp' is not a known helper property/)
    })
  })

  describe('validation', () => {
    it('throws when injection name is reserved', async () => {
      await setup({ Playwright: { page: null } })
      expect(() => expose({ inject: { I: 'Playwright.page' } })).to.throw(/inject name 'I' is reserved/)
    })

    it('throws when explicit helper is not configured', async () => {
      await setup({})
      expect(() => expose({ inject: { page: 'Playwright.page' } })).to.throw(/helper 'Playwright' is not configured/)
    })

    it('throws when shorthand has no candidate helper', async () => {
      await setup({})
      expect(() => expose({ inject: { page: 'page' } })).to.throw(/no standard browser helper configured/)
    })

    it('throws on malformed value', async () => {
      await setup({ Playwright: {} })
      expect(() => expose({ inject: { page: 'Playwright.' } })).to.throw(/invalid inject value/)
    })

    it('accepts empty inject', async () => {
      await setup({ Playwright: { page: null } })
      expect(() => expose({})).not.to.throw()
    })
  })
})
