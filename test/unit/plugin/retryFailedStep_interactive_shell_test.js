import assert from 'assert'
import event from '../../../lib/event.js'
import retryFailedStep from '../../../lib/plugin/retryFailedStep.js'

describe('retryFailedStep plugin (interactive shell regression)', () => {
  beforeEach(() => {
    // Remove all listeners to avoid side effects
    event.cleanDispatcher()
    // Re-register plugin
    retryFailedStep({ enabled: true })
  })

  it('should not throw when test.before is emitted without opts (interactive shell)', () => {
    // Simulate the event as emitted by the interactive shell (no opts)
    assert.doesNotThrow(() => {
      event.dispatcher.emit(event.test.before, { title: 'Interactive', artifacts: {} })
    })
  })

  it('should not throw when test.before is emitted with opts', () => {
    assert.doesNotThrow(() => {
      event.dispatcher.emit(event.test.before, { title: 'Normal', artifacts: {}, opts: {} })
    })
  })
})
