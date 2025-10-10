import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirp } from 'mkdirp'
import { prompt } from '../../../lib/command/generate.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('generate:prompt command', () => {
  const tempDir = path.join(__dirname, '../../data/sandbox/prompts-test')

  beforeEach(() => {
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

  it('should create writeStep prompt file', async () => {
    await prompt('writeStep', tempDir)

    const promptFile = path.join(tempDir, 'prompts/writeStep.js')
    expect(fs.existsSync(promptFile)).to.be.true

    const content = fs.readFileSync(promptFile, 'utf8')
    expect(content).to.include('export default')
    expect(content).to.include('I am test engineer writing test in CodeceptJS')
  })

  it('should create healStep prompt file', async () => {
    await prompt('healStep', tempDir)

    const promptFile = path.join(tempDir, 'prompts/healStep.js')
    expect(fs.existsSync(promptFile)).to.be.true

    const content = fs.readFileSync(promptFile, 'utf8')
    expect(content).to.include('export default')
    expect(content).to.include('I want to heal a test that fails')
  })

  it('should create generatePageObject prompt file', async () => {
    await prompt('generatePageObject', tempDir)

    const promptFile = path.join(tempDir, 'prompts/generatePageObject.js')
    expect(fs.existsSync(promptFile)).to.be.true

    const content = fs.readFileSync(promptFile, 'utf8')
    expect(content).to.include('export default')
    expect(content).to.include('Page Object for a web application')
  })

  it('should not create file for invalid prompt name', async () => {
    await prompt('invalidPrompt', tempDir)

    const promptsDir = path.join(tempDir, 'prompts')
    expect(fs.existsSync(promptsDir)).to.be.false
  })

  it('should not create file when no prompt name provided', async () => {
    await prompt(null, tempDir)

    const promptsDir = path.join(tempDir, 'prompts')
    expect(fs.existsSync(promptsDir)).to.be.false
  })

  it('should create prompts directory if it does not exist', async () => {
    const promptsDir = path.join(tempDir, 'prompts')
    expect(fs.existsSync(promptsDir)).to.be.false

    await prompt('writeStep', tempDir)

    expect(fs.existsSync(promptsDir)).to.be.true
  })

  it('should not overwrite existing prompt file', async () => {
    const promptsDir = path.join(tempDir, 'prompts')
    mkdirp.sync(promptsDir)

    const promptFile = path.join(promptsDir, 'writeStep.js')
    const customContent = '// Custom prompt content'
    fs.writeFileSync(promptFile, customContent)

    await prompt('writeStep', tempDir)

    const content = fs.readFileSync(promptFile, 'utf8')
    expect(content).to.equal(customContent)
  })
})
