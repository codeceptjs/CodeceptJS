module.exports = () => {
  return actor({
    openDir() {
      this.amInPath('.');
    },
  });
};
