const Helper = require('@codeceptjs/helper')
const ora = require('ora-classic')
const fs = require('fs')
const path = require('path')
const ai = require('../ai')
const Container = require('../container')
const { splitByChunks, minifyHtml } = require('../html')
const { beautify } = require('../utils')
const output = require('../output')
const { registerVariable } = require('../pause')

const standardActingHelpers = Container.STANDARD_ACTING_HELPERS

const gtpRole = {
  user: 'user',
}

/**
 * AI Helper for CodeceptJS.
 *
 * This helper class provides integration with the AI GPT-3.5 or 4 language model for generating responses to questions or prompts within the context of web pages. It allows you to interact with the GPT-3.5 model to obtain intelligent responses based on HTML fragments or general prompts.
 * This helper should be enabled with any web helpers like Playwright or Puppeteer or WebDriver to ensure the HTML context is available.
 *
 * Use it only in development mode. It is recommended to run it only inside pause() mode.
 *
 * ## Configuration
 *
 * This helper should be configured in codecept.conf.{js|ts}
 *
 * * `chunkSize`: (optional, default: 80000) - The maximum number of characters to send to the AI API at once. We split HTML fragments by 8000 chars to not exceed token limit. Increase this value if you use GPT-4.
 */
class AI extends Helper {
  constructor(config) {
    super(config)
    this.aiAssistant = ai

    this.options = {
      chunkSize: 80000,
    }
    this.options = { ...this.options, ...config }
    this.aiAssistant.enable(this.config)
  }

  _beforeSuite() {
    const helpers = Container.helpers()

    for (const helperName of standardActingHelpers) {
      if (Object.keys(helpers).indexOf(helperName) > -1) {
        this.helper = helpers[helperName]
        break
      }
    }
  }

  /**
   * Asks the AI GPT language model a question based on the provided prompt within the context of the current page's HTML.
   *
   * ```js
   * I.askGptOnPage('what does this page do?');
   * ```
   *
   * @async
   * @param {string} prompt - The question or prompt to ask the GPT model.
   * @returns {Promise<string>} - A Promise that resolves to the generated responses from the GPT model, joined by newlines.
   */
  async askGptOnPage(prompt) {
    const html = await this.helper.grabSource()

    const htmlChunks = splitByChunks(html, this.options.chunkSize)

    if (htmlChunks.length > 1) this.debug(`Splitting HTML into ${htmlChunks.length} chunks`)

    const responses = []

    for (const chunk of htmlChunks) {
      const messages = [
        { role: gtpRole.user, content: prompt },
        { role: gtpRole.user, content: `Within this HTML: ${await minifyHtml(chunk)}` },
      ]

      if (htmlChunks.length > 1)
        messages.push({
          role: 'user',
          content: 'If action is not possible on this page, do not propose anything, I will send another HTML fragment',
        })

      const response = await this._processAIRequest(messages)

      output.print(response)

      responses.push(response)
    }

    return responses.join('\n\n')
  }

  /**
   * Asks the AI a question based on the provided prompt within the context of a specific HTML fragment on the current page.
   *
   * ```js
   * I.askGptOnPageFragment('describe features of this screen', '.screen');
   * ```
   *
   * @async
   * @param {string} prompt - The question or prompt to ask the GPT-3.5 model.
   * @param {string} locator - The locator or selector used to identify the HTML fragment on the page.
   * @returns {Promise<string>} - A Promise that resolves to the generated response from the GPT model.
   */
  async askGptOnPageFragment(prompt, locator) {
    const html = await this.helper.grabHTMLFrom(locator)

    const messages = [
      { role: gtpRole.user, content: prompt },
      { role: gtpRole.user, content: `Within this HTML: ${await minifyHtml(html)}` },
    ]

    const response = await this._processAIRequest(messages)

    output.print(response)

    return response
  }

  /**
   * Send a general request to AI and return response.
   * @param {string} prompt
   * @returns {Promise<string>} - A Promise that resolves to the generated response from the GPT model.
   */
  async askGptGeneralPrompt(prompt) {
    const messages = [{ role: gtpRole.user, content: prompt }]

    const response = await this._processAIRequest(messages)

    output.print(response)

    return response
  }

  /**
   * Generates PageObject for current page using AI.
   *
   * It saves the PageObject to the output directory. You can review the page object and adjust it as needed and move to pages directory.
   * Prompt can be customized in a global config file.
   *
   * ```js
   * // create page object for whole page
   * I.askForPageObject('home');
   *
   * // create page object with extra prompt
   * I.askForPageObject('home', 'implement signIn(username, password) method');
   *
   * // create page object for a specific element
   * I.askForPageObject('home', null, '.detail');
   * ```
   *
   * Asks for a page object based on the provided page name, locator, and extra prompt.
   *
   * @async
   * @param {string} pageName - The name of the page to retrieve the object for.
   * @param {string|null} [extraPrompt=null] - An optional extra prompt for additional context or information.
   * @param {string|null} [locator=null] - An optional locator to find a specific element on the page.
   * @returns {Promise<Object>} A promise that resolves to the requested page object.
   */
  async askForPageObject(pageName, extraPrompt = null, locator = null) {
    const spinner = ora(' Processing AI request...').start()

    try {
      const html = locator ? await this.helper.grabHTMLFrom(locator) : await this.helper.grabSource()
      await this.aiAssistant.setHtmlContext(html)
      const response = await this.aiAssistant.generatePageObject(extraPrompt, locator)
      spinner.stop()

      if (!response[0]) {
        output.error('No response from AI')
        return ''
      }

      const code = beautify(response[0])

      output.print('----- Generated PageObject ----')
      output.print(code)
      output.print('-------------------------------')

      const fileName = path.join(output_dir, `${pageName}Page-${Date.now()}.js`)

      output.print(output.styles.bold(`Page object for ${pageName} is saved to ${output.styles.bold(fileName)}`))
      fs.writeFileSync(fileName, code)

      try {
        registerVariable('page', require(fileName))
        output.success('Page object registered for this session as `page` variable')
        output.print('Use `=>page.methodName()` in shell to run methods of page object')
        output.print('Use `click(page.locatorName)` to check locators of page object')
      } catch (err) {
        output.error('Error while registering page object')
        output.error(err.message)
      }

      return code
    } catch (e) {
      spinner.stop()
      throw Error(`Something went wrong! ${e.message}`)
    }
  }

  async _processAIRequest(messages) {
    const spinner = ora(' Processing AI request...').start()
    const response = await this.aiAssistant.createCompletion(messages)
    spinner.stop()
    return response
  }
}

module.exports = AI
