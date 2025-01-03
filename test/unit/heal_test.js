let expect
import('chai').then(chai => {
  expect = chai.expect
})
const heal = require('../../lib/heal')
const recorder = require('../../lib/recorder')
const Step = require('../../lib/step')

describe('heal', () => {
  beforeEach(() => {
    heal.clear()
    recorder.reset()
  })

  it('should collect recipes', () => {
    heal.addRecipe('reload', {
      priority: 10,
      steps: ['click'],
      fn: async () => {
        return ({ I }) => {
          I.refreshPage()
        }
      },
    })

    expect(heal.hasCorrespondingRecipes({ name: 'click' })).to.be.true
  })

  it('should respect the priority of recipes', async () => {
    heal.addRecipe('secondPrior', {
      priority: 2,
      steps: ['click'],
      fn: async () => {
        return ({ I }) => {
          I.refreshPage()
        }
      },
    })

    heal.addRecipe('firstPrior', {
      priority: 1,
      steps: ['refresh'],
      fn: async () => {
        return ({ I }) => {
          I.refreshPage()
          I.refreshPage()
        }
      },
    })

    expect((await heal.getCodeSuggestions({}))[0].name).to.equal('firstPrior')
    expect((await heal.getCodeSuggestions({}))[1].name).to.equal('secondPrior')
  })

  it('should have corresponding recipes', () => {
    heal.recipes = { test: { steps: ['step1', 'step2'], fn: () => {} } }
    heal.contextName = 'TestSuite'
    const result = heal.hasCorrespondingRecipes({ name: 'step1' })
    expect(result).to.be.true
  })

  it('should get code suggestions', async () => {
    heal.recipes = { test: { prepare: { prop: () => 'value' }, fn: () => 'snippet' } }
    heal.contextName = 'TestSuite'
    const suggestions = await heal.getCodeSuggestions({})
    expect(suggestions).to.deep.equal([{ name: 'test', snippets: ['snippet'] }])
  })

  it('should heal failed steps', async () => {
    let isHealed = false
    heal.addRecipe('reload', {
      priority: 10,
      steps: ['click'],
      fn: async () => {
        return () => {
          isHealed = true
        }
      },
    })

    await heal.healStep(new Step(null, 'click'))

    expect(isHealed).to.be.true
  })

  it('should match tests by grep', () => {
    heal.addRecipe('reload', {
      priority: 10,
      grep: '@slow',
      steps: ['step1'],
      fn: () => {},
    })

    heal.contextName = 'TestSuite @slow'
    expect(heal.hasCorrespondingRecipes({ name: 'step1' })).to.be.true
    heal.contextName = 'TestSuite @fast'
    expect(heal.hasCorrespondingRecipes({ name: 'step1' })).not.to.be.true
  })

  it('should contain info', async () => {
    let isHealed = false
    let passedOpts = null
    heal.addRecipe('reload', {
      priority: 10,
      steps: ['click'],
      fn: async opts => {
        passedOpts = opts
        return () => {
          isHealed = true
        }
      },
    })

    await heal.healStep(new Step(null, 'click'), new Error('Ups'), { test: { title: 'test' } })

    expect(isHealed).to.be.true
    expect(passedOpts).to.haveOwnProperty('test')
    expect(passedOpts).to.haveOwnProperty('error')
    expect(passedOpts).to.haveOwnProperty('step')
    expect(passedOpts).to.haveOwnProperty('prevSteps')
    expect(passedOpts.error.message).to.eql('Ups')
  })
})
