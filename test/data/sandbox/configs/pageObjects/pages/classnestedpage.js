const { I } = inject();

class Base {
  async type(s) {
    await I.printMessage(s);
  }
}

class PageObject extends Base {
  constructor() {
    super();
    this.method1 = () => { console.log(123); };
  }

  purgeDomains() {
    I.printMessage('purgeDomains');
  }
}

module.exports = new PageObject();
