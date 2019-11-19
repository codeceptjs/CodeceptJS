const { Parser } = require('gherkin');
const { Context, Suite, Test } = require('mocha');

const { matchStep } = require('./bdd');
const { isAsyncFunction } = require('../utils');
const event = require('../event');
const scenario = require('../scenario');
const Step = require('../step');

const parser = new Parser();
parser.stopAtFirstError = false;

module.exports = (text) => {
  const ast = parser.parse(text);

  const suite = new Suite(ast.feature.name, new Context());
  const tags = ast.feature.tags.map(t => t.name);
  suite.title = `${suite.title} ${tags.join(' ')}`.trim();
  suite.tags = tags || [];
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
      const setMetaStep = (step) => {
        if (step.metaStep) step = step.metaStep; // assign metastep to metastep for nested steps
        step.metaStep = metaStep;
      };
      const fn = matchStep(step.text);
      if (step.argument) {
        fn.params.push(step.argument);
        if (step.argument.type === 'DataTable') metaStep.comment = `\n${transformTable(step.argument)}`;
        if (step.argument.content) metaStep.comment = `\n${step.argument.content}`;
      }
      event.dispatcher.on(event.step.before, setMetaStep);
      try {
        await fn(...fn.params);
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
          const tags = child.tags.map(t => t.name);
          const title = `${child.name} ${JSON.stringify(current)} ${tags.join(' ')}`.trim();
          const test = new Test(title, async () => runSteps(addExampleInTable(exampleSteps, current)));
          test.tags = suite.tags.concat(tags);
          suite.addTest(scenario.test(test));
        }
      }
      continue;
    }
    const tags = child.tags.map(t => t.name);
    const title = `${child.name} ${tags.join(' ')}`.trim();
    const test = new Test(title, async () => runSteps(child.steps));
    test.tags = suite.tags.concat(tags);
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
function addExampleInTable(exampleSteps, placeholders) {
  const steps = JSON.parse(JSON.stringify(exampleSteps));
  for (const placeholder in placeholders) {
    steps.map((step) => {
      step = Object.assign({}, step);
      if (step.argument && step.argument.type === 'DataTable') {
        for (const id in step.argument.rows) {
          const cells = step.argument.rows[id].cells;
          cells.map(c => (c.value = c.value.replace(`<${placeholder}>`, placeholders[placeholder])));
        }
      }
      return step;
    });
  }
  return steps;
}
