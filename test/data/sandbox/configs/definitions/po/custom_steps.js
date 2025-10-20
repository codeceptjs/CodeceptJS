// Need for testing pages
module.exports = () => {
  return actor({
    openDir() {
      this.amInPath('.');
    },
  });
};
