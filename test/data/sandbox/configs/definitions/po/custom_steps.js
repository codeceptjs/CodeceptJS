// Need for testing pages
export default () => {
  return actor({
    openDir() {
      this.amInPath('.');
    },
  });
};
