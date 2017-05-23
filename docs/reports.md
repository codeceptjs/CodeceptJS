# Reporters

## Cli (default)

By default CodeceptJS provides cli reporter with console output.
Test names and failures will be printed to screen.

```
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

For dynamic step-by-step output add `--steps` option to `run` command:

```
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
To get additional information about test execution use `--debug` option. This will show execution steps
as well as notices from test runner. To get even more information with more technical details like error stacktraces,
and global promises, or events use `--verbose` mode.

```
GitHub --
 register
   [1] Starting recording promises
   Emitted | test.before
 > WebDriverIO._before
   [1] Queued | hook WebDriverIO._before()
   [1] Queued | amOnPage: https://github.com
   Emitted | step.before (I am on page "https://github.com")
 • I am on page "https://github.com"
   Emitted | step.after (I am on page "https://github.com")
   Emitted | test.start ([object Object])
...
```

Please use verbose output when reporting issues to GitHub.

## XML

Use default xunit reporter of Mocha to print xml reports. Provide `--reporter xunit` to get the report to screen.
It is recommended to use more powerful [`mocha-junit-reporter`](https://www.npmjs.com/package/mocha-junit-reporter) package
ot get better support for Jenkins CI.

Install it via NPM (locally or globally, depending on CodeceptJS installation type):

```
npm i mocha-junit-reporter
```

Additional configuration should be added to `codecept.json` to print xml report to `output` directory:

```json
  "mocha": {
    "reporterOptions": {
        "mochaFile": "output/result.xml"
    }
  },
```

Execute CodeceptJS with JUnit reporter:

```
codeceptjs run --reporter mocha-junit-reporter
```

Result will be located at `output/result.xml` file.


## Html

Best HTML reports could be prodused with [mochawesome](https://www.npmjs.com/package/mochawesome) reporter.

![](http://codecept.io/images/mochawesome.png)

Install it via NPM:

```
npm i mochawesome
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

```
codeceptjs run --reporter mochawesome
```

Result will be located at `output/index.html` file.

