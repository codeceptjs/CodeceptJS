const Allure = require('allure-js-commons');

const event = require('../event');
const logger = require('../output');
const { ansiRegExp } = require('../utils');

const defaultConfig = {
  outputDir: global.output_dir,
};

/**
 * Allure reporter
 *
 * ![](https://user-images.githubusercontent.com/220264/45676511-8e052800-bb3a-11e8-8cbb-db5f73de2add.png)
 *
 * Enables Allure reporter.
 *
 * #### Usage
 *
 * To start please install `allure-commandline` package (which requires Java 8)
 *
 * ```
 * npm install -g allure-commandline --save-dev
 * ```
 *
 * Add this plugin to config file:
 *
 * ```js
 * "plugins": {
 *     "allure": {}
 * }
 * ```
 *
 * Run tests with allure plugin enabled:
 *
 * ```
 * npx codeceptjs run --plugins allure
 * ```
 *
 * By default, allure reports are saved to `output` directory.
 * Launch Allure server and see the report like on a screenshot above:
 *
 * ```
 * allure serve output
 * ```
 *
 * #### Configuration
 *
 * * `outputDir` - a directory where allure reports should be stored. Standard output directory is set by default.
 * * `enableScreenshotDiffPlugin` - a boolean flag for add screenshot diff to report.
 *    To attach, tou need to attach three files to the report - "diff.png", "actual.png", "expected.png".
 *    See [Allure Screenshot Plugin](https://github.com/allure-framework/allure2/blob/master/plugins/screen-diff-plugin/README.md)
 *
 * #### Public API
 *
 * There are few public API methods which can be accessed from other plugins.
 *
 * ```js
 * const allure = codeceptjs.container.plugins('allure');
 * ```
 *
 * `allure` object has following methods:
 *
 * * `addAttachment(name, buffer, type)` - add an attachment to current test / suite
 * * `addLabel(name, value)` - adds a label to current test
 * * `addParameter(kind, name, value)` - adds a parameter to current test
 * * `createStep(name, stepFunc)` - create a step, stepFunc could consist an attachment
 * Example of usage:
 * ```js
 *     allure.createStep('New created step', () => {
 *       allure.addAttachment(
 *         'Request params',
 *         '{"clientId":123, "name":"Tom", "age":29}',
 *         'application/json'
 *       );
 *     });
 * ```
 * ![Created Step Image](https://user-images.githubusercontent.com/63167966/139339384-e6e70a62-3638-406d-a224-f32473071428.png)
 *
 * * `addScreenDiff(name, expectedImg, actualImg, diffImg)` - add a special screen diff block to the current test case
 * image must be a string representing the contents of the expected image file encoded in base64
 * Example of usage:
 * ```js
 * const expectedImg = fs.readFileSync('expectedImg.png', { encoding: 'base64' });
 * ...
 * allure.addScreenDiff('Screen Diff', expectedImg, actualImg, diffImg);
 * ```
 * ![Overlay](https://user-images.githubusercontent.com/63167966/215404458-9a325668-819e-4289-9b42-5807c49ebddb.png)
 * ![Diff](https://user-images.githubusercontent.com/63167966/215404645-73b09da0-9e6d-4352-a123-80c22f7014cd.png)
 *
 * * `severity(value)` - adds severity label
 * * `epic(value)` - adds epic label
 * * `feature(value)` - adds feature label
 * * `story(value)` - adds story label
 * * `issue(value)` - adds issue label
 * * `setDescription(description, type)` - sets a description
 *
 */

/**
 * Creates an instance of the allure reporter
 * @param {Config} [config={ outputDir: global.output_dir }] - Configuration for the allure reporter
 * @returns {Object} Instance of the allure reporter
 */
module.exports = (config) => {
  defaultConfig.outputDir = global.output_dir;
  config = Object.assign(defaultConfig, config);

  const plugin = {};

  /**
   * @type {Allure}
   */
  const reporter = new Allure();
  reporter.setOptions({ targetDir: config.outputDir });

  let currentMetaStep = [];
  let currentStep;

  /**
   * Mark a test case as pending
   * @param {string} testName - Name of the test case
   * @param {number} timestamp - Timestamp of the test case
   * @param {Object} [opts={}] - Options for the test case
   */
  reporter.pendingCase = function (testName, timestamp, opts = {}) {
    reporter.startCase(testName, timestamp);

    plugin.addCommonMetadata();
    if (opts.description) plugin.setDescription(opts.description);
    if (opts.severity) plugin.severity(opts.severity);
    if (opts.severity) plugin.addLabel('tag', opts.severity);

    reporter.endCase('pending', { message: opts.message || 'Test ignored' }, timestamp);
  };

  /**
   * Add an attachment to the current test case
   * @param {string} name - Name of the attachment
   * @param {Buffer} buffer - Buffer of the attachment
   * @param {string} type - MIME type of the attachment
   */
  plugin.addAttachment = (name, buffer, type) => {
    reporter.addAttachment(name, buffer, type);
  };

  /**
   Set description for the current test case
   @param {string} description - Description for the test case
   @param {string} [type='text/plain'] - MIME type of the description
   */
  plugin.setDescription = (description, type) => {
    const currentTest = reporter.getCurrentTest();
    if (currentTest) {
      currentTest.setDescription(description, type);
    } else {
      logger.error(`The test is not run. Please use "setDescription" for events:
      "test.start", "test.before", "test.after", "test.passed", "test.failed", "test.finish"`);
    }
  };

  /**
   A method for creating a step in a test case.
   @param {string} name - The name of the step.
   @param {Function} [stepFunc=() => {}] - The function that should be executed for this step.
   @returns {any} - The result of the step function.
   */
  plugin.createStep = (name, stepFunc = () => { }) => {
    let result;
    let status = 'passed';
    reporter.startStep(name);
    try {
      result = stepFunc(this.arguments);
    } catch (error) {
      status = 'broken';
      throw error;
    } finally {
      if (!!result
        && (typeof result === 'object' || typeof result === 'function')
        && typeof result.then === 'function'
      ) {
        result.then(() => reporter.endStep('passed'), () => reporter.endStep('broken'));
      } else {
        reporter.endStep(status);
      }
    }
    return result;
  };

  plugin.createAttachment = (name, content, type) => {
    if (typeof content === 'function') {
      const attachmentName = name;
      const buffer = content.apply(this, arguments);
      return createAttachment(attachmentName, buffer, type);
    } reporter.addAttachment(name, content, type);
  };

  plugin.severity = (severity) => {
    plugin.addLabel('severity', severity);
  };

  plugin.epic = (epic) => {
    plugin.addLabel('epic', epic);
  };

  plugin.feature = (feature) => {
    plugin.addLabel('feature', feature);
  };

  plugin.story = (story) => {
    plugin.addLabel('story', story);
  };

  plugin.issue = (issue) => {
    plugin.addLabel('issue', issue);
  };

  /**
   Adds a label with the given name and value to the current test in the Allure report
   @param {string} name - name of the label to add
   @param {string} value - value of the label to add
 */
  plugin.addLabel = (name, value) => {
    const currentTest = reporter.getCurrentTest();
    if (currentTest) {
      currentTest.addLabel(name, value);
    } else {
      logger.error(`The test is not run. Please use "addLabel" for events:
      "test.start", "test.before", "test.after", "test.passed", "test.failed", "test.finish"`);
    }
  };

  /**
   Adds a parameter with the given kind, name, and value to the current test in the Allure report
   @param {string} kind - kind of the parameter to add
   @param {string} name - name of the parameter to add
   @param {string} value - value of the parameter to add
   */
  plugin.addParameter = (kind, name, value) => {
    const currentTest = reporter.getCurrentTest();
    if (currentTest) {
      currentTest.addParameter(kind, name, value);
    } else {
      logger.error(`The test is not run. Please use "addParameter" for events:
      "test.start", "test.before", "test.after", "test.passed", "test.failed", "test.finish"`);
    }
  };

  /**
   * Add a special screen diff block to the current test case
   * @param {string} name - Name of the screen diff block
   * @param {string} expectedImg - string representing the contents of the expected image file encoded in base64
   * @param {string} actualImg - string representing the contents of the actual image file encoded in base64
   * @param {string} diffImg - string representing the contents of the diff image file encoded in base64.
   * Could be generated by image comparison lib like "pixelmatch" or alternative
   */
  plugin.addScreenDiff = (name, expectedImg, actualImg, diffImg) => {
    const screenDiff = {
      name,
      expected: `data:image/png;base64,${expectedImg}`,
      actual: `data:image/png;base64,${actualImg}`,
      diff: `data:image/png;base64,${diffImg}`,
    };
    reporter.addAttachment(name, JSON.stringify(screenDiff), 'application/vnd.allure.image.diff');
  };

  plugin.addCommonMetadata = () => {
    plugin.addLabel('language', 'javascript');
    plugin.addLabel('framework', 'codeceptjs');
  };

  event.dispatcher.on(event.suite.before, (suite) => {
    reporter.startSuite(suite.fullTitle());
  });

  event.dispatcher.on(event.suite.before, (suite) => {
    for (const test of suite.tests) {
      if (test.pending) {
        reporter.pendingCase(test.title, null, test.opts.skipInfo);
      }
    }
  });

  event.dispatcher.on(event.suite.after, () => {
    reporter.endSuite();
  });

  event.dispatcher.on(event.test.before, (test) => {
    reporter.startCase(test.title);
    plugin.addCommonMetadata();
    if (config.enableScreenshotDiffPlugin) {
      const currentTest = reporter.getCurrentTest();
      currentTest.addLabel('testType', 'screenshotDiff');
    }
    currentStep = null;
  });

  event.dispatcher.on(event.test.started, (test) => {
    const currentTest = reporter.getCurrentTest();
    for (const tag of test.tags) {
      currentTest.addLabel('tag', tag);
    }
  });

  event.dispatcher.on(event.test.failed, (test, err) => {
    if (currentStep) reporter.endStep('failed');
    if (currentMetaStep.length) {
      currentMetaStep.forEach(() => reporter.endStep('failed'));
      currentMetaStep = [];
    }

    err.message = err.message.replace(ansiRegExp(), '');
    if (reporter.getCurrentTest()) {
      reporter.endCase('failed', err);
    } else {
      // this means before suite failed, we should report this.
      reporter.startCase(`BeforeSuite of suite ${reporter.getCurrentSuite().name} failed.`);
      plugin.addCommonMetadata();
      reporter.endCase('failed', err);
    }
  });

  event.dispatcher.on(event.test.passed, () => {
    if (currentStep) reporter.endStep('passed');
    if (currentMetaStep.length) {
      currentMetaStep.forEach(() => reporter.endStep('passed'));
      currentMetaStep = [];
    }
    reporter.endCase('passed');
  });

  event.dispatcher.on(event.test.skipped, (test) => {
    let loaded = true;
    if (test.opts.skipInfo.isFastSkipped) {
      loaded = false;
      reporter.startSuite(test.parent.fullTitle());
    }
    reporter.pendingCase(test.title, null, test.opts.skipInfo);
    if (!loaded) {
      reporter.endSuite();
    }
  });

  event.dispatcher.on(event.step.started, (step) => {
    startMetaStep(step.metaStep);
    if (currentStep !== step) {
      // In multi-session scenarios, actors' names will be highlighted with ANSI
      // escape sequences which are invalid XML values
      step.actor = step.actor.replace(ansiRegExp(), '');
      reporter.startStep(step.toString());
      currentStep = step;
    }
  });

  event.dispatcher.on(event.step.comment, (step) => {
    reporter.startStep(step.toString());
    currentStep = step;
    reporter.endStep('passed');
    currentStep = null;
  });

  event.dispatcher.on(event.step.passed, (step) => {
    if (currentStep === step) {
      reporter.endStep('passed');
      currentStep = null;
    }
  });

  event.dispatcher.on(event.step.failed, (step) => {
    if (currentStep === step) {
      reporter.endStep('failed');
      currentStep = null;
    }
  });

  let maxLevel;
  function finishMetastep(level) {
    const metaStepsToFinish = currentMetaStep.splice(maxLevel - level);
    metaStepsToFinish.forEach(() => {
      // only if the current step is of type Step, end it.
      if (reporter.suites && reporter.suites.length && reporter.suites[0].currentStep && reporter.suites[0].currentStep.constructor.name === 'Step') {
        reporter.endStep('passed');
      }
    });
  }

  function startMetaStep(metaStep, level = 0) {
    maxLevel = level;
    if (!metaStep) {
      finishMetastep(0);
      maxLevel--;
      return;
    }

    startMetaStep(metaStep.metaStep, level + 1);

    if (metaStep.toString() !== currentMetaStep[maxLevel - level]) {
      finishMetastep(level);
      currentMetaStep.push(metaStep.toString());
      reporter.startStep(metaStep.toString());
    }
  }

  return plugin;
};
