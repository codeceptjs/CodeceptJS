import Step from './base.js'
import event from '../event.js'
import { humanizeString } from '../utils.js'

class MetaStep extends Step {
  constructor(actor, method) {
    if (!method) method = ''
    super(method)

    /** @member {boolean} collsapsed hide children steps from output */
    this.collapsed = false

    this.actor = actor
  }

  /** @return {boolean} */
  isBDD() {
    if (this.actor && this.actor.match && this.actor.match(/^(Given|When|Then|And|But)/)) {
      return true
    }
    return false
  }

  toCliStyled() {
    return this.toString()
  }

  toString() {
    const actorText = this.actor

    if (this.isBDD()) {
      return `${this.prefix}${actorText} ${this.title} "${this.humanizeArgs()}${this.suffix}"`
    }

    if (actorText === 'I') {
      return `${this.prefix}${actorText} ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`
    }

    if (!this.actor) {
      return `${this.title} ${this.humanizeArgs()}${this.suffix}`.trim()
    }

    return `On ${this.prefix}${actorText}: ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`.trim()
  }

  humanize() {
    return humanizeString(this.title)
  }

  setTrace() {}

  setContext(context) {
    this.context = context
  }

  /** @return {*} */
  run(fn) {
    this.status = 'queued'
    this.setArguments(Array.from(arguments).slice(1))
    let result
    let hasChildSteps = false

    const registerStep = step => {
      this.setMetaStep(null)
      step.setMetaStep(this)
      hasChildSteps = true
    }
    event.dispatcher.prependListener(event.step.before, registerStep)

    // Start timing
    this.startTime = Date.now()

    // Handle async and sync methods.
    if (fn.constructor.name === 'AsyncFunction') {
      result = fn
        .apply(this.context, this.args)
        .then(result => {
          this.setStatus('success')
          return result
        })
        .catch(error => {
          this.setStatus('failed')
          throw error
        })
        .finally(() => {
          this.endTime = Date.now()
          event.dispatcher.removeListener(event.step.before, registerStep)
          // Only emit events if no child steps were registered
          if (!hasChildSteps) {
            event.emit(event.step.started, this)
            event.emit(event.step.finished, this)
          }
        })
    } else {
      try {
        result = fn.apply(this.context, this.args)
        this.setStatus('success')
      } catch (error) {
        this.setStatus('failed')
        throw error
      } finally {
        this.endTime = Date.now()
        event.dispatcher.removeListener(event.step.before, registerStep)
        // Only emit events if no child steps were registered
        if (!hasChildSteps) {
          event.emit(event.step.started, this)
          event.emit(event.step.finished, this)
        }
      }
    }

    return result
  }
}

export default MetaStep
