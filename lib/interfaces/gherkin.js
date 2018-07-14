const { Parser } = require('gherkin');
const { matchStep } = require('./bdd');
const { isAsyncFunction } = require('../utils');
const event = require('../event');
const scenario = require('../scenario');
const Step = require('../step');
const Suite = require('mocha/lib/suite');
const Context = require('mocha/lib/context');
const Test = require('mocha/lib/test');

const parser = new Parser();
parser.stopAtFirstError = false;

module.exports = (text) => {
  const ast = parser.parse(text);

  const suite = new Suite(ast.feature.name, new Context());
  suite.title = `${suite.title} ${ast.feature.tags.map(t => t.name).join(' ')}`.trim();
  suite.comment = ast.feature.description;
  suite.feature = ast.feature;
  suite.timeout(0);

  suite.beforeEach('codeceptjs.before', () => scenario.setup(suite));
  suite.afterEach('codeceptjs.after', () => scenario.teardown(suite));
  suite.beforeAll('codeceptjs.beforeSuite', () => scenario.suiteSetup(suite));
  suite.afterAll('codeceptjs.afterSuite', () => scenario.suiteTeardown(suite));

  const runSteps = async (steps) => {
    for (const step of steps) {
      const metaStep = new Step.MetaStep(null, step.text);
      metaStep.actor = step.keyword.trim();
      metaStep.humanize = () => step.text;
      const setMetaStep = step => step.metaStep = metaStep;
      const fn = matchStep(step.text);
      if (step.argument) {
        fn.params.push(step.argument);
        if (step.argument.type === 'DataTable') metaStep.comment = `\n${transformTable(step.argument)}`;
        if (step.argument.content) metaStep.comment = `\n${step.argument.content}`;
      }
      event.dispatcher.on(event.step.before, setMetaStep);
      try {
        if (isAsyncFunction(fn)) {
          await fn(...fn.params);
        } else {
          fn(...fn.params);
        }
      } finally {
        event.dispatcher.removeListener(event.step.before, setMetaStep);
      }
    }
  };

  for (const child of ast.feature.children) {
    if (child.type === 'Background') {
      suite.beforeEach('Before', scenario.injected(async () => runSteps(child.steps), suite, 'before'));
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
          const test = new Test(`${child.name} ${JSON.stringify(current)}`, async () => runSteps(exampleSteps));
          test.timeout(0);
          test.async = true;
          suite.addTest(scenario.test(test));
        }
      }
      continue;
    }
    const title = `${child.name} ${child.tags.map(t => t.name).join(' ')}`.trim();
    const test = new Test(title, async () => runSteps(child.steps));
    test.timeout(0);
    test.async = true;
    suite.addTest(scenario.test(test));
  }

  return suite;
};

function transformTable(table) {
  let str = '';
  for (const id in table.rows) {
    const cells = table.rows[id].cells;
    str += cells.map(c => c.value).map(c => c.slice(0, 15).padEnd(15)).join(' | ');
    str += '\n';
  }
  return str;
}
