Feature('Bench');

Scenario('01 navigate home and read text', ({ I }) => {
  I.amOnPage('/');
  I.see('Welcome to test app');
  I.dontSee('NoSuchTextXYZ123');
});

Scenario('02 click by link text navigates', ({ I }) => {
  I.amOnPage('/');
  I.click('More info');
  I.seeInCurrentUrl('/info');
  I.see('Information');
});

Scenario('03 click by css navigates', ({ I }) => {
  I.amOnPage('/');
  I.click('#link');
  I.seeInCurrentUrl('/info');
});

Scenario('04 fill and submit login form', ({ I }) => {
  I.amOnPage('/login');
  I.fillField('#email', 'user@example.com');
  I.fillField('#password', 'secret123');
  I.click('Sign In');
  I.seeInCurrentUrl('/login');
});

Scenario('05 fill a two-field form and submit', ({ I }) => {
  I.amOnPage('/form/example1');
  I.fillField('#LoginForm_username', 'demo');
  I.fillField('#LoginForm_password', 'demo');
  I.click('Login');
  I.see('I am here!!!');
});

Scenario('06 click a non-navigating checkbox', ({ I }) => {
  I.amOnPage('/form/checkbox');
  I.click('#checkin');
  I.see('ticked');
});

Scenario('07 submit a button form', ({ I }) => {
  I.amOnPage('/form/button');
  I.click('Submit');
  I.see('Thank you!');
});

Scenario('08 repeated navigation', ({ I }) => {
  I.amOnPage('/');
  I.amOnPage('/info');
  I.amOnPage('/');
  I.see('Welcome to test app');
});

Scenario('09 click a non-navigating element twice', ({ I }) => {
  I.amOnPage('/form/checkbox');
  I.click('#checkin');
  I.click('#checkin');
  I.see('ticked');
});

Scenario('10 short explicit wait', ({ I }) => {
  I.amOnPage('/');
  I.wait(0.3);
  I.see('Welcome to test app');
});
