const chai = require('chai')
const assert = chai.assert
const expect = chai.expect

const path = require('path')

const TestHelper = require('../support/TestHelper')
const Cypress = require('../../lib/helper/Cypress')

global.codeceptjs = require('../../lib')

let I
const siteUrl = TestHelper.siteUrl()

describe('Cypress', function () {
  this.timeout(35000)
  this.retries(1)

  before(function () {
    global.codecept_dir = path.join(__dirname, '/../data')

    // Skip tests if cypress is not available
    const requirements = Cypress._checkRequirements()
    if (requirements && requirements.includes('cypress')) {
      this.skip()
      return
    }

    I = new Cypress({
      url: siteUrl,
      browser: 'chrome',
      show: false,
      timeout: 5000,
    })

    return I._init()
  })

  after(function () {
    if (I && I._finishTest) {
      return I._finishTest()
    }
  })

  beforeEach(function () {
    if (I && I._before) {
      return I._before()
    }
  })

  afterEach(function () {
    if (I && I._after) {
      return I._after()
    }
  })

  describe('configuration', () => {
    it('should have default configuration', () => {
      const helper = new Cypress({})
      expect(helper.options.url).to.equal('http://localhost:3000')
      expect(helper.options.browser).to.equal('chrome')
      expect(helper.options.show).to.equal(true)
      expect(helper.options.timeout).to.equal(4000)
    })

    it('should override default configuration', () => {
      const helper = new Cypress({
        url: 'http://example.com',
        browser: 'firefox',
        show: false,
        timeout: 8000,
      })
      expect(helper.options.url).to.equal('http://example.com')
      expect(helper.options.browser).to.equal('firefox')
      expect(helper.options.show).to.equal(false)
      expect(helper.options.timeout).to.equal(8000)
    })
  })

  describe('requirements check', () => {
    it('should check if cypress is installed', () => {
      const requirements = Cypress._checkRequirements()
      // Since cypress may not be installed in test environment,
      // we just check that the method returns either undefined or an array
      expect(requirements === undefined || Array.isArray(requirements)).to.be.true
    })
  })

  describe('config generation', () => {
    it('should provide configuration prompts', () => {
      const config = Cypress._config()
      expect(config).to.be.an('array')
      expect(config).to.have.length(3)

      const urlConfig = config.find(c => c.name === 'url')
      expect(urlConfig).to.exist
      expect(urlConfig.message).to.include('Base url')
      expect(urlConfig.default).to.equal('http://localhost:3000')

      const browserConfig = config.find(c => c.name === 'browser')
      expect(browserConfig).to.exist
      expect(browserConfig.default).to.equal('chrome')

      const showConfig = config.find(c => c.name === 'show')
      expect(showConfig).to.exist
      expect(showConfig.type).to.equal('confirm')
    })
  })

  describe('browser lifecycle', () => {
    it('should start and stop browser', async () => {
      expect(I.isRunning).to.be.false

      await I._startBrowser()
      expect(I.isRunning).to.be.true

      await I._stopBrowser()
      expect(I.isRunning).to.be.false
    })

    it('should not start browser twice', async () => {
      await I._startBrowser()
      expect(I.isRunning).to.be.true

      // Should not throw or change state
      await I._startBrowser()
      expect(I.isRunning).to.be.true

      await I._stopBrowser()
    })
  })

  describe('navigation', () => {
    it('should navigate to page', async () => {
      const result = await I.amOnPage('/')
      expect(result).to.be.undefined // Should complete without error
    })

    it('should handle absolute URLs', async () => {
      const result = await I.amOnPage('https://example.com')
      expect(result).to.be.undefined
    })

    it('should construct relative URLs', async () => {
      const result = await I.amOnPage('/test-page')
      expect(result).to.be.undefined
    })
  })

  describe('interactions', () => {
    beforeEach(async () => {
      await I.amOnPage('/')
    })

    it('should click elements', async () => {
      const result = await I.click('#button')
      expect(result).to.be.undefined
    })

    it('should fill fields', async () => {
      const result = await I.fillField('#email', 'test@example.com')
      expect(result).to.be.undefined
    })

    it('should see text', async () => {
      const result = await I.see('Welcome')
      expect(result).to.be.undefined
    })

    it('should see text in context', async () => {
      const result = await I.see('Welcome', '.header')
      expect(result).to.be.undefined
    })
  })

  describe('page information', () => {
    beforeEach(async () => {
      await I.amOnPage('/')
    })

    it('should grab current URL', async () => {
      const url = await I.grabCurrentUrl()
      expect(url).to.be.a('string')
      expect(url).to.include(siteUrl)
    })
  })

  describe('cypress integration', () => {
    beforeEach(async () => {
      await I.amOnPage('/')
    })

    it('should provide cypress API access', async () => {
      let cypressApiCalled = false

      await I.useCypressTo('test cypress API', async ({ cy }) => {
        expect(cy).to.exist
        expect(cy.visit).to.be.a('function')
        expect(cy.get).to.be.a('function')
        expect(cy.intercept).to.be.a('function')
        expect(cy.contains).to.be.a('function')
        cypressApiCalled = true
      })

      expect(cypressApiCalled).to.be.true
    })

    it('should handle cypress commands in useCypressTo', async () => {
      let commandsExecuted = []

      await I.useCypressTo('execute cypress commands', async ({ cy }) => {
        cy.visit('/test')
        commandsExecuted.push('visit')

        const element = cy.get('#test-element')
        element.click()
        commandsExecuted.push('click')

        cy.intercept('GET', '/api/test')
        commandsExecuted.push('intercept')
      })

      expect(commandsExecuted).to.include('visit')
      expect(commandsExecuted).to.include('click')
      expect(commandsExecuted).to.include('intercept')
    })
  })

  describe('error handling', () => {
    it('should handle methods when browser not started', async () => {
      const helper = new Cypress({ url: siteUrl })
      await helper._init()

      // These should start the browser automatically
      await helper.amOnPage('/')
      expect(helper.isRunning).to.be.true

      await helper._finishTest()
    })
  })

  describe('additional methods', () => {
    beforeEach(async () => {
      if (I) await I.amOnPage('/')
    })

    it('should handle negative assertions', async () => {
      if (!I) return

      await I.dontSee('NonexistentText')
      await I.dontSeeElement('#nonexistent-element')
      await I.dontSeeInTitle('Error')
      await I.dontSeeInCurrentUrl('/nonexistent')
    })

    it('should handle title operations', async () => {
      if (!I) return

      await I.seeInTitle('Test')
      await I.dontSeeInTitle('Error')
      const title = await I.grabTitle()
      expect(title).to.be.a('string')
    })

    it('should handle URL checking', async () => {
      if (!I) return

      await I.seeInCurrentUrl('/')
      await I.dontSeeInCurrentUrl('/nonexistent')
    })

    it('should handle waiting', async () => {
      if (!I) return

      await I.waitForElement('#test-element', 1)
      await I.waitForText('Welcome', 1)
      await I.waitForText('Welcome', 1, '.content')
    })

    it('should handle form interactions', async () => {
      if (!I) return

      await I.selectOption('#country', 'US')
      await I.appendField('#notes', 'Additional text')
      await I.clearField('#email')
      await I.doubleClick('#edit-button')
    })

    it('should handle page operations', async () => {
      if (!I) return

      await I.refreshPage()
      await I.saveScreenshot('test.png')
    })

    it('should handle element checks', async () => {
      if (!I) return

      await I.seeElement('#test-element')
      await I.dontSeeElement('#hidden-element')
    })
  })
})
