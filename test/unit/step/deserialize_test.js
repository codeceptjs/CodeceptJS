import { expect } from 'chai'
import Step from '../../../lib/step/helper.js'
import MetaStep from '../../../lib/step/meta.js'
import deserializeStep from '../../../lib/step/deserialize.js'
import Locator from '../../../lib/locator.js'
import Secret from '../../../lib/secret.js'
import { createTest, serializeTest, deserializeTest } from '../../../lib/mocha/test.js'

const transfer = step => deserializeStep(structuredClone(step.simplify()))

describe('Step serialization across workers', () => {
  it('keeps the human-readable form of locator and secret arguments', () => {
    const step = new Step({}, 'click')
    step.setArguments([new Locator({ xpath: '//button' }), new Secret('123'), 'text'])

    const restored = transfer(step)

    expect(restored.toString()).to.equal(step.toString())
    expect(restored.args).to.deep.equal(['{xpath: //button}', '*****', 'text'])
  })

  it('restores the meta step chain', () => {
    const section = new MetaStep(null, 'Login')
    const pageObject = new MetaStep('loginPage', 'login')
    pageObject.setArguments(['john'])
    pageObject.metaStep = section
    const step = new Step({}, 'fillField')
    step.setArguments(['name', 'john'])
    step.metaStep = pageObject

    const restored = transfer(step)

    expect(restored.metaStep).to.be.instanceOf(MetaStep)
    expect(restored.metaStep.toString()).to.equal(pageObject.toString())
    expect(restored.metaStep.metaStep).to.be.instanceOf(MetaStep)
    expect(restored.metaStep.metaStep.toString()).to.equal('Login')
    expect(restored.metaStep.metaStep.metaStep).to.be.undefined
  })

  it('uses the toString of meta step subclasses', () => {
    class CustomMetaStep extends MetaStep {
      toString() {
        return `Within ${this.humanizeArgs()}`
      }
    }
    const within = new CustomMetaStep('Within')
    within.setArguments(['.modal'])
    const step = new Step({}, 'see')
    step.metaStep = within

    expect(transfer(step).metaStep.toString()).to.equal('Within ".modal"')
  })

  it('shares one meta step instance between steps of the same meta step', () => {
    const metaStep = new MetaStep('loginPage', 'login')
    const first = new Step({}, 'fillField')
    const second = new Step({}, 'click')
    first.metaStep = second.metaStep = metaStep

    const test = createTest('test', () => {})
    test.steps = [first, second]
    const restored = deserializeTest(structuredClone(serializeTest(test)))

    expect(restored.steps[0].metaStep).to.equal(restored.steps[1].metaStep)
    expect(transfer(first).metaStep).to.equal(transfer(second).metaStep)
  })

  it('keeps distinct meta steps separate', () => {
    const first = new Step({}, 'fillField')
    const second = new Step({}, 'fillField')
    first.metaStep = new MetaStep('loginPage', 'login')
    second.metaStep = new MetaStep('loginPage', 'login')

    expect(transfer(first).metaStep).to.not.equal(transfer(second).metaStep)
  })
})
