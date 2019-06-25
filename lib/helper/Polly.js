const Helper = require('../helper');
const requireg = require('requireg');

let PollyJS;

class Polly extends Helper {
  constructor() {
    super();
    PollyJS = requireg('@pollyjs/core');
  }

  static _checkRequirements() {
    try {
      requireg('@pollyjs/core');
    } catch (e) {
      return ['@pollyjs/core@^2.5.0'];
    }
  }

  async _setupForPuppeteer(adapter) {
    if (!PollyJS) {
      throw new Error('Polly is not initialized properly!');
    }

    console.log('value of this.helpers => ', this.helpers);
    const { page } = this.helpers.Puppeteer;
    await page.setRequestInterception(true);
    PollyJS.register(adapter);

    return new PollyJS('Test', {
      adapters: ['puppeteer'],
      adapterOptions: {
        puppeteer: { page },
      },
    });
  }
}

module.exports = Polly;
