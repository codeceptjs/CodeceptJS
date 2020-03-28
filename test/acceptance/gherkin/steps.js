const I = actor();


Given('I opened website', () => {
  // From "gherkin/basic.feature" {"line":8,"column":5}
  I.amOnPage('/');
});

When('go to {string} page', (url) => {
  // From "gherkin/basic.feature" {"line":9,"column":5}
  I.amOnPage(url);
  I.seeInCurrentUrl(url);
});

Then('I should see {string}', (str) => {
  // From "gherkin/basic.feature" {"line":10,"column":5}
  I.see(str);
});

Given('I opened {string} website', (website) => {
  I.amOnPage(website);
});

Then('I should be able to fill the value in Hello Binding Shadow Input Element', (website) => {
  I.fillField({ shadow: ['my-app', 'recipe-hello-binding', 'ui-input', 'input.input'] }, 'value');
});
