---
permalink: /reports
title: Reporters
---

# Reporters

## Cli

By default CodeceptJS provides cli reporter with console output.
Test names and failures will be printed to screen.

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
npx codeceptjs run --stepsutput add `--steps` option to `run` command:
```
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

## Allure

> ℹ  We recommend using Allure reports on CI. Allure is one of the best open-source reporters designed to collect and show test reports in nicest way.

[Allure reporter](http://allure.qatools.ru/#) is a tool to store and display test reports.
It provides nice web UI which contains all important information on test execution.
CodeceptJS has built-in support for Allure reports. Inside reports you will have all steps, substeps and screenshots.

![](https://user-images.githubusercontent.com/220264/45676511-8e052800-bb3a-11e8-8cbb-db5f73de2add.png)

> ▶ Allure is a standalone tool. Please refer to [Allure documentation](https://docs.qameta.io/allure/) to learn more about using Allure reports.

Allure requires **Java 8** to work. Then Allure can be installed via NPM:

```
npm install -g allure-commandline --save-dev
```

Add [Allure plugin](/plugins/#allure) in config under `plugins` section.

```js
plugins: {
    allure: {
  }
}
```

Run tests with allure plugin enabled:

```
npx codeceptjs run --plugins allure
```

(optionally) To enable allure plugin permanently include `"enabled": true` into plugin config:


```js
"plugins": {
    "allure": {
      "enabled": true
    }
}
```

Launch Allure server and see the report like on a screenshot above:

```
allure serve output
```

Allure reporter aggregates data from other plugins like [*stepByStepReport*](/plugins/#stepByStepReport) and [*screenshotOnFail*](/plugins/#screenshotOnFail)

Allure reports can also be generated for `dry-run` command. So you can get the first report with no tests actually being executed. Enable allure plugin in dry-run options, and pass `--debug` option to print all tests on screen.

```
npx codeceptjs dry-run --debug -p allure
```

## ReportPortal

Allure is a great reportin tool, however, if you are running tests on different machines it is hard to merge its XML result files to build a proper report. So, for enterprise grade reporting we recommend using [ReportPortal](https://reportportal.io).

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

## Html

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

Execute CodeceptJS with HTML reporter:

```sh
codeceptjs run --reporter mochawesome
```

Result will be located at `output/index.html` file.

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

This helper should be configured in codecept.json

- `uniqueScreenshotNames` (optional, default: false) - option to prevent screenshot override if you have scenarios with the same name in different suites. This option should be the same as in common helper.
- `disableScreenshots` (optional, default: false)  - don't save screenshot on failure. This option should be the same as in common helper.

Also if you will add Mochawesome helper, then you will able to add custom context in report:

#### addMochawesomeContext

Adds context to executed test in HTML report:

```js
I.addMochawesomeContext('simple string');
I.addMochawesomeContext('http://www.url.com/pathname');
I.addMochawesomeContext('http://www.url.com/screenshot-maybe.jpg');
I.addMochawesomeContext({title: 'expected output',
                         value: {
                           a: 1,
                           b: '2',
                           c: 'd'
                         }
});
```

##### Parameters

- `context`  string, url, path to screenshot, object. See [this](https://www.npmjs.com/package/mochawesome#adding-test-context)

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
