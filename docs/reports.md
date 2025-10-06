---
permalink: /reports
title: Reporters
---

# Reporters

## Cli

By default, CodeceptJS provides cli reporter with console output.
Test names and failures will be printed out on screen.

```sh
GitHub --
 ✓ search in 2577ms
 ✓ signin in 2170ms
 ✖ register in 1306ms

-- FAILURES:

  1) GitHub: register:
      Field q not found by name|text|CSS|XPath

  Scenario Steps:

  - I.fillField("q", "aaa") at examples/github_test.js:29:7
  - I.fillField("user[password]", "user@user.com") at examples/github_test.js:28:7
  - I.fillField("user[email]", "user@user.com") at examples/github_test.js:27:7
  - I.fillField("user[login]", "User") at examples/github_test.js:26:7



  Run with --verbose flag to see NodeJS stacktrace

```

output steps use `--steps` option:

```
npx codeceptjs run --steps
```

Output:

```sh
GitHub --
 search
 • I am on page "https://github.com"
 • I am on page "https://github.com/search"
 • I fill field "Search GitHub", "CodeceptJS"
 • I press key "Enter"
 • I see "Codeception/CodeceptJS", "a"
 ✓ OK in 2681ms

 signin
 • I am on page "https://github.com"
 • I click "Sign in"
 • I see "Sign in to GitHub"
 • I fill field "Username or email address", "something@totest.com"
 • I fill field "Password", "123456"
 • I click "Sign in"
 • I see "Incorrect username or password.", ".flash-error"
 ✓ OK in 2252ms

 register
 • I am on page "https://github.com"
   Within .js-signup-form:
   • I fill field "user[login]", "User"
   • I fill field "user[email]", "user@user.com"
   • I fill field "user[password]", "user@user.com"
   • I fill field "q", "aaa"
 ✖ FAILED in 1260ms
```

To get additional information about test execution use `--debug` option.

```
npx codeceptjs run --debug
```

This will show execution steps
as well as notices from test runner. To get even more information with more technical details like error stack traces,
and global promises, or events use `--verbose` mode.

```
npx codeceptjs run --verbose
```

```sh
GitHub --
 register
   [1] Starting recording promises
   Emitted | test.before
 > WebDriver._before
   [1] Queued | hook WebDriver._before()
   [1] Queued | amOnPage: https://github.com
   Emitted | step.before (I am on page "https://github.com")
 • I am on page "https://github.com"
   Emitted | step.after (I am on page "https://github.com")
   Emitted | test.start ([object Object])
...
```

Please use verbose output when reporting issues to GitHub.

### Dry Run

There is a way to list all tests and their steps without actually executing them. Execute tests in `dry-run` mode to see all available tests:

```
npx codeceptjs dry-run
```

Output:

```
Tests from /home/davert/projects/codeceptjs/examples:

Business rules --
  ☐ do something
Google --
  ☐ test @123
GitHub -- /home/davert/projects/codeceptjs/examples/github_test.js
  ☐ Visit Home Page @retry
  ☐ search @grop
  ☐ signin @normal @important @slow
  ☐ signin2
  ☐ register

  Total: 3 suites | 7 tests

--- DRY MODE: No tests were executed ---
```

Pass `--steps` or `--debug` option as in `run` command to also get steps and substeps to be printed. In this mode **tests will be executed** but all helpers and plugins disabled, so no real actions will be performed.

```
npx codecepjs dry-run --debug
```

> ℹ If you use custom JavaScript code inside tests, or rely on values from `grab*` commands, dry-run may produce error output.

## Testomat.io

[Testomat.io](https://testomat.io) is a modern test management tool focused on CodeceptJS and **created by CodeceptJS team**.
Testomat.io is commercial SaaS service that can receive run reports from local runs or CI. Out of box Testomat.io supports parallel runs, uploading of screenshots and videos.

![](https://user-images.githubusercontent.com/220264/151728836-b52d2b2b-56e1-4640-8d3a-b39de817b1fd.png)

> 😻 **Testomat.io is free** for small teams, so you can use its reporting features with CodeceptJS.

To receive run reports you should:

- [Sign up](https://app.testomat.io/users/sign_up) at Testomat.io
- Create a new "Classical" project (select "BDD" project if you use CodeceptJS in BDD mode)
- Select "Import from Source Code"
- Select "CodeceptJS" as testing framework and JavaScript or TypeScript as a language. If you use BDD select "Gherkin" as language.
- Execute provided command in a terminal with your project. This will be "check-tests" or "check-cucmber" command. It scans all your test files and imports them into Testomat.io. This way all your e2e tests will be visible in one UI.
- After tests are imported, go to Runs tab and select "Setup automated tests".
- Follow the instructions:

![image](https://user-images.githubusercontent.com/77803888/151834217-5da44d92-a59a-458d-8856-64ce61bf3a38.png)

- You will need to install `@testomatio/reporter` package and enable it as a plugin in codeceptjs config:

```js
plugins: {
  testomatio: {
    enabled: true,
    require: '@testomatio/reporter/lib/adapter/codecept',
    apiKey: process.env.TESTOMATIO,
  }
}
```

- Run tests with `TESTOMATIO=` env variable and API key provided by Testomat.io
- See the run report is created and updated in realtime.

[Testomat.io](https://testomat.io) reporter works in the cloud, so it doesn't require you to install additional software. It can be integrated with your CI service to rerun only failed tests, launch new runs from UI, and send report notifications by email or in Slack, MS Teams, or create issue in Jira.

## ReportPortal

For enterprise grade we reporting we recommend using [ReportPortal](https://reportportal.io).

![](https://camo.githubusercontent.com/6550c0365f1d0ce1e29c53f1860b12957d1fc529/68747470733a2f2f692e6962622e636f2f516d353247306e2f53637265656e73686f742d323031392d30342d31312d61742d31352d35372d34302e706e67)

[ReportPortal](https://reportportal.io) is open-source self-hosted service for aggregating test execution reports.
Think of it as Kibana but for test reports.

Use official [CodeceptJS Agent for ReportPortal](https://github.com/reportportal/agent-js-codecept/) to start publishing your test results.

## XML

Use default xunit reporter of Mocha to print xml reports. Provide `--reporter xunit` to get the report to screen.
It is recommended to use more powerful [`mocha-junit-reporter`](https://www.npmjs.com/package/mocha-junit-reporter) package
to get better support for Jenkins CI.

Install it via NPM (locally or globally, depending on CodeceptJS installation type):

```sh
npm i mocha-junit-reporter
```

Additional configuration should be added to `codecept.conf.js` to print xml report to `output` directory:

```json
  "mocha": {
    "reporterOptions": {
        "mochaFile": "output/result.xml"
    }
  },
```

Execute CodeceptJS with JUnit reporter:

```sh
codeceptjs run --reporter mocha-junit-reporter
```

Result will be located at `output/result.xml` file.

Alternatively, the reporter name can be added to the configuration file as well. In this case, CodeceptJS can be executed without additional CLI options.

```json
  "mocha": {
    "reporter": "mocha-junit-reporter",
    "reporterOptions": {
        "mochaFile": "output/result.xml"
    }
  },
```

```sh
codeceptjs run
```

## Html

### Built-in HTML Reporter

CodeceptJS includes a built-in HTML reporter plugin that generates comprehensive HTML reports with detailed test information.

#### Features

- **Interactive Test Results**: Click on tests to expand and view detailed information
- **Step-by-Step Details**: Shows individual test steps with status indicators and timing
- **Test Statistics**: Visual cards showing totals, passed, failed, and pending test counts
- **Error Information**: Detailed error messages for failed tests with clean formatting
- **Artifacts Support**: Display screenshots and other test artifacts with modal viewing
- **Responsive Design**: Mobile-friendly layout that works on all screen sizes
- **Professional Styling**: Modern, clean interface with color-coded status indicators

#### Configuration

Add the `htmlReporter` plugin to your `codecept.conf.js`:

```js
exports.config = {
  // ... your other configuration
  plugins: {
    htmlReporter: {
      enabled: true,
      output: './output', // Directory for the report
      reportFileName: 'report.html', // Name of the HTML file
      includeArtifacts: true, // Include screenshots/artifacts
      showSteps: true, // Show individual test steps
      showSkipped: true, // Show skipped tests
    },
  },
}
```

#### Configuration Options

- `output` (optional, default: `./output`) - Directory where the HTML report will be saved
- `reportFileName` (optional, default: `'report.html'`) - Name of the generated HTML file
- `includeArtifacts` (optional, default: `true`) - Whether to include screenshots and other artifacts
- `showSteps` (optional, default: `true`) - Whether to display individual test steps
- `showSkipped` (optional, default: `true`) - Whether to include skipped tests in the report

#### Usage

Run your tests normally and the HTML report will be automatically generated:

```sh
npx codeceptjs run
```

The report will be saved to `output/report.html` (or your configured location) and includes:

- Overview statistics with visual cards
- Expandable test details showing steps and timing
- Error messages for failed tests
- Screenshots and artifacts (if available)
- Interactive failures section

### Mochawesome

Best HTML reports could be produced with [mochawesome](https://www.npmjs.com/package/mochawesome) reporter.

![mochawesome](/img/mochawesome.png)

Install it via NPM:

```sh
npm i mochawesome
```

If you get an error like this

```sh
"mochawesome" reporter not found

invalid reporter "mochawesome"
```

Make sure to have mocha installed or install it:

```sh
npm i mocha -D
```

Configure it to use `output` directory to print HTML reports:

```json
  "mocha": {
    "reporterOptions": {
        "reportDir": "output"
    }
  },
```

Execute CodeceptJS with mochawesome reporter:

```sh
codeceptjs run --reporter mochawesome
```

Result will be located at `output/index.html` file.

Alternatively, the reporter name can be added to the configuration file as well. In this case, CodeceptJS can be executed without additional CLI options.

```json
  "mocha": {
    "reporter": "mochawesome",
    "reporterOptions": {
        "reportDir": "output"
    }
  },
```

```sh
codeceptjs run
```

### Advanced usage

Want to have screenshots for failed tests?
Then add Mochawesome helper to your config:

```json
  "helpers": {
    "Mochawesome": {
        "uniqueScreenshotNames": "true"
    }
  },
```

Then tests with failure will have screenshots.

### Configuration

This helper should be configured in codecept.conf.ts

- `uniqueScreenshotNames` (optional, default: false) - option to prevent screenshot override if you have scenarios with the same name in different suites. This option should be the same as in common helper.
- `disableScreenshots` (optional, default: false) - don't save screenshot on failure. This option should be the same as in common helper.

Also if you will add Mochawesome helper, then you will able to add custom context in report:

#### addMochawesomeContext

Adds context to executed test in HTML report:

```js
I.addMochawesomeContext('simple string')
I.addMochawesomeContext('http://www.url.com/pathname')
I.addMochawesomeContext('http://www.url.com/screenshot-maybe.jpg')
I.addMochawesomeContext({
  title: 'expected output',
  value: {
    a: 1,
    b: '2',
    c: 'd',
  },
})
```

##### Parameters

- `context` string, url, path to screenshot, object. See [this](https://www.npmjs.com/package/mochawesome#adding-test-context)

## Multi Reports

Want to use several reporters in the same time? Try to use [mocha-multi](https://www.npmjs.com/package/mocha-multi) reporter

Install it via NPM:

```sh
npm i mocha-multi
```

Configure mocha-multi with reports that you want:

```json
  "mocha": {
    "reporterOptions": {
      "codeceptjs-cli-reporter": {
        "stdout": "-",
        "options": {
          "verbose": true,
          "steps": true,
        }
      },
      "mochawesome": {
        "stdout": "./output/console.log",
        "options": {
          "reportDir": "./output",
          "reportFilename": "report"
        }
      },
      "mocha-junit-reporter": {
        "stdout": "./output/console.log",
        "options": {
          "mochaFile": "./output/result.xml",
          "attachments": true //add screenshot for a failed test
        }
      }
    }
  }
```

Execute CodeceptJS with mocha-multi reporter:

```sh
npx codeceptjs run --reporter mocha-multi
```

This will give you cli with steps in console and HTML report in `output` directory.

Alternatively, the reporter name can be added to the configuration file as well. In this case, CodeceptJS can be executed without additional CLI options.

```json
  "mocha": {
    "reporter": "mocha-multi",
    "reporterOptions": {
      ...
    }
  }
```

```sh
codeceptjs run
```

## Testrail

Testrail integration with CodeceptJS is now so seamless. The test run is created automatically afterwards. The screenshots of failed tests are also attached to test results.

Try to use [codeceptjs-testrail](https://www.npmjs.com/package/codeceptjs-testrail) plugin

Install it via NPM:

```sh
npm i codeceptjs-testrail --save
```

![Attachemnt for failed case](http://g.recordit.co/ajaa2QRlnW.gif)

Now there is new feature, add the configuration to test run of test plan
![Attachemnt for failed case](http://g.recordit.co/uQLvQUq7cT.gif)

## Tesults

Submit test results data from CodeceptJS to [Tesults](https://www.tesults.com) easily with the [codeceptjs-tesults](https://www.npmjs.com/package/codeceptjs-tesults) plugin. Test results data is submitted automatically after a test run completes.

```sh
npm i codeceptjs-tesults --save
```

Once installed, follow the [quick and easy integration instructions](https://www.tesults.com/docs/codeceptjs) to get setup in no time.
