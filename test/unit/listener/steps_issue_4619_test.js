import { expect } from 'chai'
import sinon from 'sinon'
import event from '../../../lib/event.js'
import recorder from '../../../lib/recorder.js'
import { tryTo, hopeThat } from '../../../lib/effects.js'
import Step from '../../../lib/step.js'

// Import and initialize the steps listener
import stepsListener from '../../../lib/listener/steps.js'

describe('Steps Listener - Issue Fix #4619', () => {
  let currentTest

  beforeEach(() => {
    // Reset everything
    recorder.reset()
    recorder.start()
    event.cleanDispatcher()

    // Initialize the steps listener (it needs to be called as a function)
    stepsListener()

    // Create a mock test object
    currentTest = {
      title: 'Test Case for Issue #4619',
      steps: [],
    }

    // Emit test started event to properly initialize the listener
    event.emit(event.test.started, currentTest)
  })

  afterEach(() => {
    event.cleanDispatcher()
    recorder.reset()
  })

  it('should exclude steps emitted during tryTo sessions from main test trace', async () => {
    // This is the core fix: steps emitted inside tryTo should not pollute the main test trace

    const stepCountBefore = currentTest.steps.length

    // Execute tryTo and emit a step inside it
    await tryTo(() => {
      const tryToStep = new Step(
        {
          optionalAction: () => {
            throw new Error('Expected to fail')
          },
        },
        'optionalAction',
      )
      event.emit(event.step.started, tryToStep)
      recorder.add(() => {
        throw new Error('Expected to fail')
      })
    })

    const stepCountAfter = currentTest.steps.length

    // The manually emitted step should not appear in the main test trace
    const stepNames = currentTest.steps.map(step => step.name)
    expect(stepNames).to.not.include('optionalAction')

    return recorder.promise()
  })

  it('should exclude steps emitted during hopeThat sessions from main test trace', async () => {
    await hopeThat(() => {
      const hopeThatStep = new Step({ softAssertion: () => 'done' }, 'softAssertion')
      event.emit(event.step.started, hopeThatStep)
    })

    // The manually emitted step should not appear in the main test trace
    const stepNames = currentTest.steps.map(step => step.name)
    expect(stepNames).to.not.include('softAssertion')

    return recorder.promise()
  })

  it('should still allow regular steps to be added normally', () => {
    // Regular steps outside of special sessions should work normally
    const regularStep = new Step({ normalAction: () => 'done' }, 'normalAction')
    event.emit(event.step.started, regularStep)

    const stepNames = currentTest.steps.map(step => step.name)
    expect(stepNames).to.include('normalAction')
  })

  it('should validate the session filtering logic works correctly', async () => {
    // This test validates that the core logic in the fix is working

    // Add a regular step
    const regularStep = new Step({ regularAction: () => 'done' }, 'regularAction')
    event.emit(event.step.started, regularStep)

    // Execute tryTo and verify the filtering works
    await tryTo(() => {
      const filteredStep = new Step({ filteredAction: () => 'done' }, 'filteredAction')
      event.emit(event.step.started, filteredStep)
    })

    // Add another regular step
    const anotherRegularStep = new Step({ anotherRegularAction: () => 'done' }, 'anotherRegularAction')
    event.emit(event.step.started, anotherRegularStep)

    const stepNames = currentTest.steps.map(step => step.name)

    // Regular steps should be present
    expect(stepNames).to.include('regularAction')
    expect(stepNames).to.include('anotherRegularAction')

    // Filtered step should not be present
    expect(stepNames).to.not.include('filteredAction')

    return recorder.promise()
  })
})
