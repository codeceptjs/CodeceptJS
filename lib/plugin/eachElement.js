const output = require('../output')
const store = require('../store')
const recorder = require('../recorder')
const container = require('../container')
const event = require('../event')
const Step = require('../step')
const { isAsyncFunction } = require('../utils')

const defaultConfig = {
  registerGlobal: true,
}

/**
 * Provides `eachElement` global function to iterate over found elements to perform actions on them.
 *
 * `eachElement` takes following args:
 * * `purpose` - the goal of an action. A comment text that will be displayed in output.
 * * `locator` - a CSS/XPath locator to match elements
 * * `fn(element, index)` - **asynchronous** function which will be executed for each matched element.
 *
 * Example of usage:
 *
 * ```js
 * // this example works with Playwright and Puppeteer helper
 * await eachElement('click all checkboxes', 'form input[type=checkbox]', async (el) => {
 *   await el.click();
 * });
 * ```
 * Click odd elements:
 *
 * ```js
 * // this example works with Playwright and Puppeteer helper
 * await eachElement('click odd buttons', '.button-select', async (el, index) => {
 *   if (index % 2) await el.click();
 * });
 * ```
 *
 * Check all elements for visibility:
 *
 * ```js
 * // this example works with Playwright and Puppeteer helper
 * const assert = require('assert');
 * await eachElement('check all items are visible', '.item', async (el) => {
 *   assert(await el.isVisible());
 * });
 * ```
 * This method works with WebDriver, Playwright, Puppeteer, Appium helpers.
 *
 * Function parameter `el` represents a matched element.
 * Depending on a helper API of `el` can be different. Refer to API of corresponding browser testing engine for a complete API list:
 *
 * * [Playwright ElementHandle](https://playwright.dev/docs/api/class-elementhandle)
 * * [Puppeteer](https://pptr.dev/#?product=Puppeteer&show=api-class-elementhandle)
 * * [webdriverio element](https://webdriver.io/docs/api)
 *
 * #### Configuration
 *
 * * `registerGlobal` - to register `eachElement` function globally, true by default
 *
 * If `registerGlobal` is false you can use eachElement from the plugin:
 *
 * ```js
 * const eachElement = codeceptjs.container.plugins('eachElement');
 * ```
 *
 * @param {string}  purpose
 * @param {CodeceptJS.LocatorOrString}  locator
 * @param {Function}  fn
 * @return {Promise<*> | undefined}
 */
function eachElement(purpose, locator, fn) {
  if (store.dryRun) return
  const helpers = Object.values(container.helpers())

  const helper = helpers.filter(h => !!h._locate)[0]

  if (!helper) {
    throw new Error('No helper enabled with _locate method with returns a list of elements.')
  }

  if (!isAsyncFunction(fn)) {
    throw new Error('Async function should be passed into each element')
  }

  const step = new Step(helper, `${purpose || 'each element'} within "${locator}"`)
  step.helperMethod = '_locate'
  // eachElement('select all users', 'locator', async (el) => {
  event.dispatcher.emit(event.step.before, step)

  return recorder.add('register each element wrapper', async () => {
    event.emit(event.step.started, step)
    const els = await helper._locate(locator)
    output.debug(`Found ${els.length} elements for each elements to iterate`)

    const errs = []
    let i = 0
    for (const el of els) {
      try {
        await fn(el, i)
      } catch (err) {
        output.error(`eachElement: failed operation on element #${i} ${el}`)
        errs.push(err)
      }
      i++
    }

    if (errs.length) {
      event.dispatcher.emit(event.step.after, step)
      event.emit(event.step.failed, step, errs[0])
      event.emit(event.step.finished, step)
      throw errs[0]
    }

    event.dispatcher.emit(event.step.after, step)
    event.emit(event.step.passed, step, null)
    event.emit(event.step.finished, step)
  })
}

module.exports = function (config) {
  config = Object.assign(defaultConfig, config)

  if (config.registerGlobal) {
    global.eachElement = eachElement
  }
  return eachElement
}
