import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import Decision from '../../../lib/helper/Decision.js'
import store from '../../../lib/store.js'

function fakeFetch(answers, calls, status = 200) {
  return async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body), headers: options.headers })
    return {
      ok: status === 200,
      status,
      text: async () => 'boom',
      json: async () => ({ answers }),
    }
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

  beforeEach(() => {
    calls = []
    decision = new Decision({ apiKey: 'secret' })
    decision._actingHelper = () => browser
  })

  it('passes when probability reaches confidence', async () => {
    decision.fetchImpl = fakeFetch(noul(0.9), calls)
    const probability = await decision.decide('submit button is present')

    expect(probability).to.equal(0.9)
    expect(calls).to.have.length(1)
    expect(calls[0].url).to.equal('https://openrouter.ai/api/alpha/decisions')
    expect(calls[0].headers.Authorization).to.equal('Bearer secret')
    expect(calls[0].body.model).to.equal('typesafe/jev-1.13')
    expect(calls[0].body.questions).to.eql({ q0: { type: 'noul', instructions: 'submit button is present' } })
    expect(calls[0].body.state.url).to.equal('http://localhost/checkout')
    expect(calls[0].body.state.title).to.equal('Checkout')
    expect(calls[0].body.state.aria).to.include('Submit')
  })

  it('fails when probability is below confidence', async () => {
    decision.fetchImpl = fakeFetch(noul(0.4), calls)
    const err = await decision.decide('cart is empty').catch(e => e)

    expect(err).to.be.instanceOf(Error)
    expect(err.message).to.include('"cart is empty" (40%)')
    expect(err.message).to.include('70%')
  })

  it('respects configured confidence', async () => {
    decision = new Decision({ apiKey: 'secret', confidence: 0.95 })
    decision._actingHelper = () => browser
    decision.fetchImpl = fakeFetch(noul(0.9), calls)

    const err = await decision.decide('cart is empty').catch(e => e)
    expect(err.message).to.include('95%')
  })

  it('checks all statements in a single request', async () => {
    decision.fetchImpl = fakeFetch(noul(0.9, 0.99, 0.8), calls)
    const probabilities = await decision.decide(['form has fields', 'submit enabled', 'cancel present'])

    expect(probabilities).to.eql([0.9, 0.99, 0.8])
    expect(calls).to.have.length(1)
    expect(Object.keys(calls[0].body.questions)).to.eql(['q0', 'q1', 'q2'])
    expect(calls[0].body.questions.q2.instructions).to.equal('cancel present')
  })

  it('lists only failed statements', async () => {
    decision.fetchImpl = fakeFetch(noul(0.9, 0.1, 0.2), calls)
    const err = await decision.decide(['form has fields', 'submit enabled', 'cancel present']).catch(e => e)

    expect(err.message).to.include('"submit enabled" (10%)')
    expect(err.message).to.include('"cancel present" (20%)')
    expect(err.message).not.to.include('form has fields')
  })

  it('sends screenshot to visual model', async () => {
    const outputDir = store.outputDir
    store.outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'decision-'))
    decision.fetchImpl = fakeFetch(noul(0.8), calls)
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
    decision.fetchImpl = fakeFetch(noul(0.9), calls)
    await decision.decide('heading is shown')

    expect(calls[0].body.state.aria).to.be.undefined
    expect(calls[0].body.state.html).to.include('<h1>Checkout</h1>')
  })

  it('uses typesafe endpoint', async () => {
    decision = new Decision({ apiKey: 'secret', provider: 'typesafe', model: 'jev-latest' })
    decision._actingHelper = () => browser
    decision.fetchImpl = fakeFetch(noul(0.9), calls)
    await decision.decide('page is loaded')

    expect(calls[0].url).to.equal('https://api.typesafe.ai/v1/systemone')
    expect(calls[0].body.model).to.equal('jev-latest')
  })

  it('reports http errors', async () => {
    decision.fetchImpl = fakeFetch({}, calls, 402)
    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.message).to.include('402')
  })

  it('reports missing answers', async () => {
    decision.fetchImpl = fakeFetch({}, calls)
    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.message).to.include('returned no answer for "page is loaded"')
  })

  it('times out hanging requests', async () => {
    decision = new Decision({ apiKey: 'secret', timeout: 50 })
    decision._actingHelper = () => browser
    decision.fetchImpl = (url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))

    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.message).to.include('did not respond in 50ms')
    expect(err.isTerminal).to.be.undefined
  })

  it('marks failed decisions as not retryable', async () => {
    decision.fetchImpl = fakeFetch(noul(0.1), calls)
    const err = await decision.decide('cart is empty').catch(e => e)
    expect(err.isTerminal).to.equal(true)
  })

  it('marks http errors as not retryable', async () => {
    decision.fetchImpl = fakeFetch({}, calls, 500)
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
    decision.fetchImpl = async () => {
      throw new TypeError('fetch failed')
    }
    const err = await decision.decide('page is loaded').catch(e => e)
    expect(err.message).to.include('request failed: fetch failed')
    expect(err.isTerminal).to.be.undefined
  })

  it('validates config', () => {
    expect(() => new Decision({ apiKey: 'secret', provider: 'unknown' })).to.throw('Unknown decision provider')
    expect(() => new Decision({ apiKey: 'secret', confidence: 1.5 })).to.throw('between 0 and 1')
  })

  it('requires api key only when deciding', async () => {
    const key = process.env.TYPESAFE_API_KEY
    delete process.env.TYPESAFE_API_KEY
    try {
      decision = new Decision({ provider: 'typesafe' })
      decision._actingHelper = () => browser
      decision.fetchImpl = fakeFetch(noul(0.9), calls)

      const err = await decision.decide('page is loaded').catch(e => e)
      expect(err.message).to.include('TYPESAFE_API_KEY')
      expect(calls).to.be.empty
    } finally {
      if (key) process.env.TYPESAFE_API_KEY = key
    }
  })
})
