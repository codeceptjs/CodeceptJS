---
permalink: /continuous-integration
title: Continuous Integration
---

# Continuous Integration

CodeceptJS runs in any CI system that can install Node.js. The work is in the surrounding environment: a headless browser, a driver server for WebDriver, failure artifacts to upload, and a parallelization strategy that keeps the wall-clock time reasonable. This guide covers each step and provides drop-in configs for the major CI systems.

## Preparing tests for CI

A CI-ready suite needs only a few things:

- **Headless mode.** Playwright runs headless by default — only act if you set `show: true` locally. To toggle it from CI, export `HEADLESS=true` and read it from your config.
- **Colored logs.** Export `FORCE_COLOR=1` so CodeceptJS output renders correctly in CI log viewers.
- **Failure artifacts.** Keep `screenshotOnFail` enabled (it is on by default). For Playwright, also enable `trace` and `video` in the helper config — they make a remote failure diagnosable from a single artifact.
- **Self-healing for flaky tests.** Use the [`heal` plugin](/heal) to recover from broken locators. The `retryFailedStep` plugin is already enabled by default — you do not need to configure it.

You do **not** need to set `CI=true`. Every CI provider exports it automatically, and CodeceptJS reads it to relax certain timeouts.

## Installing browsers and drivers

### Playwright

Playwright needs browser binaries plus Linux system libraries. The recommended approach (per the [official Playwright CI docs](https://playwright.dev/docs/ci)) is:

```bash
npm ci
npx playwright install --with-deps chromium
```

`--with-deps` pulls in `libnss`, fonts, and other OS packages. To install all engines, drop the `chromium` argument. Playwright explicitly recommends against caching browser binaries — restoring the cache takes about as long as a fresh download.

If you prefer the official Playwright Docker image, see the [Playwright Docker docs](https://playwright.dev/docs/docker). Pin the image tag to **the same version as your installed `playwright` package** — a mismatched image will fail to find browser executables. The examples below use `node:20` + `npx playwright install --with-deps` to avoid this version-pin problem entirely.

### WebDriver

CodeceptJS's WebDriver helper talks to any WebDriver-protocol endpoint. In CI, the simplest setup is a [Selenium Docker container](https://github.com/SeleniumHQ/docker-selenium):

```bash
docker run -d --net=host --shm-size=2g selenium/standalone-chrome
```

Point the helper at it:

```js
helpers: {
  WebDriver: {
    url: 'http://localhost:8000',
    browser: 'chrome',
    host: process.env.SELENIUM_HOST || 'localhost',
    port: parseInt(process.env.SELENIUM_PORT || '4444', 10),
  }
}
```

For an alternative without Selenium, see the [WebDriver helper docs](/webdriver) — recent WebdriverIO versions can manage drivers (chromedriver, geckodriver) directly. Selenium is still the most portable choice for CI.

`--shm-size=2g` matters. The default 64 MB causes Chrome tabs to crash on heavy pages.

## Running tests

A single process:

```bash
npx codeceptjs run
```

Parallel workers on one machine:

```bash
npx codeceptjs run-workers 4 --by pool
```

`--by pool` distributes tests dynamically: each worker grabs the next test as it finishes, so no worker sits idle. See [Parallel Execution](/parallel) for `--by test` and `--by suite`.

Sharded across multiple machines (CI matrix):

```bash
npx codeceptjs run --shard 1/4
npx codeceptjs run --shard 2/4
npx codeceptjs run --shard 3/4
npx codeceptjs run --shard 4/4
```

You can combine the two — each shard runs on its own machine, and `run-workers` parallelizes within the shard.

Filter by tag:

```bash
npx codeceptjs run --grep "@smoke"
npx codeceptjs run --grep "@slow" --invert
```

## Reporting

For CI test reporting, use [`@testomatio/reporter`](https://github.com/testomatio/reporter). It ships built-in **pipes** that publish results directly into the CI platform's UI — no XML wrangling required.

| CI | Recommended pipes | Result |
|---|---|---|
| GitHub Actions | `github` + `html` | PR check annotations + a self-contained HTML report |
| GitLab CI | `gitlab` | Merge request widget with test results |
| Bitbucket Pipelines | `bitbucket` | Pipeline test report |
| Any | `html` | HTML report you can upload as an artifact |

Install:

```bash
npm i --save-dev @testomatio/reporter
```

See the [reporter README](https://github.com/testomatio/reporter) for the per-pipe environment variables.

Whatever reporter you use, also upload the `output/` directory as a build artifact. It contains failure screenshots and, with Playwright, traces and videos.

For other reporter formats, see [Reports](/reports).

## CI system examples

The examples below use Playwright by default. A WebDriver-with-Selenium variant follows where it differs.

### GitHub Actions — Playwright

`.github/workflows/tests.yml`:

```yaml
name: Tests
on:
  push:
    branches: [main]
  pull_request:

env:
  FORCE_COLOR: 1

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx codeceptjs run-workers 4 --by pool
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: codeceptjs-output
          path: output/
```

### GitHub Actions — WebDriver + Selenium

```yaml
name: WebDriver Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      selenium:
        image: selenium/standalone-chrome
        ports:
          - 4444:4444
        options: --shm-size=2g
    env:
      SELENIUM_HOST: localhost
      SELENIUM_PORT: 4444
      FORCE_COLOR: 1
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx codeceptjs run-workers 2 --by pool
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: codeceptjs-output
          path: output/
```

### GitHub Actions — Sharding matrix

Each shard runs on its own runner in parallel:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shard: ['1/4', '2/4', '3/4', '4/4']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx codeceptjs run --shard ${{ matrix.shard }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: output-shard-${{ strategy.job-index }}
          path: output/
```

### GitLab CI

`.gitlab-ci.yml`:

```yaml
stages: [test]

playwright:
  stage: test
  image: node:20
  variables:
    FORCE_COLOR: "1"
  parallel: 4
  before_script:
    - npm ci
    - npx playwright install --with-deps chromium
  script:
    - npx codeceptjs run --shard $CI_NODE_INDEX/$CI_NODE_TOTAL
  artifacts:
    when: on_failure
    paths:
      - output/
    expire_in: 1 week

webdriver:
  stage: test
  image: node:20
  services:
    - name: selenium/standalone-chrome
      alias: selenium
  variables:
    SELENIUM_HOST: selenium
    SELENIUM_PORT: "4444"
  script:
    - npm ci
    - npx codeceptjs run-workers 2 --by pool
  artifacts:
    when: on_failure
    paths: [output/]
```

`$CI_NODE_INDEX` is 1-based, which matches CodeceptJS's `--shard` syntax exactly.

### Bitbucket Pipelines

`bitbucket-pipelines.yml`:

```yaml
image: node:20

definitions:
  services:
    selenium:
      image: selenium/standalone-chrome
      memory: 2048

pipelines:
  default:
    - step:
        name: Install
        caches: [node]
        script:
          - npm ci
          - npx playwright install --with-deps chromium
    - parallel:
        - step:
            name: Shard 1/4
            script:
              - npx codeceptjs run --shard 1/4
            artifacts:
              - output/**
        - step:
            name: Shard 2/4
            script:
              - npx codeceptjs run --shard 2/4
            artifacts:
              - output/**
        - step:
            name: Shard 3/4
            script:
              - npx codeceptjs run --shard 3/4
            artifacts:
              - output/**
        - step:
            name: Shard 4/4
            script:
              - npx codeceptjs run --shard 4/4
            artifacts:
              - output/**
```

For WebDriver, attach the Selenium service to the step:

```yaml
pipelines:
  default:
    - step:
        image: node:20
        services: [selenium]
        script:
          - npm ci
          - export SELENIUM_HOST=localhost SELENIUM_PORT=4444
          - npx codeceptjs run-workers 2 --by pool
        artifacts:
          - output/**
```

### Jenkins

`Jenkinsfile` (declarative pipeline):

```groovy
pipeline {
  agent {
    docker {
      image 'node:20'
      args '-u root'
    }
  }
  environment {
    FORCE_COLOR = '1'
  }
  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
        sh 'npx playwright install --with-deps chromium'
      }
    }
    stage('Test') {
      parallel {
        stage('Shard 1/4') { steps { sh 'npx codeceptjs run --shard 1/4' } }
        stage('Shard 2/4') { steps { sh 'npx codeceptjs run --shard 2/4' } }
        stage('Shard 3/4') { steps { sh 'npx codeceptjs run --shard 3/4' } }
        stage('Shard 4/4') { steps { sh 'npx codeceptjs run --shard 4/4' } }
      }
    }
  }
  post {
    failure {
      archiveArtifacts artifacts: 'output/**', allowEmptyArchive: true
    }
  }
}
```

For WebDriver, launch Selenium alongside the test container:

```groovy
stage('Test') {
  steps {
    script {
      docker.image('selenium/standalone-chrome')
            .withRun('--shm-size=2g -p 4444:4444') { c ->
        sh '''
          export SELENIUM_HOST=localhost SELENIUM_PORT=4444
          npx codeceptjs run-workers 2 --by pool
        '''
      }
    }
  }
}
```

### CircleCI

`.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  test:
    docker:
      - image: cimg/node:20.18-browsers
    parallelism: 4
    steps:
      - checkout
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run:
          name: Run shard
          command: |
            INDEX=$((CIRCLE_NODE_INDEX + 1))
            npx codeceptjs run --shard ${INDEX}/${CIRCLE_NODE_TOTAL}
      - store_artifacts:
          path: output

  webdriver:
    docker:
      - image: cimg/node:20.18
      - image: selenium/standalone-chrome
    environment:
      SELENIUM_HOST: localhost
      SELENIUM_PORT: 4444
    steps:
      - checkout
      - run: npm ci
      - run: npx codeceptjs run-workers 2 --by pool
      - store_artifacts:
          path: output

workflows:
  test:
    jobs:
      - test
      - webdriver
```

`CIRCLE_NODE_INDEX` is 0-based, so add 1 to match CodeceptJS's 1-based `--shard` index.

### Azure Pipelines

`azure-pipelines.yml`:

```yaml
trigger: [main]

pool:
  vmImage: ubuntu-latest

strategy:
  parallel: 4

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
  - script: npm ci
    displayName: Install dependencies
  - script: npx playwright install --with-deps chromium
    displayName: Install Playwright browsers
  - script: |
      npx codeceptjs run --shard $(System.JobPositionInPhase)/$(System.TotalJobsInPhase)
    displayName: Run shard $(System.JobPositionInPhase)/$(System.TotalJobsInPhase)
    env:
      FORCE_COLOR: 1
  - task: PublishBuildArtifacts@1
    condition: failed()
    inputs:
      pathToPublish: output
      artifactName: codeceptjs-output-$(System.JobPositionInPhase)
```

For WebDriver, run Selenium as a sidecar before tests:

```yaml
  - script: docker run -d --net=host --shm-size=2g selenium/standalone-chrome
    displayName: Start Selenium
  - script: |
      export SELENIUM_HOST=localhost SELENIUM_PORT=4444
      npx codeceptjs run-workers 2 --by pool
    displayName: Run tests
```

## Docker

The official `codeceptjs/codeceptjs` image runs Playwright, Puppeteer, and WebDriver suites without further setup. Pass runtime flags through `CODECEPT_ARGS` and the worker count through `NO_OF_WORKERS`. See [Docker](/docker) for the full reference and Compose examples.

## Tips

- **Raise per-test timeouts in CI.** CI machines are slower than your laptop. Bump `timeout` in `codecept.conf.js` when assertions race the page.
- **Diagnose from logs.** Re-run with `--debug` or `DEBUG=codeceptjs:*` when a job fails and you cannot reproduce locally.
- **Selenium Chrome: always `--shm-size=2g`.** The default 64 MB causes tab crashes on heavy pages.
- **Custom Playwright images: install OS deps.** When you cannot use `mcr.microsoft.com/playwright`, run `npx playwright install --with-deps` to pull in `libnss`, fonts, and other system libraries.
- **Upload `output/` only on failure.** Successful runs produce no useful artifacts.

## See also

- [Playwright CI guide](https://playwright.dev/docs/ci) — upstream notes on browser install, sharding, and per-platform config.
- [Playwright Docker image](https://playwright.dev/docs/docker) — image tags and the version-pinning rule.
- [WebdriverIO Selenium Grid](https://webdriver.io/docs/seleniumgrid) — connection options for `host`/`port`/`path`.
- [Selenium Docker images](https://github.com/SeleniumHQ/docker-selenium) — image variants (`standalone-chrome`, `standalone-firefox`, debug images with VNC).

## Community recipes

- [CodeceptJS — Codefresh Integration](https://codecept.discourse.group/t/codeceptjs-codefresh-integration/)
- [CodeceptJS — GitLab Integration](https://codecept.discourse.group/t/codeceptjs-gitlab-integration/)
- [CodeceptJS — Jenkins Integration](https://codecept.discourse.group/t/codeceptjs-jenkins-integration/)
- [CodeceptJS — TeamCity Integration](https://codecept.discourse.group/t/codeceptjs-integration-with-teamcity/)

Got a setup that works for you? [Share your recipe](https://codecept.discourse.group/c/CodeceptJS-issues-in-general/ci/9) and we will list it here.
