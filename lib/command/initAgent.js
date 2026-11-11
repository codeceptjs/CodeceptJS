import fs from 'fs'
import path from 'path'
import inquirer from 'inquirer'
import { execSync } from 'child_process'

import output from '../output.js'

const { print, success, error } = output

export const agents = {
  claude: {
    skills: 'claude-code',
    mcp: 'claude mcp add codeceptjs -- npx codeceptjs-mcp',
  },
  codex: {
    skills: 'codex',
    mcp: 'codex mcp add codeceptjs -- npx codeceptjs-mcp',
  },
  cursor: {
    skills: 'cursor',
    file: '.cursor/mcp.json',
    key: 'mcpServers',
    server: { command: 'npx', args: ['codeceptjs-mcp'] },
  },
  opencode: {
    skills: 'opencode',
    file: 'opencode.json',
    key: 'mcp',
    server: { type: 'local', command: ['npx', 'codeceptjs-mcp'], enabled: true },
  },
}

export default async function (agentName, options = {}) {
  if (!agentName && !options.yes) {
    const answer = await inquirer.prompt([{ name: 'agent', type: 'list', message: 'Which coding agent do you use?', choices: Object.keys(agents) }])
    agentName = answer.agent
  }

  const agent = agents[agentName]
  if (!agent) {
    error(`Agent must be one of: ${Object.keys(agents).join(', ')}`)
    process.exitCode = 1
    return
  }

  let ready = true
  try {
    if (agent.mcp) {
      execSync(agent.mcp, { stdio: 'inherit' })
    } else {
      addServerToFile(agent)
      print(`Added codeceptjs MCP server to ${agent.file}`)
    }
  } catch (err) {
    ready = false
    error(`Could not register the codeceptjs MCP server: ${err.message}`)
    if (agent.mcp) print(`Run: ${agent.mcp}`)
    if (agent.file) print(`Add to "${agent.key}" in ${agent.file}: ${JSON.stringify({ codeceptjs: agent.server })}`)
  }

  const skills = `npx skills add codeceptjs/skills -a ${agent.skills} -y`
  try {
    execSync(skills, { stdio: 'inherit' })
  } catch (err) {
    ready = false
    error(`Could not install skills. Run: ${skills}`)
  }

  if (ready) success(`Start ${agentName} in this project. CodeceptJS skills and MCP are ready.`)
}

function addServerToFile(agent) {
  let config = {}
  if (fs.existsSync(agent.file)) config = JSON.parse(fs.readFileSync(agent.file, 'utf8'))
  config[agent.key] = { ...config[agent.key], codeceptjs: agent.server }
  fs.mkdirSync(path.dirname(agent.file), { recursive: true })
  fs.writeFileSync(agent.file, `${JSON.stringify(config, null, 2)}\n`)
}
