export const config: CodeceptJS.MainConfig = {
  tests: "./*_test.ts",
  output: "./output",
  helpers: {
    CustomHelper: {
      require: "../helper.js"
    }
  },
  name: "typescript-tsx-esm-test",
  require: ["tsx/cjs"]
};
