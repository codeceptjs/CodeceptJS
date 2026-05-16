---
permalink: /reports
title: Reporters
---

# Reporters

CodeceptJS prints test results to the console by default (see [CLI output](#cli-output)). For an HTML report, a pull-request comment, JUnit XML, or a hosted dashboard, it is recommeded to use **[Testomat.io Reporter](https://github.com/testomatio/reporter)**. It sends results to whichever destinations you turn on with steps, screenshots, videos, traces, and logs.

### Install

```sh
npm install @testomatio/reporter --save-dev
```

Enable reporter plugin:

```js
// codecept.conf.js
plugins: {
  testomatio: {
    enabled: true,
    require: '@testomatio/reporter/codecept',
  },
}
```

### Enable an output

Each output turns on when you set its environment variable. Run your tests as usual — one run feeds every output you enabled.

| To get… | Set | Details |
| --- | --- | --- |
| HTML report | `TESTOMATIO_HTML_REPORT_SAVE=1` | [HTML Report](#html-report) |
| Markdown report | `TESTOMATIO_MARKDOWN_REPORT_SAVE=1` | [Markdown Report](#markdown-report) |
| Run Result on [app.testomat.io](https://testomat.io) | `TESTOMATIO` (project API key) | [Cloud Report](#cloud-report) |
| A comment on a GitHub Pull Request | `GH_PAT` (`${{ github.token }}` in Actions) | [GitHub Report](#github-report) |
| A comment on a GitLab Merge Request | `GITLAB_PAT` (token with `api` scope) | [GitLab Report](#gitlab-report) |
| A comment on a Bitbucket Pull Request | `BITBUCKET_ACCESS_TOKEN` (repo access token) | [Bitbucket Report](#bitbucket-report) |

Screenshots and videos in these reports are uploaded to your own storage — see [Artifacts](#artifacts).

Put the variables on CI when running tests:

```yaml
- run: npx codeceptjs run
  env:
    TESTOMATIO_HTML_REPORT_SAVE: 1                  # → output/reports/testomatio-report.html
    TESTOMATIO_HTML_REPORT_FOLDER: output/reports   # keep it with the rest of output/
    GH_PAT: ${{ github.token }}                     # → PR comment
    # TESTOMATIO: ${{ secrets.TESTOMATIO }}         # → testomat.io run
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: codeceptjs-output
    path: output/
```

The GitHub pipe also needs the job to grant `permissions: pull-requests: write`.


### HTML Report

A single self-contained HTML file with the run summary and, per test, its steps, screenshots, logs, and error. It needs no API key and no service, so it works anywhere — open it locally or attach it to a CI build.

![HTML report](https://raw.githubusercontent.com/testomatio/reporter/master/docs/pipes/images/html-pipe.png)

- `TESTOMATIO_HTML_REPORT_SAVE=1` — enable the report
- `TESTOMATIO_HTML_REPORT_FOLDER=output/reports` — keep it inside CodeceptJS's `output/` dir (default folder is `html-report`)
- `TESTOMATIO_HTML_FILENAME` — file name, must end in `.html` (default `testomatio-report.html`)

### Cloud Report

Sends the run to [app.testomat.io](https://testomat.io) — a hosted dashboard with run history, flaky-test detection, parallel-run merging, re-running failed tests, and notifications. Free for small teams.

![Testomat.io report](https://user-images.githubusercontent.com/220264/151728836-b52d2b2b-56e1-4640-8d3a-b39de817b1fd.png)

- `TESTOMATIO` — project API key; enables the pipe
- `TESTOMATIO_CREATE=1` — create tests in Testomat.io that were not imported beforehand
- `TESTOMATIO_TITLE` — report title
- `TESTOMATIO_RUNGROUP_TITLE` — add the run to a group (e.g. `"Build ${BUILD_ID}"`)
- `TESTOMATIO_PUBLISH=1` — make the report publicly accessible

More options (shared runs, rungroups, run management): [Testomat.io pipe](https://github.com/testomatio/reporter/blob/master/docs/pipes/testomatio.md).

To view artifacts on cloud they must be uploaded to S3 storages. Images from [`screenshot`](/plugins#screenshot) plugin, videos from the [`screencast`](/plugins#screencast) plugin (or the Playwright helper's `video` and `trace`). Can be used with any S3 provider: AWS S3, Cloudflare R2, Google Cloud Storage (interoperability mode), DigitalOcean Spaces, MinIO. 

### GitHub Report

Posts a comment to the Pull Request: run status, pass/fail/skip counts, stack traces of the failures, screenshots, and the slowest tests. Re-running the workflow replaces the previous comment.

![GitHub report](https://raw.githubusercontent.com/testomatio/reporter/master/docs/pipes/images/github.png)

- `GH_PAT` — GitHub token; `${{ github.token }}` works in Actions
- the job must grant `permissions: pull-requests: write`
- `GH_KEEP_OUTDATED_REPORTS=1` — keep previous comments instead of deleting them

### GitLab Report

Posts a comment to the Merge Request with the same summary. It needs Merge Request context, so run it in merge-request pipelines.

![GitLab report](https://raw.githubusercontent.com/testomatio/reporter/master/docs/pipes/images/gitlab.png)

- `GITLAB_PAT` — Personal or Project Access Token with `api` scope
- run in merge-request pipelines (`$CI_PIPELINE_SOURCE == "merge_request_event"`)
- `GITLAB_KEEP_OUTDATED_REPORTS=1` — keep previous comments
- `GITLAB_REMOVE_ALL_OUTDATED_REPORTS=1` — remove all previous comments, not just the latest

### Bitbucket Report

Posts a comment to the Pull Request with the same summary. Comments are created only in `pull-requests` pipelines.

![Bitbucket report](https://raw.githubusercontent.com/testomatio/reporter/master/docs/pipes/images/bitbucket.png)

- `BITBUCKET_ACCESS_TOKEN` — repository access token with `Pull requests: Write` and `Repository: Read`
- run in `pull-requests` pipelines
- `BITBUCKET_KEEP_OUTDATED_REPORTS=1` — keep previous comments

### Markdown Report

A single self-contained Markdown file — renders in PR comments, CI job summaries, and Slack, and is convenient for AI agents reading test results. Needs no API key.

- `TESTOMATIO_MARKDOWN_REPORT_SAVE=1` — enable the report
- `TESTOMATIO_MARKDOWN_REPORT_FOLDER=output/reports` — keep it inside CodeceptJS's `output/` dir (default folder is `md-report`)
- `TESTOMATIO_MARKDOWN_FILENAME` — file name, must end in `.md` (default `testomatio-report.md`)
- `TESTOMATIO_TITLE` — document title (default `Test Results`)

On GitHub Actions, append it to the job summary: `cat output/reports/testomatio-report.md >> "$GITHUB_STEP_SUMMARY"`.

## JUnit XML

For CI servers that read JUnit XML (Jenkins, GitLab CI, CircleCI, the GitHub Actions test tab), enable the [`junitReporter`](/plugins#junitreporter) plugin. It writes `output/report.xml` with CodeceptJS steps included — unlike `mocha-junit-reporter`.

```js
plugins: {
  junitReporter: { enabled: true },
}
```

Options (`outputName`, `output`, `testGroupName`, `attachMeta`, `attachSteps`, `stepsInFailure`): [plugin docs](/plugins#junitreporter).

## ReportPortal

[ReportPortal](https://reportportal.io) is an open-source self-hosted dashboard for test reports. Publish with the [CodeceptJS Agent for ReportPortal](https://github.com/reportportal/agent-js-codecept/).

## Custom reporter

The [`customReporter`](/plugins#customreporter) plugin hooks into test events:

```js
plugins: {
  customReporter: {
    enabled: true,
    onTestFailed: (test, err) => console.log('FAIL', test.title, err.message),
    onResult: result => {
      // result.stats, result.tests
    },
  },
}
```

Hooks: `onHookFinished`, `onTestBefore`, `onTestPassed`, `onTestFailed`, `onTestSkipped`, `onTestFinished`, `onResult`.

For built-in Mocha reporters, use `--reporter`:

```sh
npx codeceptjs run --reporter dot
```

> The bundled `Mochawesome` helper was removed in 4.x. For an HTML report use the [Testomat.io Reporter](https://github.com/testomatio/reporter) HTML pipe (see above); for JUnit XML use the [`junitReporter`](#junit-xml) plugin. Wiring multiple Mocha reporters through `mocha-multi`/`cmr` is not recommended — prefer these instead.

Plugins exist for [TestRail](https://www.npmjs.com/package/codeceptjs-testrail) and [Tesults](https://www.npmjs.com/package/codeceptjs-tesults).

## CLI output

By default CodeceptJS prints test names and failures. Add `--steps` to see each step, `--debug` for runner notices, or `--verbose` for full stack traces and events (use this when reporting bugs).

```sh
npx codeceptjs run --steps
```

`dry-run` lists tests and steps without running them:

```sh
npx codeceptjs dry-run --steps
```
