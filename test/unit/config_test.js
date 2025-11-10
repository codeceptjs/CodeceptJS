import { expect } from 'chai'
import config from '../../lib/config.js'

describe('Config', () => {
  beforeEach(() => config.reset())

  it('should be created', () => {
    const cfg = config.create({
      output: './report',
    })
    expect(cfg).to.contain.keys(['helpers', 'plugins', 'include'])
    expect(config.get()).to.eql(cfg)
    expect(cfg.output).to.eql('./report')
    expect(config.get('output')).to.eql('./report')
    expect(config.get('output', './other')).to.eql('./report')
    expect(config.get('tests', '**_test.js')).to.eql('**_test.js')
  })

  it('should be completely reset', () => {
    config.addHook(cfg => {
      cfg.helpers.Puppeteer.show = true
    })
    config.create({
      tests: '**tests',
      helpers: {
        Puppeteer: {},
      },
    })
    config.append({
      output: './other',
    })
    expect(config.get('helpers').Puppeteer.show).to.eql(true)
    config.reset()
    expect(config.get().output).to.not.eql('./other')
    expect(config.get()).to.not.contain.key('tests')
    expect(config.get('helpers')).to.not.contain.key('Puppeteer')
    config.create({
      helpers: {
        Puppeteer: {},
      },
    })
    expect(config.get('helpers').Puppeteer.show).to.not.eql(true)
  })

  it('can be updated', () => {
    config.create()
    config.append({
      output: './other',
    })
    expect(config.get('output')).to.eql('./other')
  })

  it('should use config hooks to enhance configs', () => {
    config.addHook(cfg => {
      cfg.additionalValue = true
    })
    const cfg = config.create({
      additionalValue: false,
    })
    expect(cfg).to.contain.key('additionalValue')
    expect(cfg.additionalValue).to.eql(true)
  })

  it('should load TypeScript config that imports other TypeScript files', async () => {
    const configPath = './test/data/typescript-config-imports/tests/api/codecept.conf.ts'
    const cfg = await config.load(configPath)
    
    expect(cfg).to.be.ok
    expect(cfg.helpers).to.have.property('REST')
    expect(cfg.helpers.REST.endpoint).to.equal('https://api.example.com')
    expect(cfg.helpers.REST.timeout).to.equal(5000)
    expect(cfg.name).to.equal('typescript-config-test')
  })

  it('should load TypeScript config that uses require()', async () => {
    const configPath = './test/data/typescript-config-require/codecept.conf.ts'
    const cfg = await config.load(configPath)
    
    expect(cfg).to.be.ok
    expect(cfg.helpers).to.have.property('REST')
    expect(cfg.plugins).to.have.property('allure')
    expect(cfg.plugins.allure.require).to.equal('@codeceptjs/allure-legacy')
    expect(cfg.plugins.htmlReporter.enabled).to.equal(true)
    expect(cfg.name).to.equal('typescript-config-with-require')
  })
})
