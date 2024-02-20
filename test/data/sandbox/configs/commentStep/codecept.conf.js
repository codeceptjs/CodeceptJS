export const config = {
  tests: './*_test.js',
  output: './output.js',
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
