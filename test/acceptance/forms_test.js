Feature('Form filling')

Scenario('fill a field by label and submit, then see the posted value @Obscura @Playwright @Puppeteer', ({ I }) => {
  I.amOnPage('/form/field')
  I.fillField('Name', 'Alice Example')
  I.click('Submit')
  I.see('[name] => Alice Example')
})

Scenario('check a checkbox by its label and submit @Obscura @Playwright @Puppeteer', ({ I }) => {
  I.amOnPage('/form/checkbox')
  I.checkOption('I Agree')
  I.seeCheckboxIsChecked('#checkin')
  I.click('Submit')
  I.see('[terms] => agree')
})

Scenario('select an option, read the value back, then submit @Obscura @Playwright @Puppeteer', async ({ I }) => {
  I.amOnPage('/form/select')
  I.selectOption('Select your age', '13-21')
  const value = await I.grabValueFrom('#age')
  I.expectEqual(value, 'teenage')
  I.click('Submit')
  I.see('[age] => teenage')
})

Scenario('fill several fields on a multi-field form and submit @Obscura @Playwright @Puppeteer', ({ I }) => {
  I.amOnPage('/form/complex')
  I.fillField('Name', 'Bob Multi')
  I.fillField('Description', 'a multi-field submission')
  I.selectOption('Select your age', '21-60')
  I.click('Submit')
  I.see('[name] => Bob Multi')
  I.see('[description] => a multi-field submission')
  I.see('[age] => adult')
})

Scenario('clear and append a pre-filled field @Obscura @Playwright @Puppeteer', ({ I }) => {
  I.amOnPage('/form/field')
  I.seeInField('#name', 'OLD_VALUE')
  I.clearField('#name')
  I.fillField('#name', 'fresh')
  I.seeInField('#name', 'fresh')
  I.appendField('#name', '-appended')
  I.seeInField('#name', 'fresh-appended')
})
