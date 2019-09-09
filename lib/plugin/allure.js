const event = require('../event');
const Allure = require('allure-js-commons');
const logger = require('../output');
const ansiRegExp = require('../utils').ansiRegExp;

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
 * ##### Usage
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
 * ##### Configuration
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
 * * `severity(value)` - adds severity label
 * * `epic(value)` - adds epic label
 * * `feature(value)` - adds feature label
 * * `story(value)` - adds story label
 * * `issue(value)` - adds issue label
 * * `setDescription(description, type)` - sets a description
 *
 */
module.exports = (config) => {
  config = Object.assign(defaultConfig, config);

  const reporter = new Allure();
  reporter.setOptions({ targetDir: config.outputDir });

  let currentMetaStep = [];
  let currentStep;
  let isHookSteps = false;

  this.addAttachment = (name, buffer, type) => {
    reporter.addAttachment(name, buffer, type);
  };

  this.setDescription = (description, type) => {
    reporter.setDescription(description, type);
  };

  this.createStep = (name, stepFunc = () => {}) => {
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

  this.createAttachment = (name, content, type) => {
    if (typeof content === 'function') {
      const attachmentName = name;
      const buffer = content.apply(this, arguments);
      return createAttachment(attachmentName, buffer, type);
    } reporter.addAttachment(name, content, type);
  };

  this.severity = (severity) => {
    this.addLabel('severity', severity);
  };

  this.epic = (epic) => {
    this.addLabel('epic', epic);
  };

  this.feature = (feature) => {
    this.addLabel('feature', feature);
  };

  this.story = (story) => {
    this.addLabel('story', story);
  };

  this.issue = (issue) => {
    this.addLabel('issue', issue);
  };

  this.addLabel = (name, value) => {
    const currentTest = reporter.getCurrentTest();
    if (currentTest) {
      currentTest.addLabel(name, value);
    } else {
      logger.error(`The test is not run. Please use "addLabel" for events:
      "test.start", "test.before", "test.after", "test.passed", "test.failed", "test.finish"`);
    }
  };

  event.dispatcher.on(event.suite.before, (suite) => {
    reporter.startSuite(suite.fullTitle());
  });

  event.dispatcher.on(event.suite.before, (suite) => {
    for (const test of suite.tests) {
      if (test.pending) {
        reporter.pendingCase(test.title);
      }
    }
  });

  event.dispatcher.on(event.hook.started, (hook) => {
    isHookSteps = true;
  });

  event.dispatcher.on(event.hook.passed, (hook) => {
    isHookSteps = false;
  });

  event.dispatcher.on(event.suite.after, () => {
    reporter.endSuite();
  });

  event.dispatcher.on(event.test.before, (test) => {
    reporter.startCase(test.title);
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
    reporter.endCase('failed', err);
  });

  event.dispatcher.on(event.test.passed, (test) => {
    if (currentStep) reporter.endStep('passed');
    if (currentMetaStep.length) {
      currentMetaStep.forEach(() => reporter.endStep('passed'));
      currentMetaStep = [];
    }
    reporter.endCase('passed');
  });

  event.dispatcher.on(event.step.started, (step) => {
    if (isHookSteps === false) {
      startMetaStep(step.metaStep);
      if (currentStep !== step) {
        // The reason we need to do this cause
        // the step actor contains this and hence
        // the allure reporter could not parse and
        // generate the report
        if (step.actor.includes('\u001b[36m')) {
          step.actor = step.actor.replace('\u001b[36m', '').replace('\u001b[39m', '');
        }
        reporter.startStep(step.toString());
        currentStep = step;
      }
    }
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
    metaStepsToFinish.forEach(() => reporter.endStep('passed'));
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

  return this;
};
