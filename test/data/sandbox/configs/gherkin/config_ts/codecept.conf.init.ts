export const config: CodeceptJS.MainConfig = {
  tests: "./*_test.ts",
  output: "./output",
  helpers: {
    Playwright: {
      browser: "chromium",
      url: "http://localhost",
      show: true
    }
  },
  include: {
    I: "./steps_file"
  },
  name: "CodeceptJS"
}
