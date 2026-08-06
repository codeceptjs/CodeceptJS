import { expect } from 'chai'

let I
let siteUrl

export function init(testData) {
  I = testData.I
  siteUrl = testData.siteUrl
}

export function tests() {
  const isHelper = name => I.constructor.name === name

  describe('#amOnPage and url/title assertions', () => {
    it('opens relative url and checks title', async () => {
      await I.amOnPage('/')
      await I.seeInCurrentUrl('/')
      await I.seeInTitle('TestEd Beta 2.0')
    })
  })

  describe('#see', () => {
    it('sees and dontSees page text', async () => {
      await I.amOnPage('/')
      await I.see('Welcome to test app!')
      await I.dontSee('this text is not on the page')
    })

    it('sees text within a context element', async () => {
      await I.amOnPage('/')
      await I.see('Test Link', '#area1')
    })
  })

  describe('#click', () => {
    it('clicks a link by CSS and lands on the page', async () => {
      await I.amOnPage('/')
      await I.click('#link')
      await I.seeInCurrentUrl('/info')
    })

    it('clicks a link by text and asserts after navigation', async () => {
      await I.amOnPage('/')
      await I.click('More info')
      await I.seeInCurrentUrl('/info')
      await I.see('Information')
    })
  })

  describe('#forms', () => {
    it('fills a field by label, submits, sees posted data', async () => {
      await I.amOnPage('/form/field')
      await I.fillField('Name', 'cdp shared spec')
      await I.click('Submit')
      await I.waitInUrl('/form/complex', 5)
      await I.see('Thank you!')
      await I.see('cdp shared spec')
    })

    it('checks an option by label', async () => {
      await I.amOnPage('/form/checkbox')
      await I.checkOption('I Agree')
      await I.seeCheckboxIsChecked('#checkin')
    })

    it('selects an option by label and reads the value back', async () => {
      await I.amOnPage('/form/select')
      await I.selectOption('Select your age', '21-60')
      expect(await I.grabValueFrom('#age')).to.equal('adult')
    })

    it('inline event handlers fire on checkOption', async function () {
      if (isHelper('Obscura')) this.skip()
      await I.amOnPage('/form/checkbox')
      await I.checkOption('I Agree')
      await I.see('ticked', '#notice')
    })

    it('select state survives form submission', async function () {
      if (isHelper('Obscura')) this.skip()
      await I.amOnPage('/form/select')
      await I.selectOption('Select your age', '21-60')
      await I.click('Submit')
      await I.see('adult')
    })
  })

  describe('#grabbers', () => {
    it('grabs text, value, attribute, count', async () => {
      await I.amOnPage('/form/field')
      expect(await I.grabTextFrom({ css: 'label' })).to.equal('Name')
      expect(await I.grabValueFrom('#name')).to.equal('OLD_VALUE')
      expect(await I.grabAttributeFrom('#name', 'type')).to.equal('text')
      expect(await I.grabNumberOfElements('input')).to.be.above(1)
    })
  })

  describe('#visibility', () => {
    it('visibility assertions work on layout browsers', async function () {
      if (I.capabilities.layout === 'none') this.skip()
      await I.amOnPage('/form/field')
      await I.seeElement('#name')
      await I.dontSeeElement('#email')
    })

    it('DOM presence assertions work everywhere', async () => {
      await I.amOnPage('/form/field')
      await I.seeElementInDOM('#email')
      await I.dontSeeElementInDOM('#no-such')
    })
  })

  describe('#waits', () => {
    it('waits for element, text, function', async () => {
      await I.amOnPage('/')
      await I.waitForElement('#area1', 2)
      await I.waitForText('Welcome', 2)
      await I.waitForFunction(() => document.readyState === 'complete', [], 2)
    })
  })

  describe('#cookies', () => {
    it('sets, grabs and clears a cookie', async () => {
      await I.amOnPage('/')
      await I.setCookie({ name: 'shared', value: 'spec' })
      expect((await I.grabCookie('shared')).value).to.equal('spec')
      await I.clearCookie('shared')
      expect(await I.grabCookie('shared')).to.equal(undefined)
    })
  })
}

export function publicTests() {
  describe('#public pages', () => {
    it('opens example.com and asserts', async () => {
      await I.amOnPage('https://example.com')
      await I.see('Example Domain')
      await I.seeInTitle('Example Domain')
    })

    it('clicks by link text on a public page', async () => {
      await I.amOnPage('https://example.com')
      await I.click('More information...')
      await I.waitInUrl('iana', 15)
    })

    it('fills a public form by label', async () => {
      await I.amOnPage('https://httpbin.org/forms/post')
      await I.fillField('Customer name', 'shared spec')
      await I.checkOption('Bacon')
      await I.click('Submit order')
      await I.waitInUrl('/post', 20)
      await I.see('shared spec')
    })
  })
}
