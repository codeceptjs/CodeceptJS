let I;

module.exports = {

  _init() {
    I = actor();
  },

  hasFile(arg) {
    I.seeFile('codecept.class.js');
    I.seeFile('codecept.po.js');
  },

  failedMethod() {
    I.seeFile('notexistfile.js');
  },
};
