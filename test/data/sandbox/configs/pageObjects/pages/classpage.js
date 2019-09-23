class PageObject {
  constructor() {
    this.method1 = () => { console.log(123); };
  }

  type(s) {
    console.log(s);
  }

  purgeDomains(s) {
    console.log('purgeDomains');
    console.log(s);
  }
}

module.exports = new PageObject();
