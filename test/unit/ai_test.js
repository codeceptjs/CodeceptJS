import { expect } from 'chai'
import AiAssistant from '../../lib/ai.js'
import config from '../../lib/config.js'
import { createMockModel, MockResponses } from '../support/mock-ai-provider.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirp } from 'mkdirp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('AI module', () => {
  beforeEach(async () => {
    await AiAssistant.enable({}) // clean up config
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

    await AiAssistant.enable(config)
    await AiAssistant.setHtmlContext(html)
    expect(AiAssistant.minifiedHtml).to.include('<a data-qa="ok">Hey</a>')
  })

  it('Enabling AI assistant', async () => {
    await AiAssistant.enable()
    expect(AiAssistant.isEnabled).to.be.true
  })

  it('Disabling AI assistant', async () => {
    await AiAssistant.enable()
    AiAssistant.disable()
    expect(AiAssistant.isEnabled).to.be.false
  })

  it('Stopping when reaching tokens limit', async () => {
    await AiAssistant.enable({ maxTokens: 100 })
    AiAssistant.numTokens = 200
    AiAssistant.stopWhenReachingTokensLimit()
    expect(AiAssistant.isEnabled).to.be.false
  })

  it.skip('Writing steps', async () => {
    AiAssistant.enable({
      model: openai('gpt-4o-mini'),
    })
    await AiAssistant.setHtmlContext('<div><a href="#">Hello, world!</a></div>')
    const input = 'Test input'
    const completion = await AiAssistant.writeSteps(input)
    expect(completion).to.be.a('string')
  })
})

describe('AI module with mock provider', () => {
  const tempDir = path.join(__dirname, '../data/sandbox/ai-prompts-test')

  beforeEach(() => {
    AiAssistant.reset()
    config.reset()

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
    mkdirp.sync(tempDir)
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should use default prompts when no custom prompts exist', async () => {
    const mockModel = createMockModel({
      responses: [MockResponses.text('AI generated response')],
    })

    await AiAssistant.enable({ model: mockModel })

    expect(AiAssistant.prompts).to.have.property('writeStep')
    expect(AiAssistant.prompts).to.have.property('healStep')
    expect(AiAssistant.prompts).to.have.property('generatePageObject')
  })

  it('should create completion with mock model', async () => {
    const mockModel = createMockModel({
      responses: [MockResponses.text('Completed response')],
    })

    await AiAssistant.enable({ model: mockModel })

    const completion = await AiAssistant.createCompletion([{ role: 'user', content: 'test message' }])

    expect(completion).to.equal('Completed response')
    expect(mockModel._getCallCount()).to.equal(1)
  })

  it('should handle AI errors gracefully', async () => {
    const mockModel = createMockModel({
      simulateError: true,
      errorType: 'api',
    })

    await AiAssistant.enable({ model: mockModel })

    const completion = await AiAssistant.createCompletion([{ role: 'user', content: 'test' }])

    expect(completion).to.equal('')
  })

  it('should parse code blocks from AI response', async () => {
    const mockModel = createMockModel({
      responses: [MockResponses.codeBlock('I.click("button")\nI.fillField("input", "text")')],
    })

    await AiAssistant.enable({ model: mockModel })
    await AiAssistant.setHtmlContext('<div><button>Click me</button></div>')

    const result = await AiAssistant.writeSteps('click the button')

    expect(result).to.include('I.click("button")')
  })

  it('should use writeStep prompt for writing steps', async () => {
    const mockModel = createMockModel({
      responses: [MockResponses.writeStep('I.click("Submit")')],
    })

    await AiAssistant.enable({ model: mockModel })
    await AiAssistant.setHtmlContext('<button>Submit</button>')

    const result = await AiAssistant.writeSteps('click submit button')

    expect(result).to.equal('I.click("Submit")')
  })

  it('should use healStep prompt for healing failed steps', async () => {
    const mockModel = createMockModel({
      responses: [MockResponses.healStep('#new-button')],
    })

    await AiAssistant.enable({ model: mockModel })

    const failureContext = {
      html: '<button id="new-button">Click</button>',
      step: { toCode: () => 'I.click("#old-button")' },
      error: { message: 'Element not found' },
      prevSteps: [],
    }

    const result = await AiAssistant.healFailedStep(failureContext)

    expect(result).to.be.an('array')
    expect(result[0]).to.include('#new-button')
  })

  it('should track token usage', async () => {
    const mockModel = createMockModel({
      responses: [
        {
          text: 'Response 1',
          totalTokens: 100,
        },
        {
          text: 'Response 2',
          totalTokens: 150,
        },
      ],
    })

    await AiAssistant.enable({ model: mockModel })

    await AiAssistant.createCompletion([{ role: 'user', content: 'msg1' }])
    expect(AiAssistant.numTokens).to.equal(100)

    await AiAssistant.createCompletion([{ role: 'user', content: 'msg2' }])
    expect(AiAssistant.numTokens).to.equal(250)
  })

  it('should disable when reaching token limit', async () => {
    const mockModel = createMockModel({
      responses: [{ text: 'Response', totalTokens: 150 }],
    })

    await AiAssistant.enable({ model: mockModel, maxTokens: 200 })

    await AiAssistant.createCompletion([{ role: 'user', content: 'msg1' }])
    expect(AiAssistant.isEnabled).to.be.true

    await AiAssistant.createCompletion([{ role: 'user', content: 'msg2' }])
    expect(AiAssistant.isEnabled).to.be.false
  })

  it('should load custom prompts from user directory', async () => {
    const promptsDir = path.join(tempDir, 'prompts')
    mkdirp.sync(promptsDir)

    const customPrompt = `export default (html, input) => [{
      role: 'user',
      content: 'CUSTOM PROMPT: ' + input
    }]`

    fs.writeFileSync(path.join(promptsDir, 'writeStep.js'), customPrompt)

    global.codecept_dir = tempDir
    const mockModel = createMockModel({
      responses: [MockResponses.text('Custom response')],
    })

    await AiAssistant.enable({ model: mockModel })

    expect(AiAssistant.prompts.writeStep).to.be.a('function')

    const messages = AiAssistant.prompts.writeStep('<html></html>', 'test')
    expect(messages[0].content).to.include('CUSTOM PROMPT: test')

    delete global.codecept_dir
  })

  it('should prefer custom prompts over default ones', async () => {
    const promptsDir = path.join(tempDir, 'prompts')
    mkdirp.sync(promptsDir)

    const customHealPrompt = `export default (html, context) => [{
      role: 'user',
      content: 'MY CUSTOM HEAL PROMPT'
    }]`

    fs.writeFileSync(path.join(promptsDir, 'healStep.js'), customHealPrompt)

    global.codecept_dir = tempDir
    const mockModel = createMockModel()

    await AiAssistant.enable({ model: mockModel })

    const messages = AiAssistant.prompts.healStep('<html></html>', {
      step: { toCode: () => 'step' },
      error: { message: 'error' },
      prevSteps: [],
    })

    expect(messages[0].content).to.equal('MY CUSTOM HEAL PROMPT')

    delete global.codecept_dir
  })

  it('should allow overriding prompts via config', async () => {
    const customWriteStep = (html, input) => [{ role: 'user', content: `CONFIG OVERRIDE: ${input}` }]

    const mockModel = createMockModel()

    await AiAssistant.enable({
      model: mockModel,
      prompts: {
        writeStep: customWriteStep,
      },
    })

    const messages = AiAssistant.prompts.writeStep('<html></html>', 'test input')
    expect(messages[0].content).to.equal('CONFIG OVERRIDE: test input')
  })

  it('should handle multiple sequential AI requests', async () => {
    const mockModel = createMockModel({
      responses: [MockResponses.writeStep('I.click("button1")'), MockResponses.writeStep('I.click("button2")'), MockResponses.healStep('#new-locator')],
    })

    await AiAssistant.enable({ model: mockModel })
    await AiAssistant.setHtmlContext('<button>Click</button>')

    const result1 = await AiAssistant.writeSteps('click button 1')
    expect(result1).to.include('button1')

    const result2 = await AiAssistant.writeSteps('click button 2')
    expect(result2).to.include('button2')

    const failureContext = {
      html: '<button>Click</button>',
      step: { toCode: () => 'I.click("#old")' },
      error: { message: 'Not found' },
      prevSteps: [],
    }

    const result3 = await AiAssistant.healFailedStep(failureContext)
    expect(result3[0]).to.include('#new-locator')

    expect(mockModel._getCallCount()).to.equal(3)
  })
})
