let transpile = false;

module.exports = {
  enable: () => {
    transpile = true;
    return transpile;
  },

  status: () => {
    return transpile;
  },
};
