let I;

module.exports = {

  _init() {
    I = actor();
  },

  hasFile(arg) {
    I.seeFile('codecept.json');
    I.seeFile('codecept.po.json');
  },
};
