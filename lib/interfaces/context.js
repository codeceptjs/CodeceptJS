let steps = {};

const addStep = (step, fn) => {
  steps[step] = fn;
};

const matchStep = (step) => {
  // console.log(steps);
  for (const stepName in steps) {
    if (stepName.indexOf('/') === 0) {
      const regex = new RegExp(stepName.slice(1, -1));
      const res = step.match(regex);
      if (res) {
        return steps[stepName].apply(null, res.slice(1));
      }
    }
    if (step.toString() === stepName) {
      return steps[stepName]();
    }
  }
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
