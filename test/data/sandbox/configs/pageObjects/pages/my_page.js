const MyPage = {
  _init() {
    // Legacy method - not needed with inject pattern
  },

  hasFile(arg) {
    const { I } = inject();
    I.seeFile('codecept.class.js');
    I.seeFile('codecept.po.js');
  },

  failedMethod() {
    const { I } = inject();
    I.seeFile('notexistfile.js');
  },
}

export default MyPage
