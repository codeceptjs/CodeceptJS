const assert = require('assert');

Feature('Session');

Scenario('simple session @WebDriverIO @Protractor @Puppeteer @Playwright', (I) => {
  I.amOnPage('/info');
  session('john', () => {
    I.amOnPage('https://github.com');
    I.dontSeeInCurrentUrl('/info');
    I.see('GitHub');
  });
  I.dontSee('GitHub');
  I.seeInCurrentUrl('/info');
});

Scenario('screenshots reflect the current page of current session @Puppeteer @Playwright', async (I) => {
  const outputPath = await I.getOutputPath();

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
    `${outputPath}/session_default_1.png`,
    `${outputPath}/session_default_2.png`,
    `${outputPath}/session_john_1.png`,
    `${outputPath}/session_john_2.png`,
  ]);

  // Assert that screenshots of same page in same session are equal
  assert.equal(default1Digest, default2Digest);
  assert.equal(john1Digest, john2Digest);

  // Assert that screenshots of different pages in different sessions are not equal
  assert.notEqual(default1Digest, john1Digest);
});

Scenario('Different cookies for different sessions @WebDriverIO @Protractor @Playwright @Puppeteer', async (I) => {
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

Scenario('should throw exception and close correctly @WebDriverIO @Protractor @Puppeteer @Playwright', (I) => {
  I.amOnPage('/form/bug1467#session1');
  I.checkOption('Yes');
  session('john', () => {
    I.amOnPage('/form/bug1467#session2');
    I.checkOption('No1');
    I.seeCheckboxIsChecked({ css: 'input[value=No]' });
  });
  I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
}).fails();

Scenario('async/await @WebDriverIO @Protractor', (I) => {
  I.amOnPage('/form/bug1467#session1');
  I.checkOption('Yes');
  session('john', async () => {
    I.amOnPage('/form/bug1467#session2');
    I.checkOption('No');
    I.seeCheckboxIsChecked({ css: 'input[value=No]' });
  });
  I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
});

Scenario('exception on async/await @WebDriverIO @Protractor @Puppeteer @Playwright', (I) => {
  I.amOnPage('/form/bug1467#session1');
  I.checkOption('Yes');
  session('john', async () => {
    I.amOnPage('/form/bug1467#session2');
    I.checkOption('No');
    I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
  });
  I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
}).throws(/to be checked/);

Scenario('should work with within @WebDriverIO @Protractor @Puppeteer @Playwright', (I) => {
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

xScenario('should use different base URL @Protractor @Puppeteer @Playwright', (I) => { // nah, that's broken
  I.amOnPage('/');
  I.see('Welcome to test app');
  session('john', { url: 'https://github.com' }, () => {
    I.amOnPage('/');
    I.dontSee('Welcome to test app');
    I.see('GitHub');
  });
  I.see('Welcome to test app');
});

xScenario('should start firefox', async (I) => { // requires firefox :)
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

Scenario('should return a value in @WebDriverIO @Protractor @Puppeteer @Playwright', async (I) => {
  I.amOnPage('/form/textarea');
  const val = await session('john', () => {
    I.amOnPage('/info');
    return I.grabTextFrom({ css: 'h1' });
  });
  I.fillField('Description', val);
  I.click('Submit');
  I.see('[description] => Information');
});


Scenario('should return a value @WebDriverIO @Protractor @Puppeteer @Playwright in async', async (I) => {
  I.amOnPage('/form/textarea');
  const val = await session('john', async () => {
    I.amOnPage('/info');
    return I.grabTextFrom({ css: 'h1' });
  });
  I.fillField('Description', val);
  I.click('Submit');
  I.see('[description] => Information');
});
