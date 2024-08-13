const Gherkin = require('@cucumber/gherkin')
const Messages = require('@cucumber/messages')
const { Context, Suite, Test } = require('mocha')
const debug = require('debug')('codeceptjs:bdd')

const { matchStep } = require('./bdd')
const event = require('../event')
const scenario = require('../scenario')
const Step = require('../step')
const DataTableArgument = require('../data/dataTableArgument')
const transform = require('../transform')

const uuidFn = Messages.IdGenerator.uuid()
const builder = new Gherkin.AstBuilder(uuidFn)
const matcher = new Gherkin.GherkinClassicTokenMatcher()
const parser = new Gherkin.Parser(builder, matcher)
parser.stopAtFirstError = false

module.exports = (text, file) => {
  const ast = parser.parse(text)
  let currentLanguage

  if (ast.feature) {
    currentLanguage = getTranslation(ast.feature.language)
  }

  if (!ast.feature) {
    throw new Error(`No 'Features' available in Gherkin '${file}' provided!`)
  }
  const suite = new Suite(ast.feature.name, new Context())
  const tags = ast.feature.tags.map((t) => t.name)
  suite.title = `${suite.title} ${tags.join(' ')}`.trim()
  suite.tags = tags || []
  suite.comment = ast.feature.description
  suite.feature = ast.feature
  suite.file = file
  suite.timeout(0)

  suite.beforeEach('codeceptjs.before', () => scenario.setup(suite))
  suite.afterEach('codeceptjs.after', () => scenario.teardown(suite))
  suite.beforeAll('codeceptjs.beforeSuite', () => scenario.suiteSetup(suite))
  suite.afterAll('codeceptjs.afterSuite', () => scenario.suiteTeardown(suite))

  const runSteps = async (steps) => {
    for (const step of steps) {
      const metaStep = new Step.MetaStep(null, step.text)
      metaStep.actor = step.keyword.trim()
      let helperStep
      const setMetaStep = (step) => {
        helperStep = step
        if (step.metaStep) {
          if (step.metaStep === metaStep) {
            return
          }
          setMetaStep(step.metaStep)
          return
        }
        step.metaStep = metaStep
      }
      const fn = matchStep(step.text)

      if (step.dataTable) {
        fn.params.push({
          ...step.dataTable,
          parse: () => new DataTableArgument(step.dataTable),
        })
        metaStep.comment = `\n${transformTable(step.dataTable)}`
      }

      if (step.docString) {
        fn.params.push(step.docString)
        metaStep.comment = `\n"""\n${step.docString.content}\n"""`
      }

      step.startTime = Date.now()
      step.match = fn.line
      event.emit(event.bddStep.before, step)
      event.emit(event.bddStep.started, metaStep)
      event.dispatcher.prependListener(event.step.before, setMetaStep)
      try {
        debug(`Step '${step.text}' started...`)
        await fn(...fn.params)
        debug('Step passed')
        step.status = 'passed'
      } catch (err) {
        debug(`Step failed: ${err?.message}`)
        step.status = 'failed'
        step.err = err
        throw err
      } finally {
        step.endTime = Date.now()
        event.dispatcher.removeListener(event.step.before, setMetaStep)
      }
      event.emit(event.bddStep.finished, metaStep)
      event.emit(event.bddStep.after, step)
    }
  }

  for (const child of ast.feature.children) {
    if (child.background) {
      suite.beforeEach(
        'Before',
        scenario.injected(async () => runSteps(child.background.steps), suite, 'before'),
      )
      continue
    }
    if (
      child.scenario &&
      (currentLanguage
        ? child.scenario.keyword === currentLanguage.contexts.ScenarioOutline
        : child.scenario.keyword === 'Scenario Outline')
    ) {
      for (const examples of child.scenario.examples) {
        const fields = examples.tableHeader.cells.map((c) => c.value)
        for (const example of examples.tableBody) {
          let exampleSteps = [...child.scenario.steps]
          const current = {}
          for (const index in example.cells) {
            const placeholder = fields[index]
            const value = transform('gherkin.examples', example.cells[index].value)
            example.cells[index].value = value
            current[placeholder] = value
            exampleSteps = exampleSteps.map((step) => {
              step = { ...step }
              step.text = step.text.split(`<${placeholder}>`).join(value)
              return step
            })
          }
          const tags = child.scenario.tags.map((t) => t.name).concat(examples.tags.map((t) => t.name))
          let title = `${child.scenario.name} ${JSON.stringify(current)} ${tags.join(' ')}`.trim()

          for (const [key, value] of Object.entries(current)) {
            if (title.includes(`<${key}>`)) {
              title = title.replace(JSON.stringify(current), '').replace(`<${key}>`, value)
            }
          }

          const test = new Test(title, async () => runSteps(addExampleInTable(exampleSteps, current)))
          test.tags = suite.tags.concat(tags)
          test.file = file
          suite.addTest(scenario.test(test))
        }
      }
      continue
    }

    if (child.scenario) {
      const tags = child.scenario.tags.map((t) => t.name)
      const title = `${child.scenario.name} ${tags.join(' ')}`.trim()
      const test = new Test(title, async () => runSteps(child.scenario.steps))
      test.tags = suite.tags.concat(tags)
      test.file = file
      suite.addTest(scenario.test(test))
    }
  }

  return suite
}

function transformTable(table) {
  let str = ''
  for (const id in table.rows) {
    const cells = table.rows[id].cells
    str += cells
      .map((c) => c.value)
      .map((c) => c.padEnd(15))
      .join(' | ')
    str += '\n'
  }
  return str
}
function addExampleInTable(exampleSteps, placeholders) {
  const steps = JSON.parse(JSON.stringify(exampleSteps))
  for (const placeholder in placeholders) {
    steps.map((step) => {
      step = { ...step }
      if (step.dataTable) {
        for (const id in step.dataTable.rows) {
          const cells = step.dataTable.rows[id].cells
          cells.map((c) => (c.value = c.value.replace(`<${placeholder}>`, placeholders[placeholder])))
        }
      }
      return step
    })
  }
  return steps
}

function getTranslation(language) {
  const translations = Object.keys(require('../../translations'))

  for (const availableTranslation of translations) {
    if (!language) {
      break
    }

    if (availableTranslation.includes(language)) {
      return require('../../translations')[availableTranslation]
    }
  }
}
