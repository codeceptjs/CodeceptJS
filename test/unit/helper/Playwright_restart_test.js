import { expect } from 'chai'
import Playwright from '../../../lib/helper/Playwright.js'

describe('Playwright restart strategy', () => {
  function countBrowserStarts(restart) {
    const helper = new Playwright({ browser: 'chromium', url: 'http://localhost', restart })
    let starts = 0
    helper._startBrowser = async () => {
      starts++
    }
    return { helper, starts: () => starts }
  }

  it('should not start a browser before a suite when each test starts its own browser (#5784)', async () => {
    for (const restart of [true, 'browser']) {
      const { helper, starts } = countBrowserStarts(restart)
      await helper._beforeSuite()
      expect(starts(), `restart: ${restart}`).to.equal(0)
    }
  })

  it('should start the browser before a suite when tests share it', async () => {
    for (const restart of [false, 'context', 'session']) {
      const { helper, starts } = countBrowserStarts(restart)
      await helper._beforeSuite()
      expect(starts(), `restart: ${restart}`).to.equal(1)
    }
  })
})
