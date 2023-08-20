Feature('within', { retries: 3 });

Scenario('within on form @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/form/bug1467');
  I.see('TEST TEST');
  within({ css: '[name=form2]' }, async () => {
    await I.checkOption('Yes');
    await I.seeCheckboxIsChecked({ css: 'input[name=first_test_radio]' });
  });
  I.seeCheckboxIsChecked({ css: 'form[name=form2] input[name=first_test_radio]' });
  I.dontSeeCheckboxIsChecked({ css: 'form[name=form1] input[name=first_test_radio]' });
});

Scenario('switch iframe manually @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/iframe');

  I.switchTo('iframe');
  I.fillField('rus', 'Updated');
  I.click('Sign in!');
  I.waitForText('Email Address');

  I.switchTo();
  I.see('Iframe test');
  I.dontSee('Email Address');
});

Scenario('within on iframe @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/iframe');
  within({ frame: 'iframe' }, async () => {
    await I.fillField('rus', 'Updated');
    await I.click('Sign in!');
    await I.waitForText('Email Address');
  });
  I.see('Iframe test');
  I.dontSee('Email Address');
});

Scenario('within on iframe without iframe navigation @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/iframe');
  within({ frame: 'iframe' }, async () => {
    await I.fillField('rus', 'Updated');
    await I.see('Sign in!');
  });
  I.see('Iframe test');
  I.dontSee('Sign in!');
});

Scenario('within on nested iframe without iframe navigation depth 2 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/iframe_nested');
  within({ frame: ['[name=wrapper]', '[name=content]'] }, async () => {
    await I.fillField('rus', 'Updated');
    await I.see('Sign in!');
  });
  I.see('Nested Iframe test');
  I.dontSee('Sign in!');
});

Scenario('within on nested iframe depth 1 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/iframe');
  within({ frame: ['[name=content]'] }, async () => {
    await I.fillField('rus', 'Updated');
    await I.click('Sign in!');
    await I.waitForText('Email Address');
  });
  I.see('Iframe test');
  I.dontSee('Email Address');
});

Scenario('within on nested iframe depth 2 @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/iframe_nested');
  within({ frame: ['[name=wrapper]', '[name=content]'] }, async () => {
    await I.fillField('rus', 'Updated');
    await I.click('Sign in!');
    await I.see('Email Address');
  });
  I.see('Nested Iframe test');
  I.dontSee('Email Address');
});

Scenario('within on nested iframe depth 2 and mixed id and xpath selector @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/iframe_nested');
  within({ frame: ['#wrapperId', '[name=content]'] }, async () => {
    await I.fillField('rus', 'Updated');
    await I.click('Sign in!');
    await I.see('Email Address');
  });
  I.see('Nested Iframe test');
  I.dontSee('Email Address');
});

Scenario('within on nested iframe depth 2 and mixed class and xpath selector @WebDriverIO @Puppeteer @Playwright', ({ I }) => {
  I.amOnPage('/iframe_nested');
  within({ frame: ['.wrapperClass', '[name=content]'] }, async () => {
    await I.fillField('rus', 'Updated');
    await I.click('Sign in!');
    await I.see('Email Address');
  });
  I.see('Nested Iframe test');
  I.dontSee('Email Address');
});

Scenario('should throw exception if element not found @WebDriverIO @Puppeteer @Playwright', async ({ I }) => {
  I.amOnPage('/form/textarea');
  within('#grab-multiple', async () => {
    return I.grabTextFrom('#first-link');
  });
}).throws(/found/);

Scenario('should return a value @WebDriverIO @Puppeteer @Playwright', async ({ I }) => {
  I.amOnPage('/info');
  const val = await within('#grab-multiple', () => {
    return I.grabTextFrom('#first-link');
  });
  I.fillField('rus', val);
  I.pressKey('Enter');
  I.see('[rus] => First');
}).retry(0);
