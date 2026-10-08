import fs from 'fs'
import path from 'path'

import Helper from '@codeceptjs/helper'
import Container from '../container.js'
import Config from '../config.js'
import store from '../store.js'
import output from '../output.js'
import AssertionFailedError from '../assert/error.js'
import { compactAriaSnapshot } from '../aria.js'
import { minifyHtml } from '../html.js'
import { pickActingHelper } from '../utils/trace.js'
import { DecisionAI, DecisionConnectionError } from '../ai.js'

/**
 * Asserts statements about the current page with a decision model.
 *
 * Decision models (like [Jev](https://openrouter.ai/typesafe/jev-1.13) or [Clef](https://openrouter.ai/cloudflare/clef))
 * do not generate text. They read the page state and return the probability that a statement is true.
 * A statement passes when its probability reaches the configured `confidence`.
 *
 * ```js
 * I.decide('top level navigation is available');
 * I.decide([
 *   'checkout form has all required fields',
 *   'success message is shown',
 *   'submit button enabled',
 *   'cancel button present',
 * ]);
 * I.decideVisually('sidebar is shown');
 * ```
 *
 * The model receives the page URL, title and ARIA snapshot.
 * Helpers without ARIA snapshots (anything but Playwright) send minified HTML instead.
 * `decideVisually` also sends a screenshot, so it requires a model with image input.
 *
 * This helper must be enabled together with a web helper (Playwright, Puppeteer, WebDriver).
 *
 * ## Configuration
 *
 * Decision model is configured in the `ai.decisionModel` section of the config:
 *
 * ```js
 * ai: {
 *   decisionModel: {
 *     model: 'typesafe/jev-1.13',
 *     visualModel: 'cloudflare/clef',
 *     confidence: 0.7,
 *   },
 * },
 * helpers: {
 *   Playwright: { url: 'http://localhost', browser: 'chromium' },
 *   Decision: {},
 * }
 * ```
 *
 * Decisions are requested through the [OpenRouter Decisions API](https://openrouter.ai/models?output_modalities=decisions)
 * with AI SDK [`experimental_decide`](https://ai-sdk.dev/docs/ai-sdk-core/decisions). Set `OPENROUTER_API_KEY` to use it.
 *
 * * `apiKey` (optional) - OpenRouter API key for model IDs, overrides `OPENROUTER_API_KEY` environment variable.
 * * `model` (default: `typesafe/jev-1.13`) - decision model used by `decide`: OpenRouter model ID or AI SDK decision model.
 * * `visualModel` (default: `cloudflare/clef`) - decision model with image input used by `decideVisually`: OpenRouter model ID or AI SDK decision model.
 *
 * AI SDK decision models are created with `@openrouter/ai-sdk-provider`:
 *
 * ```js
 * import { createOpenRouter } from '@openrouter/ai-sdk-provider'
 *
 * const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY })
 *
 * ai: {
 *   decisionModel: {
 *     model: openrouter.evaluationModel('typesafe/jev-1.13'),
 *     visualModel: openrouter.evaluationModel('cloudflare/clef'),
 *   },
 * },
 * ```
 * * `confidence` (default: `0.7`) - minimal probability, between 0 and 1, for a statement to pass.
 * * `timeout` (default: `15000`) - request timeout in ms.
 * * `maxLength` (default: `12000`) - maximal length of ARIA snapshot or HTML sent to the model.
 *
 * The helper has one option:
 *
 * * `mode` (default: `assert`) - how decisions are executed:
 *   * `assert` - request the model and fail the step when a statement is not confirmed.
 *   * `report` - request the model but never fail, even on API errors. Results and errors are added to the step as a comment.
 *   * `skip` - do not request the model, every decision passes.
 *
 * ```js
 * Decision: { mode: process.env.CI ? 'assert' : 'skip' }
 * ```
 *
 * Decisions work without the `--ai` flag.
 * Browse all decision models at [OpenRouter](https://openrouter.ai/models?output_modalities=decisions).
 *
 * ## Methods
 */
class Decision extends Helper {
  constructor(config = {}) {
    super(config)
    const modes = ['assert', 'report', 'skip']
    this.mode = config.mode || 'assert'
    if (!modes.includes(this.mode)) throw new Error(`Unknown Decision helper mode "${this.mode}", use one of: ${modes.join(', ')}`)
    this.decisionAI = new DecisionAI(Config.get('ai', {}).decisionModel)
    this.options = this.decisionAI.config
  }

  get isAsserting() {
    return this.mode === 'assert'
  }

  get isReporting() {
    return this.mode === 'report'
  }

  get isSkipping() {
    return this.mode === 'skip'
  }

  /**
   * Asserts that a statement (or each of statements) is true for the current page.
   * The decision model receives page URL, title and ARIA snapshot.
   * Multiple statements are checked in a single request and all of them must pass.
   *
   * ```js
   * I.decide('user is logged in');
   * I.decide(['submit button enabled', 'cancel button present']);
   * const probability = await I.decide('cart is empty');
   * ```
   *
   * @param {string|string[]} statements statement or list of statements to verify.
   * @returns {Promise<number|number[]|undefined>} probability of each statement, `undefined` in `skip` mode.
   */
  async decide(statements) {
    if (this.isSkipping) return this._skip()
    return this._run(async () => {
      const state = await this._grabState()
      return this._assert(statements, this.options.model, state)
    })
  }

  /**
   * Asserts that a statement (or each of statements) is true for the current page using a screenshot.
   * The decision model receives page URL, title, ARIA snapshot and a screenshot.
   * Requires `visualModel` with image input. Experimental.
   *
   * ```js
   * I.decideVisually('sidebar is shown');
   * I.decideVisually(['logo is in the header', 'page uses dark theme']);
   * ```
   *
   * @param {string|string[]} statements statement or list of statements to verify.
   * @returns {Promise<number|number[]|undefined>} probability of each statement, `undefined` in `skip` mode.
   */
  async decideVisually(statements) {
    if (this.isSkipping) return this._skip()
    return this._run(async () => {
      const state = await this._grabState()
      const screenshot = await this._grabScreenshot()
      const content = [
        { type: 'text', text: JSON.stringify(state) },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${screenshot}` } },
      ]
      return this._assert(statements, this.options.visualModel, content)
    })
  }

  _skip() {
    if (store.currentStep) store.currentStep.comment = ' (skipped)'
  }

  async _run(fn) {
    try {
      return await fn()
    } catch (err) {
      if (this.isReporting) {
        if (store.currentStep) store.currentStep.comment = ` (error: ${err.message})`
        output.say(`  ✖ ${err.message}`, 'yellow')
        return
      }
      if (!(err instanceof DecisionConnectionError)) err.isTerminal = true
      throw err
    }
  }

  async _assert(statements, model, state) {
    const list = [statements].flat()
    if (!list.length) throw new Error('No statements to decide')

    const probabilities = await this.decisionAI.decide(model, state, list)

    const failed = []
    const results = list.map((statement, i) => {
      const passed = probabilities[i] >= this.options.confidence
      const result = `${passed ? '✔' : '✖'} ${statement} (${formatProbability(probabilities[i])})`
      this.debugSection('Decision', result)
      if (!passed) failed.push(`"${statement}" (${formatProbability(probabilities[i])})`)
      return result
    })

    if (this.isReporting) {
      if (store.currentStep) store.currentStep.comment = `\n${results.join('\n')}`
      results.forEach(result => output.say(`  ${result}`, result.startsWith('✔') ? 'green' : 'yellow'))
      return Array.isArray(statements) ? probabilities : probabilities[0]
    }

    if (failed.length) {
      const err = new AssertionFailedError(
        { statements: failed.join(', '), confidence: formatProbability(this.options.confidence) },
        'expected page to satisfy {{statements}} with confidence of {{confidence}}',
      )
      err.showDiff = false
      err.message = err.cliMessage()
      throw err
    }

    return Array.isArray(statements) ? probabilities : probabilities[0]
  }

  async _grabState() {
    const helper = this._actingHelper()
    const state = {
      url: await helper.grabCurrentUrl(),
      title: await helper.grabTitle(),
    }

    if (helper.grabAriaSnapshot) {
      state.aria = compactAriaSnapshot(await helper.grabAriaSnapshot()).slice(0, this.options.maxLength)
      return state
    }

    state.html = (await minifyHtml(await helper.grabSource())).slice(0, this.options.maxLength)
    return state
  }

  async _grabScreenshot() {
    const helper = this._actingHelper()
    const file = path.join(store.outputDir, `decision_${Date.now()}.png`)
    await helper.saveScreenshot(file)
    if (!fs.existsSync(file)) throw new Error('Could not take a screenshot for visual decision')
    try {
      return fs.readFileSync(file).toString('base64')
    } finally {
      fs.rmSync(file, { force: true })
    }
  }

  _actingHelper() {
    const helper = pickActingHelper(Container.helpers())
    if (!helper) throw new Error('Decision helper requires a web helper: Playwright, Puppeteer or WebDriver')
    return helper
  }
}

function formatProbability(probability) {
  return `${Math.round(probability * 100)}%`
}

export default Decision
