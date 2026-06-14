export const config: CodeceptJS.MainConfig = {
  tests: "./*_test.ts",
  output: "./output",
  helpers: {
    ConfigHelper: {
      require: "./internal_api_helper.js",
      marker: "config-marker-123"
    }
  },
  name: "internal-api-tsx-cjs-test",
  require: ["tsx/cjs"]
};
