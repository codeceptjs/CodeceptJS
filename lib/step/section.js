const MetaStep = require('./meta')
const event = require('../event')

let currentSection

class Section {
  constructor(name = '') {
    this.name = name

    this.metaStep = new MetaStep(null, name)

    this.attachMetaStep = step => {
      if (currentSection !== this) return
      if (!step) return
      const metaStep = getRootMetaStep(step)

      if (metaStep !== this.metaStep) {
        metaStep.metaStep = this.metaStep
      }
    }
  }

  hidden() {
    this.metaStep.collapsed = true
    return this
  }

  start() {
    if (currentSection) currentSection.end()
    currentSection = this
    event.dispatcher.prependListener(event.step.before, this.attachMetaStep)
    event.dispatcher.once(event.test.finished, () => this.end())
    return this
  }

  end() {
    currentSection = null
    event.dispatcher.off(event.step.started, this.attachMetaStep)
    return this
  }

  /**
   * @returns {Section}
   */
  static current() {
    return currentSection
  }
}

function getRootMetaStep(step) {
  if (step.metaStep) return getRootMetaStep(step.metaStep)
  return step
}

module.exports = Section
