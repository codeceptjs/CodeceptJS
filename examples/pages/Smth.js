const I = actor();
const loginPage = require('./Login');

class Smth {}

module.exports = {

  openGitHub() {
    I.amOnPage('https://github.com');
  },

  openAndLogin() {
    this.openGitHub();
    loginPage.login('something@totest.com', '1234356');
  },
};

Object.setPrototypeOf(module.exports, Smth.prototype);
