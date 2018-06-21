const I = actor();
const loginPage = require('./Login');

module.exports = {

  openGitHub() {
    I.amOnPage('https://github.com');
  },

  openAndLogin() {
    this.openGitHub();
    loginPage.login('something@totest.com', '1234356');
  },

};
