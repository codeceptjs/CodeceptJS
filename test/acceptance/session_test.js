const chai = require('chai');

const expect = chai.expect;

Feature('Session');

Scenario('simple session @WebDriverIO @Protractor', (I) => {
  I.amOnPage('/info');
  session('john', () => {
    I.amOnPage('https://github.com');
    I.dontSeeInCurrentUrl('/info');
    I.see('GitHub');
  });
  I.dontSee('GitHub');
  I.seeInCurrentUrl('/info');
});

Scenario('Different cookies for different sessions @WebDriverIO @Protractor', async (I) => {
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
  expect(cookies.default).to.be.ok;
  expect(cookies.john).to.be.ok;
  expect(cookies.mary).to.be.ok;
  expect(cookies.default).to.not.equal(cookies.john);
  expect(cookies.default).to.not.equal(cookies.mary);
  expect(cookies.john).to.not.equal(cookies.mary);
});

Scenario('should throw exception and close correctly @WebDriverIO @Protractor', (I) => {
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

Scenario('exception on async/await @WebDriverIO @Protractor', (I) => {
  I.amOnPage('/form/bug1467#session1');
  I.checkOption('Yes');
  session('john', async () => {
    I.amOnPage('/form/bug1467#session2');
    I.checkOption('No');
    I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
  });
  I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
}).throws(/to be checked/);

Scenario('should work with within @WebDriverIO @Protractor', (I) => {
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

Scenario('should use different base URL @WebDriverIO @Protractor', (I) => {
  I.amOnPage('/');
  I.see('Welcome to test app');
  session('john', { url: 'https://github.com' }, () => {
    I.amOnPage('/');
    I.dontSee('Welcome to test app');
    I.see('GitHub');
  });
  I.see('Welcome to test app');
});

Scenario('should start firefox @WebDriverIO', async (I) => {
  I.amOnPage('/form/bug1467#session1');
  I.checkOption('Yes');
  session('john', { browser: 'firefox' }, async () => {
    I.amOnPage('/form/bug1467#session2');
    I.checkOption('No');
    I.seeCheckboxIsChecked({ css: 'input[value=No]' });
    const isChrome = await I.executeScript(() => !!window.chrome);
    expect(isChrome).not.to.be.ok;
  });
  I.seeCheckboxIsChecked({ css: 'input[value=Yes]' });
  const isChrome = await I.executeScript(() => !!window.chrome);
  expect(isChrome).to.be.ok;
});
