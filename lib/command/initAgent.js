import colors from 'chalk'
import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import { spawnSync } from 'child_process'
import { mkdirp } from 'mkdirp'

import output from '../output.js'
import { getTestRoot, findConfigFile } from './utils.js'

const { print, success, error } = output

const SERVER = 'codeceptjs'
const MCP_COMMAND = ['npx', 'codeceptjs-mcp']
const SKILLS_PACKAGE = 'codeceptjs/skills'

export const agents = {
  claude: {
    title: 'Claude Code',
    skills: 'claude-code',
    bin: 'claude',
    installUrl: 'https://code.claude.com/docs/en/setup',
    envFlag: '-e',
  },
  codex: {
    title: 'Codex',
    skills: 'codex',
    bin: 'codex',
    installUrl: 'https://developers.openai.com/codex/cli',
    envFlag: '--env',
  },
  cursor: {
    title: 'Cursor',
    skills: 'cursor',
    file: '.cursor/mcp.json',
    key: 'mcpServers',
    entry: env => ({ command: MCP_COMMAND[0], args: MCP_COMMAND.slice(1), ...(env && { env }) }),
  },
  opencode: {
    title: 'OpenCode',
    skills: 'opencode',
    file: 'opencode.json',
    key: 'mcp',
    entry: env => ({ type: 'local', command: MCP_COMMAND, enabled: true, ...(env && { environment: env }) }),
  },
}

const agentNames = Object.keys(agents)

export default async function (agentName, options = {}) {
  if (!agentName && options.yes) return fail(`Agent is required with --yes. Use one of: ${agentNames.join(', ')}`)
  if (agentName && !agents[agentName]) return fail(`Unknown agent "${agentName}". Use one of: ${agentNames.join(', ')}`)

  if (!agentName) {
    const answer = await inquirer.prompt([
      {
        name: 'agent',
        type: 'list',
        message: 'Which coding agent do you use?',
        choices: agentNames,
      },
    ])
    agentName = answer.agent
  }
  return setupAgent(agentName, options)
}

export async function setupAgent(agentName, options = {}) {
  const agent = agents[agentName]
  if (!agent) throw new Error(`Unknown agent "${agentName}". Use one of: ${agentNames.join(', ')}`)

  const run = options.runner || spawnCommand
  const cwd = process.cwd()
  const env = configEnv(options.config, cwd)

  print()
  print(`Setting up CodeceptJS for ${colors.bold(agent.title)}`)
  print()

  let ready = agent.bin ? registerWithCli(agent, env, run) : writeMcpFile(path.join(cwd, agent.file), agent, env)

  const skillsArgs = ['skills', 'add', SKILLS_PACKAGE, '-a', agent.skills, '-y']
  print(`Installing CodeceptJS skills: ${colors.green(['npx', ...skillsArgs].join(' '))}`)
  if (!succeeded(run('npx', skillsArgs))) {
    ready = false
    error('Installing skills failed. Run it manually:')
    print(`  npx ${skillsArgs.join(' ')}`)
  }

  print()
  if (ready) {
    success(`Start ${agent.title} in this project. CodeceptJS skills and MCP are ready.`)
  } else {
    print(`Run the commands above, then start ${agent.title} in this project.`)
  }
  print()
  return ready
}

function registerWithCli(agent, env, run) {
  const addArgs = ['mcp', 'add', SERVER]
  if (env) Object.entries(env).forEach(([key, value]) => addArgs.push(agent.envFlag, `${key}=${value}`))
  addArgs.push('--', ...MCP_COMMAND)
  const manual = `  ${agent.bin} ${addArgs.join(' ')}`

  if (!succeeded(run(agent.bin, ['--version'], { quiet: true }))) {
    error(`${agent.title} CLI (${agent.bin}) was not found. Install it: ${agent.installUrl}`)
    print('Then register the MCP server:')
    print(manual)
    return false
  }

  if (succeeded(run(agent.bin, ['mcp', 'get', SERVER], { quiet: true }))) {
    print(`MCP server "${SERVER}" is already registered in ${agent.title}`)
    return true
  }

  print(`Registering MCP server: ${colors.green(`${agent.bin} ${addArgs.join(' ')}`)}`)
  if (succeeded(run(agent.bin, addArgs))) return true

  error('Registering MCP server failed. Run it manually:')
  print(manual)
  return false
}

function writeMcpFile(file, agent, env) {
  const entry = agent.entry(env)
  const relative = path.relative(process.cwd(), file)
  let data = {}

  if (fs.existsSync(file)) {
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch (err) {
      data = null
    }
    if (!isObject(data) || (data[agent.key] !== undefined && !isObject(data[agent.key]))) {
      error(`Could not parse ${relative}, leaving it untouched. Add this to "${agent.key}" manually:`)
      print(JSON.stringify({ [SERVER]: entry }, null, 2))
      return false
    }
  }

  if (data[agent.key] && JSON.stringify(data[agent.key][SERVER]) === JSON.stringify(entry)) {
    print(`MCP server "${SERVER}" is already configured in ${relative}`)
    return true
  }

  data[agent.key] = { ...(data[agent.key] || {}), [SERVER]: entry }
  mkdirp.sync(path.dirname(file))
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
  print(`MCP server "${SERVER}" added to ${relative}`)
  return true
}

function configEnv(config, cwd) {
  let configFile = config ? path.resolve(cwd, config) : findConfigFile(getTestRoot())
  if (configFile && fs.existsSync(configFile) && fs.lstatSync(configFile).isDirectory()) configFile = findConfigFile(configFile)
  if (!configFile || configFile === path.join(cwd, 'codecept.conf.js')) return null
  const relative = path.relative(cwd, configFile)
  return { CODECEPTJS_CONFIG: relative.startsWith('..') ? configFile : `./${relative.split(path.sep).join('/')}` }
}

function fail(message) {
  error(message)
  process.exitCode = 1
  return false
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function succeeded(result) {
  return !!result && !result.error && result.status === 0
}

function spawnCommand(command, args, { quiet } = {}) {
  return spawnSync(command, args, { stdio: quiet ? 'ignore' : 'inherit', shell: process.platform === 'win32' })
}
