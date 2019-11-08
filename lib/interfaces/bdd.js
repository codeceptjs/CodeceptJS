const {
  CucumberExpression,
  ParameterTypeRegistry,
  ParameterType,
} = require('cucumber-expressions');

let steps = {};

const STACK_POSITION = 2;

/**
 * @param {*} step
 * @param {*} fn
 */
const addStep = (step, fn) => {
  const stack = (new Error()).stack;
  steps[step] = fn;
  fn.line = stack && stack.split('\n')[STACK_POSITION];
  if (fn.line) fn.line = fn.line.trim().replace(/^at (.*?)\(/, '(');
};

const parameterTypeRegistry = new ParameterTypeRegistry();

const matchStep = (step) => {
  for (const stepName in steps) {
    if (stepName.indexOf('/') === 0) {
      const res = step.match(new RegExp(stepName.slice(1, -1)));
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
  matchStep,
  getSteps,
  clearSteps,
};
