let I;

export default {

  _init() {
    I = actor();
  },

  hasFile(arg) {
    I.seeFile('allure.conf.js');
    I.seeFile('codecept.po.js');
  },

  failedMethod() {
    I.seeFile('notexistfile.js');
  },
};
