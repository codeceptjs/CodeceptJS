Feature('clean')

Scenario('clean', async ({ I }) => {
  I.amOnPage('/')
  I.fillField('Password', secret('123456'))
  I.waitForElement('#ok')
  const title = await I.grabTitle()
  I.see(title)
})
