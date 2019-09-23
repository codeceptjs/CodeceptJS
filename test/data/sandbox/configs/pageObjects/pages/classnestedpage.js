class Base {
  type(s) {
    console.log(s);
  }
}

class PageObject extends Base {
  constructor() {
    super();
    this.method1 = () => { console.log(123); };
  }

  purgeDomains(s) {
    console.log('purgeDomains');
    console.log(s);
  }
}

module.exports = new PageObject();
