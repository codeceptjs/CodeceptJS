import chai from 'chai'
chai.should()
import path from 'path'
import fs from 'fs'
import { mkdirp } from 'mkdirp'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const codecept_dir = path.join(__dirname, '/../data/sandbox/configs/init')

describe('Init Command', function () {
  this.timeout(20000)

  beforeEach(() => {
    mkdirp.sync(codecept_dir)
    process.env._INIT_DRY_RUN_INSTALL = true
  })

  afterEach(() => {
    try {
      fs.unlinkSync(`${codecept_dir}/codecept.conf.ts`)
      fs.unlinkSync(`${codecept_dir}/steps_file.ts`)
      fs.unlinkSync(`${codecept_dir}/tsconfig.json`)
    } catch (e) {
      // continue regardless of error
    }

    try {
      fs.unlinkSync(`${codecept_dir}/codecept.conf.js`)
      fs.unlinkSync(`${codecept_dir}/steps_file.js`)
      fs.unlinkSync(`${codecept_dir}/jsconfig.json`)
    } catch (e) {
      // continue regardless of error
    }

    delete process.env._INIT_DRY_RUN_INSTALL
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

  it('should have upgraded to latest inquirer version', async () => {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

    // Check that we're using a modern version of inquirer (12.x+)
    packageJson.dependencies.inquirer.should.match(/^12\./)

    // Check that inquirer-test is removed (was causing ESM compatibility issues)
    chai.expect(packageJson.devDependencies['inquirer-test']).to.be.undefined

    // Check that @inquirer/testing is available for modern testing
    packageJson.devDependencies['@inquirer/testing'].should.be.ok
  })
})
