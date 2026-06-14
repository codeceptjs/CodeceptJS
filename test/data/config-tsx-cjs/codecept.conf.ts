export const config: CodeceptJS.MainConfig = {
  tests: "./*_test.ts",
  output: "./output",
  helpers: {
    ConfigHelper: {
      require: "./config_helper.js",
      marker: "config-marker-123"
    }
  },
  name: "config-tsx-cjs-test",
  require: ["tsx/cjs"]
};
