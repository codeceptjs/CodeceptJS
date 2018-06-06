const { Parser } = require('gherkin');
const { matchStep } = require('./context');
const Scenario = require('../scenario');
const Suite = require('mocha/lib/suite');
const Context = require('mocha/lib/context');
const Test = require('mocha/lib/test');

function setMetaStep(step, metaStep) {

}

module.exports = (text) => {
  const parser = new Parser();
  parser.stopAtFirstError = false;
  const ast = parser.parse(text);

  const suite = new Suite(ast.feature.name, new Context());
  suite.title = ast.feature.name;
  suite.feature = ast.feature;

  for (const scenario of ast.feature.children) {
    const test = new Test(scenario.name, () => {
      for (const step of scenario.steps) {
        const fn = matchStep(step.text);
        fn(...fn.params);
      }
    });
    test.timeout(0);
    test.async = true;
    suite.addTest(Scenario.test(test));
  }

  return suite;
};
