export default function() {
  return actor({
    openDir() {
      this.amInPath('.');
    },
  });
}
