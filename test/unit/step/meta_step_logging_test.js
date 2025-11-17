import { expect } from 'chai'
import sinon from 'sinon'
import event from '../../../lib/event.js'
import MetaStep from '../../../lib/step/meta.js'
import Step from '../../../lib/step.js'

describe('MetaStep Logging', () => {
  let eventStub

  beforeEach(() => {
    event.cleanDispatcher()
    eventStub = {
      stepStarted: sinon.spy(),
      stepFinished: sinon.spy(),
    }
    event.dispatcher.on(event.step.started, eventStub.stepStarted)
    event.dispatcher.on(event.step.finished, eventStub.stepFinished)
  })

  afterEach(() => {
    event.cleanDispatcher()
  })

  it('should emit step.started and step.finished for MetaStep without child steps', () => {
    const metaStep = new MetaStep('I', 'doSomething')
    const fn = () => {
      // MetaStep that doesn't call any child I steps
      console.log('Just a console.log')
    }

    metaStep.run(fn)

    // Should emit step.started and step.finished
    expect(eventStub.stepStarted.calledOnce).to.be.true
    expect(eventStub.stepFinished.calledOnce).to.be.true
    expect(eventStub.stepStarted.firstCall.args[0]).to.equal(metaStep)
    expect(eventStub.stepFinished.firstCall.args[0]).to.equal(metaStep)
  })

  it('should NOT emit events for MetaStep WITH child steps', () => {
    const metaStep = new MetaStep('I', 'doSomethingWithChild')
    const fn = () => {
      // Simulate a child step being registered
      const childStep = new Step({ helper: 'test' }, 'childAction')
      event.emit(event.step.before, childStep)
    }

    metaStep.run(fn)

    // Should NOT emit step.started and step.finished for the MetaStep
    // because it has child steps
    expect(eventStub.stepStarted.called).to.be.false
    expect(eventStub.stepFinished.called).to.be.false
  })

  it('should emit events for async MetaStep without child steps', async () => {
    const metaStep = new MetaStep('I', 'doSomethingAsync')
    const fn = async () => {
      // Async MetaStep that doesn't call any child I steps
      await Promise.resolve()
      console.log('Just an async operation')
    }

    await metaStep.run(fn)

    // Should emit step.started and step.finished
    expect(eventStub.stepStarted.calledOnce).to.be.true
    expect(eventStub.stepFinished.calledOnce).to.be.true
    expect(eventStub.stepStarted.firstCall.args[0]).to.equal(metaStep)
    expect(eventStub.stepFinished.firstCall.args[0]).to.equal(metaStep)
  })

  it('should NOT emit events for async MetaStep WITH child steps', async () => {
    const metaStep = new MetaStep('I', 'doSomethingAsyncWithChild')
    const fn = async () => {
      // Simulate a child step being registered
      const childStep = new Step({ helper: 'test' }, 'childAction')
      event.emit(event.step.before, childStep)
      await Promise.resolve()
    }

    await metaStep.run(fn)

    // Should NOT emit step.started and step.finished for the MetaStep
    // because it has child steps
    expect(eventStub.stepStarted.called).to.be.false
    expect(eventStub.stepFinished.called).to.be.false
  })

  it('should set status to success when MetaStep completes without error', () => {
    const metaStep = new MetaStep('I', 'doSomething')
    const fn = () => {
      return 'success'
    }

    metaStep.run(fn)

    expect(metaStep.status).to.equal('success')
  })

  it('should set status to failed when MetaStep throws error', () => {
    const metaStep = new MetaStep('I', 'doSomethingThatFails')
    const fn = () => {
      throw new Error('Test error')
    }

    try {
      metaStep.run(fn)
    } catch (err) {
      // Expected to throw
    }

    expect(metaStep.status).to.equal('failed')
  })
})
