const util = require('util')
const path = require('path')
const fs = require('fs')
const axios = require('axios').default
const exec = util.promisify(require('child_process').exec)
const { clearString, deepMerge } = require('../utils')
const { container, event, recorder, output } = require('../index')

const defaultBrowserConfig = {
  chrome: {
    default: 'latest',
    versions: {
      latest: {
        image: 'selenoid/chrome:latest',
        port: '4444',
        path: '/',
      },
    },
  },
  firefox: {
    default: 'latest',
    versions: {
      latest: {
        image: 'selenoid/firefox:latest',
        port: '4444',
        path: '/wd/hub',
      },
    },
  },
}

const dockerCreateScriptArr = [
  'docker create --rm --name $name$',
  '-p $port$:4444',
  '-v /var/run/docker.sock:/var/run/docker.sock',
  `-v ${global.codecept_dir}/:/etc/selenoid/:ro`,
  `-v ${global.output_dir}/video/:/opt/selenoid/video/`,
  `-v ${global.output_dir}/logs/:/opt/selenoid/logs/`,
  `-e OVERRIDE_VIDEO_OUTPUT_DIR=${global.output_dir}/video/`,
  '$additionalParams$',
  'aerokube/selenoid:latest-release -log-output-dir /opt/selenoid/logs',
]

const dockerImageCheckScript = ['docker images', "--filter reference='selenoid/video-recorder'", "--filter reference='selenoid/chrome:latest'", "--filter reference='selenoid/firefox:latest'"].join(' ')

let dockerCreateScript = dockerCreateScriptArr.join(' ')
let dockerStartScript = 'docker start $name$'
let dockerStopScript = 'docker stop $name$'
let seleniumUrl = 'http://localhost:$port$'

const supportedHelpers = ['WebDriver']
const SELENOID_START_TIMEOUT = 2000
const SELENOID_STOP_TIMEOUT = 10000
const wait = time =>
  new Promise(res => {
    setTimeout(() => {
      // @ts-ignore
      res()
    }, time)
  })

/**
 * [Selenoid](https://aerokube.com/selenoid/) plugin automatically starts browsers and video recording.
 * Works with WebDriver helper.
 *
 * ### Prerequisite
 *
 * This plugin **requires Docker** to be installed.
 *
 * > If you have issues starting Selenoid with this plugin consider using the official [Configuration Manager](https://aerokube.com/cm/latest/) tool from Selenoid
 *
 * ### Usage
 *
 * Selenoid plugin can be started in two ways:
 *
 * 1. **Automatic** - this plugin will create and manage selenoid container for you.
 * 2. **Manual** - you create the conatainer and configure it with a plugin (recommended).
 *
 * #### Automatic
 *
 * If you are new to Selenoid and you want plug and play setup use automatic mode.
 *
 * Add plugin configuration in `codecept.conf.js`:
 *
 * ```js
 * plugins: {
 *     selenoid: {
 *       enabled: true,
 *       deletePassed: true,
 *       autoCreate: true,
 *       autoStart: true,
 *       sessionTimeout: '30m',
 *       enableVideo: true,
 *       enableLog: true,
 *     },
 *   }
 * ```
 *
 * When `autoCreate` is enabled it will pull the [latest Selenoid from DockerHub](https://hub.docker.com/u/selenoid) and start Selenoid automatically.
 * It will also create `browsers.json` file required by Selenoid.
 *
 * In automatic mode the latest version of browser will be used for tests. It is recommended to specify exact version of each browser inside `browsers.json` file.
 *
 * > **If you are using Windows machine or if `autoCreate` does not work properly, create container manually**
 *
 * #### Manual
 *
 * While this plugin can create containers for you for better control it is recommended to create and launch containers manually.
 * This is especially useful for Continous Integration server as you can configure scaling for Selenoid containers.
 *
 * > Use [Selenoid Configuration Manager](https://aerokube.com/cm/latest/) to create and start containers semi-automatically.
 *
 * 1. Create `browsers.json` file in the same directory `codecept.conf.js` is located
 * [Refer to Selenoid documentation](https://aerokube.com/selenoid/latest/#_prepare_configuration) to know more about browsers.json.
 *
 * *Sample browsers.json*
 *
 * ```js
 * {
 *  "chrome": {
 *    "default": "latest",
 *    "versions": {
 *      "latest": {
 *        "image": "selenoid/chrome:latest",
 *        "port": "4444",
 *        "path": "/"
 *      }
 *    }
 *  }
 * }
 * ```
 *
 * > It is recommended to use specific versions of browsers in `browsers.json` instead of latest. This will prevent tests fail when browsers will be updated.
 *
 * **⚠ At first launch selenoid plugin takes extra time to download all Docker images before tests starts**.
 *
 * 2. Create Selenoid container
 *
 * Run the following command to create a container. To know more [refer here](https://aerokube.com/selenoid/latest/#_option_2_start_selenoid_container)
 *
 *
 * ```bash
 * docker create                                    \
 * --name selenoid                                  \
 * -p 4444:4444                                     \
 * -v /var/run/docker.sock:/var/run/docker.sock     \
 * -v `pwd`/:/etc/selenoid/:ro                      \
 * -v `pwd`/output/video/:/opt/selenoid/video/      \
 * -e OVERRIDE_VIDEO_OUTPUT_DIR=`pwd`/output/video/ \
 * aerokube/selenoid:latest-release
 * ```
 *
 * ### Video Recording
 *
 * This plugin allows to record and save video per each executed tests.
 *
 * When `enableVideo` is `true` this plugin saves video in `output/videos` directory with each test by name
 * To save space videos for all succesful tests are deleted. This can be changed by `deletePassed` option.
 *
 * When `allure` plugin is enabled a video is attached to report automatically.
 *
 * ### Options:
 *
 * | Param | Description |
 * |--|--|
 * | name | Name of the container (default : selenoid) |
 * | port | Port of selenium server (default : 4444) |
 * | autoCreate | Will automatically create container (Linux only) (default : true)|
 * | autoStart | If disabled start the container manually before running tests (default : true)|
 * | enableVideo | Enable video recording and use `video` folder of output (default: false) |
 * | enableLog | Enable log recording and use `logs` folder of output (default: false) |
 * | deletePassed | Delete video and logs of passed tests (default : true)|
 * | additionalParams | example: `additionalParams: '--env TEST=test'` [Refer here](https://docs.docker.com/engine/reference/commandline/create/) to know more |
 *
 */

const selenoid = config => {
  const helpers = container.helpers()
  let helperName

  for (const name of supportedHelpers) {
    if (Object.keys(helpers).indexOf(name) > -1) {
      helperName = name
    }
  }

  if (!helperName) {
    output.print(`Selenoid plugin supported only for: ${supportedHelpers.toString()}`)
    return // no helpers for Selenoid
  }

  const { autoStart, name = 'selenoid', deletePassed = true, additionalParams = '', autoCreate = true, port = 4444 } = config
  const passedTests = []

  recorder.startUnlessRunning()
  replaceScriptConfig({ name, additionalParams, port })

  if (autoStart) {
    event.dispatcher.on(event.all.before, () => {
      recorder.add('Starting selenoid', () => {
        output.debug('Staring Selenoid... ')
        return createAndStart(autoCreate)
          .then(() => output.debug('Selenoid started'))
          .catch(err => {
            throw new Error(err.stack)
          })
      })
    })

    event.dispatcher.on(event.all.after, () => {
      recorder.add('Stopping selenoid', () => {
        output.debug('Stopping Selenoid...')
        return wait(SELENOID_STOP_TIMEOUT)
          .then(() => deletePassedTests(passedTests))
          .then(stopSelenoid)
          .then(() => output.debug('Selenoid stopped'))
          .catch(err => {
            throw new Error(err.stack)
          })
      })
    })
  }

  event.dispatcher.on(event.all.before, () => {
    switch (helperName) {
      case 'WebDriver':
        setOptionsForWebdriver(config)
        break
    }
  })

  event.dispatcher.on(event.test.before, test => {
    switch (helperName) {
      case 'WebDriver':
        setTestConfigForWebdriver(test)
        break
    }
  })

  if (config.enableVideo) {
    event.dispatcher.on(event.test.passed, test => {
      if (deletePassed) {
        passedTests.push(test.title)
      } else {
        test.artifacts.video = videoSaved(test)
      }
    })

    event.dispatcher.on(event.test.failed, test => {
      test.artifacts.video = videoSaved(test)
    })
  }
}

module.exports = selenoid

function videoSaved(test) {
  const fileName = `${clearString(test.title)}.mp4`
  const videoFile = path.join(global.output_dir, 'video', fileName)
  output.debug(`Video has been saved to file://${videoFile}`)
  const allureReporter = container.plugins('allure')
  if (allureReporter) {
    allureReporter.addAttachment('Video', fs.readFileSync(videoFile), 'video/mp4')
  }
  return videoFile
}

const createSelenoidConfig = () => {
  const configPath = path.join(global.codecept_dir, 'browsers.json')
  return new Promise((res, rej) => {
    try {
      if (fs.existsSync(configPath)) {
        res(true)
      } else {
        const data = new Uint8Array(Buffer.from(JSON.stringify(defaultBrowserConfig)))
        fs.writeFileSync(configPath, data)
        res(true)
      }
    } catch (err) {
      rej(err.stack)
    }
  })
}

const createSelenoid = () => exec(dockerCreateScript)

const startSelenoid = () => exec(dockerStartScript)

const stopSelenoid = () => exec(dockerStopScript)

const checkDockerImage = () => exec(dockerImageCheckScript)

const pullImage = async () => {
  const { stdout } = await checkDockerImage()
  const pulls = []
  let resultPromise

  output.print('Pulling in Selenoid containers. This may take a while when running the first time...')

  console.time('Pulled containers')
  if (!stdout.includes('selenoid/video-recorder')) {
    output.debug('Pulling selenoid/video-recorder...')
    resultPromise = exec('docker pull selenoid/video-recorder:latest-release').then(() => output.debug('Pulled in selenoid/video-recorder'))
    pulls.push(resultPromise)
  }
  if (!stdout.includes('selenoid/chrome')) {
    output.debug('Pulling selenoid/chrome...')
    resultPromise = exec('docker pull selenoid/chrome:latest').then(() => output.debug('Pulled in selenoid/video-recorder'))
    pulls.push(resultPromise)
  }
  if (!stdout.includes('selenoid/firefox')) {
    output.debug('Pulling selenoid/firefox...')
    resultPromise = exec('docker pull selenoid/firefox:latest').then(() => output.debug('Pulled in selenoid/chrome'))
    pulls.push(resultPromise)
  }

  return Promise.all(pulls).then(() => {
    console.timeEnd('Pulled containers')
  })
}

function createAndStart(autoCreate) {
  const selenoidCreated = autoCreate ? createSelenoidConfig().then(createSelenoid).then(pullImage) : Promise.resolve()
  return selenoidCreated.then(startSelenoid).then(() => wait(SELENOID_START_TIMEOUT))
}

function deletePassedTests(passedTests) {
  const deleteVideoPromiseList = passedTests.map(clearString).map(test => axios.delete(`${seleniumUrl}/video/${test}.mp4`))
  const deleteLogPromiseList = passedTests.map(clearString).map(test => axios.delete(`${seleniumUrl}/logs/${test}.log`))

  return Promise.all(deleteVideoPromiseList.concat(deleteLogPromiseList))
    .then(() => output.debug('Deleted videos and logs for all passed tests'))
    .catch(err => output.error(`Error while deleting video and log files ${err.stack}`))
}

function setOptionsForWebdriver(config) {
  const WebDriver = container.helpers('WebDriver')
  WebDriver._setConfig(
    deepMerge(WebDriver.options, {
      capabilities: { 'selenoid:options': config },
    }),
  )
}

function setTestConfigForWebdriver(test) {
  const WebDriver = container.helpers('WebDriver')
  const fileName = clearString(test.title)
  const { options } = WebDriver
  recorder.add('setting selenoid capabilities', () => {
    options.capabilities['selenoid:options'].name = test.title
    options.capabilities['selenoid:options'].videoName = `${fileName}.mp4`
    options.capabilities['selenoid:options'].logName = `${fileName}.log`
    WebDriver._setConfig(options)
  })
}

function replaceScriptConfig(config) {
  for (const key of Object.keys(config)) {
    dockerCreateScript = dockerCreateScript.replace(new RegExp(`\\$${key}\\$`, 'g'), config[key])
  }
  dockerStartScript = dockerStartScript.replace('$name$', config.name)
  dockerStopScript = dockerStopScript.replace('$name$', config.name)
  seleniumUrl = seleniumUrl.replace('$port$', config.port)
}
