const { expect } = require('chai')
const path = require('path')
const fs = require('fs')
const Config = require('../../lib/config')
const { mkdirSync, rmSync } = fs

const testConfigDir = path.join(__dirname, '../data/esm-config-test')

describe('Config ESM Support', () => {
  before(() => {
    if (fs.existsSync(testConfigDir)) {
      rmSync(testConfigDir, { recursive: true })
    }
    mkdirSync(testConfigDir, { recursive: true })
  })

  after(() => {
    if (fs.existsSync(testConfigDir)) {
      rmSync(testConfigDir, { recursive: true })
    }
  })

  describe('CommonJS config loading', () => {
    it('should load CommonJS config synchronously', () => {
      const configPath = path.join(testConfigDir, 'cjs-config.js')
      const packagePath = path.join(testConfigDir, 'package.json')

      fs.writeFileSync(packagePath, JSON.stringify({ name: 'test' }))
      fs.writeFileSync(
        configPath,
        `
        exports.config = {
          tests: './cjs_test.js',
          output: './output',
          helpers: {
            REST: {
              endpoint: 'https://api.example.com'
            }
          }
        };
      `,
      )

      const config = Config.loadSync(configPath)
      expect(config.tests).to.equal('./cjs_test.js')
      expect(config.helpers.REST.endpoint).to.equal('https://api.example.com')
    })

    it('should load CommonJS config asynchronously', async () => {
      const configPath = path.join(testConfigDir, 'cjs-config-async.js')

      fs.writeFileSync(
        configPath,
        `
        exports.config = {
          tests: './cjs_async_test.js',
          output: './output',
          helpers: {
            REST: {
              endpoint: 'https://api.example.com'
            }
          }
        };
      `,
      )

      const config = await Config.load(configPath)
      expect(config.tests).to.equal('./cjs_async_test.js')
      expect(config.helpers.REST.endpoint).to.equal('https://api.example.com')
    })
  })

  describe('ESM config loading', () => {
    it('should detect ESM from package.json type', () => {
      const configPath = path.join(testConfigDir, 'esm-config.js')
      const packagePath = path.join(testConfigDir, 'package.json')

      fs.writeFileSync(packagePath, JSON.stringify({ type: 'module', name: 'test' }))

      // Test that the package.json was written correctly
      const packageContent = fs.readFileSync(packagePath, 'utf8')
      const packageObj = JSON.parse(packageContent)
      expect(packageObj.type).to.equal('module')
    })

    it('should fail synchronous loading of ESM config', () => {
      const configPath = path.join(testConfigDir, 'esm-config-fail.js')
      const packagePath = path.join(testConfigDir, 'package.json')

      fs.writeFileSync(packagePath, JSON.stringify({ type: 'module', name: 'test' }))
      fs.writeFileSync(
        configPath,
        `
        export const config = {
          tests: './esm_test.js',
          output: './output',
          helpers: {
            REST: {
              endpoint: 'https://api.example.com'
            }
          }
        };
      `,
      )

      expect(() => Config.loadSync(configPath)).to.throw(/ES module.*cannot be loaded synchronously/)
    })
  })

  describe('.mjs config files', () => {
    it('should support .mjs extension', async () => {
      const configPath = path.join(testConfigDir, 'codecept.conf.mjs')

      fs.writeFileSync(
        configPath,
        `
        export const config = {
          tests: './mjs_test.js',
          output: './output',
          helpers: {
            REST: {
              endpoint: 'https://api.example.com'
            }
          }
        };
      `,
      )

      const config = await Config.load(configPath)
      expect(config.tests).to.equal('./mjs_test.js')
      expect(config.helpers.REST.endpoint).to.equal('https://api.example.com')
    })

    it('should fail synchronous loading of .mjs config', () => {
      const configPath = path.join(testConfigDir, 'sync-fail.mjs')

      fs.writeFileSync(
        configPath,
        `
        export const config = {
          tests: './mjs_sync_test.js',
          output: './output'
        };
      `,
      )

      expect(() => Config.loadSync(configPath)).to.throw(/ES module.*cannot be loaded synchronously/)
    })
  })

  describe('config file discovery with ESM support', () => {
    it('should find .mjs config files in directory scan', async () => {
      const testDir = path.join(testConfigDir, 'discovery-test')
      mkdirSync(testDir)

      const configPath = path.join(testDir, 'codecept.config.mjs')
      fs.writeFileSync(
        configPath,
        `
        export const config = {
          tests: './discovery_test.js',
          output: './output'
        };
      `,
      )

      const config = await Config.load(testDir)
      expect(config.tests).to.equal('./discovery_test.js')
    })
  })
})
