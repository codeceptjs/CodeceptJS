const { I } = inject();

class Base {
  async type(s) {
    await I.printMessage(s);
  }
}

class PageObject extends Base {
  constructor() {
    super();
    this.user = 'User1';
    this.method1 = () => { console.log(123); };
  }

  purgeDomains() {
    console.log('user =>', this.user);
    I.printMessage('purgeDomains');
  }
}

module.exports = new PageObject();
