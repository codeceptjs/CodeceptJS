const I = actor();

module.exports = {
  login(email, password) {
    I.click('Sign in');
    I.fillField('Username or email address', 'something@totest.com');
    I.fillField('Password', '123456');
    I.click('Sign in');
  },
};

Object.setPrototypeOf(module.exports, class Login {}.prototype);
