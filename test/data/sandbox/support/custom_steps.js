module.exports = () => {
  return actor({
    openDir() {
      this.amInPath('.');
    },
    throw() {
      assert.ok(false);
    },
  });
};
