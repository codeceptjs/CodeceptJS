
Feature('GitHub');

Before((Smth) => {
  Smth.openGitHub();
});

Scenario('search', (I) => {
  I.fillField('Search GitHub', 'CodeceptJS');
  I.pressKey('Enter');
  I.see('Codeception/CodeceptJS', 'a');
});

Scenario('signin', (I) => {
  I.click('Sign in');
  I.see('Sign in to GitHub');
  I.fillField('Username or email address', 'something@totest.com');
  I.fillField('Password', '123456');
  I.click('Sign in');
  I.see('Incorrect username or password.', '.flash-error');
});

Scenario.only('register', (I, featuresPage) => {
  within('.form-signup-home', function () {
    I.fillField('user[login]', 'User');
    I.fillField('user[email]', 'user@user.com');
    I.fillField('user[password]', 'user@user.com');
    // I.fillField('q', 'aaa');
    I.click('button');
  });
  I.see('There were problems creating your account.');
  featuresPage.openFeatures();
  I.see('Field-tested tools for any project');
});
