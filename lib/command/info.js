const envinfo = require('envinfo')

const { getConfig, getTestRoot } = require('./utils')
const Codecept = require('../codecept')
const output = require('../output')
const { execSync } = require('child_process')

async function getPlaywrightBrowsers() {
  try {
    const regex = /(chromium|firefox|webkit)\s+version\s+([\d.]+)/gi
    let versions = []

    const info = execSync('npx playwright install --dry-run').toString().trim()

    const matches = [...info.matchAll(regex)]

    matches.forEach(match => {
      const browser = match[1]
      const version = match[2]
      versions.push(`${browser}: ${version}`)
    })

    return versions.join(', ')
  } catch (err) {
    return 'Playwright not installed'
  }
}

async function getOsBrowsers() {
  const chromeInfo = await envinfo.helpers.getChromeInfo()
  const edgeInfo = await envinfo.helpers.getEdgeInfo()
  const firefoxInfo = await envinfo.helpers.getFirefoxInfo()
  const safariInfo = await envinfo.helpers.getSafariInfo()

  return [
    `chrome: ${chromeInfo ? chromeInfo[1] : 'not installed'}`,
    `edge: ${edgeInfo ? edgeInfo[1] : 'not installed'}`,
    `firefox: ${firefoxInfo ? firefoxInfo[1] : 'not installed'}`,
    `safari: ${safariInfo ? safariInfo[1] : 'not installed'}`,
  ].join(', ')
}

module.exports = async function (path) {
  const testsPath = getTestRoot(path)
  const config = getConfig(testsPath)
  const codecept = new Codecept(config, {})
  codecept.init(testsPath)

  output.print('\n Environment information: \n')
  const info = {}
  info.codeceptVersion = Codecept.version()
  info.nodeInfo = await envinfo.helpers.getNodeInfo()
  info.osInfo = await envinfo.helpers.getOSInfo()
  info.cpuInfo = await envinfo.helpers.getCPUInfo()
  info.osBrowsers = await getOsBrowsers()
  info.playwrightBrowsers = await getPlaywrightBrowsers()

  const { helpers, plugins } = config
  info.helpers = helpers || "You don't use any helpers"
  info.plugins = plugins || "You don't have any enabled plugins"

  for (const [key, value] of Object.entries(info)) {
    if (Array.isArray(value)) {
      output.print(`${key}:  ${value[1]}`)
    } else {
      output.print(`${key}:  ${JSON.stringify(value, null, ' ')}`)
    }
  }
  output.print('***************************************')
  output.print('If you have questions ask them in our Slack: http://bit.ly/chat-codeceptjs')
  output.print('Or ask them on our discussion board: https://codecept.discourse.group/')
  output.print('Please copy environment info when you report issues on GitHub: https://github.com/Codeception/CodeceptJS/issues')
  output.print('***************************************')
}

module.exports.getMachineInfo = async () => {
  const info = {
    nodeInfo: await envinfo.helpers.getNodeInfo(),
    osInfo: await envinfo.helpers.getOSInfo(),
    cpuInfo: await envinfo.helpers.getCPUInfo(),
    chromeInfo: await envinfo.helpers.getChromeInfo(),
    edgeInfo: await envinfo.helpers.getEdgeInfo(),
    firefoxInfo: await envinfo.helpers.getFirefoxInfo(),
    safariInfo: await envinfo.helpers.getSafariInfo(),
    playwrightBrowsers: await getPlaywrightBrowsers(),
  }

  output.print('***************************************')
  for (const [key, value] of Object.entries(info)) {
    if (Array.isArray(value)) {
      output.print(`${key}:  ${value[1]}`)
    } else {
      output.print(`${key}:  ${JSON.stringify(value, null, ' ')}`)
    }
  }
  output.print('If you need more detailed info, just run this: npx codeceptjs info')
  output.print('***************************************')
  return info
}
