const Step = require('./base')
const event = require('../event')
const { humanizeString } = require('../utils')

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
    if (this.actor && this.actor.match && this.actor.match(/^(Given|When|Then|And)/)) {
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
      return `${this.prefix}${actorText} ${this.name} "${this.humanizeArgs()}${this.suffix}"`
    }

    if (actorText === 'I') {
      return `${this.prefix}${actorText} ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`
    }

    if (!this.actor) {
      return `${this.name} ${this.humanizeArgs()}${this.suffix}`.trim()
    }

    return `On ${this.prefix}${actorText}: ${this.humanize()} ${this.humanizeArgs()}${this.suffix}`.trim()
  }

  humanize() {
    return humanizeString(this.name)
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

    const registerStep = step => {
      this.setMetaStep(null)
      step.setMetaStep(this)
    }
    event.dispatcher.prependListener(event.step.before, registerStep)
    // Handle async and sync methods.
    if (fn.constructor.name === 'AsyncFunction') {
      result = fn
        .apply(this.context, this.args)
        .then(result => {
          return result
        })
        .catch(error => {
          this.setStatus('failed')
          throw error
        })
        .finally(() => {
          this.endTime = Date.now()
          event.dispatcher.removeListener(event.step.before, registerStep)
        })
    } else {
      try {
        this.startTime = Date.now()
        result = fn.apply(this.context, this.args)
      } catch (error) {
        this.setStatus('failed')
        throw error
      } finally {
        this.endTime = Date.now()
        event.dispatcher.removeListener(event.step.before, registerStep)
      }
    }

    return result
  }
}

module.exports = MetaStep
