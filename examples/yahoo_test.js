Feature('Yahoo test');

Scenario('Nightmare basic test', { timeout: 3 }, ({ I }) => {
  I.amOnPage('http://yahoo.com');
  I.fillField('p', 'github nightmare');
  I.click('Search');
  I.waitForElement('#main', 2);
  I.seeElement('#main .searchCenterMiddle li a');
  // I.seeElement("//a[contains(@href,'github.com/segmentio/nightmare')]");
  I.see('segmentio/nightmare', 'li a');
});

// Our implementation of:

// nightmare
//   .goto('http://yahoo.com')
//   .type('form[action*="/search"] [name=p]', 'github nightmare')
//   .click('form[action*="/search"] [type=submit]')
//   .wait('#main')
//   .evaluate(function () {
//     return document.querySelector('#main .searchCenterMiddle li a').href
//   })
//   .end()
//   .then(function (result) {
//     console.log(result)
//   })
//   .catch(function (error) {
//     console.error('Search failed:', error);
//   });
