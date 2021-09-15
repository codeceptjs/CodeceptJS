const path = require('path');
const { CucumberExpression, ParameterTypeRegistry } = require('cucumber-expressions');

let steps = {};
let matchingSteps = {};

const STACK_POSITION = 2;

/**
 * @param {*} step
 * @param {*} fn
 */
const addStep = (step, fn) => {
  const stack = (new Error()).stack;
  steps[step] = fn;
  fn.line = stack && stack.split('\n')[STACK_POSITION];
  if (Object.keys(steps).includes(step)) {
    if (!Object.keys(matchingSteps).includes(step)) {
      matchingSteps[step] = [];
    }
    matchingSteps[step].push(fn);
  }
  if (fn.line) {
    fn.line = fn.line
      .trim()
      .replace(/^at (.*?)\(/, '(')
      .replace(codecept_dir, '.');
  }
};

const parameterTypeRegistry = new ParameterTypeRegistry();

const _findClosestPath = (from, tos) => {
  let _shortest = Infinity;
  let _closest = tos[0];
  for (const each of tos) {
    let to = each.line;
    to = to.slice(to.indexOf(path.sep) - 1, to.lastIndexOf(path.sep) + 1);
    const _distance = (path.relative(from, to).split(path.sep).length - 1);
    if (_distance < _shortest) {
      _shortest = _distance;
      _closest = each;
    }
  }
  return _closest;
};

const matchStep = (step, featureName) => {
  for (const stepName in steps) {
    if (stepName.indexOf('/') === 0) {
      const res = step.match(new RegExp(stepName.slice(1, -1)));
      if (res) {
        const fn = (featureName && Object.keys(matchingSteps).includes(stepName)) ? _findClosestPath(featureName, matchingSteps[stepName]) : steps[stepName];
        fn.params = res.slice(1);
        return fn;
      }
      continue;
    }
    const expression = new CucumberExpression(stepName, parameterTypeRegistry);
    const res = expression.match(step);
    if (res) {
      const fn = (featureName && Object.keys(matchingSteps).includes(stepName)) ? _findClosestPath(featureName, matchingSteps[stepName]) : steps[stepName];
      fn.params = res.map(arg => arg.getValue());
      return fn;
    }
  }
  throw new Error(`No steps matching "${step.toString()}"`);
};

const clearSteps = () => {
  steps = {};
  matchingSteps = {};
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
