export const config: CodeceptJS.MainConfig = {
  tests: "./*.ts",
  output: "./output",
  helpers: {
    FileSystem: {},
  },
  name: "container-esm",
  require: ["tsx/cjs"],
};
