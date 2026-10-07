import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import Linter from '../../../lib/lint.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const project = path.join(__dirname, '../../data/lint/project')
const bin = path.join(__dirname, '../../../bin/codecept.js')

const lint = (code, file = 'test.js') => new Linter().lint(code, file)
const rules = code => lint(code).map(f => `${f.line}:${f.rule}`)

const runHook = payload =>
  spawnSync(process.execPath, [bin, 'lint', '--hook', 'claude'], {
    cwd: project,
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, CI: '' },
  })

describe('lint', () => {
  let ci

  beforeEach(() => {
    ci = process.env.CI
    delete process.env.CI
  })

  afterEach(() => {
    if (ci !== undefined) process.env.CI = ci
  })

  describe('rules', () => {
    it('no-fixed-wait', () => {
      expect(rules("I.wait(5)\nI.waitForElement('#a', 5)\nI.wait(timeout)")).to.deep.equal(['1:no-fixed-wait'])
    })

    it('no-sleep', () => {
      expect(rules("Scenario('a', async ({ I }) => {\n  await new Promise(r => setTimeout(r, 100))\n})")).to.deep.equal(['2:no-sleep'])
      expect(rules('class X extends Helper {\n  m() { setTimeout(() => {}, 1) }\n}')).to.deep.equal([])
    })

    it('no-only and no-pause are warnings locally and errors on CI', () => {
      const code = "Scenario.only('a', () => {})\nFeature.only('f')\nData([]).only.Scenario('d', () => {})\npause()"
      expect(lint(code).map(f => `${f.rule}:${f.level}`)).to.deep.equal(['no-only:warn', 'no-only:warn', 'no-only:warn', 'no-pause:warn'])
      process.env.CI = 'true'
      expect(lint(code).map(f => f.level)).to.deep.equal(['error', 'error', 'error', 'error'])
    })

    it('secret-credentials', () => {
      const code = [
        "I.fillField('Password', '123456')",
        "I.fillField('Password', secret('123456'))",
        "I.fillField('Email', 'a@b.c')",
        'I.fillField(loc, process.env.API_TOKEN)',
        'I.fillField(loc, secret(process.env.API_TOKEN))',
      ].join('\n')
      expect(rules(code)).to.deep.equal(['1:secret-credentials', '4:secret-credentials'])
    })

    it('await-grab', () => {
      const code = ['const a = I.grabTextFrom("h1")', 'const b = await I.grabTextFrom("h1")', 'return I.grabTextFrom("h1")', 'I.grabTextFrom("h1").length', 'await Promise.all([I.grabTitle()])'].join('\n')
      expect(new Linter().lint(`async function f() {\n${code}\n}`, 'test.js').map(f => `${f.line}:${f.rule}`)).to.deep.equal(['2:await-grab', '5:await-grab'])
    })

    it('no-actor-in-helper', () => {
      const code = 'class X extends Helper {\n  m() {\n    I.click("a")\n  }\n}\nI.click("b")'
      expect(rules(code)).to.deep.equal(['3:no-actor-in-helper'])
    })

    it('raw-browser-in-test', () => {
      const code = "Scenario('a', ({ I }) => {\n  I.usePlaywrightTo('x', () => {})\n  I.executeScript(() => 1)\n})\nI.executeScript(() => 1)"
      expect(lint(code).map(f => `${f.line}:${f.rule}:${f.level}`)).to.deep.equal(['2:raw-browser-in-test:warn', '3:raw-browser-in-test:warn'])
    })
  })

  it('suppresses a rule with a comment', () => {
    const code = 'I.wait(1) // codeceptjs-lint-disable-line no-fixed-wait\n// codeceptjs-lint-disable-next-line no-fixed-wait\nI.wait(2)\nI.wait(3)'
    expect(rules(code)).to.deep.equal(['4:no-fixed-wait'])
  })

  it('turns rules off from config', () => {
    const linter = new Linter({ lint: { rules: { 'no-fixed-wait': 'off', 'no-pause': 'error' } } })
    expect(linter.lint('I.wait(1)\npause()', 'test.js').map(f => `${f.rule}:${f.level}`)).to.deep.equal(['no-pause:error'])
  })

  it('lints TypeScript with correct lines', () => {
    expect(lint('const n: number = 5\n\nI.wait(n as number)\nI.wait(5)', 'test.ts').map(f => f.line)).to.deep.equal([4])
  })

  it('parses CommonJS files', () => {
    expect(rules("const x = require('x')\nreturn I.wait(1)")).to.deep.equal(['2:no-fixed-wait'])
  })

  it('collects tests, include and helper files from config', () => {
    const linter = new Linter({ tests: './*_test.js', include: { I: './steps_file.js', page: './pages/login.js', other: 'some-package' }, helpers: { Custom: { require: './custom_helper.js' } } }, project)
    const files = linter
      .files()
      .map(f => path.relative(project, f))
      .sort()
    expect(files).to.deep.equal(['checkout_test.js', 'custom_helper.js', 'existing_test.js', 'pages/login.js', 'steps_file.js'])
    expect(linter.includes(path.join(project, 'new_test.js'))).to.be.true
    expect(linter.includes(path.join(project, 'app.js'))).to.be.false
  })

  describe('CLI', () => {
    it('prints findings and exits 1 on errors', () => {
      const result = spawnSync(process.execPath, [bin, 'lint'], { cwd: project, encoding: 'utf8', env: { ...process.env, CI: '' } })
      expect(result.stdout).to.include('checkout_test.js:4:3  error  no-fixed-wait')
      expect(result.stdout).to.include('custom_helper.js:5:13  error  no-actor-in-helper')
      expect(result.stdout).not.to.include('raw-browser-in-test')
      expect(result.status).to.equal(1)
    })
  })

  describe('hook', () => {
    it('blocks a write that adds an error', () => {
      const result = runHook({ tool_name: 'Write', tool_input: { file_path: path.join(project, 'new_test.js'), content: "Scenario('a', ({ I }) => {\n  I.wait(3)\n})\n" } })
      expect(result.status).to.equal(2)
      expect(result.stderr).to.include('new_test.js:2:3  error  no-fixed-wait')
    })

    it('allows an edit that keeps existing errors', () => {
      const result = runHook({ tool_name: 'Edit', tool_input: { file_path: path.join(project, 'existing_test.js'), old_string: "I.see('Welcome')", new_string: "I.see('Hello')" } })
      expect(result.status).to.equal(0)
    })

    it('blocks an edit that adds a second identical error', () => {
      const result = runHook({ tool_name: 'Edit', tool_input: { file_path: path.join(project, 'existing_test.js'), old_string: "I.see('Welcome')", new_string: "I.wait(5)\n  I.see('Welcome')" } })
      expect(result.status).to.equal(2)
    })

    it('allows warnings, files outside the project config and bad payloads', () => {
      expect(runHook({ tool_name: 'Write', tool_input: { file_path: path.join(project, 'new_test.js'), content: 'pause()' } }).status).to.equal(0)
      expect(runHook({ tool_name: 'Write', tool_input: { file_path: path.join(project, 'app.js'), content: 'I.wait(1)' } }).status).to.equal(0)
      expect(runHook({ nonsense: true }).status).to.equal(0)
    })
  })

  it('does not touch fixture files', () => {
    expect(fs.existsSync(path.join(project, 'new_test.js'))).to.be.false
  })
})
