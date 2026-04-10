const { I } = inject()

class HookPage {
  _before() {
    I.printMessage('HookPage._before called')
  }

  _after() {
    I.printMessage('HookPage._after called')
  }

  _afterSuite() {
    I.printMessage('HookPage._afterSuite called')
  }

  doSomething() {
    I.printMessage('HookPage action')
  }
}

export default HookPage
