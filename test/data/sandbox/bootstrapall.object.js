module.exports = {
  bootstrapAll: async (done) => {
    await console.log('"bootstrapAll" is called.');
    done();
  },
};
