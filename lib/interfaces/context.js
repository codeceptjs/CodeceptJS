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

function makeRegexPattern(stepName) {
  if (stepName.indexOf('/') === 0) {
    return new RegExp(stepName.slice(1, -1));
  }
  let stepPattern = escapeRe(stepName)
    .replace(/(\w+)\/(\w+)/, '(?:$1|$2)') // or
    .replace(/\((\w)\)/, '$1?'); // (s)


  stepPattern = stepPattern.replace(/\\{int\\}/g, '(\\d+)');
  stepPattern = stepPattern.replace(/\\{float\\}/g, '([\\d\.]+)');
  stepPattern = stepPattern.replace(/\\{word\\}/g, '(\\w+)');
  stepPattern = stepPattern.replace(/\\{string\\}/g, '\"(.*?)\"');

  // params converting from :param to match 11 and "aaa" and "aaa\"aaa"
  // stepPattern = stepPattern.replace(/"?\$(\w+)"?/g, replacePattern);
  // validating this pattern is slow, so we skip it now
  console.log(stepPattern);

  return new RegExp(`^${stepPattern}$`);
}

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
