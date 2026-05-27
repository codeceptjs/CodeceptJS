import * as Gherkin from '@cucumber/gherkin'
import * as Messages from '@cucumber/messages'
import path from 'path'
import { expect } from 'chai'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uuidFn = Messages.IdGenerator.uuid()
const builder = new Gherkin.AstBuilder(uuidFn)
const matcher = new Gherkin.GherkinClassicTokenMatcher()

import Config from '../../lib/config.js'
import { Given, When, And, Then, Before, After, matchStep, clearSteps, defineParameterType } from '../../lib/mocha/bdd.js'
import run from '../../lib/mocha/gherkin.js'
import recorder from '../../lib/recorder.js'
import container from '../../lib/container.js'
import actor from '../../lib/actor.js'
import event from '../../lib/event.js'

global.codecept_dir = path.join(__dirname, '/..')

let printed = []
let I

class Color {
  constructor(name) {
    this.name = name
  }
}

const text = `
  Feature: checkout process
  In order to buy products
  As a customer
  I want to be able to buy several products

  @super
  Scenario:
    Given I have product with 600 price
    And I have product with 1000 price
    When I go to checkout process
`

const checkTestForErrors = test => {
  return new Promise((resolve, reject) => {
    test.fn(err => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

describe('BDD', () => {
  beforeEach(async () => {
    clearSteps()
    recorder.start()
    await container.create({})
    Config.reset()
  })

  afterEach(async () => {
    await container.clear()
    recorder.stop()
  })

  it('should parse gherkin input', () => {
    const parser = new Gherkin.Parser(builder, matcher)
    parser.stopAtFirstError = false
    const ast = parser.parse(text)
    // console.log('Feature', ast.feature);
    // console.log('Scenario', ast.feature.children);
    // console.log('Steps', ast.feature.children[0].steps[0]);
    expect(ast.feature).is.ok
    expect(ast.feature.children).is.ok
    expect(ast.feature.children[0].scenario.steps).is.ok
  })

  it('should load step definitions', async () => {
    await Given('I am a bird', () => 1)
    await When('I fly over ocean', () => 2)
    await And(/^I fly over land$/i, () => 3)
    await Then(/I see (.*?)/, () => 4)
    expect(1).is.equal(matchStep('I am a bird')())
    expect(3).is.equal(matchStep('I Fly oVer Land')())
    expect(4).is.equal(matchStep('I see ocean')())
    expect(4).is.equal(matchStep('I see world')())
  })

  it('should fail on duplicate step definitions with option', async () => {
    Config.append({
      gherkin: {
        avoidDuplicateSteps: true,
      },
    })

    let error = null
    try {
      await Given('I am a bird', () => 1)
      await Then('I am a bird', () => 1)
    } catch (err) {
      error = err
    } finally {
      expect(!!error).is.true
    }
  })

  it('should contain tags', async () => {
    let sum = 0
    await Given(/I have product with (\d+) price/, param => (sum += parseInt(param, 10)))
    await When('I go to checkout process', () => (sum += 10))
    const suite = await run(text)
    suite.tests[0].fn(() => {})
    expect(suite.tests[0].tags).is.ok
    expect('@super').is.equal(suite.tests[0].tags[0])
  })

  it('should load and run step definitions', async () => {
    let sum = 0
    await Given(/I have product with (\d+) price/, param => (sum += parseInt(param, 10)))
    await When('I go to checkout process', () => (sum += 10))
    const suite = await run(text)
    expect('checkout process').is.equal(suite.title)
    return new Promise(resolve => {
      suite.tests[0].fn(() => {
        expect(suite.tests[0].steps).is.ok
        expect(1610).is.equal(sum)
        resolve()
      })
    })
  })

  it('should allow failed steps', async () => {
    let sum = 0
    Given(/I have product with (\d+) price/, param => (sum += parseInt(param, 10)))
    When('I go to checkout process', () => expect(false).is.true)
    const suite = await run(text)
    expect('checkout process').is.equal(suite.title)
    try {
      await checkTestForErrors(suite.tests[0])
      return Promise.reject(new Error('Test should have thrown with failed step, but did not'))
    } catch (err) {
      const errored = !!err
      expect(errored).is.true
    }
  })

  it('handles errors in steps', async () => {
    let sum = 0
    Given(/I have product with (\d+) price/, param => (sum += parseInt(param, 10)))
    When('I go to checkout process', () => {
      throw new Error('errored step')
    })
    const suite = await run(text)
    expect('checkout process').is.equal(suite.title)
    try {
      await checkTestForErrors(suite.tests[0])
      return Promise.reject(new Error('Test should have thrown with error, but did not'))
    } catch (err) {
      const errored = !!err
      expect(errored).is.true
    }
  })

  it('handles async errors in steps', async () => {
    let sum = 0
    Given(/I have product with (\d+) price/, param => (sum += parseInt(param, 10)))
    When('I go to checkout process', () => Promise.reject(new Error('step failed')))
    const suite = await run(text)
    expect('checkout process').is.equal(suite.title)
    try {
      await checkTestForErrors(suite.tests[0])
      return Promise.reject(new Error('Test should have thrown with error, but did not'))
    } catch (err) {
      const errored = !!err
      expect(errored).is.true
    }
  })

  it('should work with async functions', async () => {
    let sum = 0
    Given(/I have product with (\d+) price/, param => (sum += parseInt(param, 10)))
    When('I go to checkout process', async () => {
      return new Promise(checkoutDone => {
        sum += 10
        setTimeout(checkoutDone, 0)
      })
    })
    const suite = await run(text)
    expect('checkout process').is.equal(suite.title)
    return new Promise(resolve => {
      suite.tests[0].fn(() => {
        expect(suite.tests[0].steps).is.ok
        expect(1610).is.equal(sum)
        resolve()
      })
    })
  })

  it('should execute scenarios step-by-step ', async () => {
    await recorder.start()
    printed = []
    container.append({
      helpers: {
        simple: {
          do(...args) {
            return Promise.resolve().then(() => printed.push(args.join(' ')))
          },
        },
      },
    })
    I = actor({}, container)
    let sum = 0
    Given(/I have product with (\d+) price/, price => {
      I.do('add', (sum += parseInt(price, 10)))
    })
    When('I go to checkout process', () => {
      I.do('add finish checkout')
    })
    const suite = await run(text)
    return new Promise(resolve => {
      suite.tests[0].fn(() => {
        recorder.promise().then(() => {
          expect(printed).to.include.members(['add 600', 'add 1600', 'add finish checkout'])
          const lines = recorder.scheduled().split('\n')
          expect(lines).to.include.members([
            'do: "add", 600',
            'step passed',
            'return result',
            'do: "add", 1600',
            'step passed',
            'return result',
            'do: "add finish checkout"',
            'step passed',
            'return result',
            'fire test.passed',
            'finish test',
          ])
          resolve()
        })
      })
    })
  })

  it('should match step with params', async () => {
    await Given('I am a {word}', param => param)
    const fn = matchStep('I am a bird')
    expect('bird').is.equal(fn.params[0])
  })

  it('should produce step events', async () => {
    const text = `
    Feature: Emit step event

      Scenario:
        Then I emit step events
    `
    Then('I emit step events', () => {})
    let listeners = 0
    event.dispatcher.addListener(event.bddStep.before, () => listeners++)
    event.dispatcher.addListener(event.bddStep.after, () => listeners++)

    const suite = await run(text)
    return new Promise(resolve => {
      suite.tests[0].fn(() => {
        expect(listeners).to.eql(2)
        resolve()
      })
    })
  })

  it('should use shortened form for step definitions', async () => {
    let fn
    await Given('I am a {word}', params => params[0])
    await When('I have {int} wings and {int} eyes', params => params[0] + params[1])
    await Given('I have ${int} in my pocket', params => params[0])
    await Given('I have also ${float} in my pocket', params => params[0])
    fn = matchStep('I am a bird')
    expect('bird').is.equal(fn(fn.params))
    fn = matchStep('I have 2 wings and 2 eyes')
    expect(4).is.equal(fn(fn.params))
    fn = matchStep('I have $500 in my pocket')
    expect(500).is.equal(fn(fn.params))
    fn = matchStep('I have also $500.30 in my pocket')
    expect(500.3).is.equal(fn(fn.params))
  })

  it('should attach before hook for Background', async () => {
    const text = `
    Feature: checkout process

      Background:
        Given I am logged in as customer

      Scenario:
        Then I am shopping
    `
    let sum = 0
    function incrementSum() {
      sum++
    }
    Given('I am logged in as customer', incrementSum)
    Then('I am shopping', incrementSum)
    const suite = await run(text)
    const done = () => {}

    suite._beforeEach.forEach(hook => hook.run(done))
    return new Promise(resolve => {
      suite.tests[0].fn(() => {
        expect(sum).is.equal(2)
        resolve()
      })
    })
  })

  it('should execute scenario outlines', async () => {
    const text = `
    @awesome @cool
    Feature: checkout process

    @super
    Scenario Outline: order discount
      Given I have product with price <price>$ in my cart
      And discount is 10 %
      Then I should see price is "<total>" $

      Examples:
        | price | total |
        | 10    | 9     |

      @exampleTag1
      @exampleTag2
      Examples:
        | price | total |
        | 20    | 18    |
    `
    let cart = 0
    let sum = 0
    Given('I have product with price {int}$ in my cart', price => {
      cart = price
    })
    Given('discount is {int} %', discount => {
      cart -= (cart * discount) / 100
    })
    Then('I should see price is {string} $', total => {
      sum = parseInt(total, 10)
    })

    const suite = await run(text)

    expect(suite.tests[0].tags).is.ok
    expect(['@awesome', '@cool', '@super']).is.deep.equal(suite.tests[0].tags)
    expect(['@awesome', '@cool', '@super', '@exampleTag1', '@exampleTag2']).is.deep.equal(suite.tests[1].tags)

    expect(2).is.equal(suite.tests.length)
    return new Promise(resolve => {
      suite.tests[0].fn(() => {
        expect(9).is.equal(cart)
        expect(9).is.equal(sum)

        suite.tests[1].fn(() => {
          expect(18).is.equal(cart)
          expect(18).is.equal(sum)
          resolve()
        })
      })
    })
  })

  it('should provide a parsed DataTable', async () => {
    const text = `
    @awesome @cool
    Feature: checkout process

    @super
    Scenario: order products
      Given I have the following products :
        | label   | price  |
        | beer    | 9      |
        | cookies | 12     |
      Then I should see the following products :
        | label   | price  |
        | beer    | 9      |
        | cookies | 12     |
    `

    let givenParsedRows
    let thenParsedRows

    Given('I have the following products :', products => {
      expect(products.rows.length).to.equal(3)
      givenParsedRows = products.parse()
    })
    Then('I should see the following products :', products => {
      expect(products.rows.length).to.equal(3)
      thenParsedRows = products.parse()
    })

    const suite = await run(text)

    const expectedParsedDataTable = [
      ['label', 'price'],
      ['beer', '9'],
      ['cookies', '12'],
    ]

    return new Promise(resolve => {
      suite.tests[0].fn(() => {
        expect(givenParsedRows.rawData).is.deep.equal(expectedParsedDataTable)
        expect(thenParsedRows.rawData).is.deep.equal(expectedParsedDataTable)
        resolve()
      })
    })
  })

  it('should match step with custom parameter type', async () => {
    const colorType = {
      name: 'color',
      regexp: /red|blue|yellow/,
      transformer: s => new Color(s),
    }
    defineParameterType(colorType)
    await Given('I have a {color} label', color => color)
    const fn = matchStep('I have a red label')
    expect('red').is.equal(fn.params[0].name)
  })

  it('should match step with async custom parameter type transformation', async () => {
    const colorType = {
      name: 'async_color',
      regexp: /red|blue|yellow/,
      transformer: async s => new Color(s),
    }
    defineParameterType(colorType)
    await Given('I have a {async_color} label', color => color)
    const fn = matchStep('I have a blue label')
    const color = await fn.params[0]
    expect('blue').is.equal(color.name)
    await Promise.resolve()
  })

  describe('Gherkin hook events', () => {
    const featureText = `
      @feature_tag
      Feature: checkout flow

        @scenario_tag
        Scenario: buy a product
          Given I have product with 600 price
          When I go to checkout process
    `

    const registerBasicSteps = () => {
      Given(/I have product with (\d+) price/, () => {})
      When('I go to checkout process', () => {})
    }

    const removeListeners = events => {
      for (const name of events) event.dispatcher.removeAllListeners(name)
    }

    const driveHook = (hook, currentTest) =>
      new Promise((resolve, reject) => {
        hook.fn.call({ currentTest }, err => (err ? reject(err) : resolve()))
      })

    it('event.test.before carries the real scenario title and tags', async () => {
      registerBasicSteps()
      const suite = await run(featureText)
      const captured = []
      event.dispatcher.on(event.test.before, t => captured.push({ title: t.title, tags: t.tags }))

      try {
        const beforeHook = suite._beforeEach.find(h => h.title.includes('codeceptjs.before'))
        await driveHook(beforeHook, suite.tests[0])

        expect(captured).to.have.lengthOf(1)
        expect(captured[0].title).to.equal('buy a product @scenario_tag')
        expect(captured[0].tags).to.include.members(['@feature_tag', '@scenario_tag'])
        expect(captured[0].title).to.not.equal('...')
      } finally {
        removeListeners([event.test.before])
      }
    })

    it('event.test.after carries the real scenario title and tags', async () => {
      registerBasicSteps()
      const suite = await run(featureText)
      const captured = []
      event.dispatcher.on(event.test.after, t => captured.push({ title: t.title, tags: t.tags }))

      try {
        const afterHook = suite._afterEach.find(h => h.title.includes('codeceptjs.after'))
        await driveHook(afterHook, suite.tests[0])

        expect(captured).to.have.lengthOf(1)
        expect(captured[0].title).to.equal('buy a product @scenario_tag')
        expect(captured[0].tags).to.include.members(['@feature_tag', '@scenario_tag'])
        expect(captured[0].title).to.not.equal('...')
      } finally {
        removeListeners([event.test.after])
      }
    })

    it('forwards the done callback from setup() and emits before invoking it', async () => {
      registerBasicSteps()
      const suite = await run(featureText)
      const beforeHook = suite._beforeEach.find(h => h.title.includes('codeceptjs.before'))
      const order = []
      event.dispatcher.on(event.test.before, () => order.push('emitted'))

      try {
        let doneCalls = 0
        await new Promise((resolve, reject) => {
          beforeHook.fn.call({ currentTest: suite.tests[0] }, err => {
            doneCalls++
            order.push('done')
            err ? reject(err) : resolve()
          })
        })
        expect(doneCalls).to.equal(1)
        expect(order).to.deep.equal(['emitted', 'done'])
      } finally {
        removeListeners([event.test.before])
      }
    })

    it('Before(test => ...) step-definition hook receives the real scenario', async () => {
      const seen = []
      Before(test => seen.push({ title: test.title, tags: test.tags }))
      registerBasicSteps()
      const suite = await run(featureText)

      try {
        await new Promise((resolve, reject) => {
          suite.tests[0].fn(err => (err ? reject(err) : resolve()))
        })

        expect(seen).to.have.lengthOf.at.least(1)
        const recorded = seen[seen.length - 1]
        expect(recorded.title).to.equal('buy a product @scenario_tag')
        expect(recorded.tags).to.include.members(['@feature_tag', '@scenario_tag'])
      } finally {
        removeListeners([event.test.started])
      }
    })

    it('emits test.before, test.started, test.after in the expected order', async () => {
      registerBasicSteps()
      const suite = await run(featureText)
      const order = []
      const record = name => () => order.push(name)
      event.dispatcher.on(event.test.before, record('test.before'))
      event.dispatcher.on(event.test.started, record('test.started'))
      event.dispatcher.on(event.test.passed, record('test.passed'))
      event.dispatcher.on(event.test.after, record('test.after'))

      try {
        const beforeHook = suite._beforeEach.find(h => h.title.includes('codeceptjs.before'))
        const afterHook = suite._afterEach.find(h => h.title.includes('codeceptjs.after'))

        await driveHook(beforeHook, suite.tests[0])
        await new Promise((resolve, reject) => {
          suite.tests[0].fn(err => (err ? reject(err) : resolve()))
        })
        await driveHook(afterHook, suite.tests[0])

        expect(order.indexOf('test.before')).to.be.lessThan(order.indexOf('test.started'))
        expect(order.indexOf('test.started')).to.be.lessThan(order.indexOf('test.passed'))
        expect(order.indexOf('test.passed')).to.be.lessThan(order.indexOf('test.after'))
      } finally {
        removeListeners([event.test.before, event.test.started, event.test.passed, event.test.after])
      }
    })

    it('After(test => ...) step-definition hook receives the real scenario', async () => {
      const seen = []
      After(test => seen.push({ title: test.title, tags: test.tags }))
      registerBasicSteps()
      const suite = await run(featureText)

      try {
        await new Promise((resolve, reject) => {
          suite.tests[0].fn(err => (err ? reject(err) : resolve()))
        })

        expect(seen).to.have.lengthOf.at.least(1)
        const recorded = seen[seen.length - 1]
        expect(recorded.title).to.equal('buy a product @scenario_tag')
        expect(recorded.tags).to.include.members(['@feature_tag', '@scenario_tag'])
      } finally {
        removeListeners([event.test.finished])
      }
    })
  })
})
