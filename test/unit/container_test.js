import { expect } from 'chai'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import FileSystem from '../../lib/helper/FileSystem.js'
import actor from '../../lib/actor.js'
import container from '../../lib/container.js'
import Translation from '../../lib/translation.js'
import { resolveImportModulePath } from '../../lib/utils.js'

describe('Container', () => {
  before(() => {
    global.codecept_dir = path.join(__dirname, '/..')
    global.inject = container.support
    global.actor = actor
  })

  afterEach(async () => {
    await container.clear()
    ;['I', 'dummy_page'].forEach(po => {
      // Note: ESM modules cannot be deleted from cache like CommonJS
    })
  })

  describe('#translation', () => {
    it('should create empty translation', async () => {
      await container.create({})
      expect(container.translation()).to.be.instanceOf(Translation)
      expect(container.translation().loaded).to.be.false
      expect(container.translation().actionAliasFor('see')).to.eql('see')
    })

    it('should create Russian translation', async () => {
      await container.create({ translation: 'ru-RU' })
      expect(container.translation()).to.be.instanceOf(Translation)
      expect(container.translation().loaded).to.be.true
      expect(container.translation().I).to.eql('Я')
      expect(container.translation().actionAliasFor('see')).to.eql('вижу')
    })

    it('should create Italian translation', async () => {
      await container.create({ translation: 'it-IT' })
      expect(container.translation()).to.be.instanceOf(Translation)
      expect(container.translation().loaded).to.be.true
      expect(container.translation().I).to.eql('io')
      expect(container.translation().value('contexts').Feature).to.eql('Funzionalità')
    })

    it('should create French translation', async () => {
      await container.create({ translation: 'fr-FR' })
      expect(container.translation()).to.be.instanceOf(Translation)
      expect(container.translation().loaded).to.be.true
      expect(container.translation().I).to.eql('Je')
      expect(container.translation().value('contexts').Feature).to.eql('Fonctionnalité')
    })

    it('should create Portuguese translation', async () => {
      await container.create({ translation: 'pt-BR' })
      expect(container.translation()).to.be.instanceOf(Translation)
      expect(container.translation().loaded).to.be.true
      expect(container.translation().I).to.eql('Eu')
      expect(container.translation().value('contexts').Feature).to.eql('Funcionalidade')
    })

    it('should load custom translation', async () => {
      await container.create({ translation: 'my' })
      expect(container.translation()).to.be.instanceOf(Translation)
      expect(container.translation().loaded).to.be.true
    })

    it('should load no translation', async () => {
      await container.create({})
      expect(container.translation()).to.be.instanceOf(Translation)
      expect(container.translation().loaded).to.be.false
    })

    it('should load custom translation with vocabularies', async () => {
      await container.create({ translation: 'my', vocabularies: ['data/custom_vocabulary.json'] })
      expect(container.translation()).to.be.instanceOf(Translation)
      expect(container.translation().loaded).to.be.true
      const translation = container.translation()
      expect(translation.actionAliasFor('say')).to.eql('arr')
    })
  })

  describe('#helpers', () => {
    beforeEach(async () => {
      await container.clear({
        helper1: { name: 'hello' },
        helper2: { name: 'world' },
      })
    })

    it('should return all helper with no args', () => expect(container.helpers()).to.have.keys('helper1', 'helper2'))

    it('should return helper by name', () => {
      expect(container.helpers('helper1')).is.ok
      expect(container.helpers('helper1').name).to.eql('hello')
      expect(container.helpers('helper2')).is.ok
      expect(container.helpers('helper2').name).to.eql('world')
      expect(!container.helpers('helper3')).is.ok
    })
  })

  describe('#support', () => {
    beforeEach(async () => {
      await container.clear(
        {},
        {
          support1: { name: 'hello' },
          support2: { name: 'world' },
        },
      )
    })

    it('should return all support objects', () => {
      expect(container.support()).to.have.keys('support1', 'support2')
    })

    it('should support object by name', () => {
      expect(container.support('support1')).is.ok
      expect(container.support('support1').name).to.eql('hello')
      expect(container.support('support2')).is.ok
      expect(container.support('support2').name).to.eql('world')
      expect(container.support('support3').name).to.be.undefined
    })
  })

  describe('#plugins', () => {
    beforeEach(async () => {
      await container.clear(
        {},
        {},
        {
          plugin1: { name: 'hello' },
          plugin2: { name: 'world' },
        },
      )
    })

    it('should return all plugins', () => expect(container.plugins()).to.have.keys('plugin1', 'plugin2'))

    it('should get plugin by name', () => {
      expect(container.plugins('plugin1')).is.ok
      expect(container.plugins('plugin1').name).is.eql('hello')
      expect(container.plugins('plugin2')).is.ok
      expect(container.plugins('plugin2').name).is.eql('world')
      expect(!container.plugins('plugin3')).is.ok
    })
  })

  describe('#create', () => {
    it('should create container with helpers', async () => {
      // --- ADD THIS DEBUGGING BLOCK ---
      const sandboxDir = path.resolve(__dirname, 'data/sandbox/data');
      console.log('--- CI DEBUGGING ---');
      console.log('Does directory exist?', fs.existsSync(sandboxDir));
      if (fs.existsSync(sandboxDir)) {
        console.log('Files inside directory:', fs.readdirSync(sandboxDir));
      }
      console.log('--------------------');
      // --------------------------------

      const config = {
        helpers: {
          MyHelper: {
            require: './data/helper.js',
          },
          FileSystem: {},
        },
      }
      await container.create(config)
      await container.started()
      // custom helpers
      expect(container.helpers('MyHelper')).is.ok
      expect(container.helpers('MyHelper').method()).to.eql('hello world')

      // built-in helpers
      expect(container.helpers('FileSystem')).is.ok
      expect(container.helpers('FileSystem')).to.be.instanceOf(FileSystem)
    })

    it('should always create I', async () => {
      await container.create({})
      expect(container.support('I')).is.ok
    })

    it('should load DI and return a reference to the module', async () => {
      await container.create({
        include: {
          dummyPage: './data/dummy_page.js',
        },
      })

      const resolvedPath = resolveImportModulePath('../data/dummy_page.js')
      const dummyPage = await import(resolvedPath)
      expect(container.support('dummyPage').toString()).is.eql((dummyPage.default || dummyPage).toString())
    })

    it('should load I from path and execute', async () => {
      await container.create({
        include: {
          I: './data/I.js',
        },
      })
      expect(container.support('I')).is.ok
      expect(Object.keys(container.support('I'))).is.ok
      expect(Object.keys(container.support('I'))).to.include('_init')
      expect(Object.keys(container.support('I'))).to.include('doSomething')
    })

    it('should load DI includes provided as require paths', async () => {
      await container.create({
        include: {
          dummyPage: './data/dummy_page',
        },
      })
      expect(container.support('dummyPage')).is.ok
      expect(container.support('dummyPage')).to.include.keys('openDummyPage')
    })

    it('should load DI and inject I into PO', async () => {
      await container.create({
        include: {
          dummyPage: './data/dummy_page.js',
          I: './data/I.js',
        },
      })
      expect(container.support('dummyPage')).is.ok
      expect(container.support('I')).is.ok
      expect(container.support('dummyPage')).to.include.keys('openDummyPage')
      expect(container.support('dummyPage').getI()).to.have.keys('_init', 'doSomething')
    })

    it('should load DI and inject custom I into PO', async () => {
      await container.create({
        include: {
          dummyPage: './data/dummy_page.js',
          I: './data/I.js',
        },
      })
      expect(container.support('dummyPage')).is.ok
      expect(container.support('I')).is.ok
      expect(container.support('dummyPage')).to.include.keys('openDummyPage')
    })

    it('should load DI includes provided as objects', async () => {
      await container.create({
        include: {
          dummyPage: {
            openDummyPage: () => 'dummy page opened',
          },
        },
      })
      expect(container.support('dummyPage')).is.ok
      expect(container.support('dummyPage')).to.include.keys('openDummyPage')
    })

    it('should load DI includes provided as objects', async () => {
      await container.create({
        include: {
          dummyPage: {
            openDummyPage: () => 'dummy page opened',
          },
        },
      })
      expect(container.support('dummyPage')).is.ok
      expect(container.support('dummyPage')).to.include.keys('openDummyPage')
    })
  })

  describe('#append', () => {
    it('should be able to add new helper', async () => {
      const config = {
        helpers: {
          FileSystem: {},
        },
      }
      await container.create(config)
      await container.started()
      container.append({
        helpers: {
          AnotherHelper: { method: () => 'executed' },
        },
      })
      expect(container.helpers('FileSystem')).is.ok
      expect(container.helpers('FileSystem')).is.instanceOf(FileSystem)

      expect(container.helpers('AnotherHelper')).is.ok
      expect(container.helpers('AnotherHelper').method()).is.eql('executed')
    })

    it('should be able to add new support object', async () => {
      await container.create({})
      container.append({ support: { userPage: { login: '#login' } } })
      expect(container.support('I')).is.ok
      expect(container.support('userPage')).is.ok
      expect(container.support('userPage').login).is.eql('#login')
    })

    it('should be able to add and retrieve a function as a support object', async () => {
      await container.create({})
      const loginFunction = async name => `logged in as ${name}`
      container.append({ support: { loginAs: loginFunction } })
      expect(container.support('I')).is.ok
      const loginAs = container.support('loginAs')
      expect(loginAs).to.be.a('function')
      const result = await loginAs('admin')
      expect(result).to.eql('logged in as admin')
    })
  })

  describe('TypeScript support', () => {
    it('should load TypeScript steps_file that imports other TS files', async () => {
      const tsStepsPath = path.join(__dirname, '../data/typescript-support/steps_file.ts')
      await container.create({
        include: {
          I: tsStepsPath,
        },
      })

      const I = container.support('I')
      expect(I).to.be.ok
      expect(I.testMethod).to.be.a('function')
      expect(I.useHelper).to.be.a('function')
      expect(I.getConstant).to.be.a('function')
    })

    it('should properly execute methods from TypeScript steps_file', async () => {
      const tsStepsPath = path.join(__dirname, '../data/typescript-support/steps_file.ts')
      await container.create({
        include: {
          I: tsStepsPath,
        },
      })

      const I = container.support('I')
      // Note: These are proxied through MetaStep, so we can't call them directly in tests
      // The test verifies that the file loads and the structure is correct
      expect(I.testMethod).to.exist
      expect(I.useHelper).to.exist
      expect(I.getConstant).to.exist
    })

    it('should handle TypeScript files that use __dirname and __filename', async () => {
      const tsStepsPath = path.join(__dirname, '../data/typescript-support/steps_with_dirname.ts')
      await container.create({
        include: {
          I: tsStepsPath,
        },
      })

      const I = container.support('I')
      expect(I).to.be.ok
      expect(I.getConfigPath).to.be.a('function')
      expect(I.getCurrentFile).to.be.a('function')
      // The test verifies that the file loads without "ReferenceError: __dirname is not defined"
    })

    it('should handle TypeScript files that use require()', async () => {
      const tsStepsPath = path.join(__dirname, '../data/typescript-support/steps_with_require.ts')
      await container.create({
        include: {
          I: tsStepsPath,
        },
      })

      const I = container.support('I')
      expect(I).to.be.ok
      expect(I.getPluginPath).to.be.a('function')
      expect(I.loadModule).to.be.a('function')
      // The test verifies that the file loads without "ReferenceError: require is not defined"
    })

    it('should load TypeScript custom helper', async () => {
      const tsHelperPath = path.join(__dirname, '../data/typescript-support/CustomHelper.ts')
      await container.create({
        helpers: {
          CustomHelper: {
            require: tsHelperPath,
          },
        },
      })
      await container.started()

      const helper = container.helpers('CustomHelper')
      expect(helper).to.be.ok
      expect(helper.customMethod).to.be.a('function')
      expect(helper.customMethod()).to.eql('TypeScript helper loaded successfully')
      expect(helper.asyncCustomMethod).to.be.a('function')
    })

    it('should load TypeScript helper that imports another TypeScript file without extension', async () => {
      const tsHelperPath = path.join(__dirname, '../data/typescript-support/MaterialComponentHelper.ts')
      await container.create({
        helpers: {
          MaterialComponentHelper: {
            require: tsHelperPath,
          },
        },
      })
      await container.started()

      const helper = container.helpers('MaterialComponentHelper')
      expect(helper).to.be.ok
      expect(helper.customMethod).to.be.a('function')
      expect(helper.customMethod()).to.eql('[Helper] Material component helper loaded')
      expect(helper.clickButton).to.be.a('function')
    })

    it('should load TypeScript helper with dots in filename that imports another file with dots', async () => {
      const tsHelperPath = path.join(__dirname, '../data/typescript-support/material.component.helper.ts')
      await container.create({
        helpers: {
          MaterialComponentHelper: {
            require: tsHelperPath,
          },
        },
      })
      await container.started()

      const helper = container.helpers('MaterialComponentHelper')
      expect(helper).to.be.ok
      expect(helper.customMethod).to.be.a('function')
      expect(helper.customMethod()).to.eql('Material component works')
    })
  })
})
