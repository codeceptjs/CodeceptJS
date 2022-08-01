const { I } = inject();

class DummyPage {
  constructor() {
    this.pageUrl = '/dummy-page';
  }
}

module.exports = { default: DummyPage };
