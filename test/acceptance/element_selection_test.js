import assert from 'assert'
import { container, event } from '../../lib/index.js'
import { tryTo } from '../../lib/effects.js'

Feature('element selection chain')

function setStrict(value) {
  Object.values(container.helpers()).forEach(helper => {
    if (helper.options) helper.options.strict = value
  })
}

Before(() => setStrict(true))
After(() => setStrict(false))

const allHelpers = '@Playwright @Puppeteer @WebDriverIO'
const browserOnly = '@Playwright @Puppeteer'
const strictPage = '/form/strict_mode'
const buttons = '.duplicate-btn'
const fields = 'input[name="duplicate-field"]'
const checkboxes = 'input[name="terms"]'

function seeOnlyFieldFilled(I, position) {
  for (const current of [1, 2, 3]) {
    const field = { css: `${fields}:nth-of-type(${current})` }
    if (current === position) I.seeInField(field, 'chained')
    else I.dontSeeInField(field, 'chained')
  }
}

const actions = [
  ['click', allHelpers, strictPage, I => I.click(buttons)],
  ['forceClick', allHelpers, strictPage, I => I.forceClick(buttons)],
  ['doubleClick', allHelpers, strictPage, I => I.doubleClick(buttons)],
  ['rightClick', allHelpers, strictPage, I => I.rightClick(buttons)],
  ['fillField', allHelpers, strictPage, I => I.fillField(fields, 'value')],
  ['appendField', allHelpers, strictPage, I => I.appendField(fields, 'value')],
  ['clearField', allHelpers, strictPage, I => I.clearField(fields)],
  ['checkOption', allHelpers, strictPage, I => I.checkOption(checkboxes)],
  ['uncheckOption', allHelpers, strictPage, I => I.uncheckOption(checkboxes)],
  ['selectOption', allHelpers, '/form/field_values', I => I.selectOption('select', 'not seen two')],
  ['attachFile', allHelpers, '/form/file', I => I.attachFile('input[type="file"]', '../data/app/avatar.jpg')],
  ['moveCursorTo', browserOnly, strictPage, I => I.moveCursorTo(buttons)],
  ['focus', browserOnly, strictPage, I => I.focus(fields)],
  ['blur', browserOnly, strictPage, I => I.blur(fields)],
  ['scrollTo', browserOnly, strictPage, I => I.scrollTo(buttons)],
  ['saveElementScreenshot', '@Playwright', strictPage, I => I.saveElementScreenshot(buttons, 'element_selection.png')],
  ['clickXY', '@Playwright', strictPage, I => I.clickXY(buttons, 1, 1)],
  ['clickLink', '@Puppeteer', '/info', I => I.clickLink('a[href]')],
]

for (const [name, helpers, page, action] of actions) {
  Scenario(`${name} requires a selection in strict mode ${helpers}`, async ({ I }) => {
    I.amOnPage(page)
    let error
    event.dispatcher.once(event.step.failed, (step, err) => (error = err))
    await tryTo(() => action(I))
    assert.equal(error?.constructor.name, 'MultipleElementsFound')
  })

  Scenario(`${name} works with first() in strict mode ${helpers}`, async ({ I }) => {
    I.amOnPage(page)
    await action(I).first()
  })

  Scenario(`${name} reads the selected position ${helpers}`, async ({ I }) => {
    I.amOnPage(page)
    let error
    event.dispatcher.once(event.step.failed, (step, err) => (error = err))
    await tryTo(() => action(I).at(100))
    assert.match(error?.message || '', /exceeds the number of elements/)
  })
}

Scenario(`first() selects the first match ${allHelpers}`, async ({ I }) => {
  I.amOnPage(strictPage)
  await I.fillField(fields, 'chained').first()
  seeOnlyFieldFilled(I, 1)
})

Scenario(`last() selects the last match ${allHelpers}`, async ({ I }) => {
  I.amOnPage(strictPage)
  await I.fillField(fields, 'chained').last()
  seeOnlyFieldFilled(I, 3)
})

Scenario(`at() selects a match by position ${allHelpers}`, async ({ I }) => {
  I.amOnPage(strictPage)
  await I.fillField(fields, 'chained').at(2)
  seeOnlyFieldFilled(I, 2)
})

Scenario(`at() counts from the end with a negative position ${allHelpers}`, async ({ I }) => {
  I.amOnPage(strictPage)
  await I.fillField(fields, 'chained').at(-2)
  seeOnlyFieldFilled(I, 2)
})

Scenario(`selection works without await ${allHelpers}`, ({ I }) => {
  I.amOnPage(strictPage)
  I.fillField(fields, 'chained').last()
  seeOnlyFieldFilled(I, 3)
})
