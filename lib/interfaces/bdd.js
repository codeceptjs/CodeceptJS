const { CucumberExpression, ParameterTypeRegistry } = require('cucumber-expressions');
const Config = require('../config');

let steps = {};

const STACK_POSITION = 2;

/**
 * @param {*} step
 * @param {*} fn
 */
const addStep = (step, fn) => {
  const avoidDuplicateSteps = Config.get('gherkin', {}).avoidDuplicateSteps || false;
  const stack = (new Error()).stack;
  if (avoidDuplicateSteps && steps[step]) {
    throw new Error(`Step '${step}' is already defined`);
  }
  steps[step] = fn;
  fn.line = stack && stack.split('\n')[STACK_POSITION];
  if (fn.line) {
    fn.line = fn.line
      .trim()
      .replace(/^at (.*?)\(/, '(')
      .replace(codecept_dir, '.');
  }
};

const parameterTypeRegistry = new ParameterTypeRegistry();

const matchStep = (step) => {
  for (const stepName in steps) {
    if (stepName.indexOf('/') === 0) {
      const regExpArr = stepName.match(new RegExp('^/(.*?)/([gimy]*)$')) || [];
      const res = step.match(new RegExp(regExpArr[1], regExpArr[2]));
      if (res) {
        const fn = steps[stepName];
        fn.params = res.slice(1);
        return fn;
      }
      continue;
    }
    const expression = new CucumberExpression(stepName, parameterTypeRegistry);
    const res = expression.match(step);
    if (res) {
      const fn = steps[stepName];
      fn.params = res.map(arg => arg.getValue());
      return fn;
    }
  }
  throw new Error(`No steps matching "${step.toString()}"`);
};

const clearSteps = () => {
  steps = {};
};

const getSteps = () => {
  return steps;
};

module.exports = {
  Given: addStep,
  When: addStep,
  Then: addStep,
  And: addStep,
  matchStep,
  getSteps,
  clearSteps,
};
