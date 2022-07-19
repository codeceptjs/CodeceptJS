const I = actor();

module.exports = {
  login(email, password) {
    I.click('Sign in');
    I.fillField('Username or email address', email);
    I.fillField('Password', password);
    I.click('Sign in');
  },
};

Object.setPrototypeOf(module.exports, class Login {}.prototype);
