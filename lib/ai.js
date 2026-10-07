import debugModule from 'debug'
const debug = debugModule('codeceptjs:ai')
import output from './output.js'
import event from './event.js'
import { removeNonInteractiveElements, minifyHtml, splitByChunks } from './html.js'
import { generateText, experimental_decide as decide, APICallError } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { createTypeSafeAi } from '@ai-sdk/typesafe-ai'
import { fileURLToPath } from 'url'
import path from 'path'
import { fileExists, resolveImportModulePath } from './utils.js'
import store from './store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const defaultHtmlConfig = {
  maxLength: 50000,
  simplify: true,
  minify: true,
  html: {},
}

async function loadPrompts() {
  const prompts = {}
  const promptNames = ['writeStep', 'healStep', 'generatePageObject']

  for (const name of promptNames) {
    let promptPath

    if (store.codeceptDir) {
      promptPath = path.join(store.codeceptDir, `prompts/${name}.js`)
    }

    if (!promptPath || !fileExists(promptPath)) {
      promptPath = path.join(__dirname, `template/prompts/${name}.js`)
    }

    try {
      const resolvedPath = resolveImportModulePath(promptPath)
      const module = await import(resolvedPath)
      prompts[name] = module.default || module
      debug(`Loaded prompt ${name} from ${promptPath}`)
    } catch (err) {
      debug(`Failed to load prompt ${name}:`, err.message)
    }
  }

  return prompts
}

class AiAssistant {
  constructor() {
    this.totalTime = 0
    this.numTokens = 0

    this.reset()
    this.connectToEvents()
  }

  async enable(config = {}) {
    debug('Enabling AI assistant')
    this.isEnabled = true

    const { html, prompts, decisionModel, ...aiConfig } = config

    this.config = Object.assign(this.config, aiConfig)
    this.htmlConfig = Object.assign(defaultHtmlConfig, html)

    const loadedPrompts = await loadPrompts()
    this.prompts = Object.assign(loadedPrompts, prompts || {})

    debug('Config', this.config)
  }

  reset() {
    this.numTokens = 0
    this.isEnabled = false
    this.config = {
      maxTokens: 1000000,
      model: null,
      response: parseCodeBlocks,
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
        output.print(`AI assistant took ${this.totalTime}s and used ${numTokensK}K tokens. Tokens limit: ${maxTokensK}K`)
      }
    })
  }

  checkModel() {
    if (!this.isEnabled) {
      debug('AI assistant is disabled')
      return
    }

    if (this.config.model) return

    const noModelErrorMessage = `
     No model is set for AI assistant.

     [!] Please configure AI model using Vercel AI SDK providers.

     Example (connect to OpenAI):

     import { openai } from '@ai-sdk/openai';

     ai: {
       model: openai('gpt-4o-mini')
     }

     Example (connect to Anthropic):

     import { anthropic } from '@ai-sdk/anthropic';

     ai: {
       model: anthropic('claude-3-5-sonnet-20241022')
     }

     See https://ai-sdk.dev/docs/foundations/providers-and-models for all providers.
    `.trim()

    throw new Error(noModelErrorMessage)
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
      this.checkModel()
      debug('Request', messages)

      this.response = null

      const startTime = process.hrtime()
      const result = await generateText({
        model: this.config.model,
        messages,
      })
      const endTime = process.hrtime(startTime)
      const executionTimeInSeconds = endTime[0] + endTime[1] / 1e9

      this.response = result.text
      this.numTokens += result.usage.totalTokens

      this.totalTime += Math.round(executionTimeInSeconds)
      debug('AI response time', executionTimeInSeconds)
      debug('Response', this.response)
      debug('Usage', result.usage)
      this.stopWhenReachingTokensLimit()
      return this.response
    } catch (err) {
      debug(err)
      output.print('')
      output.error(`AI service error: ${err.message}`)
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

const DECISION_PROVIDERS = {
  openrouter: { keyName: 'OPENROUTER_API_KEY' },
  typesafe: { keyName: 'TYPESAFE_API_KEY' },
}

const defaultDecisionConfig = {
  provider: 'openrouter',
  model: 'typesafe/jev-1.13',
  visualModel: 'cloudflare/clef',
  confidence: 0.7,
  timeout: 15000,
  maxLength: 12000,
}

class DecisionConnectionError extends Error {}

class DecisionAI {
  constructor(config = {}) {
    this.config = { ...defaultDecisionConfig, ...config }

    const { provider, confidence } = this.config
    this.provider = DECISION_PROVIDERS[provider]
    if (!this.provider) throw new Error(`Unknown decision provider "${provider}" in ai.decisionModel, use one of: ${Object.keys(DECISION_PROVIDERS).join(', ')}`)
    if (!(confidence > 0 && confidence < 1)) throw new Error(`ai.decisionModel.confidence must be between 0 and 1, got ${confidence}`)

    this.fetchImpl = fetch
  }

  checkModel() {
    if (this.config.apiKey || process.env[this.provider.keyName]) return

    const noKeyErrorMessage = `
     No API key is set for decision model.

     [!] Set ${this.provider.keyName} environment variable or apiKey in ai.decisionModel config.

     Example (connect to OpenRouter, default):

     export OPENROUTER_API_KEY=sk-or-...

     ai: {
       decisionModel: {
         model: 'typesafe/jev-1.13',
         confidence: 0.7,
       }
     }

     Get a key at https://openrouter.ai/settings/keys

     Example (connect to TypeSafe):

     export TYPESAFE_API_KEY=...

     ai: {
       decisionModel: {
         provider: 'typesafe',
         model: 'jev-latest',
       }
     }

     See https://openrouter.ai/models?output_modalities=decisions for all decision models.
    `.trim()

    throw new Error(noKeyErrorMessage)
  }

  async decide(model, state, statements) {
    this.checkModel()

    const questions = Object.fromEntries(statements.map((statement, i) => [`q${i}`, { type: 'boolean', instructions: statement }]))
    debug('Decision request', model, statements)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.config.timeout)

    let result
    try {
      result = await decide({
        model: this.decisionModel(model),
        state,
        questions,
        maxRetries: 0,
        abortSignal: controller.signal,
      })
    } catch (err) {
      if (controller.signal.aborted) throw new DecisionConnectionError(`Decision model ${model} did not respond in ${this.config.timeout}ms`)
      if (APICallError.isInstance(err)) throw new Error(`Decision model ${model} responded with ${err.statusCode}: ${err.responseBody || err.message}`)
      throw err
    } finally {
      clearTimeout(timer)
    }

    debug('Decision response', result.answers, result.usage)

    return Object.keys(questions).map(id => result.answers[id].probability)
  }

  decisionModel(model) {
    const settings = {
      apiKey: this.config.apiKey || process.env[this.provider.keyName],
      fetch: async (url, options) => {
        try {
          return await this.fetchImpl(url, options)
        } catch (err) {
          if (options.signal?.aborted) throw err
          throw new DecisionConnectionError(`Decision model ${model} request failed: ${err.message}`)
        }
      },
    }
    if (this.config.provider === 'typesafe') return createTypeSafeAi(settings).decisionModel(model)
    return createOpenRouter(settings).evaluationModel(model)
  }
}

export { DecisionAI, DecisionConnectionError }

export default new AiAssistant()
