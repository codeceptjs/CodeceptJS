const {
  CucumberExpression,
  ParameterTypeRegistry,
  ParameterType,
} = require('cucumber-expressions');


let steps = {};

const addStep = (step, fn) => {
  steps[step] = fn;
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
  console.log('aaaaaaaaaaaaa', step.toString());
  throw new Error(`No steps matching "${step.toString()}"`);
};

const clearSteps = () => {
  steps = {};
};

module.exports = {
  Given: addStep,
  When: addStep,
  Then: addStep,
  matchStep,
  clearSteps,
};
