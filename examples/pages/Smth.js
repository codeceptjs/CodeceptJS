

let I;

module.exports = {

  _init() {
    I = actor();
  },

  openGitHub() {
    I.amOnPage('https://github.com');
  },

  // insert your locators and methods here
};
