import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { lintFile, lintSource, collectFiles, newErrors } from '../../../lib/lint.js'
import { runHook } from '../../../lib/command/lint.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.join(__dirname, '../../data/lint')
const bin = path.join(__dirname, '../../../bin/codecept.js')

const fixture = name => path.join(fixtures, name)
const findings = async (name, options) => (await lintFile(fixture(name), options)).findings
const byRule = (list, rule) => list.filter(f => f.rule === rule).map(f => f.line)

describe('lint command', () => {
  const saved = {}

  before(() => {
    for (const key of ['CI', 'CLAUDE_PROJECT_DIR']) {
      saved[key] = process.env[key]
      delete process.env[key]
    }
  })

  after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  describe('rules', () => {
    it('no-fixed-wait flags I.wait with a number literal only', async () => {
      const list = await findings('no-fixed-wait.js')
      expect(byRule(list, 'no-fixed-wait')).to.deep.equal([5])
      expect(list[0].level).to.equal('error')
      expect(list[0].column).to.equal(3)
      expect(list[0].message).to.include('I.wait(5)')
    })

    it('no-sleep flags setTimeout in scenarios and page object methods', async () => {
      const list = await findings('no-sleep.js')
      expect(byRule(list, 'no-sleep')).to.deep.equal([6, 13])
    })

    it('no-sleep ignores files without CodeceptJS code', async () => {
      expect(await findings('no-sleep-app.js')).to.be.empty
    })

    it('no-only flags focused features, scenarios and data scenarios', async () => {
      const list = await findings('no-only.js')
      expect(byRule(list, 'no-only')).to.deep.equal([1, 7, 11])
    })

    it('no-only and no-pause are warnings locally and errors on CI', async () => {
      let list = [...(await findings('no-only.js')), ...(await findings('no-pause.js'))]
      expect(list.map(f => f.level)).to.deep.equal(['warn', 'warn', 'warn', 'warn'])
      process.env.CI = 'true'
      try {
        list = [...(await findings('no-only.js')), ...(await findings('no-pause.js'))]
      } finally {
        delete process.env.CI
      }
      expect(list.map(f => f.level)).to.deep.equal(['error', 'error', 'error', 'error'])
    })

    it('no-pause flags pause() calls', async () => {
      expect(byRule(await findings('no-pause.js'), 'no-pause')).to.deep.equal([5])
    })

    it('secret-credentials flags credentials not wrapped in secret()', async () => {
      const list = await findings('secret-credentials.js')
      expect(byRule(list, 'secret-credentials')).to.deep.equal([5, 7, 9])
    })

    it('await-grab flags grab results used without await', async () => {
      const list = await findings('await-grab.js')
      expect(byRule(list, 'await-grab')).to.deep.equal([4, 7, 14])
    })

    it('no-actor-in-helper flags I inside a Helper class only', async () => {
      const list = await findings('no-actor-in-helper.js')
      expect(byRule(list, 'no-actor-in-helper')).to.deep.equal([5, 6])
    })

    it('raw-browser-in-test warns on use*To and executeScript inside a Scenario', async () => {
      const list = await findings('raw-browser-in-test.js')
      expect(byRule(list, 'raw-browser-in-test')).to.deep.equal([4, 5])
      expect(list.every(f => f.level === 'warn')).to.be.true
    })

    it('clean test has no findings', async () => {
      expect(await findings('clean.js')).to.be.empty
    })
  })

  describe('engine', () => {
    it('suppresses findings with disable-line and disable-next-line comments that name the rule', async () => {
      expect(byRule(await findings('suppressed.js'), 'no-fixed-wait')).to.deep.equal([7, 8])
    })

    it('applies rule levels from config', async () => {
      const list = await findings('raw-browser-in-test.js', { rules: { 'raw-browser-in-test': 'off' } })
      expect(list).to.be.empty
      const waits = await findings('no-fixed-wait.js', { rules: { 'no-fixed-wait': 'warn' } })
      expect(waits[0].level).to.equal('warn')
    })

    it('keeps TypeScript line numbers after stripping types', async () => {
      const list = await findings('typescript.ts')
      expect(list.map(f => [f.rule, f.line, f.column])).to.deep.equal([
        ['await-grab', 13, 25],
        ['no-fixed-wait', 14, 3],
      ])
    })

    it('maps TypeScript syntax that needs transpiling back to source lines', async () => {
      const list = await findings('typescript-enum.ts')
      expect(list.map(f => [f.rule, f.line])).to.deep.equal([['no-fixed-wait', 10]])
    })

    it('parses CommonJS files as scripts', async () => {
      const code = 'const { I } = inject()\n\nmodule.exports = {\n  open() {\n    I.wait(2)\n  },\n}\n\nreturn\n'
      expect(byRule((await lintSource(code, 'page.js')).findings, 'no-fixed-wait')).to.deep.equal([5])
    })

    it('throws on syntax errors', async () => {
      let error
      try {
        await lintSource("Scenario('broken', ({ I }) => {\n  I.see(\n", 'broken.js')
      } catch (err) {
        error = err
      }
      expect(error).to.be.instanceOf(SyntaxError)
    })

    it('collects tests, local includes and helpers from config, minus ignored files', () => {
      const root = fixture('project')
      const config = {
        tests: './*_test.js',
        include: { I: './steps_file.js', loginPage: './pages/login.js', externalModule: 'some-package' },
        helpers: { Custom: { require: './custom_helper.js' }, Playwright: {} },
        lint: { ignore: ['legacy_test.js'] },
      }
      const files = collectFiles(config, root)
        .map(f => path.relative(root, f))
        .sort()
      expect(files).to.deep.equal(['checkout_test.js', 'custom_helper.js', 'existing_test.js', path.join('pages', 'login.js'), 'steps_file.js'])
    })

    it('treats repeated identical errors as new', async () => {
      const before = (await lintSource("Scenario('a', ({ I }) => {\n  I.wait(5)\n})\n")).findings
      const after = (await lintSource("Scenario('a', ({ I }) => {\n  I.wait(5)\n  I.say('x')\n  I.wait(5)\n})\n")).findings
      const added = newErrors(before, after)
      expect(added).to.have.length(1)
      expect(added[0].line).to.equal(4)
    })
  })

  describe('CLI', () => {
    const run = (args, opts = {}) => spawnSync(process.execPath, [bin, 'lint', ...args], { encoding: 'utf8', env: { ...process.env, CI: '' }, ...opts })

    it('lints files from config and exits 1 on errors', () => {
      const result = run(['-c', fixture('project/codecept.conf.js')])
      expect(result.status).to.equal(1)
      expect(result.stdout).to.include('checkout_test.js:4:3')
      expect(result.stdout).to.include('no-fixed-wait')
      expect(result.stdout).to.include('custom_helper.js:5:13')
      expect(result.stdout).to.include('login.js:5:5')
      expect(result.stdout).not.to.include('legacy_test.js')
      expect(result.stdout).not.to.include('raw-browser-in-test')
    })

    it('exits 0 when only warnings are found', () => {
      const result = run([fixture('no-pause.js')])
      expect(result.status).to.equal(0)
      expect(result.stdout).to.include('no-pause')
    })

    it('prints JSON', () => {
      const result = run(['--json', fixture('no-fixed-wait.js')])
      expect(result.status).to.equal(1)
      const json = JSON.parse(result.stdout)
      expect(json.errors).to.equal(1)
      expect(json.findings[0]).to.include({ rule: 'no-fixed-wait', line: 5, column: 3, level: 'error' })
    })

    it('exits 2 on parse failure', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codecept-lint-'))
      const file = path.join(dir, 'broken_test.js')
      fs.writeFileSync(file, "Scenario('broken', ({ I }) => {\n  I.see(\n")
      try {
        const result = run([file])
        expect(result.status).to.equal(2)
        expect(result.stdout).to.include('parse')
      } finally {
        fs.rmSync(dir, { recursive: true, force: true })
      }
    })
  })

  describe('hook', () => {
    let dir
    const existing = () => path.join(dir, 'existing_test.js')

    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codecept-lint-'))
      fs.copyFileSync(fixture('project/existing_test.js'), existing())
    })

    afterEach(() => {
      fs.rmSync(dir, { recursive: true, force: true })
    })

    const hook = payload => runHook({ cwd: dir, ...payload }, { agent: 'claude' })

    it('blocks a Write that introduces an error', async () => {
      const result = await hook({ tool_name: 'Write', tool_input: { file_path: path.join(dir, 'new_test.js'), content: fs.readFileSync(fixture('no-fixed-wait.js'), 'utf8') } })
      expect(result.code).to.equal(2)
      expect(result.stderr).to.include('new_test.js:5:3')
      expect(result.stderr).to.include('no-fixed-wait')
    })

    it('allows a Write that only produces warnings', async () => {
      const result = await hook({ tool_name: 'Write', tool_input: { file_path: path.join(dir, 'stub_test.js'), content: fs.readFileSync(fixture('no-pause.js'), 'utf8') } })
      expect(result).to.deep.equal({ code: 0, stderr: '' })
    })

    it('blocks an Edit that adds an error to a clean part of the file', async () => {
      const result = await hook({ tool_name: 'Edit', tool_input: { file_path: existing(), old_string: "I.see('Welcome')", new_string: "I.see('Welcome')\n  I.wait(3)" } })
      expect(result.code).to.equal(2)
      expect(result.stderr).to.include('I.wait(3)')
      expect(result.stderr).not.to.include('I.wait(5)')
    })

    it('allows an Edit on a file with pre-existing violations', async () => {
      const result = await hook({ tool_name: 'Edit', tool_input: { file_path: existing(), old_string: "I.see('Welcome')", new_string: "I.see('Welcome')\n  I.waitForElement('#ok')" } })
      expect(result.code).to.equal(0)
    })

    it('blocks a second identical violation', async () => {
      const result = await hook({ tool_name: 'Edit', tool_input: { file_path: existing(), old_string: "I.see('Welcome')", new_string: "I.see('Welcome')\n  I.wait(5)" } })
      expect(result.code).to.equal(2)
      expect(result.stderr).to.include('existing_test.js:7:3')
    })

    it('applies MultiEdit edits in order', async () => {
      const result = await hook({
        tool_name: 'MultiEdit',
        tool_input: {
          file_path: existing(),
          edits: [
            { old_string: 'I.wait(5)', new_string: "I.waitForText('Welcome')" },
            { old_string: "I.see('Welcome')", new_string: "I.see('Welcome')\n  I.wait(1)" },
          ],
        },
      })
      expect(result.code).to.equal(2)
      expect(result.stderr).to.include('I.wait(1)')
    })

    it('ignores other tools, other files and files outside the project', async () => {
      expect((await hook({ tool_name: 'Read', tool_input: { file_path: existing() } })).code).to.equal(0)
      expect((await hook({ tool_name: 'Write', tool_input: { file_path: path.join(dir, 'notes.md'), content: 'I.wait(5)' } })).code).to.equal(0)
      const outside = path.join(os.tmpdir(), 'outside_test.js')
      expect((await hook({ tool_name: 'Write', tool_input: { file_path: outside, content: "Scenario('a', ({ I }) => { I.wait(5) })" } })).code).to.equal(0)
    })

    it('respects lint config from the project', async () => {
      fs.writeFileSync(path.join(dir, 'codecept.conf.js'), "exports.config = { tests: './*_test.js', lint: { ignore: ['legacy/**'], rules: { 'await-grab': 'warn' } } }\n")
      const legacy = await hook({ tool_name: 'Write', tool_input: { file_path: path.join(dir, 'legacy', 'old_test.js'), content: "Scenario('a', ({ I }) => {\n  I.wait(5)\n})\n" } })
      expect(legacy.code).to.equal(0)
      const grab = await hook({ tool_name: 'Write', tool_input: { file_path: path.join(dir, 'grab_test.js'), content: "Scenario('a', ({ I }) => {\n  const t = I.grabTitle()\n})\n" } })
      expect(grab.code).to.equal(0)
    })

    it('allows edits that leave the file unparseable', async () => {
      const result = await hook({ tool_name: 'Write', tool_input: { file_path: path.join(dir, 'broken_test.js'), content: 'Scenario((' } })
      expect(result.code).to.equal(0)
      expect(result.stderr).to.include('could not be parsed')
    })

    it('reads the payload from stdin and exits 2 with findings on stderr', () => {
      const payload = { cwd: dir, tool_name: 'Edit', tool_input: { file_path: existing(), old_string: "I.see('Welcome')", new_string: "I.see('Welcome')\n  I.wait(5)" } }
      const result = spawnSync(process.execPath, [bin, 'lint', '--hook', 'claude'], { cwd: dir, input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } })
      expect(result.status).to.equal(2)
      expect(result.stdout).to.equal('')
      expect(result.stderr).to.include('no-fixed-wait')
    })

    it('exits 0 on invalid stdin', () => {
      const result = spawnSync(process.execPath, [bin, 'lint', '--hook', 'claude'], { cwd: dir, input: 'not json', encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } })
      expect(result.status).to.equal(0)
      expect(result.stdout).to.equal('')
    })
  })
})
