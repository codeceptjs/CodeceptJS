const { I } = inject();

class PageObject {
  constructor() {
    this.method1 = () => { console.log(123); };
  }

  async type(s) {
    await I.printMessage(s);
  }

  purgeDomains() {
    I.printMessage('purgeDomains');
  }
}

export default new PageObject();
