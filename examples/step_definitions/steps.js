const assert = require('assert');
const Smth = require('../pages/Smth');

const I = actor();
// Add in your custom step files

Given('I have a defined step', () => {
  // TODO: replace with your own step
  I.amOnPage('https://google.com');
});

Given('Open google', () => {
  // From "features\lawPage.feature" {"line":72,"column":7}
  I.amOnPage('https://www.google.ru/webhp?hl=ru&sa=X&ved=0ahUKEwjY7rWfrPjbAhUHFiwKHas5DCMQPAgD');
});

Given('I open GitHub', () => {
  Smth.openGitHub();
  I.dontSee('Ups');
});

Then('check link', async () => {
  // From "features\lawPage.feature" {"line":73,"column":7}
  const link = await I.grabAttributeFrom({ css: '#gbw > div > div > div.gb_qe.gb_R.gb_Pg.gb_Fg > div:nth-child(2) > a' }, 'href');
  const response = await I.sendGetRequest(link);
  assert(response.statusCode === 200);
  I.see('Google');
});
