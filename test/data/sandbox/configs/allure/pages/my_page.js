let I;

module.exports = {

  _init() {
    I = actor();
  },

  hasFile(arg) {
    I.seeFile('allure.conf.js');
    I.seeFile('codecept.po.json');
  },

  failedMethod() {
    I.seeFile('notexistfile.js');
  },
};
