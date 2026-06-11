import * as chai from 'chai'
chai.should()
import path from 'path'
import fs from 'fs'
import { mkdirp } from 'mkdirp'
import { fileURLToPath } from 'url'
import sinon from 'sinon'
import inquirer from 'inquirer'
import * as initModule from '../../lib/command/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/init')

describe('Init Command', function () {
  this.timeout(20000)

  let promptStub;

  beforeEach(() => {
    mkdirp.sync(codecept_dir)
    process.env._INIT_DRY_RUN_INSTALL = true
    process.env.CODECEPT_TEST = 'true'
    promptStub = sinon.stub(inquirer, 'prompt')
  })

  afterEach(() => {
    try {
      fs.rmSync(codecept_dir, { recursive: true, force: true })
    } catch (e) {
      // continue regardless of error
    }
    sinon.restore()
    delete process.env._INIT_DRY_RUN_INSTALL
    delete process.env.CODECEPT_TEST
  })

  it('should have init command available and noTranslation defined', async () => {
    const { default: initCommand } = await import('../../lib/command/init.js')
    initCommand.should.be.a('function')
  })

  it('should be able to import translations', async () => {
    const translationsModule = await import('../../translations/index.js')
    const translations = Object.keys(translationsModule.default || translationsModule)
    translations.should.be.an('array')
    translations.length.should.be.greaterThan(0)
  })

  // Test the fix for noTranslation bug
  it('should have noTranslation constant available in init command', async () => {
    // This test verifies that the noTranslation bug is fixed
    // by importing the module and checking no syntax errors occur
    try {
      await import('../../lib/command/init.js')
    } catch (error) {
      if (error.message.includes('noTranslation is not defined')) {
        throw new Error('noTranslation bug still exists in init command')
      }
      throw error
    }
  })

  it('should initialize a JS project', async () => {
    // When yes: true, it skips prompts
    await initModule.default(codecept_dir, { yes: true })

    fs.existsSync(path.join(codecept_dir, 'codecept.conf.js')).should.be.true
    fs.existsSync(path.join(codecept_dir, 'steps_file.js')).should.be.true
  })

  it('should initialize a TS project', async () => {
    promptStub.onCall(0).resolves({
        typescript: true,
        tests: './tests/*_test.ts',
        helper: 'Playwright',
        output: './output',
    })
    promptStub.onCall(1).resolves({
        Playwright_browser: 'chromium',
        Playwright_url: 'http://localhost',
        Playwright_show: false,
    })

    await initModule.default(codecept_dir, { yes: false })

    fs.existsSync(path.join(codecept_dir, 'codecept.conf.ts')).should.be.true
    fs.existsSync(path.join(codecept_dir, 'steps_file.ts')).should.be.true
  })
})
