const { Parser } = require('gherkin');
const { matchStep } = require('./context');

module.exports = (text) => {
  const parser = new Parser();
  parser.stopAtFirstError = false;
  const ast = parser.parse(text);

  for (const scenario of ast.feature.children) {
    for (const step of scenario.steps) {
      matchStep(step.text);
    }
  }
};
