import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import initAgent from '../../../lib/command/initAgent.js'

describe('init:agent command', () => {
  let tempDir
  let originalCwd
  let calls

  const runner =
    (handler = () => 0) =>
    (command, args, opts = {}) => {
      calls.push({ command, args, quiet: !!opts.quiet })
      return { status: handler(command, args) }
    }

  const failing = (command, args) => (args[0] === 'mcp' && args[1] === 'get' ? 1 : 0)

  const listFiles = () => fs.readdirSync(tempDir, { recursive: true })
  const readJson = file => JSON.parse(fs.readFileSync(path.join(tempDir, file), 'utf8'))

  beforeEach(() => {
    originalCwd = process.cwd()
    tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'codecept-init-agent-')))
    process.chdir(tempDir)
    fs.writeFileSync(path.join(tempDir, 'codecept.conf.js'), 'export const config = {}')
    calls = []
  })

  afterEach(() => {
    process.chdir(originalCwd)
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  describe('claude', () => {
    it('registers MCP and installs skills without writing files', async () => {
      const ready = await initAgent('claude', { yes: true, runner: runner(failing) })

      expect(ready).to.be.true
      expect(calls.filter(c => !c.quiet).map(c => [c.command, ...c.args])).to.deep.equal([
        ['claude', 'mcp', 'add', 'codeceptjs', '--', 'npx', 'codeceptjs-mcp'],
        ['npx', 'skills', 'add', 'codeceptjs/skills', '-a', 'claude-code', '-y'],
      ])
      expect(listFiles()).to.deep.equal(['codecept.conf.js'])
    })

    it('skips mcp add when the server is already registered', async () => {
      await initAgent('claude', { yes: true, runner: runner() })

      expect(calls.map(c => c.args.slice(0, 2).join(' '))).to.include('mcp get')
      expect(calls.some(c => c.args[1] === 'add' && c.command === 'claude')).to.be.false
      expect(calls.some(c => c.command === 'npx')).to.be.true
    })

    it('passes CODECEPTJS_CONFIG for a non-default config', async () => {
      fs.mkdirSync(path.join(tempDir, 'e2e'))
      fs.writeFileSync(path.join(tempDir, 'e2e/codecept.conf.ts'), 'export const config = {}')

      await initAgent('claude', { yes: true, config: 'e2e/codecept.conf.ts', runner: runner(failing) })

      const add = calls.find(c => c.command === 'claude' && c.args[1] === 'add')
      expect(add.args).to.deep.equal(['mcp', 'add', 'codeceptjs', '-e', 'CODECEPTJS_CONFIG=./e2e/codecept.conf.ts', '--', 'npx', 'codeceptjs-mcp'])
    })

    it('continues when the claude binary is missing', async () => {
      const ready = await initAgent('claude', { yes: true, runner: runner(command => (command === 'claude' ? 127 : 0)) })

      expect(ready).to.be.false
      expect(calls.some(c => c.args[1] === 'add' && c.command === 'claude')).to.be.false
      expect(calls.some(c => c.command === 'npx')).to.be.true
    })

    it('continues when skills install fails', async () => {
      const ready = await initAgent('claude', { yes: true, runner: runner((command, args) => (command === 'npx' ? 1 : failing(command, args))) })

      expect(ready).to.be.false
      expect(calls.some(c => c.command === 'claude' && c.args[1] === 'add')).to.be.true
    })
  })

  describe('codex', () => {
    it('registers MCP with codex and installs skills', async () => {
      await initAgent('codex', { yes: true, runner: runner(failing) })

      expect(calls.filter(c => !c.quiet).map(c => [c.command, ...c.args])).to.deep.equal([
        ['codex', 'mcp', 'add', 'codeceptjs', '--', 'npx', 'codeceptjs-mcp'],
        ['npx', 'skills', 'add', 'codeceptjs/skills', '-a', 'codex', '-y'],
      ])
      expect(listFiles()).to.deep.equal(['codecept.conf.js'])
    })
  })

  describe('cursor', () => {
    it('writes .cursor/mcp.json and installs skills', async () => {
      await initAgent('cursor', { yes: true, runner: runner() })

      expect(readJson('.cursor/mcp.json')).to.deep.equal({
        mcpServers: { codeceptjs: { command: 'npx', args: ['codeceptjs-mcp'] } },
      })
      expect(calls.map(c => [c.command, ...c.args])).to.deep.equal([['npx', 'skills', 'add', 'codeceptjs/skills', '-a', 'cursor', '-y']])
    })

    it('preserves other servers and keys', async () => {
      fs.mkdirSync(path.join(tempDir, '.cursor'))
      fs.writeFileSync(path.join(tempDir, '.cursor/mcp.json'), JSON.stringify({ other: true, mcpServers: { github: { command: 'gh' } } }))

      await initAgent('cursor', { yes: true, runner: runner() })

      expect(readJson('.cursor/mcp.json')).to.deep.equal({
        other: true,
        mcpServers: { github: { command: 'gh' }, codeceptjs: { command: 'npx', args: ['codeceptjs-mcp'] } },
      })
    })

    it('produces the same file on a second run', async () => {
      await initAgent('cursor', { yes: true, runner: runner() })
      const first = fs.readFileSync(path.join(tempDir, '.cursor/mcp.json'), 'utf8')
      await initAgent('cursor', { yes: true, runner: runner() })
      expect(fs.readFileSync(path.join(tempDir, '.cursor/mcp.json'), 'utf8')).to.equal(first)
    })

    it('leaves unparseable JSON untouched', async () => {
      const jsonc = '{\n  // comment\n  "mcpServers": {}\n}\n'
      fs.mkdirSync(path.join(tempDir, '.cursor'))
      fs.writeFileSync(path.join(tempDir, '.cursor/mcp.json'), jsonc)

      const ready = await initAgent('cursor', { yes: true, runner: runner() })

      expect(ready).to.be.false
      expect(fs.readFileSync(path.join(tempDir, '.cursor/mcp.json'), 'utf8')).to.equal(jsonc)
      expect(calls.some(c => c.command === 'npx')).to.be.true
    })
  })

  describe('opencode', () => {
    it('writes opencode.json preserving other keys', async () => {
      fs.writeFileSync(path.join(tempDir, 'opencode.json'), JSON.stringify({ $schema: 'https://opencode.ai/config.json', mcp: { other: { type: 'remote', url: 'http://x' } } }))

      await initAgent('opencode', { yes: true, runner: runner() })

      expect(readJson('opencode.json')).to.deep.equal({
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          other: { type: 'remote', url: 'http://x' },
          codeceptjs: { type: 'local', command: ['npx', 'codeceptjs-mcp'], enabled: true },
        },
      })
      expect(calls.map(c => [c.command, ...c.args])).to.deep.equal([['npx', 'skills', 'add', 'codeceptjs/skills', '-a', 'opencode', '-y']])
    })

    it('produces the same file on a second run', async () => {
      await initAgent('opencode', { yes: true, runner: runner() })
      const first = fs.readFileSync(path.join(tempDir, 'opencode.json'), 'utf8')
      await initAgent('opencode', { yes: true, runner: runner() })
      expect(fs.readFileSync(path.join(tempDir, 'opencode.json'), 'utf8')).to.equal(first)
    })
  })

  describe('arguments', () => {
    afterEach(() => {
      process.exitCode = 0
    })

    it('requires an agent with --yes', async () => {
      const ready = await initAgent(undefined, { yes: true, runner: runner() })

      expect(ready).to.be.false
      expect(process.exitCode).to.equal(1)
      expect(calls).to.be.empty
      expect(listFiles()).to.deep.equal(['codecept.conf.js'])
    })

    it('rejects unknown agents', async () => {
      const ready = await initAgent('vim', { yes: true, runner: runner() })

      expect(ready).to.be.false
      expect(process.exitCode).to.equal(1)
      expect(calls).to.be.empty
    })
  })
})
