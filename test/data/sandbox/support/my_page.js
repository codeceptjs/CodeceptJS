let I;

module.exports = {

  _init() {
    I = actor();
  },

  hasFile() {
    I.seeFile('codecept.json');
    I.seeFile('codecept.po.json');
  },
};
