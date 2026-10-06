import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import initAgent from '../../../lib/command/initAgent.js'

describe('init:agent command', () => {
  let tempDir
  let binDir
  let logFile
  let originalCwd
  let originalPath

  const fakeBin = (name, exitCode = 0) => {
    const file = path.join(binDir, name)
    fs.writeFileSync(file, `#!/bin/sh\necho "${name} $*" >> "${logFile}"\nexit ${exitCode}\n`)
    fs.chmodSync(file, 0o755)
  }

  const calls = () => {
    if (!fs.existsSync(logFile)) return []
    return fs.readFileSync(logFile, 'utf8').trim().split('\n')
  }

  const readJson = file => JSON.parse(fs.readFileSync(path.join(tempDir, file), 'utf8'))

  before(function () {
    if (process.platform === 'win32') this.skip()
  })

  beforeEach(() => {
    originalCwd = process.cwd()
    originalPath = process.env.PATH
    tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'codecept-init-agent-')))
    binDir = path.join(tempDir, '.bin')
    logFile = path.join(binDir, 'calls.log')
    fs.mkdirSync(binDir)
    process.env.PATH = `${binDir}${path.delimiter}${originalPath}`
    process.chdir(tempDir)
    fakeBin('claude')
    fakeBin('codex')
    fakeBin('npx')
    process.exitCode = 0
  })

  afterEach(() => {
    process.chdir(originalCwd)
    process.env.PATH = originalPath
    process.exitCode = 0
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  it('claude: registers MCP with claude CLI and installs skills', async () => {
    await initAgent('claude', { yes: true })

    expect(calls()).to.deep.equal(['claude mcp add codeceptjs -- npx codeceptjs-mcp', 'npx skills add codeceptjs/skills -a claude-code -y'])
    expect(fs.readdirSync(tempDir)).to.deep.equal(['.bin'])
  })

  it('codex: registers MCP with codex CLI and installs skills', async () => {
    await initAgent('codex', { yes: true })

    expect(calls()).to.deep.equal(['codex mcp add codeceptjs -- npx codeceptjs-mcp', 'npx skills add codeceptjs/skills -a codex -y'])
  })

  it('installs skills even when MCP registration fails', async () => {
    fakeBin('claude', 1)

    await initAgent('claude', { yes: true })

    expect(calls()).to.include('npx skills add codeceptjs/skills -a claude-code -y')
  })

  it('cursor: writes .cursor/mcp.json and keeps other servers', async () => {
    fs.mkdirSync(path.join(tempDir, '.cursor'))
    fs.writeFileSync(path.join(tempDir, '.cursor/mcp.json'), JSON.stringify({ mcpServers: { other: { command: 'other' } } }))

    await initAgent('cursor', { yes: true })

    expect(readJson('.cursor/mcp.json')).to.deep.equal({
      mcpServers: {
        other: { command: 'other' },
        codeceptjs: { command: 'npx', args: ['codeceptjs-mcp'] },
      },
    })
    expect(calls()).to.deep.equal(['npx skills add codeceptjs/skills -a cursor -y'])
  })

  it('opencode: writes opencode.json, second run gives the same file', async () => {
    fs.writeFileSync(path.join(tempDir, 'opencode.json'), JSON.stringify({ theme: 'dark' }))

    await initAgent('opencode', { yes: true })
    const first = fs.readFileSync(path.join(tempDir, 'opencode.json'), 'utf8')
    await initAgent('opencode', { yes: true })

    expect(fs.readFileSync(path.join(tempDir, 'opencode.json'), 'utf8')).to.equal(first)
    expect(readJson('opencode.json')).to.deep.equal({
      theme: 'dark',
      mcp: { codeceptjs: { type: 'local', command: ['npx', 'codeceptjs-mcp'], enabled: true } },
    })
  })

  it('leaves unparseable JSON untouched', async () => {
    const jsonc = '{\n  // comment\n  "mcp": {}\n}\n'
    fs.writeFileSync(path.join(tempDir, 'opencode.json'), jsonc)

    await initAgent('opencode', { yes: true })

    expect(fs.readFileSync(path.join(tempDir, 'opencode.json'), 'utf8')).to.equal(jsonc)
  })

  it('fails on unknown agent', async () => {
    await initAgent('vim', { yes: true })

    expect(process.exitCode).to.equal(1)
    expect(calls()).to.deep.equal([])
  })

  it('fails with --yes and no agent', async () => {
    await initAgent(undefined, { yes: true })

    expect(process.exitCode).to.equal(1)
  })
})
