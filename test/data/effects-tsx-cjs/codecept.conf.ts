export const config: CodeceptJS.MainConfig = {
  tests: "./*_test.ts",
  output: "./output",
  helpers: {
    EffectsHelper: {
      require: "./effects_helper.js"
    }
  },
  name: "effects-tsx-cjs-test",
  require: ["tsx/cjs"]
};
