exports.config = {
  tests: './*_test.js',
  output: './output',
  helpers: {
    CustomHelper: {
      require: './customHelper.js',
    },
  },
  plugins: {
    commentStep: {
      enabled: true,
      registerGlobal: true,
    },
  },
  name: 'pageobject-as-class',
};
