import { CucumberExpression, ParameterTypeRegistry, ParameterType } from '@cucumber/cucumber-expressions';
import Config from '../config.js';

let steps = {};
const codecept_dir = '';

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

export const matchStep = (step) => {
  for (const stepName in steps) {
    if (stepName.indexOf('/') === 0) {
      const regExpArr = stepName.match(/^\/(.*?)\/([gimy]*)$/) || [];
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

export const clearSteps = () => {
  steps = {};
};

export const getSteps = () => {
  return steps;
};

export const defineParameterType = (options) => {
  const parameterType = buildParameterType(options);
  parameterTypeRegistry.defineParameterType(parameterType);
};

export const buildParameterType = ({
  name,
  regexp,
  transformer,
  useForSnippets,
  preferForRegexpMatch,
}) => {
  if (typeof useForSnippets !== 'boolean') useForSnippets = true;
  if (typeof preferForRegexpMatch !== 'boolean') preferForRegexpMatch = false;
  return new ParameterType(
    name,
    regexp,
    null,
    transformer,
    useForSnippets,
    preferForRegexpMatch,
  );
};

export { addStep as Given };
export { addStep as When };
export { addStep as Then };
export { addStep as And };

export default {
  matchStep,
  getSteps,
  clearSteps,
  defineParameterType,
};
