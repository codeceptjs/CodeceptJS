// / <reference path="./steps.d.ts" />
Feature('GitHub');

Before((Smth) => {
  Smth.openGitHub();
});

Scenario('Visit Home Page @retry', (I) => {
  // .retry({ retries: 3, minTimeout: 1000 })
  I.retry(2).see('GitHub');
  I.retry(3).see('ALL');
  I.retry(2).see('IMAGES');
});

Scenario('search @grop', (I) => {
  I.amOnPage('https://github.com/search');
  I.fillField('Search GitHub', 'CodeceptJS');
  I.pressKey('Enter');
  I.wait(1);
  I.see('Codeception/CodeceptJS', locate('.repo-list .repo-list-item').first());
});

Scenario('signin', (I, loginPage) => {
  I.say('it should not enter');
  loginPage.login('something@totest.com', '123456');
  I.see('Incorrect username or password.', '.flash-error');
});

Scenario('signin2', (I, Smth) => {
  Smth.openAndLogin();
  I.see('Incorrect username or password.', '.flash-error');
});

Scenario('register', (I) => {
  within('.js-signup-form', () => {
    I.fillField('user[login]', 'User');
    I.fillField('user[email]', 'user@user.com');
    I.fillField('user[password]', 'user@user.com');
    I.fillField('q', 'aaa');
    I.click('button');
  });
  I.see('There were problems creating your account.');
  I.click('Explore');
  I.seeInCurrentUrl('/explore');
});
