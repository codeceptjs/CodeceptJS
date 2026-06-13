import HelperModule from '../../../lib/helper.js'
const Helper = HelperModule.default || HelperModule

class EffectsHelper extends Helper {
  constructor(config) {
    super(config)
    this._withinActive = false
    this._tries = 0
  }

  _withinBegin() {
    this._withinActive = true
  }

  _withinEnd() {
    this._withinActive = false
  }

  seeMissing() {
    throw new Error('element not found')
  }

  clickInside() {
    console.log(`EFFECTS_CLICK withinActive=${this._withinActive}`)
  }

  pass() {
    console.log('EFFECTS_PASS ran')
  }

  flaky() {
    this._tries++
    console.log(`EFFECTS_FLAKY try=${this._tries}`)
    if (this._tries < 2) throw new Error('not ready yet')
  }
}

export default EffectsHelper
