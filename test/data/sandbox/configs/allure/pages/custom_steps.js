export default () => {
  return actor({
    openDir() {
      this.amInPath('.');
    },
  });
};
