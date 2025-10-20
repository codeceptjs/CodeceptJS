const AiAssistant = require('../../lib/ai')
const config = require('../../lib/config')

let expect
import('chai').then(chai => {
  expect = chai.expect
})

describe('AI module', () => {
  beforeEach(() => {
    AiAssistant.enable({}) // clean up config
    AiAssistant.reset()
    config.reset()
  })

  it('should be externally configurable', async () => {
    const html = '<div><a data-qa="ok">Hey</a></div>'
    await AiAssistant.setHtmlContext(html)
    expect(AiAssistant.minifiedHtml).to.include('<a>Hey</a>')

    const config = {
      html: {
        allowedAttrs: ['data-qa'],
      },
    }

    AiAssistant.enable(config)
    await AiAssistant.setHtmlContext(html)
    expect(AiAssistant.minifiedHtml).to.include('<a data-qa="ok">Hey</a>')
  })

  it('Enabling AI assistant', () => {
    AiAssistant.enable()
    expect(AiAssistant.isEnabled).to.be.true
  })

  it('Disabling AI assistant', () => {
    AiAssistant.enable()
    AiAssistant.disable()
    expect(AiAssistant.isEnabled).to.be.false
  })

  it('Creating completion', async () => {
    AiAssistant.enable({
      request: async () => 'Completed response',
    })
    const completion = await AiAssistant.createCompletion(['message 1', 'message 2'])
    expect(completion).to.equal('Completed response')
  })

  it('Healing failed step', async () => {
    AiAssistant.enable({
      request: async () => 'Thanks you asked, here is the answer:\n```js\nI.click("Hello world");\n```',
    })
    const failureContext = {
      html: '<div><a href="#">Hello, world!</a></div>',
      step: { toCode: () => 'Failed step' },
      error: { message: 'Error message' },
      prevSteps: [{ toString: () => 'Previous step' }],
    }
    const completion = await AiAssistant.healFailedStep(failureContext)
    expect(completion).to.deep.equal(['I.click("Hello world");'])
  })

  it('Calculating tokens', () => {
    const messages = [{ content: 'Message 1' }, { content: 'Message 2' }]
    const tokens = AiAssistant.calculateTokens(messages)
    expect(tokens).to.be.greaterThan(0)
  })

  it('Stopping when reaching tokens limit', () => {
    AiAssistant.enable({ maxTokens: 100 })
    AiAssistant.numTokens = 200
    AiAssistant.stopWhenReachingTokensLimit()
    expect(AiAssistant.isEnabled).to.be.false
  })

  it('Writing steps', async () => {
    AiAssistant.enable({
      request: async () => 'Well, you can try to ```js\nI.click("Hello world");\n```',
    })
    await AiAssistant.setHtmlContext('<div><a href="#">Hello, world!</a></div>')
    const input = 'Test input'
    const completion = await AiAssistant.writeSteps(input)
    expect(completion).to.equal('I.click("Hello world");')
  })
})
