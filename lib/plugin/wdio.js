const debug = require('debug')('codeceptjs:plugin:wdio')

const container = require('../container')
const mainConfig = require('../config')
const recorder = require('../recorder')
const event = require('../event')
const output = require('../output')

const defaultConfig = {
  services: [],
  capabilities: {},
}

let restartsSession

/**
 * Webdriverio services runner.
 *
 * This plugin allows to run webdriverio services like:
 *
 * * selenium-standalone
 * * sauce
 * * testingbot
 * * browserstack
 * * appium
 *
 * A complete list of all available services can be found on [webdriverio website](https://webdriver.io).
 *
 * #### Setup
 *
 * 1. Install a webdriverio service
 * 2. Enable `wdio` plugin in config
 * 3. Add service name to `services` array inside wdio plugin config.
 *
 * See examples below:
 *
 * #### Selenium Standalone Service
 *
 * Install ` @wdio/selenium-standalone-service` package, as [described here](https://webdriver.io/docs/selenium-standalone-service.html).
 * It is important to make sure it is compatible with current webdriverio version.
 *
 * Enable `wdio` plugin in plugins list and add `selenium-standalone` service:
 *
 * ```js
 * plugins: {
 *    wdio: {
 *        enabled: true,
 *        services: ['selenium-standalone']
 *        // additional config for service can be passed here
 *    }
 * }
 * ```
 *
 *
 * #### Sauce Service
 *
 * Install `@wdio/sauce-service` package, as [described here](https://webdriver.io/docs/sauce-service.html).
 * It is important to make sure it is compatible with current webdriverio version.
 *
 * Enable `wdio` plugin in plugins list and add `sauce` service:
 *
 * ```js
 * plugins: {
 *    wdio: {
 *        enabled: true,
 *        services: ['sauce'],
 *        user: ... ,// saucelabs username
 *        key: ... // saucelabs api key
 *        // additional config, from sauce service
 *    }
 * }
 * ```
 *
 * ---
 *
 * In the same manner additional services from webdriverio can be installed, enabled, and configured.
 *
 * #### Configuration
 *
 * * `services` - list of enabled services
 * * ... - additional configuration passed into services.
 *
 */
module.exports = config => {
  // Keep initial configs to pass as options to wdio services
  const wdioOptions = { ...config }
  const webDriver = container.helpers('WebDriver')
  if (webDriver) {
    config = Object.assign(webDriver.options, config)
    restartsSession = !!config.restart
  }
  config = Object.assign(defaultConfig, config)
  const seleniumInstallArgs = { ...config.seleniumInstallArgs }
  const seleniumArgs = { ...config.seleniumArgs }

  const services = []
  const launchers = []

  for (const name of config.services) {
    const Service = safeRequire(`@wdio/${name.toLowerCase()}-service`)
    if (Service) {
      if (Service.launcher && typeof Service.launcher === 'function') {
        const Launcher = Service.launcher

        const options = {
          logPath: global.output_dir,
          installArgs: seleniumInstallArgs,
          args: seleniumArgs,
          ...wdioOptions,
        }
        launchers.push(new Launcher(options, [config.capabilities], config))
      }
      if (typeof Service === 'function') {
        services.push(new Service(config, config.capabilities))
      }
      continue
    }

    throw new Error(`Couldn't initialize service ${name} from wdio plugin config.\nIt should be available either in '@wdio/${name.toLowerCase()}-service' package`)
  }

  debug(`services ${services}, launchers ${launchers}`)

  recorder.startUnlessRunning()

  for (const launcher of launchers) {
    registerLauncher(launcher)
  }

  for (const service of services) {
    registerService(service)
  }

  function registerService(service) {
    const name = service.constructor.name
    if (service.beforeSession) {
      event.dispatcher.on(event.all.before, () => {
        recorder.add(`service ${name} all.before`, async () => {
          await service.beforeSession(config, config.capabilities)
        })
      })
    }

    if (service.afterSession) {
      event.dispatcher.on(event.all.result, result => {
        recorder.add(`service ${name} all.after`, async () => {
          await service.afterSession(result)
        })
      })
    }

    if (service.beforeSuite) {
      event.dispatcher.on(event.suite.before, suite => {
        debug(`suite started: ${suite.title}`)
        recorder.add(`service ${name} suite.before`, () => service.beforeSuite(suite))
      })
    }

    if (service.afterSuite) {
      event.dispatcher.on(event.suite.after, suite => {
        debug(`suite finished: ${suite.title}`)
        recorder.add(`service ${name} suite.after`, () => service.afterSuite(suite))
      })
    }

    if (service.beforeTest) {
      event.dispatcher.on(event.test.started, async test => {
        if (test.parent) {
          test.parent.toString = () => test.parent.title
        }
        // test.parent = test.parent ? test.parent.title : null;
        debug(`test started: ${test.title}`)
        if (webDriver) {
          global.browser = webDriver.browser
          global.browser.config = Object.assign(mainConfig.get('test', 1), global.browser.config)
        }
        await service.beforeTest(test)
      })
    }

    if (service.afterTest) {
      event.dispatcher.on(event.test.finished, async test => {
        debug(`test finished: ${test.title}`)
        await service.afterTest(test)
      })
    }

    if (restartsSession && service.before) {
      event.dispatcher.on(event.test.started, () => service.before())
    }

    if (restartsSession && service.after) {
      event.dispatcher.on(event.test.finished, () => service.after())
    }

    if (!restartsSession && service.before) {
      let initializedBrowser = false
      event.dispatcher.on(event.test.started, async () => {
        if (!initializedBrowser) {
          await service.before()
          initializedBrowser = true
        }
      })
    }

    if (!restartsSession && service.after) {
      event.dispatcher.on(event.all.result, result => service.after(result))
    }
  }

  function registerLauncher(launcher) {
    const name = launcher.constructor.name
    if (launcher.onPrepare) {
      event.dispatcher.on(event.all.before, () => {
        recorder.add(`launcher ${name} start`, async () => {
          // browserstack-service expects capabilities as array
          if (launcher.constructor.name === 'BrowserstackLauncherService') {
            await launcher.onPrepare(config, [config.capabilities])
          } else {
            await launcher.onPrepare(config, config.capabilities)
          }
          output.debug(`Started ${name}`)
        })
      })
    }

    if (launcher.onComplete) {
      event.dispatcher.on(event.all.after, () => {
        recorder.add(`launcher ${name} start`, async () => {
          await launcher.onComplete(process.exitCode, config, config.capabilities)
          output.debug(`Stopped ${name}`)
        })
      })
    }
  }
}

function safeRequire(name) {
  try {
    return require(name)
  } catch (e) {
    if (!e.message.match(`Cannot find module '${name}'`)) {
      throw new Error(`Couldn't initialise "${name}".\n${e.stack}`)
    }
    return null
  }
}
