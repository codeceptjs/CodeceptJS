const { I } = inject()

class NoHookPage {
  doAction() {
    I.printMessage('NoHookPage action')
  }
}

export default NoHookPage
