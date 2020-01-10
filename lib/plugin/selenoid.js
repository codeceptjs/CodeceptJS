const util = require('util');
const axios = require('axios').default;
const exec = util.promisify(require('child_process').exec);
const {
  container, event, recorder, output,
} = require('../index');

let dockerCreateScript = `docker create --rm --name $name$ -p 4444:4444 -v /var/run/docker.sock:/var/run/docker.sock -v ${global.codecept_dir}/:/etc/selenoid/:ro -v ${global.output_dir}/video/:/opt/selenoid/video/ -v ${global.output_dir}/logs/:/opt/selenoid/logs/ -e OVERRIDE_VIDEO_OUTPUT_DIR=${global.output_dir}/video/ $additionalParams$ aerokube/selenoid:latest-release -log-output-dir /opt/selenoid/logs`;
let dockerStartScript = 'docker start $name$';
let dockerStopScript = 'docker stop $name$';
const seleniumUrl = 'http://localhost:4444';

const createSelenoid = () => exec(dockerCreateScript);

const startSelenoid = () => exec(dockerStartScript);

const stopSelenoid = () => exec(dockerStopScript);

const wait = time => new Promise((res) => setTimeout(() => res(), time));

const createAndStart = (autoCreate) => {
  const selenoidCreated = autoCreate ? createSelenoid() : Promise.resolve();
  return selenoidCreated.then(startSelenoid).then(() => wait(2000));
};

const deletePassedTests = (passedTests) => {
  const deleteVideoPromiseList = passedTests.map(test => axios.delete(`${seleniumUrl}/video/${test}.mp4`));
  const deleteLogPromiseList = passedTests.map(test => axios.delete(`${seleniumUrl}/logs/${test}.log`));

  return Promise.all(deleteVideoPromiseList.concat(deleteLogPromiseList)).then(() => output.debug('Deleted passed tests'));
};

const setSelenoidOptions = (config) => {
  const WebDriver = container.helpers('WebDriver');
  WebDriver._setConfig(Object.assign(WebDriver.options, {
    capabilities: { 'selenoid:options': config },
  }));
};

const replaceScriptConfig = (config) => {
  for (const key of Object.keys(config)) {
    dockerCreateScript = dockerCreateScript.replace(`$${key}$`, config[key]);
  }
  dockerStartScript = dockerStartScript.replace('$name$', config.name);
  dockerStopScript = dockerStopScript.replace('$name$', config.name);
};


const selenoid = (config) => {
  const {
    autoStart, name = 'selenoid', deletePassed = true, additionalParams = '', autoCreate = true,
  } = config;
  const passedTests = [];
  recorder.startUnlessRunning();
  replaceScriptConfig({ name, additionalParams });

  if (autoStart) {
    event.dispatcher.on(event.all.before, () => {
      recorder.add('Starting selenoid', async () => {
        return createAndStart(autoCreate).then(() => output.debug('Selenoid started')).catch((err) => { throw err; });
      });
    });

    event.dispatcher.on(event.all.after, () => {
      recorder.add('Stopping selenoid', async () => {
        return wait(10000).then(() => deletePassedTests(passedTests)).then(stopSelenoid).then(() => output.debug('Selenoid stopped'))
          .catch((err) => { throw err; });
      });
    });
  }

  event.dispatcher.on(event.all.before, () => {
    setSelenoidOptions(config);
  });

  event.dispatcher.on(event.test.before, (test) => {
    const WebDriver = container.helpers('WebDriver');
    const { options } = WebDriver;
    recorder.add('setting selenoid capabilities', () => {
      options.capabilities['selenoid:options'].name = test.title;
      options.capabilities['selenoid:options'].videoName = `${test.title}.mp4`;
      options.capabilities['selenoid:options'].logName = `${test.title}.log`;
      WebDriver._setConfig(options);
    });
  });

  if (deletePassed) {
    event.dispatcher.on(event.test.passed, (test) => {
      passedTests.push(test.title);
    });
  }
};

/**
 * # Selenoid
 *
 * Selenoid plugin with for recording video recording and logs
 *
 * ## Prerequisite
 *
 *  - Docker
 *
 * ## How to ?
 *
 * ### 1. Add browsers.json
 * Add browsers.json parallel to codecept conf location. [Refer here](https://aerokube.com/selenoid/latest/#_prepare_configuration) to know more about browsers.json
 *
 * **You can download the sample json from example.**
 *
 * ### 2. Add plugin configuration in codecept
 *
 *  Add plugin config to codecept conf.
 * ```js
 * plugins: {
 *     selenoid: {
 *       require: '../lib/index',
 *       enabled: true,
 *       name: 'testnoid',
 *       deletePassed: true,
 *       autoCreate: true,
 *       autoStart: true,
 *       sessionTimeout: '30m',
 *       enableVideo: true,
 *       enableLog: true,
 *       additionalParams: '--env TEST=test',
 *     },
 *   }
 * ```
 * #### Options:
 * | Param | Description |
 * |--|--|
 * | name | Name of the container |
 * | deletePassed | Delete video and logs of passed tests |
 * | autoCreate | Will automatically create container (Linux only)|
 * | autoStart | If disabled start the container manually before running tests |
 * | enableVideo | Enable video recording (`video` folder of output)|
 * | enableLog | Enable video recording (`logs` folder of output) |
 * | additionalParams | [Refer here](https://docs.docker.com/engine/reference/commandline/create/) to know more |
 *
 * ### 3. Create selenoid container
 * **If you are using linux machine, we can handle this for you.**
 *
 * Run the following command to create one. To know more [refer here](https://aerokube.com/selenoid/latest/#_option_2_start_selenoid_container)
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
module.exports = selenoid;
