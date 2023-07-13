const assert = require('assert');

const { event } = codeceptjs;

Feature('Session');

Scenario('simple session @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/info');
  session('john', () => {
    I.amOnPage('https://github.com');
    I.dontSeeInCurrentUrl('/info');
    I.see('GitHub');
  });
  I.dontSee('GitHub');
  I.seeInCurrentUrl('/info');
});

Scenario('screenshots reflect the current page of current session @Puppeteer @Playwright @WebDriver', async ({ I }) => {
  I.amOnPage('/');
  I.saveScreenshot('session_default_1.png');

  session('john', () => {
    I.amOnPage('/info');
    I.saveScreenshot('session_john_1.png');
  });

  I.saveScreenshot('session_default_2.png');

  session('john', () => {
    I.saveScreenshot('session_john_2.png');
  });

  const [default1Digest, default2Digest, john1Digest, john2Digest] = await I.getMD5Digests([
    `${output_dir}/session_default_1.png`,
    `${output_dir}/session_default_2.png`,
    `${output_dir}/session_john_1.png`,
    `${output_dir}/session_john_2.png`,
  ]);

  // Assert that screenshots of same page in same session are equal
  assert.equal(default1Digest, default2Digest);
  assert.equal(john1Digest, john2Digest);

  // Assert that screenshots of different pages in different sessions are not equal
  assert.notEqual(default1Digest, john1Digest);
});

Scenario('Different cookies for different sessions @WebDriverIO @Playwright @Puppeteer', async ({ I }) => {
  const cookiePage = 'https://www.microsoft.com/en-au/';
  const cookieName = 'MUID';
  const cookies = {};

  I.amOnPage(cookiePage);
  session('john', () => {
    I.amOnPage(cookiePage);
  });
  session('mary', () => {
    I.amOnPage(cookiePage);
  });

  cookies.default = (await I.grabCookie(cookieName)).value;
  I.say(`${cookieName}: ${cookies.default}`);
  session('john', async () => {
    cookies.john = (await I.grabCookie(cookieName)).value;
    I.say(`${cookieName}: ${cookies.john}`);
  });
  session('mary', async () => {
    cookies.mary = (await I.grabCookie(cookieName)).value;
    I.say(`${cookieName}: ${cookies.mary}`);
  });
  await I.seeInCurrentUrl('en-au');
  assert(cookies.default);
  assert(cookies.john);
  assert(cookies.mary);
  assert.notEqual(cookies.default, cookies.john);
  assert.notEqual(cookies.default, cookies.mary);
  assert.notEqual(cookies.john, cookies.mary);
});

Scenario('should save screenshot for active session @WebDriverIO @Puppeteer @Playwright', async function ({ I }) {
  I.amOnPage('/form/bug1467');
  I.saveScreenshot('original.png');
  I.amOnPage('/');
  session('john', async () => {
    await I.amOnPage('/form/bug1467');
    event.dispatcher.emit(event.test.failed, this);
  });

  const fileName = clearString(this.title);

  const [original, failed] = await I.getMD5Digests([
    `${output_dir}/original.png`,
    `${output_dir}/${fileName}.failed.png`,
  ]);

  // Assert that screenshots of same page in same session are equal
  assert.equal(original, failed);
});

Scenario('should throw exception and close correctly @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/form/bug1467#session1');
  I.checkOption('Yes');
  session('john', () => {
    I.amOnPage('/form/bug1467#session2');
    I.checkOption('No1');
    I.seeCheckboxIsChecked({ css: 'input[value=No]' });
  });
  I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
  I.amOnPage('/info');
}).fails();

Scenario('async/await @WebDriverIO', ({ I }) => {
  I.amOnPage('/form/bug1467#session1');
  I.checkOption('Yes');
  session('john', async () => {
    I.amOnPage('/form/bug1467#session2');
    I.checkOption('No');
    I.seeCheckboxIsChecked({ css: 'input[value=No]' });
  });
  I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
});

Scenario('exception on async/await @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/form/bug1467#session1');
  I.checkOption('Yes');
  session('john', async () => {
    I.amOnPage('/form/bug1467#session2');
    I.checkOption('No');
    I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
  });
  I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
}).throws(/to be checked/);

Scenario('should work with within @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/form/bug1467');
  session('john', () => {
    I.amOnPage('/form/bug1467');
    within({ css: '[name=form1]' }, () => {
      I.checkOption('Yes');
      I.seeCheckboxIsChecked({ css: 'input[name=first_test_radio]' });
    });
  });
  within({ css: '[name=form2]' }, () => {
    I.checkOption('Yes');
    I.seeCheckboxIsChecked({ css: 'input[name=first_test_radio]' });
  });
  I.seeCheckboxIsChecked({ css: 'form[name=form2] input[name=first_test_radio]' });
  I.dontSeeCheckboxIsChecked({ css: 'form[name=form1] input[name=first_test_radio]' });
  session('john', () => {
    I.seeCheckboxIsChecked({ css: 'form[name=form1] input[name=first_test_radio]' });
    I.dontSeeCheckboxIsChecked({ css: 'form[name=form2] input[name=first_test_radio]' });
  });
});

Scenario('change page emulation @Playwright', async ({ I }) => {
  const assert = require('assert');
  I.amOnPage('/');
  session('mobile user', {
    viewport: { width: 300, height: 500 },
  }, async () => {
    I.amOnPage('/');
    const width = await I.executeScript('window.innerWidth');
    assert.equal(width, 300);
  });
});

Scenario('emulate iPhone @Playwright', async ({ I }) => {
  const { devices } = require('playwright');
  if (process.env.BROWSER === 'firefox') return;
  const assert = require('assert');
  I.amOnPage('/');
  session('mobile user', devices['iPhone 6'], async () => {
    I.amOnPage('/');
    const width = await I.executeScript('window.innerWidth');
    assert.ok(width > 950 && width < 1000);
  });
});

xScenario('should use different base URL @Puppeteer @Playwright', ({ I }) => { // nah, that's broken
  I.amOnPage('/');
  I.see('Welcome to test app');
  session('john', { url: 'https://github.com' }, () => {
    I.amOnPage('/');
    I.dontSee('Welcome to test app');
    I.see('GitHub');
  });
  I.see('Welcome to test app');
});

xScenario('should start firefox', async ({ I }) => { // requires firefox :)
  I.amOnPage('/form/bug1467#session1');
  I.checkOption('Yes');
  session('john', { browser: 'firefox' }, async () => {
    I.amOnPage('/form/bug1467#session2');
    I.checkOption('No');
    I.seeCheckboxIsChecked({ css: 'input[value=No]' });
    const isChrome = await I.executeScript(() => !!window.chrome);
    assert(!isChrome);
  });
  I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
  const isChrome = await I.executeScript(() => !!window.chrome);
  assert(isChrome);
});

Scenario('should return a value in @WebDriverIO @Puppeteer @Playwright', async ({ I }) => {
  I.amOnPage('/form/textarea');
  const val = await session('john', () => {
    I.amOnPage('/info');
    return I.grabTextFrom({ css: 'h1' });
  });
  I.fillField('Description', val);
  I.click('Submit');
  I.see('[description] => Information');
});

Scenario('should return a value @WebDriverIO @Puppeteer @Playwright in async', async ({ I }) => {
  I.amOnPage('/form/textarea');
  const val = await session('john', async () => {
    I.amOnPage('/info');
    return I.grabTextFrom({ css: 'h1' });
  });
  I.fillField('Description', val);
  I.click('Submit');
  I.see('[description] => Information');
});

function clearString(str) {
  if (!str) return '';
  /* Replace forbidden symbols in string
     */
  return str
    .replace(/ /g, '_');
}
