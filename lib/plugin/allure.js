const event = require('../event');
const Allure = require('allure-js-commons');

module.exports = (config) => {
  const reporter = new Allure();
  reporter.setOptions({ targetDir: config.outputDir || global.output_dir });

  let currentMetaStep = [];
  let currentStep;

  this.addAttachment = (name, buffer, type) => {
    reporter.addAttachment(name, buffer, type);
  };

  event.dispatcher.on(event.suite.before, (suite) => {
    reporter.startSuite(suite.fullTitle());
  });

  event.dispatcher.on(event.suite.after, () => {
    reporter.endSuite();
  });

  event.dispatcher.on(event.test.before, (test) => {
    reporter.startCase(test.title);
    currentStep = null;
  });

  event.dispatcher.on(event.test.failed, (test, err) => {
    if (currentStep) reporter.endStep('failed');
    if (currentMetaStep.length) {
      currentMetaStep.forEach(() => reporter.endStep('failed'));
      currentMetaStep = [];
    }
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
    startMetaStep(step.metaStep);
    if (currentStep !== step) {
      reporter.startStep(step.toString());
      currentStep = step;
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
