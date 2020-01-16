const util = require('util');
const path = require('path');
const fs = require('fs');
const axios = require('axios').default;
const exec = util.promisify(require('child_process').exec);
const {
  container, event, recorder, output,
} = require('../index');

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
};

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
];

const dockerImageCheckScript = [
  'docker images',
  '--filter reference=\'selenoid/video-recorder\'',
  '--filter reference=\'selenoid/chrome:latest\'',
  '--filter reference=\'selenoid/firefox:latest\'',
].join(' ');

let dockerCreateScript = dockerCreateScriptArr.join(' ');
let dockerStartScript = 'docker start $name$';
let dockerStopScript = 'docker stop $name$';
let seleniumUrl = 'http://localhost:$port$';

const supportedHelpers = ['WebDriver'];
const SELENOID_START_TIMEOUT = 2000;
const SELENOID_STOP_TIMEOUT = 10000;

const createSelenoidConfig = () => {
  const configPath = path.join(global.codecept_dir, 'browsers.json');
  return new Promise((res, rej) => {
    try {
      if (fs.existsSync(configPath)) {
        res(true);
      } else {
        const data = new Uint8Array(Buffer.from(JSON.stringify(defaultBrowserConfig)));
        fs.writeFileSync(configPath, data);
        res(true);
      }
    } catch (err) {
      rej(err.stack);
    }
  });
};

const createSelenoid = () => exec(dockerCreateScript);

const startSelenoid = () => exec(dockerStartScript);

const stopSelenoid = () => exec(dockerStopScript);

const checkDockerImage = () => exec(dockerImageCheckScript);

const pullImage = async () => {
  const { stdout } = await checkDockerImage();
  let resultPromise = Promise.resolve();

  if (!stdout.includes('selenoid/video-recorder')) {
    resultPromise = resultPromise.then(() => exec('docker pull selenoid/video-recorder:latest-release'));
  }
  if (!stdout.includes('selenoid/chrome')) {
    resultPromise = resultPromise.then(() => exec('docker pull selenoid/chrome:latest'));
  }
  if (!stdout.includes('selenoid/firefox')) {
    resultPromise = resultPromise.then(() => exec('docker pull selenoid/firefox:latest'));
  }

  return resultPromise;
};

const wait = time => new Promise((res) => setTimeout(() => res(), time));

const createAndStart = (autoCreate) => {
  const selenoidCreated = autoCreate ? createSelenoidConfig().then(createSelenoid).then(pullImage) : Promise.resolve();
  return selenoidCreated.then(startSelenoid).then(() => wait(SELENOID_START_TIMEOUT));
};

const deletePassedTests = (passedTests) => {
  const deleteVideoPromiseList = passedTests.map(test => axios.delete(`${seleniumUrl}/video/${test}.mp4`));
  const deleteLogPromiseList = passedTests.map(test => axios.delete(`${seleniumUrl}/logs/${test}.log`));

  return Promise.all(deleteVideoPromiseList.concat(deleteLogPromiseList))
    .then(() => output.debug('Deleted videos and logs for all passed tests'))
    .catch(err => output.error('Error while deleting video and log files', err.stack));
};

const setOptionsForWebdriver = (config) => {
  const WebDriver = container.helpers('WebDriver');
  WebDriver._setConfig(Object.assign(WebDriver.options, {
    capabilities: { 'selenoid:options': config },
  }));
};

const setTestConfigForWebdriver = (test) => {
  const WebDriver = container.helpers('WebDriver');
  const { options } = WebDriver;
  recorder.add('setting selenoid capabilities', () => {
    options.capabilities['selenoid:options'].name = test.title;
    options.capabilities['selenoid:options'].videoName = `${test.title}.mp4`;
    options.capabilities['selenoid:options'].logName = `${test.title}.log`;
    WebDriver._setConfig(options);
  });
};

const replaceScriptConfig = (config) => {
  for (const key of Object.keys(config)) {
    dockerCreateScript = dockerCreateScript.replace(new RegExp(`\\$${key}\\$`, 'g'), config[key]);
  }
  dockerStartScript = dockerStartScript.replace('$name$', config.name);
  dockerStopScript = dockerStopScript.replace('$name$', config.name);
  seleniumUrl = seleniumUrl.replace('$port$', config.port);
};


/**
 * # Selenoid
 *  Selenoid plugin with for recording video recording and logs
 *  ## Prerequisite
 *   - Docker
 *  ## How to ?
 *
 *  Selenoid plugin can be enabled in two ways.
 *  1. **Automatic** - Codecept will create and manage selenoid container for you.
 *  2. **Manual** - You can create the conatainer and configure the details in codecept
 *
 *  ### 1. Automatic
 *
 *  Add plugin configuration in codecept conf and run codecept.
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
 *  ### 2. Manual
 * Simplest way to to this is enabling `autoCreate` and it will be taken care by codecept itself.
 * **If you are using windows machine or if `autoCreate` does not work properly, create container manually**
 *
 * #### 1. Add browsers.json parallel to codecept conf location. [Refer here](https://aerokube.com/selenoid/latest/#_prepare_configuration) to know more about browsers.json.
 *
 *  *Sample browsers.json*
 * ```
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
 * **Note** : *You can download the sample json from example.*
 *
 * #### Options:
 * | Param | Description |
 * |--|--|
 * | name | Name of the container (default : selenoid) |
 * | port | Port of selenium server (default : 4444) |
 * | deletePassed | Delete video and logs of passed tests (default : true)|
 * | autoCreate | Will automatically create container (Linux only) (default : true)|
 * | autoStart | If disabled start the container manually before running tests (default : true)|
 * | enableVideo | Enable video recording (`video` folder of output)|
 * | enableLog | Enable video recording (`logs` folder of output)|
 * | additionalParams | example: `additionalParams: '--env TEST=test'` [Refer here](https://docs.docker.com/engine/reference/commandline/create/) to know more |
 *  #### 2. Create selenoid container
 *  Run the following command to create one. To know more [refer here](https://aerokube.com/selenoid/latest/#_option_2_start_selenoid_container)
 * ```
 * docker create                                    \
 * --name selenoid                                  \
 * -p 4444:4444                                     \
 * -v /var/run/docker.sock:/var/run/docker.sock     \
 * -v `pwd`/:/etc/selenoid/:ro                      \
 * -v `pwd`/output/video/:/opt/selenoid/video/      \
 * -e OVERRIDE_VIDEO_OUTPUT_DIR=`pwd`/output/video/ \
 * aerokube/selenoid:latest-release
 * ```
 */

const selenoid = (config) => {
  const helpers = container.helpers();
  let helperName;

  for (const name of supportedHelpers) {
    if (Object.keys(helpers).indexOf(name) > -1) {
      helperName = name;
    }
  }

  if (!helperName) {
    output.print(`Selenoid plugin supported only for : ${supportedHelpers.toString()}`);
    return; // no helpers for Selenoid
  }

  const {
    autoStart,
    name = 'selenoid',
    deletePassed = true,
    additionalParams = '',
    autoCreate = true,
    port = 4444,
  } = config;
  const passedTests = [];

  recorder.startUnlessRunning();
  replaceScriptConfig({ name, additionalParams, port });

  if (autoStart) {
    event.dispatcher.on(event.all.before, () => {
      recorder.add('Starting selenoid', () => {
        return createAndStart(autoCreate)
          .then(() => output.debug('Selenoid started'))
          .catch((err) => { throw new Error(err.stack); });
      });
    });

    event.dispatcher.on(event.all.after, () => {
      recorder.add('Stopping selenoid', () => {
        return wait(SELENOID_STOP_TIMEOUT)
          .then(() => deletePassedTests(passedTests))
          .then(stopSelenoid)
          .then(() => output.debug('Selenoid stopped'))
          .catch((err) => { throw new Error(err.stack); });
      });
    });
  }

  event.dispatcher.on(event.all.before, () => {
    switch (helperName) {
      case 'WebDriver': setOptionsForWebdriver(config); break;
    }
  });

  event.dispatcher.on(event.test.before, (test) => {
    switch (helperName) {
      case 'WebDriver': setTestConfigForWebdriver(test); break;
    }
  });

  if (deletePassed) {
    event.dispatcher.on(event.test.passed, (test) => {
      passedTests.push(test.title);
    });
  }
};

module.exports = selenoid;
