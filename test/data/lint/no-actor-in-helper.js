import Helper from '@codeceptjs/helper'

class MyHelper extends Helper {
  async login() {
    const { I } = inject()
    I.amOnPage('/login')
  }

  async open() {
    const { Playwright } = this.helpers
    await Playwright.amOnPage('/')
  }
}

class PageObject {
  open() {
    const { I } = inject()
    I.amOnPage('/')
  }
}

export default MyHelper
