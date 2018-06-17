const { Parser } = require('gherkin');
const { matchStep } = require('./bdd');
const event = require('../event');
const scenario = require('../scenario');
const recorder = require('../recorder');
const Step = require('../step');
const Suite = require('mocha/lib/suite');
const Context = require('mocha/lib/context');
const Test = require('mocha/lib/test');


module.exports = (text) => {
  const parser = new Parser();
  parser.stopAtFirstError = false;
  const ast = parser.parse(text);

  const suite = new Suite(ast.feature.name, new Context());
  suite.title = ast.feature.name;
  suite.feature = ast.feature;

  suite.beforeEach('codeceptjs.before', () => scenario.setup(suite));

  // console.log(ast);
  if (ast.feature.before) {
    // suite.beforeEach('Before', scenario.injected(fn, suites, 'before'));
  }

  const runSteps = (steps) => {
    for (const step of steps) {
      const metaStep = new Step.MetaStep(null, step.text);
      metaStep.actor = step.keyword.trim();
      metaStep.humanize = () => step.text;
      const setMetaStep = step => step.metaStep = metaStep;
      const fn = matchStep(step.text);
      event.dispatcher.on(event.step.before, setMetaStep);
      fn(...fn.params);
      event.dispatcher.removeListener(event.step.before, setMetaStep);
    }
  };

  for (const child of ast.feature.children) {
    if (child.type === 'Background') {
      suite.beforeEach('Before', scenario.injected(() => runSteps(child.steps), suite, 'before'));
      continue;
    }
    if (child.type === 'ScenarioOutline') {
      for (const examples of child.examples) {
        const fields = examples.tableHeader.cells.map(c => c.value);
        for (const example of examples.tableBody) {
          let exampleSteps = [...child.steps];
          const current = {};
          for (const index in example.cells) {
            const placeholder = fields[index];
            const value = example.cells[index].value;
            current[placeholder] = value;
            exampleSteps = exampleSteps.map((step) => {
              step = Object.assign({}, step);
              step.text = step.text.replace(`<${placeholder}>`, value);
              return step;
            });
          }
          const test = new Test(`${child.name} ${JSON.stringify(current)}`, () => runSteps(exampleSteps));
          test.timeout(0);
          test.async = true;
          suite.addTest(scenario.test(test));
        }
      }
      continue;
    }
    const test = new Test(child.name, () => runSteps(child.steps));
    test.timeout(0);
    test.async = true;
    suite.addTest(scenario.test(test));
  }

  return suite;
};
