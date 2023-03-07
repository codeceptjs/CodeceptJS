const { event, recorder } = hermiona;

const { page } = inject();

class PagesStore {
  constructor() {
    this.domainIds = [];
    event.dispatcher.on(event.test.after, () => {
      recorder.add('hook', async () => {
        await this._after();
      });
    });
  }

  async _after() {
    console.log(this.domainIds);
    console.log(page);
    if (this.domainIds.length > 0) {
      await page.purgeDomains({ ids: this.domainIds });
      this.domainIds = [];
    }
  }
}

module.exports = new PagesStore();
