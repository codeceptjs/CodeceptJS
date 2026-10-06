Feature('raw')

Scenario('raw', async ({ I }) => {
  await I.usePlaywrightTo('click', async ({ page }) => page.click('#a'))
  I.executeScript(() => window.scrollTo(0, 0))
  I.click('Login')
})

Before(({ I }) => {
  I.executeScript(() => localStorage.clear())
})

export const page = {
  reset() {
    I.useWebDriverTo('reset', async ({ browser }) => browser.reloadSession())
  },
}
