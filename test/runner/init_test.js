const { DOWN, ENTER } = require('inquirer-test');
const run = require('inquirer-test');
const path = require('path');

const runner = path.join(__dirname, '../../bin/codecept.js');

describe('Init Command', function () {
  this.timeout(20000);
  // this.retries(4);

  it('init - welcome message', async () => {
    const result = await run([runner, 'init'], []);
    result.should.include('Welcome to CodeceptJS initialization tool');
    result.should.include('It will prepare and configure a test environment for you');
    result.should.include('Installing to');
  });

  it('init - Do you plan to write tests in TypeScript?', async () => {
    const result = await run([runner, 'init'], []);
    result.should.include('? Do you plan to write tests in TypeScript? (y/N)');
  });

  it('init - TypeScript and Promise Based', async () => {
    const result = await run([runner, 'init'], ['Y', ENTER, ENTER, DOWN, DOWN, DOWN, ENTER, ENTER, 'y']);
    result.should.include('? Do you plan to write tests in TypeScript? (y/N)');
    result.should.include('promise-based typings');
    result.should.include('(y/N) y');
  });

  it('init - Where are your tests located?', async () => {
    const result = await run([runner, 'init'], ['Y']);
    result.should.include('? Where are your tests located? (./*_test.ts)');
  });

  it('init - What helpers do you want to use? (Use arrow keys)?', async () => {
    const result = await run([runner, 'init'], ['Y', ENTER, ENTER]);
    result.should.include('? What helpers do you want to use? (Use arrow keys)');
    for (const item of ['Playwright', 'WebDriver', 'Puppeteer', 'REST', 'GraphQL', 'Appium', 'TestCafe']) {
      result.should.include(item);
    }
    result.should.include('(Move up and down to reveal more choices)');
  });

  it('init - Where should logs, screenshots, and reports to be stored? (./output)', async () => {
    const result = await run([runner, 'init'], [ENTER, ENTER, DOWN, DOWN, DOWN, ENTER, ENTER]);
    result.should.include('? What helpers do you want to use? REST');
    result.should.include('Where should logs, screenshots, and reports to be stored? (./output)');
  });

  it('init - Do you want to enable localization for tests?', async () => {
    const result = await run([runner, 'init'], [ENTER, ENTER, DOWN, DOWN, DOWN, ENTER, ENTER, ENTER]);
    result.should.include('? Do you want to enable localization for tests?');
    result.should.include('❯ English (no localization)');
    for (const item of ['de-DE', 'it-IT', 'fr-FR', 'ja-JP', 'pl-PL', 'pt-BR']) {
      result.should.include(item);
    }
    result.should.include('(Move up and down to reveal more choices)');
  });

  it('init - [REST] Endpoint of API you are going to test (http://localhost:3000/api)', async () => {
    const result = await run([runner, 'init'], [ENTER, ENTER, DOWN, DOWN, DOWN, ENTER, ENTER, ENTER, ENTER]);
    result.should.include('Do you want to enable localization for tests? http://bit.ly/3GNUBbh Eng');
    result.should.include('Configure helpers...');
    result.should.include('? [REST] Endpoint of API you are going to test (http://localhost:3000/api)');
  });
});
