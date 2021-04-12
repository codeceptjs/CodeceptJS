const envinfo = require('envinfo');

const { getConfig, getTestRoot } = require('./utils');
const Codecept = require('../codecept');
const output = require('../output');

module.exports = async function (path) {
  const testsPath = getTestRoot(path);
  const config = getConfig(testsPath);
  const codecept = new Codecept(config, {});
  codecept.init(testsPath);

  output.print('\n Environment information:-\n');
  const info = {};
  info.codeceptVersion = Codecept.version();
  info.nodeInfo = await envinfo.helpers.getNodeInfo();
  info.osInfo = await envinfo.helpers.getOSInfo();
  info.cpuInfo = await envinfo.helpers.getCPUInfo();
  info.chromeInfo = await envinfo.helpers.getChromeInfo();
  info.edgeInfo = await envinfo.helpers.getEdgeInfo();
  info.firefoxInfo = await envinfo.helpers.getFirefoxInfo();
  info.safariInfo = await envinfo.helpers.getSafariInfo();
  const { helpers, plugins } = config;
  info.helpers = helpers || "You don't use any helpers";
  info.plugins = plugins || "You don't have any enabled plugins";

  for (const [key, value] of Object.entries(info)) {
    if (Array.isArray(value)) {
      output.print(`${key}:  ${value[1]}`);
    } else {
      output.print(`${key}:  ${JSON.stringify(value, null, ' ')}`);
    }
  }
  output.print('***************************************');
  output.print('If you have questions ask them in our Slack: shorturl.at/cuKU8');
  output.print('Or ask them on our discussion board: https://codecept.discourse.group/');
  output.print('Please copy environment info when you report issues on GitHub: https://github.com/Codeception/CodeceptJS/issues');
  output.print('***************************************');
};
