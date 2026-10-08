import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import Decision from '../../../lib/helper/Decision.js'
import store from '../../../lib/store.js'
import Config from '../../../lib/config.js'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

function createDecision(decisionModel, config = {}) {
  Config.create({ ai: { decisionModel } })
  return new Decision(config)
}

function fakeFetch(answers, calls, status = 200) {
  return async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body), headers: new Headers(options.headers) })
    if (status !== 200) return new Response('boom', { status })
    return Response.json({ answers })
  }
}

function noul(...values) {
  return Object.fromEntries(values.map((v, i) => [`q${i}`, { type: 'noul', noul: v }]))
}

const browser = {
  grabCurrentUrl: async () => 'http://localhost/checkout',
  grabTitle: async () => 'Checkout',
  grabAriaSnapshot: async () => '- heading "Checkout" [level=1]\n- button "Submit"',
  saveScreenshot: async file => fs.writeFileSync(file, 'png-bytes'),
}

describe('Decision helper', () => {
  let decision
  let calls

  afterEach(() => Config.reset())

  beforeEach(() => {
    calls = []
    decision = createDecision({ apiKey: 'secret' })
    decision._actingHelper = () => browser
  })

  it('passes when probability reaches confidence', async () => {
    decision.decisionAI.fetchImpl = fakeFetch(noul(0.9), calls)
    const probability = await decision.decide('submit button is present')

    expect(probability).to.equal(0.9)
    expect(calls).to.have.length(1)
    expect(calls[0].url).to.equal('https://openrouter.ai/api/alpha/decisions')
    expect(calls[0].headers.get('authorization')).to.equal('Bearer secret')
    expect(calls[0].body.model).to.equal('typesafe/jev-1.13')
    expect(calls[0].body.questions).to.eql({ q0: { type: 'noul', instructions: 'submit button is present' } })
    expect(calls[0].body.state.url).to.equal('http://localhost/checkout')
    expect(calls[0].body.state.title).to.equal('Checkout')
    expect(calls[0].body.state.aria).to.include('Submit')
  })

  it('fails when probability is below confidence', async () => {
    decision.decisionAI.fetchImpl = fakeFetch(noul(0.4), calls)
    const err = await decision.decide('cart is empty').catch(e => e)

    expect(err).to.be.instanceOf(Error)
    expect(err.message).to.include('"cart is empty" (40%)')
    expect(err.message).to.include('70%')
  })

  it('respects configured confidence', async () => {
    decision = createDecision({ apiKey: 'secret', confidence: 0.95 })
    decision._actingHelper = () => browser
    decision.decisionAI.fetchImpl = fakeFetch(noul(0.9), calls)

    const err = await decision.decide('cart is empty').catch(e => e)
    expect(err.message).to.include('95%')
  })

  it('checks all statements in a single request', async () => {
    decision.decisionAI.fetchImpl = fakeFetch(noul(0.9, 0.99, 0.8), calls)
    const probabilities = await decision.decide(['form has fields', 'submit enabled', 'cancel present'])

    expect(probabilities).to.eql([0.9, 0.99, 0.8])
    expect(calls).to.have.length(1)
    expect(Object.keys(calls[0].body.questions)).to.eql(['q0', 'q1', 'q2'])
    expect(calls[0].body.questions.q2.instructions).to.equal('cancel present')
  })

  it('lists only failed statements', async () => {
    decision.decisionAI.fetchImpl = fakeFetch(noul(0.9, 0.1, 0.2), calls)
    const err = await decision.decide(['form has fields', 'submit enabled', 'cancel present']).catch(e => e)

    expect(err.message).to.include('"submit enabled" (10%)')
    expect(err.message).to.include('"cancel present" (20%)')
    expect(err.message).not.to.include('form has fields')
  })

  it('sends screenshot to visual model', async () => {
    const outputDir = store.outputDir
    store.outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-'))
    decision.decisionAI.fetchImpl = fakeFetch(noul(0.8), calls)
    try {
      await decision.decideVisually('sidebar is shown')
      expect(fs.readdirSync(store.outputDir)).to.be.empty
    } finally {
      fs.rmSync(store.outputDir, { recursive: true, force: true })
      store.outputDir = outputDir
    }

    const { model, state } = calls[0].body
    expect(model).to.equal('cloudflare/clef')
    expect(state).to.have.length(2)
    expect(JSON.parse(state[0].text).title).to.equal('Checkout')
    expect(state[1].type).to.equal('image_url')
    expect(state[1].image_url.url).to.equal(`data:image/png;base64,${Buffer.from('png-bytes').toString('base64')}`)
  })

  it('sends html when aria snapshot is not supported', async () => {
    decision._actingHelper = () => ({ ...browser, grabAriaSnapshot: undefined, grabSource: async () => '<html><body><h1>Checkout</h1></body></html>' })
    decision.decisionAI.fetchImpl = fakeFetch(noul(0.9), calls)
    await decision.decide('heading is shown')

    expect(calls[0].body.state.aria).to.be.undefined
    expect(calls[0].body.state.html).to.include('<h1>Checkout</h1>')
  })

  it('uses AI SDK decision model from config', async () => {
    const key = process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_API_KEY
    try {
      const openrouter = createOpenRouter({ apiKey: 'config-key', fetch: fakeFetch(noul(0.9), calls) })
      decision = createDecision({ model: openrouter.evaluationModel('typesafe/jev-latest') })
      decision._actingHelper = () => browser

      expect(await decision.decide('page is loaded')).to.equal(0.9)
      expect(calls[0].body.model).to.equal('typesafe/jev-latest')
      expect(calls[0].headers.get('authorization')).to.equal('Bearer config-key')
    } finally {
      if (key) process.env.OPENROUTER_API_KEY = key
    }
  })

  it('reports http errors', async () => {
    decision.decisionAI.fetchImpl = fakeFetch({}, calls, 402)
    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.message).to.include('402')
  })

  it('reports missing answers', async () => {
    decision.decisionAI.fetchImpl = fakeFetch({}, calls)
    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.message).to.include('Decision must return exactly one answer for every question')
  })

  it('times out hanging requests', async () => {
    decision = createDecision({ apiKey: 'secret', timeout: 50 })
    decision._actingHelper = () => browser
    decision.decisionAI.fetchImpl = (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))

    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.message).to.include('did not respond in 50ms')
    expect(err.isTerminal).to.be.undefined
  })

  it('times out stalled response body', async () => {
    decision = createDecision({ apiKey: 'secret', timeout: 50 })
    decision._actingHelper = () => browser
    decision.decisionAI.fetchImpl = async (url, { signal }) => {
      const body = new ReadableStream({ start: controller => signal.addEventListener('abort', () => controller.error(new Error('aborted'))) })
      return new Response(body, { headers: { 'content-type': 'application/json' } })
    }

    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.message).to.include('did not respond in 50ms')
    expect(err.isTerminal).to.be.undefined
  })

  it('marks failed decisions as not retryable', async () => {
    decision.decisionAI.fetchImpl = fakeFetch(noul(0.1), calls)
    const err = await decision.decide('cart is empty').catch(e => e)
    expect(err.isTerminal).to.equal(true)
  })

  it('marks http errors as not retryable', async () => {
    decision.decisionAI.fetchImpl = fakeFetch({}, calls, 500)
    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.isTerminal).to.equal(true)
  })

  it('marks page state errors as not retryable', async () => {
    decision._actingHelper = () => ({ ...browser, grabTitle: async () => { throw new Error('page closed') } })
    const err = await decision.decideVisually('sidebar is shown').catch(e => e)
    expect(err.message).to.equal('page closed')
    expect(err.isTerminal).to.equal(true)
  })

  it('keeps connection errors retryable', async () => {
    decision.decisionAI.fetchImpl = async () => {
      throw new TypeError('fetch failed')
    }
    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.message).to.include('request failed: fetch failed')
    expect(err.isTerminal).to.be.undefined
  })

  it('reads config from ai.decisionModel', () => {
    decision = createDecision({ apiKey: 'secret', model: 'jev-latest', confidence: 0.9 })
    expect(decision.options.model).to.equal('jev-latest')
    expect(decision.options.confidence).to.equal(0.9)
    expect(decision.options.visualModel).to.equal('cloudflare/clef')
  })

  it('validates config', () => {
    expect(() => createDecision({ apiKey: 'secret', confidence: 1.5 })).to.throw('between 0 and 1')
  })

  it('requires api key only when deciding', async () => {
    const key = process.env.OPENROUTER_API_KEY
    delete process.env.OPENROUTER_API_KEY
    try {
      decision = createDecision({})
      decision._actingHelper = () => browser
      decision.decisionAI.fetchImpl = fakeFetch(noul(0.9), calls)

      const err = await decision.decide('page is loaded').catch(e => e)
      expect(err.message).to.include('OPENROUTER_API_KEY')
      expect(calls).to.be.empty
    } finally {
      if (key) process.env.OPENROUTER_API_KEY = key
    }
  })

  describe('mode', () => {
    afterEach(() => {
      store.currentStep = null
    })

    it('skips decisions without requests', async () => {
      decision = createDecision({}, { mode: 'skip' })
      decision.decisionAI.fetchImpl = fakeFetch(noul(0.1), calls)
      store.currentStep = { comment: '' }

      expect(await decision.decide('cart is empty')).to.be.undefined
      expect(await decision.decideVisually('sidebar is shown')).to.be.undefined
      expect(calls).to.be.empty
      expect(store.currentStep.comment).to.include('skipped')
    })

    it('reports results in step comment without failing', async () => {
      decision = createDecision({ apiKey: 'secret' }, { mode: 'report' })
      decision._actingHelper = () => browser
      decision.decisionAI.fetchImpl = fakeFetch(noul(0.9, 0.1), calls)
      store.currentStep = { comment: '' }

      const probabilities = await decision.decide(['form has fields', 'submit enabled'])
      expect(probabilities).to.eql([0.9, 0.1])
      expect(calls).to.have.length(1)
      expect(store.currentStep.comment).to.include('✔ form has fields (90%)')
      expect(store.currentStep.comment).to.include('✖ submit enabled (10%)')
    })

    it('reports api errors in step comment without failing', async () => {
      decision = createDecision({ apiKey: 'secret' }, { mode: 'report' })
      decision._actingHelper = () => browser
      decision.decisionAI.fetchImpl = fakeFetch({}, calls, 500)
      store.currentStep = { comment: '' }

      expect(await decision.decide('page is loaded')).to.be.undefined
      expect(store.currentStep.comment).to.include('responded with 500')
    })

    it('validates mode', () => {
      expect(() => createDecision({}, { mode: 'soft' })).to.throw('Unknown Decision helper mode')
    })
  })
})
