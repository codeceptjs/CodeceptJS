// @TODO: Need tests arguments of protected methods

class CustomClass extends Helper {
  constructor(config: any) {
    super(
      config // $ExpectType any
    )
    this.helpers // $ExpectType any
    this.debug() // $ExpectError
    this.debugSection() // $ExpectError
    this.debugSection('[Section]') // $ExpectError

    this.debug('log') // $ExpectType void
    this.debugSection('[Section]', 'log') // $ExpectType void
  }
  _failed() {} // $ExpectType () => void
  _finishTest() {} // $ExpectType () => void
  _init() {} // $ExpectType () => void
  _passed() {} // $ExpectType () => void
  _setConfig() {} // $ExpectType () => void
  _useTo() {} // $ExpectType () => void
  _validateConfig() {} // $ExpectType () => void
  _before() {} // $ExpectType () => void
  _beforeStep() {} // $ExpectType () => void
  _beforeSuite() {} // $ExpectType () => void
  _after() {} // $ExpectType () => void
  _afterStep() {} // $ExpectType () => void
  _afterSuite() {} // $ExpectType () => void
}

const customClass = new Helper({})

customClass._failed() // $ExpectError
customClass._finishTest() // $ExpectError
customClass._init() // $ExpectError
customClass._passed() // $ExpectError
customClass._setConfig() // $ExpectError
customClass._validateConfig() // $ExpectError
customClass._before() // $ExpectError
customClass._beforeStep() // $ExpectError
customClass._beforeSuite() // $ExpectError
customClass._after() // $ExpectError
customClass._afterStep() // $ExpectError
customClass._afterSuite() // $ExpectError

customClass._useTo() // $ExpectType void
