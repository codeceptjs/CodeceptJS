const debug = require('debug')('codeceptjs:ai')
const output = require('./output')
const event = require('./event')
const { removeNonInteractiveElements, minifyHtml, splitByChunks } = require('./html')

const defaultHtmlConfig = {
  maxLength: 50000,
  simplify: true,
  minify: true,
  html: {},
}

const defaultPrompts = {
  writeStep: (html, input) => [
    {
      role: 'user',
      content: `I am test engineer writing test in CodeceptJS
        I have opened web page and I want to use CodeceptJS to ${input} on this page
        Provide me valid CodeceptJS code to accomplish it
        Use only locators from this HTML: \n\n${html}`,
    },
  ],

  healStep: (html, { step, error, prevSteps }) => {
    return [
      {
        role: 'user',
        content: `As a test automation engineer I am testing web application using CodeceptJS.
        I want to heal a test that fails. Here is the list of executed steps: ${prevSteps.map(s => s.toString()).join(', ')}
        Propose how to adjust ${step.toCode()} step to fix the test.
        Use locators in order of preference: semantic locator by text, CSS, XPath. Use codeblocks marked with \`\`\`
        Here is the error message: ${error.message}
        Here is HTML code of a page where the failure has happened: \n\n${html}`,
      },
    ]
  },

  generatePageObject: (html, extraPrompt = '', rootLocator = null) => [
    {
      role: 'user',
      content: `As a test automation engineer I am creating a Page Object for a web application using CodeceptJS.
        Here is an sample page object:

const { I } = inject();

module.exports = {

  // setting locators
  element1: '#selector',
  element2: '.selector',
  element3: locate().withText('text'),

  // seting methods
  doSomethingOnPage(params) {
    // ...
  },  
}        

        I want to generate a Page Object for the page I provide.
        Write JavaScript code in similar manner to list all locators on the page.
        Use locators in order of preference: by text (use locate().withText()), label, CSS, XPath.
        Avoid TailwindCSS, Bootstrap or React style formatting classes in locators.
        Add methods to to interact with page when needed.
        ${extraPrompt}
        ${rootLocator ? `All provided elements are inside '${rootLocator}'. Declare it as root variable and for every locator use locate(...).inside(root)` : ''}
        Add only locators from this HTML: \n\n${html}`,
    },
  ],
}

class AiAssistant {
  constructor() {
    this.totalTime = 0
    this.numTokens = 0

    this.reset()
    this.connectToEvents()
  }

  enable(config = {}) {
    debug('Enabling AI assistant')
    this.isEnabled = true

    const { html, prompts, ...aiConfig } = config

    this.config = Object.assign(this.config, aiConfig)
    this.htmlConfig = Object.assign(defaultHtmlConfig, html)
    this.prompts = Object.assign(defaultPrompts, prompts)

    debug('Config', this.config)
  }

  reset() {
    this.numTokens = 0
    this.isEnabled = false
    this.config = {
      maxTokens: 1000000,
      request: null,
      response: parseCodeBlocks,
      // lets limit token usage to 1M
    }
    this.minifiedHtml = null
    this.response = null
    this.totalTime = 0
  }

  disable() {
    this.isEnabled = false
  }

  connectToEvents() {
    event.dispatcher.on(event.all.result, () => {
      if (this.isEnabled && this.numTokens > 0) {
        const numTokensK = Math.ceil(this.numTokens / 1000)
        const maxTokensK = Math.ceil(this.config.maxTokens / 1000)
        output.print(`AI assistant took ${this.totalTime}s and used ~${numTokensK}K input tokens. Tokens limit: ${maxTokensK}K`)
      }
    })
  }

  checkRequestFn() {
    if (!this.isEnabled) {
      debug('AI assistant is disabled')
      return
    }

    if (this.config.request) return

    const noRequestErrorMessage = `
     No request function is set for AI assistant.

     [!] AI request was decoupled from CodeceptJS. To connect to OpenAI or other AI service.
     Please implement your own request function and set it in the config.

     Example (connect to OpenAI):

     ai: {
       request: async (messages) => {
         const OpenAI = require('openai');
         const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })
         const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
         });
         return response?.data?.choices[0]?.message?.content;
       }
     }
    `.trim()

    throw new Error(noRequestErrorMessage)
  }

  async setHtmlContext(html) {
    let processedHTML = html

    if (this.htmlConfig.simplify) {
      processedHTML = removeNonInteractiveElements(processedHTML, this.htmlConfig)
    }

    if (this.htmlConfig.minify) processedHTML = await minifyHtml(processedHTML)
    if (this.htmlConfig.maxLength) processedHTML = splitByChunks(processedHTML, this.htmlConfig.maxLength)[0]

    this.minifiedHtml = processedHTML
  }

  getResponse() {
    return this.response || ''
  }

  async createCompletion(messages) {
    if (!this.isEnabled) return ''

    try {
      this.checkRequestFn()
      debug('Request', messages)

      this.response = null

      this.calculateTokens(messages)
      const startTime = process.hrtime()
      this.response = await this.config.request(messages)
      const endTime = process.hrtime(startTime)
      const executionTimeInSeconds = endTime[0] + endTime[1] / 1e9

      this.totalTime += Math.round(executionTimeInSeconds)
      debug('AI response time', executionTimeInSeconds)
      debug('Response', this.response)
      this.stopWhenReachingTokensLimit()
      return this.response
    } catch (err) {
      debug(err.response)
      output.print('')
      output.error(`AI service error: ${err.message}`)
      if (err?.response?.data?.error?.code) output.error(err?.response?.data?.error?.code)
      if (err?.response?.data?.error?.message) output.error(err?.response?.data?.error?.message)
      this.stopWhenReachingTokensLimit()
      return ''
    }
  }

  async healFailedStep(failureContext) {
    if (!this.isEnabled) return []
    if (!failureContext.html) throw new Error('No HTML context provided')

    await this.setHtmlContext(failureContext.html)

    if (!this.minifiedHtml) {
      debug('HTML context is empty after removing non-interactive elements & minification')
      return []
    }

    const response = await this.createCompletion(this.prompts.healStep(this.minifiedHtml, failureContext))
    if (!response) return []

    return this.config.response(response)
  }

  /**
   *
   * @param {*} extraPrompt
   * @param {*} locator
   * @returns
   */
  async generatePageObject(extraPrompt = null, locator = null) {
    if (!this.isEnabled) return []
    if (!this.minifiedHtml) throw new Error('No HTML context provided')

    const response = await this.createCompletion(this.prompts.generatePageObject(this.minifiedHtml, locator, extraPrompt))
    if (!response) return []

    return this.config.response(response)
  }

  calculateTokens(messages) {
    // we implement naive approach for calculating tokens with no extra requests
    // this approach was tested via https://platform.openai.com/tokenizer
    // we need it to display current tokens usage so users could analyze effectiveness of AI

    const inputString = messages
      .map(m => m.content)
      .join(' ')
      .trim()
    const numWords = (inputString.match(/[^\s\-:=]+/g) || []).length

    // 2.5 token is constant for average HTML input
    const tokens = numWords * 2.5

    this.numTokens += tokens

    return tokens
  }

  stopWhenReachingTokensLimit() {
    if (this.numTokens < this.config.maxTokens) return

    output.print(`AI assistant has reached the limit of ${this.config.maxTokens} tokens in this session. It will be disabled now`)
    this.disable()
  }

  async writeSteps(input) {
    if (!this.isEnabled) return
    if (!this.minifiedHtml) throw new Error('No HTML context provided')

    const snippets = []

    const response = await this.createCompletion(this.prompts.writeStep(this.minifiedHtml, input))
    if (!response) return
    snippets.push(...this.config.response(response))

    debug(snippets[0])

    return snippets[0]
  }
}

function parseCodeBlocks(response) {
  // Regular expression pattern to match code snippets
  const codeSnippetPattern = /```(?:javascript|js|typescript|ts)?\n([\s\S]+?)\n```/g

  // Array to store extracted code snippets
  const codeSnippets = []

  response = response
    .split('\n')
    .map(line => line.trim())
    .join('\n')

  // Iterate over matches and extract code snippets
  let match
  while ((match = codeSnippetPattern.exec(response)) !== null) {
    codeSnippets.push(match[1])
  }

  // Remove "Scenario", "Feature", and "require()" lines
  const modifiedSnippets = codeSnippets.map(snippet => {
    const lines = snippet.split('\n')

    const filteredLines = lines.filter(line => !line.includes('I.amOnPage') && !line.startsWith('Scenario') && !line.startsWith('Feature') && !line.includes('= require('))

    return filteredLines.join('\n')
    // remove snippets that move from current url
  }) // .filter(snippet => !line.includes('I.amOnPage'));

  return modifiedSnippets.filter(snippet => !!snippet)
}

module.exports = new AiAssistant()
