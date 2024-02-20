export default {
  teardownAll: async (done) => {
    await console.log('"teardownAll" is called.');
    done();
  },
};
