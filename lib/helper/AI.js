const Helper = require('@codeceptjs/helper');
const ai = require('../ai');
const standardActingHelpers = require('../plugin/standardActingHelpers');
const Container = require('../container');
const { splitByChunks, minifyHtml } = require('../html');

/**
 * AI Helper for CodeceptJS.
 *
 * This helper class provides integration with the AI GPT-3.5 or 4 language model for generating responses to questions or prompts within the context of web pages. It allows you to interact with the GPT-3.5 model to obtain intelligent responses based on HTML fragments or general prompts.
 * This helper should be enabled with any web helpers like Playwright or Puppeteer or WebDrvier to ensure the HTML context is available.
 *
 * ## Configuration
 *
 * This helper should be configured in codecept.json or codecept.conf.js
 *
 * * `chunkSize`: (optional, default: 80000) - The maximum number of characters to send to the AI API at once. We split HTML fragments by 8000 chars to not exceed token limit. Increase this value if you use GPT-4.
 */
class AI extends Helper {
  constructor(config) {
    super(config);
    this.aiAssistant = ai;

    this.options = {
      chunkSize: 80000,
    };
    this.options = { ...this.options, ...config };
  }

  _beforeSuite() {
    const helpers = Container.helpers();

    for (const helperName of standardActingHelpers) {
      if (Object.keys(helpers).indexOf(helperName) > -1) {
        this.helper = helpers[helperName];
        break;
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
    const html = await this.helper.grabSource();

    const htmlChunks = splitByChunks(html, this.options.chunkSize);

    if (htmlChunks.length > 1) this.debug(`Splitting HTML into ${htmlChunks.length} chunks`);

    const responses = [];

    for (const chunk of htmlChunks) {
      const messages = [
        { role: 'user', content: prompt },
        { role: 'user', content: `Within this HTML: ${minifyHtml(chunk)}` },
      ];

      if (htmlChunks.length > 1) messages.push({ role: 'user', content: 'If action is not possible on this page, do not propose anything, I will send another HTML fragment' });

      const response = await this.aiAssistant.createCompletion(messages);

      console.log(response);

      responses.push(response);
    }

    return responses.join('\n\n');
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
    const html = await this.helper.grabHTMLFrom(locator);

    const messages = [
      { role: 'user', content: prompt },
      { role: 'user', content: `Within this HTML: ${minifyHtml(html)}` },
    ];

    const response = await this.aiAssistant.createCompletion(messages);

    console.log(response);

    return response;
  }

  /**
   * Send a general request to ChatGPT and return response.
   * @param {string} prompt
   * @returns {Promise<string>} - A Promise that resolves to the generated response from the GPT model.
   */
  async askGptGeneralPrompt(prompt) {
    const messages = [
      { role: 'user', content: prompt },
    ];

    const response = await this.aiAssistant.createCompletion(messages);

    console.log(response);

    return response;
  }
}

module.exports = AI;
