class PageObject {
  constructor() {
    this.method1 = () => {
      console.log(123)
    }
  }

  async type(s) {
    const { I } = inject()
    await I.printMessage(s)
  }

  purgeDomains() {
    const { I } = inject()
    I.printMessage('purgeDomains')
  }
}

export default new PageObject()
